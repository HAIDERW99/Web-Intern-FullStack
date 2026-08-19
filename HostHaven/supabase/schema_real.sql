-- ============================================================
-- HostHaven – Complete Production Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── 1. Profiles Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  phone       TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'customer',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow update profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are editable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Admin can read all profiles" ON public.profiles;

CREATE POLICY "Allow public read profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow insert profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow update profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = COALESCE(public.profiles.role, EXCLUDED.role);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 2. Hotels Table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hotels (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  business_name    TEXT,
  contact_name     TEXT,
  contact_phone    TEXT,
  contact_email    TEXT,
  address          TEXT,
  city             TEXT,
  country          TEXT DEFAULT 'US',
  maps_link        TEXT,
  category         TEXT DEFAULT 'hotel',
  room_count       INT DEFAULT 0,
  price_per_night  NUMERIC(10, 2) DEFAULT 150,
  rating           NUMERIC(3, 2) DEFAULT 0,
  review_count     INT DEFAULT 0,
  description      TEXT,
  amenities        TEXT[] DEFAULT ARRAY['Free WiFi', 'Pool', 'Room Service'],
  image_url        TEXT,
  cover_image_url  TEXT,
  license_doc_name TEXT,
  owner_id_doc_name TEXT,
  status           TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  admin_notes      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist even if table was created previously
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS maps_link TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'hotel';
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS room_count INT DEFAULT 0;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS price_per_night NUMERIC(10, 2) DEFAULT 150;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS rating NUMERIC(3, 2) DEFAULT 0;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT ARRAY['Free WiFi', 'Pool', 'Room Service'];
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS license_doc_name TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS owner_id_doc_name TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS admin_notes TEXT;

ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Approved hotels are public" ON public.hotels;
DROP POLICY IF EXISTS "Owners can view their hotels" ON public.hotels;
DROP POLICY IF EXISTS "Owners can insert hotels" ON public.hotels;
DROP POLICY IF EXISTS "Owners can update their hotels" ON public.hotels;
DROP POLICY IF EXISTS "Admins have full hotels access" ON public.hotels;
DROP POLICY IF EXISTS "Hotels select policy" ON public.hotels;
DROP POLICY IF EXISTS "Hotels insert policy" ON public.hotels;
DROP POLICY IF EXISTS "Hotels update policy" ON public.hotels;
DROP POLICY IF EXISTS "Hotels delete policy" ON public.hotels;

CREATE POLICY "Hotels select policy"
  ON public.hotels FOR SELECT
  USING (status = 'approved' OR owner_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Hotels insert policy"
  ON public.hotels FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Hotels update policy"
  ON public.hotels FOR UPDATE
  USING (owner_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Hotels delete policy"
  ON public.hotels FOR DELETE
  USING (owner_id = auth.uid() OR auth.uid() IS NOT NULL);


-- ── 3. Rooms Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rooms (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_number   TEXT NOT NULL,
  type          TEXT DEFAULT 'Standard',
  price         NUMERIC(10, 2) NOT NULL DEFAULT 100,
  beds          TEXT DEFAULT '1 Queen Bed',
  size_sqm      INT DEFAULT 25,
  status        TEXT DEFAULT 'available',
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rooms select policy" ON public.rooms;
DROP POLICY IF EXISTS "Rooms insert policy" ON public.rooms;
DROP POLICY IF EXISTS "Rooms update policy" ON public.rooms;
DROP POLICY IF EXISTS "Rooms delete policy" ON public.rooms;

CREATE POLICY "Rooms select policy"
  ON public.rooms FOR SELECT USING (true);

CREATE POLICY "Rooms insert policy"
  ON public.rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Rooms update policy"
  ON public.rooms FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Rooms delete policy"
  ON public.rooms FOR DELETE USING (auth.uid() IS NOT NULL);


-- ── 4. Bookings Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id        UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_id         UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  check_in        DATE NOT NULL,
  check_out       DATE NOT NULL,
  guests          INT DEFAULT 1,
  total_amount    NUMERIC(10, 2) NOT NULL DEFAULT 0,
  service_fee     NUMERIC(10, 2) DEFAULT 0,
  status          TEXT DEFAULT 'confirmed',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bookings select policy" ON public.bookings;
DROP POLICY IF EXISTS "Bookings insert policy" ON public.bookings;
DROP POLICY IF EXISTS "Bookings update policy" ON public.bookings;

CREATE POLICY "Bookings select policy"
  ON public.bookings FOR SELECT
  USING (customer_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Bookings insert policy"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Bookings update policy"
  ON public.bookings FOR UPDATE
  USING (customer_id = auth.uid() OR auth.uid() IS NOT NULL);


-- ── 5. Reviews Table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  hotel_id    UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
  booking_id  UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating      INT NOT NULL DEFAULT 5,
  comment     TEXT,
  reply       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews select policy" ON public.reviews;
DROP POLICY IF EXISTS "Reviews insert policy" ON public.reviews;
DROP POLICY IF EXISTS "Reviews update policy" ON public.reviews;

CREATE POLICY "Reviews select policy"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Reviews insert policy"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Reviews update policy"
  ON public.reviews FOR UPDATE USING (auth.uid() IS NOT NULL);


-- ── 6. Update hotel rating trigger ─────────────────────────
CREATE OR REPLACE FUNCTION public.update_hotel_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.hotels
  SET
    rating = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM public.reviews
      WHERE hotel_id = COALESCE(NEW.hotel_id, OLD.hotel_id)
    ),
    review_count = (
      SELECT COUNT(*) FROM public.reviews
      WHERE hotel_id = COALESCE(NEW.hotel_id, OLD.hotel_id)
    )
  WHERE id = COALESCE(NEW.hotel_id, OLD.hotel_id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_hotel_rating();

NOTIFY pgrst, 'reload schema';
