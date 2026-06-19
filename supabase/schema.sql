-- =====================================================================
-- WEEKLY CAMPUS MEALS - DATABASE SCHEMA MIGRATION SCRIPT
-- Target Platform: Supabase (PostgreSQL 15+)
-- Description: Standard schema setup including standard triggers, indices,
--              Row-Level Security (RLS) policies, and user role mechanics.
-- =====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Custom ENUM Types for Domain Models
CREATE TYPE user_role AS ENUM ('student', 'admin');

CREATE TYPE menu_status AS ENUM ('draft', 'active', 'archived');

CREATE TYPE meal_category AS ENUM ('soup', 'stew', 'rice', 'other');

CREATE TYPE order_status AS ENUM (
  'pending_payment', 
  'payment_under_verification', 
  'paid', 
  'confirmed', 
  'delivered', 
  'cancelled'
);

CREATE TYPE proof_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE catering_status AS ENUM (
  'pending', 
  'reviewed', 
  'quoted', 
  'accepted', 
  'completed', 
  'cancelled'
);

CREATE TYPE schedule_status AS ENUM ('open', 'closed', 'completed');

-- ---------------------------------------------------------------------
-- 1. PROFILES TABLE
-- Extends Supabase auth.users system table
-- ---------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  role user_role DEFAULT 'student'::user_role NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  hostel_name TEXT,
  room_number TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 2. MEALS TABLE (Universal Master Catalog)
-- Recurrent products catalog
-- ---------------------------------------------------------------------
CREATE TABLE public.meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category meal_category NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on meals
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 3. WEEKLY MENUS TABLE
-- Tracks menus active across specific multi-day cycles
-- ---------------------------------------------------------------------
CREATE TABLE public.weekly_menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date >= start_date),
  status menu_status DEFAULT 'draft'::menu_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on weekly_menus
ALTER TABLE public.weekly_menus ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 4. MENU MEALS junction table (The Weekly Lineup)
-- Holds threshold mechanisms specifically scoped to a specific weekly menu
-- ---------------------------------------------------------------------
CREATE TABLE public.menu_meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID REFERENCES public.weekly_menus(id) ON DELETE CASCADE NOT NULL,
  meal_id UUID REFERENCES public.meals(id) ON DELETE RESTRICT NOT NULL,
  min_threshold INTEGER DEFAULT 40 NOT NULL CHECK (min_threshold > 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_menu_meal UNIQUE (menu_id, meal_id)
);

-- Enable RLS on menu_meals
ALTER TABLE public.menu_meals ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 5. ORDERS TABLE
-- High-level student orders tracking payment & delivery parameters
-- ---------------------------------------------------------------------
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT, -- Made nullable for guest checkouts
  customer_name TEXT, -- Extra columns for guest flow
  customer_phone TEXT, -- Extra columns for guest flow
  customer_whatsapp TEXT, -- Extra columns for guest flow
  pickup_code TEXT, -- Extra columns for guest flow
  status order_status DEFAULT 'pending_payment'::order_status NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  hostel_name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 6. ORDER ITEMS TABLE
-- Individual meals purchased inside an order linked to weekly items
-- ---------------------------------------------------------------------
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_meal_id UUID REFERENCES public.menu_meals(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 7. PAYMENT PROOFS TABLE
-- Proof uploads tracking manual transaction verification for the MVP
-- ---------------------------------------------------------------------
CREATE TABLE public.payment_proofs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  transaction_reference TEXT UNIQUE, -- Optional manual/Paystack trace
  proof_image_url TEXT NOT NULL,
  status proof_status DEFAULT 'pending'::proof_status NOT NULL,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on payment_proofs
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 8. CATERING REQUESTS TABLE
-- Dedicated requests for student events & special bookings
-- ---------------------------------------------------------------------
CREATE TABLE public.catering_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT, -- Made nullable for guest requests
  customer_name TEXT, -- Extra columns for guest catering mode
  customer_phone TEXT, -- Extra columns for guest catering mode
  customer_email TEXT, -- Extra columns for guest catering mode
  event_name TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL CHECK (event_date > now()),
  estimated_guests INTEGER NOT NULL CHECK (estimated_guests > 0),
  special_instructions TEXT,
  status catering_status DEFAULT 'pending'::catering_status NOT NULL,
  quoted_price NUMERIC(10, 2) CHECK (quoted_price >= 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on catering_requests
ALTER TABLE public.catering_requests ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 9. DELIVERY SCHEDULES TABLE
-- Outlines delivery slots and order windows linked to weekly menus
-- ---------------------------------------------------------------------
CREATE TABLE public.delivery_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_id UUID REFERENCES public.weekly_menus(id) ON DELETE CASCADE NOT NULL,
  delivery_date DATE NOT NULL,
  cutoff_time TIMESTAMPTZ NOT NULL,
  status schedule_status DEFAULT 'open'::schedule_status NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on delivery_schedules
ALTER TABLE public.delivery_schedules ENABLE ROW LEVEL SECURITY;


-- =====================================================================
-- DATABASE INDEXES (Performance Tuning)
-- =====================================================================
CREATE INDEX idx_profiles_role ON public.profiles(role);

CREATE INDEX idx_weekly_menus_dates ON public.weekly_menus(start_date, end_date);
CREATE INDEX idx_weekly_menus_status ON public.weekly_menus(status);

CREATE INDEX idx_menu_meals_menu ON public.menu_meals(menu_id);
CREATE INDEX idx_menu_meals_meal ON public.menu_meals(meal_id);

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE INDEX idx_order_items_menu_meal ON public.order_items(menu_meal_id);

CREATE INDEX idx_payment_proofs_order ON public.payment_proofs(order_id);
CREATE INDEX idx_payment_proofs_status ON public.payment_proofs(status);

CREATE INDEX idx_catering_requests_user ON public.catering_requests(user_id);
CREATE INDEX idx_catering_requests_date ON public.catering_requests(event_date);

CREATE INDEX idx_delivery_schedules_menu ON public.delivery_schedules(menu_id);


-- =====================================================================
-- TIMESTAMPTZ HELPER TRIGGERS (Auto-update updated_at)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_meals_modtime BEFORE UPDATE ON public.meals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_weekly_menus_modtime BEFORE UPDATE ON public.weekly_menus FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_payment_proofs_modtime BEFORE UPDATE ON public.payment_proofs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_catering_requests_modtime BEFORE UPDATE ON public.catering_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER update_delivery_schedules_modtime BEFORE UPDATE ON public.delivery_schedules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =====================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER (On Supabase Sign-up)
-- Calculates full_name from auth user meta metadata or email prefix if null
-- =====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role user_role := 'student'::user_role;
  user_fullName TEXT;
BEGIN
  -- Auto-upgrade email with admin@jdhkitchen.com to administrative chef role
  IF NEW.email = 'admin@jdhkitchen.com' THEN
    default_role := 'admin'::user_role;
  END IF;

  user_fullName := COALESCE(
    (NEW.raw_user_meta_data->>'full_name'), 
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, role, full_name, email, phone, hostel_name, room_number)
  VALUES (
    NEW.id,
    default_role,
    user_fullName,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'hostel_name',
    NEW.raw_user_meta_data->>'room_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =====================================================================
-- DATABASE VIEWS (For Simple Counting & Real-time Threshold Tracking)
-- =====================================================================
-- Computes the dynamic order aggregate count towards the minimum threshold
CREATE OR REPLACE VIEW public.vw_menu_meals_progress AS
SELECT 
  mm.id AS menu_meal_id,
  mm.menu_id,
  mm.meal_id,
  m.name AS meal_name,
  m.category AS meal_category,
  m.price AS unit_price,
  m.image_url,
  mm.min_threshold,
  COALESCE(SUM(oi.quantity), 0)::INTEGER AS total_ordered_quantity,
  GREATEST(0, mm.min_threshold - COALESCE(SUM(oi.quantity), 0))::INTEGER AS remaining_orders_needed,
  (COALESCE(SUM(oi.quantity), 0) >= mm.min_threshold) AS is_threshold_met
FROM public.menu_meals mm
JOIN public.meals m ON mm.meal_id = m.id
LEFT JOIN public.order_items oi ON mm.id = oi.menu_meal_id
LEFT JOIN public.orders o ON oi.order_id = o.id AND o.status IN ('paid', 'confirmed', 'delivered')
GROUP BY mm.id, m.name, m.category, m.price, m.image_url;


-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Helper Functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Profiles are readable by anyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Profiles can be updated by anyone" ON public.profiles
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Profiles can be inserted by anyone" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- Meals Policies (Admins maintain; authenticated users view)
CREATE POLICY "Meals are viewable by anyone" ON public.meals
  FOR SELECT USING (true);

CREATE POLICY "Meals can be modified by anyone" ON public.meals
  FOR ALL USING (true);

-- Weekly Menus Policies
CREATE POLICY "Weekly menus are readable by anyone" ON public.weekly_menus
  FOR SELECT USING (true);

CREATE POLICY "Weekly menus can be modified by anyone" ON public.weekly_menus
  FOR ALL USING (true);

-- Menu Meals Policies
CREATE POLICY "Weekly menu lineup is readable by anyone" ON public.menu_meals
  FOR SELECT USING (true);

CREATE POLICY "Weekly menu lineup can be modified by anyone" ON public.menu_meals
  FOR ALL USING (true);

-- Orders Policies
CREATE POLICY "Anyone can view orders" ON public.orders
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update orders" ON public.orders
  FOR UPDATE USING (true);

-- Order Items Policies
CREATE POLICY "Anyone can view order items" ON public.order_items
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update order items" ON public.order_items
  FOR UPDATE USING (true);

-- Payment Proofs Policies
CREATE POLICY "Anyone can view payment proofs" ON public.payment_proofs
  FOR SELECT USING (true);

CREATE POLICY "Anyone can submit payment proofs" ON public.payment_proofs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update payment proofs" ON public.payment_proofs
  FOR UPDATE USING (true);

-- Catering Requests Policies
CREATE POLICY "Anyone can view catering requests" ON public.catering_requests
  FOR SELECT USING (true);

CREATE POLICY "Anyone can submit catering requests" ON public.catering_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update catering requests" ON public.catering_requests
  FOR UPDATE USING (true);

-- Delivery Schedules Policies
CREATE POLICY "Delivery schedules are viewable by anyone" ON public.delivery_schedules
  FOR SELECT USING (true);

CREATE POLICY "Delivery schedules are manageable by anyone" ON public.delivery_schedules
  FOR ALL USING (true);

-- =====================================================================
-- STORAGE BUCKETS AND SECURITY POLICIES FOR UPLOADS
-- Ensure both buckets exist as public buckets inside Supabase storage,
-- and set up security rules so anonymous/authenticated uploads succeed.
-- =====================================================================

-- Create bucket for universal catalog meal pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('mealsImage', 'mealsImage', true)
ON CONFLICT (id) DO NOTHING;

-- Create bucket for manual student pre-order payment verification receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies if they exist to prevent conflicts on application
DROP POLICY IF EXISTS "Allow public read access to mealsImage bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert access to mealsImage bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update access to mealsImage bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete access to mealsImage bucket" ON storage.objects;

DROP POLICY IF EXISTS "Allow public read access to payment-proofs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert access to payment-proofs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update access to payment-proofs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete access to payment-proofs bucket" ON storage.objects;

-- Storage Policies for 'mealsImage' bucket
CREATE POLICY "Allow public read access to mealsImage bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'mealsImage');

CREATE POLICY "Allow public insert access to mealsImage bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'mealsImage');

CREATE POLICY "Allow public update access to mealsImage bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'mealsImage')
WITH CHECK (bucket_id = 'mealsImage');

-- Storage Policies for 'payment-proofs' bucket
CREATE POLICY "Allow public read access to payment-proofs bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

CREATE POLICY "Allow public insert access to payment-proofs bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Allow public update access to payment-proofs bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'payment-proofs')
WITH CHECK (bucket_id = 'payment-proofs');


-- =====================================================================
-- CUSTOMER REVIEWS DYNAMIC COMPONENT TABLING
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.customer_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  stars INT NOT NULL DEFAULT 5,
  image TEXT
);

-- Enable RLS on public.customer_reviews
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing review policies if they exist to prevent conflicts on application
DROP POLICY IF EXISTS "Allow public read access to customer_reviews" ON public.customer_reviews;
DROP POLICY IF EXISTS "Allow public insert access to customer_reviews" ON public.customer_reviews;

-- Create policies for public reviews access
CREATE POLICY "Allow public read access to customer_reviews" ON public.customer_reviews
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to customer_reviews" ON public.customer_reviews
  FOR INSERT WITH CHECK (true);

-- Create bucket for reviewer avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('reviewer-avatars', 'reviewer-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist for reviewer-avatars
DROP POLICY IF EXISTS "Allow public read access to reviewer-avatars bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert access to reviewer-avatars bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update access to reviewer-avatars bucket" ON storage.objects;

-- Storage Policies for 'reviewer-avatars' bucket
CREATE POLICY "Allow public read access to reviewer-avatars bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'reviewer-avatars');

CREATE POLICY "Allow public insert access to reviewer-avatars bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reviewer-avatars');

CREATE POLICY "Allow public update access to reviewer-avatars bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'reviewer-avatars')
WITH CHECK (bucket_id = 'reviewer-avatars');


