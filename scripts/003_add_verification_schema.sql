-- Add verification and user details to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'under_review')),
ADD COLUMN IF NOT EXISTS aadhar_number TEXT,
ADD COLUMN IF NOT EXISTS aadhar_front_url TEXT,
ADD COLUMN IF NOT EXISTS aadhar_back_url TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS pincode TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_number TEXT,
ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS has_temp_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS credentials_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS credentials_sent_via TEXT CHECK (credentials_sent_via IN ('email', 'whatsapp', 'sms')),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP DEFAULT NOW();

-- Create verification queue table for admin review
CREATE TABLE IF NOT EXISTS public.verification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create admin users table (for backend verification team)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'verifier', 'super_admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create credential logs table (to track sent credentials)
CREATE TABLE IF NOT EXISTS public.credential_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL,
  user_id_generated TEXT NOT NULL,
  sent_via TEXT NOT NULL CHECK (sent_via IN ('email', 'whatsapp', 'sms')),
  recipient_email TEXT,
  recipient_phone TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'delivered'))
);

-- RLS Policies for new tables
ALTER TABLE public.verification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_logs ENABLE ROW LEVEL SECURITY;

-- Verification Queue Policies (only admins can see)
CREATE POLICY "verification_queue_select_admin" ON public.verification_queue 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "verification_queue_update_admin" ON public.verification_queue 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- Admin Users Policies (only super admins can manage)
CREATE POLICY "admin_users_select_admin" ON public.admin_users 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
    )
  );

-- Credential Logs Policies (admins only)
CREATE POLICY "credential_logs_select_admin" ON public.credential_logs 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND is_active = TRUE
    )
  );

-- Function to generate user ID (10 digits for contractor, 8 for worker)
CREATE OR REPLACE FUNCTION public.generate_user_id(user_type_param TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_user_id TEXT;
  id_length INT;
  is_unique BOOLEAN := FALSE;
BEGIN
  -- Set length based on user type
  IF user_type_param = 'contractor' THEN
    id_length := 10;
  ELSE
    id_length := 8;
  END IF;
  
  -- Generate unique ID
  WHILE NOT is_unique LOOP
    -- Generate random numeric ID
    new_user_id := LPAD(
      FLOOR(RANDOM() * POWER(10, id_length))::TEXT,
      id_length,
      '0'
    );
    
    -- Check if ID already exists
    SELECT NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = new_user_id
    ) INTO is_unique;
  END LOOP;
  
  RETURN new_user_id;
END;
$$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_queue_status ON public.verification_queue(status);
CREATE INDEX IF NOT EXISTS idx_verification_queue_created_at ON public.verification_queue(created_at DESC);

