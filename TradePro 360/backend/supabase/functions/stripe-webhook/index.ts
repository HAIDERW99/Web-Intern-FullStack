// ============================================================
// TradePro 360 – Stripe Webhook Edge Function
// ============================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.0.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req: Request) => {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body, sig, Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? ""
    );
  } catch (err) {
    return new Response(`Webhook error: ${(err as Error).message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const notify = async (profileId: string, jobId: string, title: string, body: string) => {
    await supabase.from("notifications").insert({ profile_id: profileId, job_id: jobId, title, body });
  };

  const getJobCustomer = async (jobId: string) => {
    const { data } = await supabase
      .from("jobs").select("customers(profile_id)").eq("id", jobId).single();
    return data?.customers?.profile_id ?? null;
  };

  try {
    switch (event.type) {
      case "payment_intent.created": {
        const pi = event.data.object as Stripe.PaymentIntent;
        if (pi.metadata?.job_id) {
          await supabase.from("jobs")
            .update({ stripe_payment_intent_id: pi.id, payment_status: "unpaid" })
            .eq("id", pi.metadata.job_id);
        }
        break;
      }

      case "payment_intent.amount_capturable_updated": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const jobId = pi.metadata?.job_id;
        if (jobId) {
          await supabase.from("jobs").update({ payment_status: "authorised" }).eq("id", jobId);
          const profileId = await getJobCustomer(jobId);
          if (profileId) await notify(profileId, jobId, "Payment Authorised",
            `£${(pi.amount / 100).toFixed(2)} reserved. Charged only on completion.`);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const jobId = pi.metadata?.job_id;
        if (jobId) {
          await supabase.from("jobs")
            .update({ payment_status: "captured", final_price: pi.amount_received / 100 })
            .eq("id", jobId);
          const profileId = await getJobCustomer(jobId);
          if (profileId) await notify(profileId, jobId, "Payment Complete",
            `Payment of £${(pi.amount_received / 100).toFixed(2)} successful. Thank you!`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const jobId = pi.metadata?.job_id;
        if (jobId) {
          await supabase.from("jobs").update({ payment_status: "failed" }).eq("id", jobId);
          const profileId = await getJobCustomer(jobId);
          if (profileId) await notify(profileId, jobId, "Payment Failed",
            "Your payment could not be processed. Please update your payment method.");
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (charge.payment_intent) {
          await supabase.from("jobs").update({ payment_status: "refunded" })
            .eq("stripe_payment_intent_id", charge.payment_intent);
        }
        break;
      }

      default:
        console.log(`Unhandled: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
