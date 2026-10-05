-- =========================================================
-- HomeworkHub — Supabase Database & Storage Setup Schema
-- Paste and Run this in Supabase SQL Editor (https://supabase.com)
-- =========================================================

-- Quick Migration (Run this if you already have existing tables):
-- ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
-- ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS approval_history JSONB DEFAULT '[]'::jsonb;


-- 1. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    grade TEXT,
    pin TEXT NOT NULL DEFAULT '0000',
    color TEXT DEFAULT '#d96b43',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'pending',
    is_recurring BOOLEAN DEFAULT false,
    approved_at TIMESTAMPTZ,
    approval_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Submissions Table
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Fee / Tuition Logs Table (Lịch sử cộng, trừ và thanh toán học phí)
CREATE TABLE IF NOT EXISTS public.fee_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,            -- e.g. -2500 (thưởng nộp bài), +10000 (mất streak), +10000 (trễ bài thường), +5000 (trễ hằng ngày), hoặc số tiền thanh toán/điều chỉnh
    balance_after INTEGER NOT NULL,     -- Số dư sau giao dịch
    type TEXT NOT NULL DEFAULT 'manual', -- 'reward' | 'penalty_streak' | 'penalty_late' | 'payment' | 'reset' | 'manual'
    reason TEXT NOT NULL,               -- Chi tiết lý do giao dịch
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) & Public Access Policies for simplicity
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on students" ON public.students FOR DELETE USING (true);

CREATE POLICY "Allow public read access on tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on tasks" ON public.tasks FOR DELETE USING (true);

CREATE POLICY "Allow public read access on submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on submissions" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access on submissions" ON public.submissions FOR DELETE USING (true);

CREATE POLICY "Allow public read access on fee_logs" ON public.fee_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on fee_logs" ON public.fee_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on fee_logs" ON public.fee_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on fee_logs" ON public.fee_logs FOR DELETE USING (true);

-- 6. Insert initial default Student: Khải (PIN: 0000)
INSERT INTO public.students (name, grade, pin, color)
VALUES ('Khải', 'English Student', '0000', '#d96b43')
ON CONFLICT DO NOTHING;

