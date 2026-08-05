// ============================================================
// TradePro 360 – Dispatch Engine Edge Function
// Auto-assigns the best available engineer to a new job
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DispatchRequest { job_id: string; }

interface EngineerCandidate {
  engineer_id: string;
  profile_id:  string;
  full_name:   string;
  rating:      number;
  hourly_rate: number;
  distance_km: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { job_id }: DispatchRequest = await req.json();
    if (!job_id) return json({ error: "job_id is required" }, 400);

    // 1. Fetch job
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("*, customers(profile_id)")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) return json({ error: "Job not found" }, 404);
    if (job.status !== "pending") return json({ error: "Job not pending", status: job.status }, 400);
    if (!job.location) return json({ error: "Job has no location" }, 400);

    // Parse POINT(lng lat)
    const match = String(job.location).match(/POINT\(([^ ]+) ([^ )]+)\)/);
    if (!match) return json({ error: "Invalid location format" }, 400);
    const [lng, lat] = [parseFloat(match[1]), parseFloat(match[2])];

    // Radius per urgency
    const radii: Record<string, number> = { emergency: 50, same_day: 30, standard: 20 };
    const radius = radii[job.urgency] ?? 20;

    // 2. Find nearest engineers
    const { data: candidates, error: candErr } = await supabase.rpc("find_nearest_engineers", {
      p_trade: job.trade, p_lat: lat, p_lng: lng, p_radius_km: radius, p_limit: 10,
    });

    if (candErr) return json({ error: "Failed to query engineers", details: candErr }, 500);

    if (!candidates?.length) {
      await supabase.from("dispatch_log").insert({
        job_id, candidates: [], assigned_to: null,
        reason: `No engineers within ${radius}km for ${job.trade}`,
      });
      await supabase.from("notifications").insert({
        profile_id: job.customers.profile_id, job_id,
        title: "No Engineers Available",
        body: `No ${job.trade.replace("_"," ")} engineers are available nearby. We'll notify you when one becomes free.`,
      });
      return json({ success: false, message: "No engineers available" });
    }

    // 3. Score: 50% proximity + 50% rating
    const scored = (candidates as EngineerCandidate[]).map((e) => ({
      ...e,
      score: (1 - e.distance_km / radius) * 0.5 + ((e.rating ?? 5) / 5) * 0.5,
    })).sort((a, b) => b.score - a.score);

    const best = scored[0];

    // 4. Estimated arrival time
    const scheduledAt =
      job.urgency === "emergency" ? new Date(Date.now() + 30 * 60_000).toISOString()
      : job.urgency === "same_day" ? new Date(Date.now() + 2 * 3600_000).toISOString()
      : job.scheduled_at;

    const quotedPrice =
      job.urgency === "emergency"
        ? Number(best.hourly_rate) * 1.5 + 50
        : Number(best.hourly_rate) + 50;

    // 5. Assign job
    const { error: updErr } = await supabase.from("jobs").update({
      engineer_id: best.engineer_id,
      status: "assigned",
      scheduled_at: scheduledAt,
      quoted_price: quotedPrice,
    }).eq("id", job_id);

    if (updErr) return json({ error: "Failed to assign", details: updErr }, 500);

    // 6. Mark engineer busy
    await supabase.from("engineers").update({ status: "busy" }).eq("id", best.engineer_id);

    // 7. Audit log
    await supabase.from("dispatch_log").insert({
      job_id, candidates: scored, assigned_to: best.engineer_id,
      reason: `Score=${best.score.toFixed(3)}, dist=${best.distance_km.toFixed(1)}km, rating=${best.rating}`,
    });

    // 8. Notifications
    await supabase.from("notifications").insert([
      {
        profile_id: job.customers.profile_id, job_id,
        title: "Engineer Assigned!",
        body: `${best.full_name} is on the way. Track live in the app.`,
      },
      {
        profile_id: best.profile_id, job_id,
        title: "New Job Assigned",
        body: `New ${job.trade.replace("_"," ")} job at ${job.address}. Please confirm.`,
      },
    ]);

    return json({ success: true, job_id, assigned_to: best, scheduled_at: scheduledAt });
  } catch (err) {
    console.error(err);
    return json({ error: "Internal error", message: (err as Error).message }, 500);
  }
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
