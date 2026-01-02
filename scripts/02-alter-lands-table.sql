-- Add new columns to lands table
ALTER TABLE public.lands
ADD COLUMN IF NOT EXISTS farmer_id UUID REFERENCES public.farmers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS details TEXT;

-- Make village optional by dropping the NOT NULL constraint
ALTER TABLE public.lands ALTER COLUMN village DROP NOT NULL;
