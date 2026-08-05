-- ============================================================
-- TradePro 360 — Complete Database Schema
-- Copy this entire file and run it in the Supabase SQL Editor.
-- ============================================================
-- INSTRUCTIONS:
--   1. Open your Supabase project → SQL Editor → New query
--   2. Paste this entire file
--   3. Click "Run"
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- ENUMS
-- ============================================================

-- Trade types (matches all service IDs used in BookingWidget/HomePage)
CREATE TYPE trade_type AS ENUM (
  'plumbing',
  'electrical',
  'heating',
  'drainage',
  'locksmith',
  'general'
);

-- Job lifecycle status
-- NOTE: 'invoicing' is a transient UI state used by EngineerActions;
--       it is mapped here so the DB accepts it without errors.
CREATE TYPE job_status AS ENUM (
  'pending',
  'assigned',
  'en_route',
  'on_site',
  'invoicing',
  'completed',
  'cancelled',
  'disputed'
);

-- Booking urgency (BookingWidget sends 'emergency' or 'standard';
--                  dispatch engine also handles 'same_day')
CREATE TYPE booking_urgency AS ENUM (
  'emergency',
  'same_day',
  'standard'
);

-- Payment lifecycle (driven by Stripe webhook)
CREATE TYPE payment_status AS ENUM (
  'unpaid',
  'authorised',
  'captured',
  'refunded',
  'failed'
);

-- Engineer availability (includes en_route & on_site so the
--  fleet map and dispatch engine can reflect real states)
CREATE TYPE engineer_status AS ENUM (
  'available',
  'en_route',
  'on_site',
  'busy',
  'offline'
);

-- User roles (controls RLS and dashboard routing)
CREATE TYPE user_role AS ENUM (
  'customer',
  'engineer',
  'admin'
);

-- ============================================================
-- PROFILES  (extends Supabase auth.users — created automatically
--  via an Auth trigger; see trigger below)
-- ============================================================

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role NOT NULL DEFAULT 'customer',
  full_name     TEXT NOT NULL DEFAULT '',
  phone         TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ENGINEERS
-- ============================================================

CREATE TABLE engineers (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trade                 trade_type NOT NULL,
  status                engineer_status NOT NULL DEFAULT 'offline',
  rating                NUMERIC(3,2) DEFAULT 5.00,
  review_count          INTEGER DEFAULT 0,         -- cached count; updated by trigger
  total_jobs            INTEGER DEFAULT 0,
  hourly_rate           NUMERIC(10,2) NOT NULL DEFAULT 60.00,
  callout_fee           NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  bio                   TEXT,
  certifications        TEXT[],
  cert_badge            TEXT,                      -- e.g. "Gas Safe Certified", "NICEIC" — shown on TrackingPage
  vehicle               TEXT,                      -- e.g. "White Ford Transit"
  vehicle_reg           TEXT,                      -- e.g. "AB12 CDE"
  service_radius_miles  INTEGER DEFAULT 15,
  location              GEOGRAPHY(POINT, 4326),    -- live PostGIS point
  last_seen_at          TIMESTAMPTZ,
  stripe_account_id     TEXT,                      -- Stripe Connect account for payouts
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE customers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id  TEXT,                        -- Stripe Customer ID for saved cards
  default_address     TEXT,
  default_postcode    TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- JOBS
-- ============================================================

CREATE TABLE jobs (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id               UUID REFERENCES customers(id) ON DELETE RESTRICT,
  engineer_id               UUID REFERENCES engineers(id) ON DELETE SET NULL,
  trade                     trade_type NOT NULL,
  title                     TEXT NOT NULL,
  description               TEXT,
  urgency                   booking_urgency NOT NULL DEFAULT 'standard',
  status                    job_status NOT NULL DEFAULT 'pending',
  -- Location fields
  address                   TEXT NOT NULL DEFAULT '',
  postcode                  TEXT NOT NULL DEFAULT '',
  location                  GEOGRAPHY(POINT, 4326),  -- geocoded from postcode
  -- Timing
  scheduled_at              TIMESTAMPTZ,
  started_at                TIMESTAMPTZ,
  completed_at              TIMESTAMPTZ,
  estimated_duration_mins   INTEGER DEFAULT 60,
  eta_mins                  INTEGER,                  -- live ETA shown in Kanban
  -- Pricing
  quoted_price              NUMERIC(10,2),
  final_price               NUMERIC(10,2),
  -- Payment
  payment_status            payment_status NOT NULL DEFAULT 'unpaid',
  stripe_payment_intent_id  TEXT,
  -- Notes
  customer_notes            TEXT,                     -- access notes from booking
  engineer_notes            TEXT,
  -- Photos (stored as Supabase Storage public URLs)
  photos_before             TEXT[],
  photos_after              TEXT[],
  -- Public tracking token (shared with customer via SMS / email)
  tracking_token            TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- JOB STATUS HISTORY  (full audit trail)
-- ============================================================

CREATE TABLE job_status_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  old_status  job_status,
  new_status  job_status NOT NULL,
  changed_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ENGINEER LOCATION HISTORY  (GPS breadcrumb trail)
-- ============================================================

CREATE TABLE engineer_locations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engineer_id   UUID NOT NULL REFERENCES engineers(id) ON DELETE CASCADE,
  job_id        UUID REFERENCES jobs(id) ON DELETE SET NULL,
  location      GEOGRAPHY(POINT, 4326) NOT NULL,
  accuracy_m    NUMERIC(8,2),
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id        UUID NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  engineer_id   UUID NOT NULL REFERENCES engineers(id) ON DELETE CASCADE,
  rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  reply         TEXT,                               -- engineer reply
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id      UUID REFERENCES jobs(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DISPATCH LOG  (auto-assignment audit — written by dispatch-engine function)
-- ============================================================

CREATE TABLE dispatch_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id        UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidates    JSONB,                              -- scored candidate list
  assigned_to   UUID REFERENCES engineers(id) ON DELETE SET NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_jobs_status           ON jobs(status);
CREATE INDEX idx_jobs_trade            ON jobs(trade);
CREATE INDEX idx_jobs_engineer_id      ON jobs(engineer_id);
CREATE INDEX idx_jobs_customer_id      ON jobs(customer_id);
CREATE INDEX idx_jobs_tracking_token   ON jobs(tracking_token);
CREATE INDEX idx_jobs_created_at       ON jobs(created_at DESC);
CREATE INDEX idx_jobs_location         ON jobs USING GIST(location);
CREATE INDEX idx_engineers_trade       ON engineers(trade);
CREATE INDEX idx_engineers_status      ON engineers(status);
CREATE INDEX idx_engineers_profile_id  ON engineers(profile_id);
CREATE INDEX idx_engineers_location    ON engineers USING GIST(location);
CREATE INDEX idx_customers_profile_id  ON customers(profile_id);
CREATE INDEX idx_notifications_profile ON notifications(profile_id, read);
CREATE INDEX idx_notifications_job     ON notifications(job_id);
CREATE INDEX idx_eng_locations_eng     ON engineer_locations(engineer_id, recorded_at DESC);
CREATE INDEX idx_eng_locations_job     ON engineer_locations(job_id);
CREATE INDEX idx_reviews_engineer      ON reviews(engineer_id);
CREATE INDEX idx_job_history_job       ON job_status_history(job_id, created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_engineers_updated_at
  BEFORE UPDATE ON engineers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- JOB STATUS HISTORY TRIGGER
-- Fires on every status change and logs the transition
-- ============================================================

CREATE OR REPLACE FUNCTION log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO job_status_history (job_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_job_status_history
  AFTER UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION log_job_status_change();

-- ============================================================
-- ENGINEER RATING + REVIEW COUNT UPDATE TRIGGER
-- Keeps engineers.rating and engineers.review_count in sync
-- ============================================================

CREATE OR REPLACE FUNCTION update_engineer_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE engineers
  SET
    rating       = ROUND(AVG(r.rating)::NUMERIC, 2),
    review_count = COUNT(r.id)::INTEGER,
    total_jobs   = COUNT(r.id)::INTEGER
  FROM reviews r
  WHERE r.engineer_id = NEW.engineer_id
    AND engineers.id  = NEW.engineer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_engineer_rating
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_engineer_rating();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE engineer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_log       ENABLE ROW LEVEL SECURITY;

-- ── profiles ──────────────────────────────────────────────────────────────
-- Users read / update only their own row.
-- Admins use service_role key from edge functions (bypasses RLS).
-- NOTE: Avoid querying profiles inside a profiles policy (infinite recursion).
--       Admin operations must use the service_role key.

CREATE POLICY "profiles_self_select"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_self_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── customers ─────────────────────────────────────────────────────────────

CREATE POLICY "customers_self_all"
  ON customers FOR ALL
  USING (profile_id = auth.uid());

-- ── engineers ─────────────────────────────────────────────────────────────
-- Public can read non-offline engineers (needed for dispatch & booking page)

CREATE POLICY "engineers_public_read"
  ON engineers FOR SELECT
  USING (status != 'offline');

CREATE POLICY "engineers_self_all"
  ON engineers FOR ALL
  USING (profile_id = auth.uid());

-- ── jobs ──────────────────────────────────────────────────────────────────

-- Customers read/insert their own jobs
CREATE POLICY "jobs_customer_select"
  ON jobs FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "jobs_customer_insert"
  ON jobs FOR INSERT
  WITH CHECK (
    -- Allow guest bookings (customer_id may be NULL for unauthenticated users)
    customer_id IS NULL
    OR customer_id IN (
      SELECT id FROM customers WHERE profile_id = auth.uid()
    )
  );

-- Engineers read and update their own assigned jobs
CREATE POLICY "jobs_engineer_select"
  ON jobs FOR SELECT
  USING (
    engineer_id IN (
      SELECT id FROM engineers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "jobs_engineer_update"
  ON jobs FOR UPDATE
  USING (
    engineer_id IN (
      SELECT id FROM engineers WHERE profile_id = auth.uid()
    )
  );

-- Public tracking via token — anyone with the token can read the job
-- (enables shareable tracking links sent by SMS/email)
CREATE POLICY "jobs_public_tracking_select"
  ON jobs FOR SELECT
  USING (tracking_token IS NOT NULL);

-- ── job_status_history ────────────────────────────────────────────────────

CREATE POLICY "job_history_parties_select"
  ON job_status_history FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM jobs
      WHERE
        customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
        OR engineer_id IN (SELECT id FROM engineers WHERE profile_id = auth.uid())
    )
  );

-- ── engineer_locations ────────────────────────────────────────────────────

CREATE POLICY "locations_engineer_insert"
  ON engineer_locations FOR INSERT
  WITH CHECK (
    engineer_id IN (
      SELECT id FROM engineers WHERE profile_id = auth.uid()
    )
  );

-- Customers and engineers involved in the job can read location updates
CREATE POLICY "locations_job_parties_select"
  ON engineer_locations FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM jobs
      WHERE
        customer_id IN (SELECT id FROM customers WHERE profile_id = auth.uid())
        OR engineer_id IN (SELECT id FROM engineers WHERE profile_id = auth.uid())
    )
  );

-- ── reviews ───────────────────────────────────────────────────────────────

CREATE POLICY "reviews_public_select"
  ON reviews FOR SELECT
  USING (TRUE);

CREATE POLICY "reviews_customer_insert"
  ON reviews FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE profile_id = auth.uid()
    )
  );

-- ── notifications ─────────────────────────────────────────────────────────

CREATE POLICY "notifications_self_all"
  ON notifications FOR ALL
  USING (profile_id = auth.uid());

-- ── dispatch_log ──────────────────────────────────────────────────────────
-- Only readable by service_role (admin edge functions); no end-user policy.

-- ============================================================
-- REALTIME PUBLICATIONS
-- Tables that stream live changes to the frontend via supabase-js
-- ============================================================

BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE
    jobs,
    engineer_locations,
    notifications,
    job_status_history;
COMMIT;

-- ============================================================
-- STORAGE BUCKET
-- Creates the 'job-photos' bucket used by BookingWidget and EngineerActions
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read public photos (used in AdminKanban thumbnails)
CREATE POLICY "job_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-photos');

-- Only authenticated users can upload
CREATE POLICY "job_photos_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'job-photos'
    AND auth.role() = 'authenticated'
  );

-- Owners can delete their own uploads
CREATE POLICY "job_photos_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'job-photos'
    AND auth.uid() = owner
  );

-- ============================================================
-- HELPER FUNCTION — find nearest available engineers
-- Called by the dispatch-engine Edge Function
-- ============================================================

CREATE OR REPLACE FUNCTION find_nearest_engineers(
  p_trade       trade_type,
  p_lat         FLOAT,
  p_lng         FLOAT,
  p_radius_km   FLOAT   DEFAULT 30,
  p_limit       INTEGER DEFAULT 5
)
RETURNS TABLE (
  engineer_id   UUID,
  profile_id    UUID,
  full_name     TEXT,
  rating        NUMERIC,
  hourly_rate   NUMERIC,
  distance_km   FLOAT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id                                                                           AS engineer_id,
    e.profile_id,
    p.full_name,
    e.rating,
    e.hourly_rate,
    (ST_Distance(
      e.location,
      ST_MakePoint(p_lng, p_lat)::GEOGRAPHY
    ) / 1000)::FLOAT                                                               AS distance_km
  FROM engineers e
  JOIN profiles p ON p.id = e.profile_id
  WHERE
    e.trade   = p_trade
    AND e.status = 'available'
    AND e.location IS NOT NULL
    AND ST_DWithin(
      e.location,
      ST_MakePoint(p_lng, p_lat)::GEOGRAPHY,
      p_radius_km * 1000
    )
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$;

-- ============================================================
-- SEED DATA (DEVELOPMENT ONLY)
-- Remove or comment-out before going to production.
-- Create the admin user in Supabase Auth first, then paste
-- the generated UUID below.
-- ============================================================

-- Step 1: Create user in Supabase Auth → Settings → Users → Invite user
-- Step 2: Copy the UUID from the Users table and paste it below:

-- INSERT INTO profiles (id, role, full_name, phone)
-- VALUES (
--   'PASTE-ADMIN-UUID-HERE',
--   'admin',
--   'TradePro Admin',
--   '+441234567890'
-- )
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ============================================================
-- END OF SCHEMA
-- ============================================================
