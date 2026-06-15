-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS public.tatkal_jobs CASCADE;
DROP TABLE IF EXISTS public.penalties CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('worker', 'contractor')),
  full_name TEXT,
  phone TEXT,
  location TEXT,
  bio TEXT,
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_jobs INT DEFAULT 0,
  penalty_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create jobs table for contractor job postings
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  workers_needed INT NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  is_tatkal BOOLEAN DEFAULT FALSE,
  tatkal_multiplier DECIMAL(3,2) DEFAULT 1.5,
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create job applications table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'no_show')),
  applied_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  final_amount DECIMAL(10,2),
  UNIQUE(job_id, worker_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('job_posted', 'job_accepted', 'job_rejected', 'job_completed', 'penalty_issued', 'tatkal_available')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create penalties table
CREATE TABLE public.penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  penalty_points INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tatkal jobs table (urgent jobs)
CREATE TABLE public.tatkal_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  urgency_level TEXT DEFAULT 'high' CHECK (urgency_level IN ('high', 'critical')),
  posted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(job_id)
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "jobs_select_all" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_contractor" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update_contractor" ON public.jobs;
DROP POLICY IF EXISTS "jobs_delete_contractor" ON public.jobs;
DROP POLICY IF EXISTS "job_applications_select_own" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_insert_worker" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_update_worker" ON public.job_applications;
DROP POLICY IF EXISTS "job_applications_update_contractor" ON public.job_applications;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "penalties_select_own" ON public.penalties;
DROP POLICY IF EXISTS "penalties_insert_system" ON public.penalties;
DROP POLICY IF EXISTS "tatkal_jobs_select_all" ON public.tatkal_jobs;
DROP POLICY IF EXISTS "tatkal_jobs_insert_contractor" ON public.tatkal_jobs;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tatkal_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Jobs RLS Policies
CREATE POLICY "jobs_select_all" ON public.jobs FOR SELECT USING (TRUE);
CREATE POLICY "jobs_insert_contractor" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = contractor_id);
CREATE POLICY "jobs_update_contractor" ON public.jobs FOR UPDATE USING (auth.uid() = contractor_id);
CREATE POLICY "jobs_delete_contractor" ON public.jobs FOR DELETE USING (auth.uid() = contractor_id);

-- Job Applications RLS Policies
CREATE POLICY "job_applications_select_own" ON public.job_applications FOR SELECT USING (auth.uid() = worker_id OR auth.uid() IN (SELECT contractor_id FROM public.jobs WHERE id = job_id));
CREATE POLICY "job_applications_insert_worker" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = worker_id);
CREATE POLICY "job_applications_update_worker" ON public.job_applications FOR UPDATE USING (auth.uid() = worker_id);
CREATE POLICY "job_applications_update_contractor" ON public.job_applications FOR UPDATE USING (auth.uid() IN (SELECT contractor_id FROM public.jobs WHERE id = job_id));

-- Notifications RLS Policies
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Penalties RLS Policies
CREATE POLICY "penalties_select_own" ON public.penalties FOR SELECT USING (auth.uid() = worker_id);
CREATE POLICY "penalties_insert_system" ON public.penalties FOR INSERT WITH CHECK (TRUE);

-- Tatkal Jobs RLS Policies
CREATE POLICY "tatkal_jobs_select_all" ON public.tatkal_jobs FOR SELECT USING (TRUE);
CREATE POLICY "tatkal_jobs_insert_contractor" ON public.tatkal_jobs FOR INSERT WITH CHECK (auth.uid() = contractor_id);
