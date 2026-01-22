-- ============================================================================
-- DEV ONLY - ANONYMOUS ACCESS RLS POLICIES
-- ============================================================================
-- WARNING: These policies allow unrestricted anonymous access to data.
-- ONLY use in development environments. NEVER deploy to production.
-- These policies bypass authentication and allow any anonymous user to
-- read and modify data.
-- ============================================================================

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.action_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING DEV POLICIES (IDEMPOTENT)
-- ============================================================================

-- action_catalog policies
DROP POLICY IF EXISTS dev_anon_select_action_catalog ON public.action_catalog;

-- weekly_reports policies
DROP POLICY IF EXISTS dev_anon_select_weekly_reports ON public.weekly_reports;
DROP POLICY IF EXISTS dev_anon_insert_weekly_reports ON public.weekly_reports;
DROP POLICY IF EXISTS dev_anon_update_weekly_reports ON public.weekly_reports;

-- report_lines policies
DROP POLICY IF EXISTS dev_anon_select_report_lines ON public.report_lines;
DROP POLICY IF EXISTS dev_anon_insert_report_lines ON public.report_lines;
DROP POLICY IF EXISTS dev_anon_update_report_lines ON public.report_lines;

-- report_entries policies
DROP POLICY IF EXISTS dev_anon_select_report_entries ON public.report_entries;
DROP POLICY IF EXISTS dev_anon_insert_report_entries ON public.report_entries;
DROP POLICY IF EXISTS dev_anon_update_report_entries ON public.report_entries;

-- ============================================================================
-- CREATE DEV ANONYMOUS POLICIES
-- ============================================================================

-- action_catalog: READ ONLY for anonymous users
CREATE POLICY dev_anon_select_action_catalog
  ON public.action_catalog
  FOR SELECT
  TO anon
  USING (true);

-- weekly_reports: READ, INSERT, UPDATE for anonymous users
CREATE POLICY dev_anon_select_weekly_reports
  ON public.weekly_reports
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY dev_anon_insert_weekly_reports
  ON public.weekly_reports
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY dev_anon_update_weekly_reports
  ON public.weekly_reports
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- report_lines: READ, INSERT, UPDATE for anonymous users
CREATE POLICY dev_anon_select_report_lines
  ON public.report_lines
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY dev_anon_insert_report_lines
  ON public.report_lines
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY dev_anon_update_report_lines
  ON public.report_lines
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- report_entries: READ, INSERT, UPDATE for anonymous users
CREATE POLICY dev_anon_select_report_entries
  ON public.report_entries
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY dev_anon_insert_report_entries
  ON public.report_entries
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY dev_anon_update_report_entries
  ON public.report_entries
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- CLEANUP SECTION - REMOVE DEV POLICIES
-- ============================================================================
-- Uncomment and run these statements to remove all dev_anon_* policies
-- when transitioning to production or implementing proper authentication.
-- ============================================================================

/*
-- Drop action_catalog dev policies
DROP POLICY IF EXISTS dev_anon_select_action_catalog ON public.action_catalog;

-- Drop weekly_reports dev policies
DROP POLICY IF EXISTS dev_anon_select_weekly_reports ON public.weekly_reports;
DROP POLICY IF EXISTS dev_anon_insert_weekly_reports ON public.weekly_reports;
DROP POLICY IF EXISTS dev_anon_update_weekly_reports ON public.weekly_reports;

-- Drop report_lines dev policies
DROP POLICY IF EXISTS dev_anon_select_report_lines ON public.report_lines;
DROP POLICY IF EXISTS dev_anon_insert_report_lines ON public.report_lines;
DROP POLICY IF EXISTS dev_anon_update_report_lines ON public.report_lines;

-- Drop report_entries dev policies
DROP POLICY IF EXISTS dev_anon_select_report_entries ON public.report_entries;
DROP POLICY IF EXISTS dev_anon_insert_report_entries ON public.report_entries;
DROP POLICY IF EXISTS dev_anon_update_report_entries ON public.report_entries;
*/
