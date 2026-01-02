-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create lands table
CREATE TABLE IF NOT EXISTS public.lands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  land_id_code TEXT NOT NULL,
  village TEXT NOT NULL,
  khasra_no TEXT NOT NULL,
  area_acres DECIMAL(10, 2),
  area_bigha DECIMAL(10, 2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'leased', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, land_id_code)
);

-- Create farmers table
CREATE TABLE IF NOT EXISTS public.farmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  village TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create agreements table
CREATE TABLE IF NOT EXISTS public.agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  land_id UUID NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES public.farmers(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('fixed', 'crop_share')),
  expected_amount DECIMAL(12, 2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'renewal_pending')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create crops table
CREATE TABLE IF NOT EXISTS public.crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  land_id UUID NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  season TEXT NOT NULL CHECK (season IN ('rabi', 'kharif', 'zaid')),
  crop_name TEXT NOT NULL,
  sowing_month TEXT,
  harvest_month TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create parchis table (documents)
CREATE TABLE IF NOT EXISTS public.parchis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  land_id UUID NOT NULL REFERENCES public.lands(id) ON DELETE CASCADE,
  season TEXT NOT NULL CHECK (season IN ('rabi', 'kharif', 'zaid')),
  crop_name TEXT NOT NULL,
  parchi_type TEXT NOT NULL CHECK (parchi_type IN ('mandi_sale', 'payment', 'other')),
  parchi_date DATE NOT NULL,
  amount DECIMAL(12, 2),
  quantity_weight DECIMAL(10, 2),
  file_path TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  expected_amount DECIMAL(12, 2),
  received_amount DECIMAL(12, 2) DEFAULT 0,
  payment_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parchis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "users_can_view_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_can_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_can_access_own_lands" ON public.lands FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_can_access_own_farmers" ON public.farmers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_can_access_own_agreements" ON public.agreements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_can_access_own_crops" ON public.crops FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_can_access_own_parchis" ON public.parchis FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_can_access_own_payments" ON public.payments FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_lands_user_id ON public.lands(user_id);
CREATE INDEX idx_farmers_user_id ON public.farmers(user_id);
CREATE INDEX idx_agreements_user_id ON public.agreements(user_id);
CREATE INDEX idx_agreements_land_id ON public.agreements(land_id);
CREATE INDEX idx_crops_user_id ON public.crops(user_id);
CREATE INDEX idx_parchis_user_id ON public.parchis(user_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
