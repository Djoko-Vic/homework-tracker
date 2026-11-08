-- Run once in the Supabase SQL editor, as the database owner.
-- For multiple students, first uncomment and set the CONFIRMED legacy owner:
-- SET homeworkhub.legacy_student_id = '00000000-0000-0000-0000-000000000000';
-- This transaction aborts without changing data if ownership is ambiguous.
BEGIN;
LOCK TABLE public.fee_logs IN ACCESS EXCLUSIVE MODE;
CREATE TABLE IF NOT EXISTS public.fee_migration_versions (version integer PRIMARY KEY);
ALTER TABLE public.fee_migration_versions ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE owner_id uuid; old_balance integer; delta bigint;
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.fee_migration_versions WHERE version=2) THEN
  CREATE TABLE public.fee_logs_backup_v1 AS TABLE public.fee_logs;
  ALTER TABLE public.fee_logs_backup_v1 ENABLE ROW LEVEL SECURITY;
  IF EXISTS (SELECT 1 FROM public.fee_logs) THEN
   owner_id := NULLIF(current_setting('homeworkhub.legacy_student_id',true),'')::uuid;
   IF owner_id IS NULL AND (SELECT count(*) FROM public.students)=1 THEN
    SELECT id INTO owner_id FROM public.students LIMIT 1;
   END IF;
   IF owner_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.students WHERE id=owner_id) THEN
    RAISE EXCEPTION 'Confirm the existing student that owns the legacy shared balance; set homeworkhub.legacy_student_id and rerun. No data changed.';
   END IF;
   SELECT balance_after INTO old_balance FROM public.fee_logs ORDER BY created_at DESC,id DESC LIMIT 1;
   UPDATE public.fee_logs SET student_id=owner_id WHERE student_id IS NULL;
   SELECT old_balance-COALESCE(sum(amount),0) INTO delta FROM public.fee_logs;
   IF delta<>0 THEN
    INSERT INTO public.fee_logs(student_id,amount,balance_after,type,reason)
     VALUES(owner_id,delta,old_balance,'opening','Số dư đầu kỳ — chuyển dữ liệu cũ');
   END IF;
  END IF;
  INSERT INTO public.fee_migration_versions VALUES(2);
 END IF;
END $$;
ALTER TABLE public.fee_logs ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.fee_logs DROP CONSTRAINT IF EXISTS fee_logs_student_id_fkey;
ALTER TABLE public.fee_logs ALTER COLUMN student_id SET NOT NULL;
ALTER TABLE public.fee_logs ADD CONSTRAINT fee_logs_student_id_fkey
 FOREIGN KEY(student_id) REFERENCES public.students(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS fee_logs_student_date_idx ON public.fee_logs(student_id,created_at DESC);
COMMIT;
-- Existing public RLS policies are unchanged: see docs/fee-tracking.md.
