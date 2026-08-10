-- ============================================================
-- Supabase Row Level Security (RLS) — ITE File Vault
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Enable RLS on all tables ────────────────────────────
ALTER TABLE public.employees   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_index  ENABLE ROW LEVEL SECURITY;

-- ── 2. EMPLOYEES table policies ────────────────────────────
-- Only authenticated (logged-in) users can read employees
CREATE POLICY "employees_select_authenticated"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can insert
CREATE POLICY "employees_insert_authenticated"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only authenticated users can update
CREATE POLICY "employees_update_authenticated"
  ON public.employees FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only authenticated users can delete
CREATE POLICY "employees_delete_authenticated"
  ON public.employees FOR DELETE
  TO authenticated
  USING (true);

-- Block anonymous (public) access completely
CREATE POLICY "employees_block_anon"
  ON public.employees FOR ALL
  TO anon
  USING (false);

-- ── 3. FILE INDEX table policies ───────────────────────────
CREATE POLICY "file_index_select_authenticated"
  ON public.file_index FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "file_index_insert_authenticated"
  ON public.file_index FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "file_index_update_authenticated"
  ON public.file_index FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "file_index_delete_authenticated"
  ON public.file_index FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "file_index_block_anon"
  ON public.file_index FOR ALL
  TO anon
  USING (false);

-- ── 4. Verify RLS is enabled ───────────────────────────────
-- Run this query to confirm:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public';
