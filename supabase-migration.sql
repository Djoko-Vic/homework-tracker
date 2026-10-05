-- =========================================================
-- HomeworkHub — Supabase Migration for File Attachments & Submissions
-- Paste and Run this in Supabase SQL Editor (https://supabase.com)
-- =========================================================

-- 1. Add attachments column to tasks table (for teacher assignment files)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 2. Add submitted_files column to tasks table (for student file uploads)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS submitted_files JSONB DEFAULT '[]'::jsonb;

-- 3. Create Storage Bucket for HomeworkHub files (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('homework-files', 'homework-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Enable public Storage Policies on the homework-files bucket
DROP POLICY IF EXISTS "Public Access homework-files" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload homework-files" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete homework-files" ON storage.objects;
DROP POLICY IF EXISTS "Public Update homework-files" ON storage.objects;

CREATE POLICY "Public Access homework-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'homework-files');

CREATE POLICY "Public Upload homework-files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'homework-files');

CREATE POLICY "Public Update homework-files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'homework-files');

CREATE POLICY "Public Delete homework-files"
ON storage.objects FOR DELETE
USING (bucket_id = 'homework-files');
