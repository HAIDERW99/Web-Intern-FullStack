-- ============================================================
-- HostHaven – Complete Master Database Migration & Fix
-- Run this ONCE in Supabase SQL Editor to fix ALL missing columns & schema errors!
-- ============================================================

-- ── 1. Drop ALL existing RLS policies to prevent lock errors ──
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;


-- ── 2. Fix ENUM types & Convert status columns to TEXT ────────
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'hotels' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.hotels ALTER COLUMN status TYPE TEXT USING status::text;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.bookings ALTER COLUMN status TYPE TEXT USING status::text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'rooms' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.rooms ALTER COLUMN status TYPE TEXT USING status::text;
    END IF;
END $$;


-- ── 3. Drop ALL legacy NOT NULL constraints (Except Primary Key 'id') ──
DO $$
DECLARE
    col RECORD;
BEGIN
    FOR col IN
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND column_name != 'id' 
          AND is_nullable = 'NO'
          AND table_name IN ('hotels', 'rooms', 'bookings', 'reviews', 'profiles', 'hotel_images')
    LOOP
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL', col.table_name, col.column_name);
    END LOOP;
END $$;


-- ── 4. Fix PROFILES Table & Ensure ALL Columns Exist ─────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

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


-- ── 5. Fix HOTELS Table & Ensure ALL Columns Exist ────────────
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS address TEXT;
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
ALTER TABLE public.hotels ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ── 6. Fix ROOMS Table & Ensure ALL Columns Exist ─────────────
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Standard';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 100;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS beds TEXT DEFAULT '1 Queen Bed';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS size_sqm INT DEFAULT 25;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();


-- ── 7. Fix BOOKINGS Table & Ensure ALL Columns Exist (guests, service_fee, etc.) ──
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS check_in DATE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS check_out DATE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guests INT DEFAULT 1;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS service_fee NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();


-- ── 8. Fix REVIEWS Table & Ensure ALL Columns Exist ────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS rating INT DEFAULT 5;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reply TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();


-- ── 9. Re-enable RLS & Set Up Clean Policies ─────────────────

-- PROFILES POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow insert profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow update profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- HOTELS POLICIES
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hotels select policy" ON public.hotels FOR SELECT USING (status = 'approved' OR owner_id = auth.uid() OR auth.uid() IS NOT NULL);
CREATE POLICY "Hotels insert policy" ON public.hotels FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Hotels update policy" ON public.hotels FOR UPDATE USING (owner_id = auth.uid() OR auth.uid() IS NOT NULL);
CREATE POLICY "Hotels delete policy" ON public.hotels FOR DELETE USING (owner_id = auth.uid() OR auth.uid() IS NOT NULL);

-- ROOMS POLICIES
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rooms select policy" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Rooms insert policy" ON public.rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Rooms update policy" ON public.rooms FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Rooms delete policy" ON public.rooms FOR DELETE USING (auth.uid() IS NOT NULL);

-- BOOKINGS POLICIES
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bookings select policy" ON public.bookings FOR SELECT USING (customer_id = auth.uid() OR auth.uid() IS NOT NULL);
CREATE POLICY "Bookings insert policy" ON public.bookings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Bookings update policy" ON public.bookings FOR UPDATE USING (customer_id = auth.uid() OR auth.uid() IS NOT NULL);

-- REVIEWS POLICIES
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews select policy" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Reviews insert policy" ON public.reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Reviews update policy" ON public.reviews FOR UPDATE USING (auth.uid() IS NOT NULL);

-- HOTEL_IMAGES POLICIES (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hotel_images') THEN
    ALTER TABLE public.hotel_images ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Hotel images select policy" ON public.hotel_images FOR SELECT USING (true);
    CREATE POLICY "Hotel images insert policy" ON public.hotel_images FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;


-- ── 10. Reload PostgREST Schema Cache ──────────────────────────
NOTIFY pgrst, 'reload schema';
