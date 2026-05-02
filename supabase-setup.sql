-- ============================================================
-- AMEZA — One-time Supabase setup
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================


-- ── 1. PROFILES TRIGGER ────────────────────────────────────────────────────
-- Creates a profiles row automatically whenever a user signs up.
-- The register page stores role + full_name in user_metadata.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'client'),
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 2. STORAGE BUCKETS ─────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('cleaner-docs', 'cleaner-docs', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;


-- ── 3. STORAGE RLS POLICIES — cleaner-docs ─────────────────────────────────
-- Authenticated users can upload/update only inside their own folder ({userId}/...)
-- Anyone can read (needed to display avatars and doc links).

DROP POLICY IF EXISTS "cleaner_docs_insert" ON storage.objects;
CREATE POLICY "cleaner_docs_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cleaner-docs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "cleaner_docs_update" ON storage.objects;
CREATE POLICY "cleaner_docs_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cleaner-docs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "cleaner_docs_select" ON storage.objects;
CREATE POLICY "cleaner_docs_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'cleaner-docs');


-- ── 4. STORAGE RLS POLICIES — job-photos ───────────────────────────────────

DROP POLICY IF EXISTS "job_photos_insert" ON storage.objects;
CREATE POLICY "job_photos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'job-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "job_photos_update" ON storage.objects;
CREATE POLICY "job_photos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'job-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "job_photos_select" ON storage.objects;
CREATE POLICY "job_photos_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'job-photos');


-- ── 5. CREATE ADMIN USER ────────────────────────────────────────────────────
-- STEP 1: First sign up at /register (choose any role — doesn't matter).
-- STEP 2: Replace 'admin@yourdomain.com' below with the email you used.
-- STEP 3: Run these two statements.

DO $$
DECLARE
  admin_email TEXT := 'admin@yourdomain.com'; -- <-- CHANGE THIS
  admin_id    UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = admin_email;

  IF admin_id IS NULL THEN
    RAISE EXCEPTION 'No user found with email %. Sign up at /register first.', admin_email;
  END IF;

  -- Update or insert profiles row
  INSERT INTO public.profiles (id, role, full_name)
    SELECT admin_id, 'admin', COALESCE(raw_user_meta_data->>'full_name', 'Admin')
    FROM auth.users WHERE id = admin_id
  ON CONFLICT (id) DO UPDATE SET role = 'admin';

  -- Update JWT metadata so future tokens carry the admin role
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb
  WHERE id = admin_id;

  RAISE NOTICE 'Done. % is now an admin. Sign out and back in to apply.', admin_email;
END;
$$;
