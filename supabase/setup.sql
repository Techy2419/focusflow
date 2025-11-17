-- ========================================
-- FOCUSFLOW DATABASE SETUP
-- ========================================
-- Run this ENTIRE script in Supabase SQL Editor
-- ========================================

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  -- User preferences
  ai_tone TEXT DEFAULT 'friendly',
  intervention_level DECIMAL DEFAULT 0.7,

  -- Stats
  total_study_minutes INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  best_focus_score DECIMAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  session_goal TEXT,
  ai_warmup TEXT,
  ai_reflection TEXT,

  total_minutes INTEGER,
  focused_minutes INTEGER,
  distraction_count INTEGER DEFAULT 0,
  focus_score DECIMAL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,

  timestamp TIMESTAMP DEFAULT NOW(),
  type TEXT NOT NULL,
  app_name TEXT,
  duration INTEGER,
  user_response TEXT
);

-- 2. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies
DROP POLICY IF EXISTS "Users own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users own events" ON public.events;

CREATE POLICY "Users own data" ON public.users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON public.users
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users own sessions" ON public.sessions
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own events" ON public.events
FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.sessions WHERE id = session_id)
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON public.events(session_id);

-- 5. Create trigger to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    username,
    first_name,
    last_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- DONE! Your database is ready.
-- ========================================
