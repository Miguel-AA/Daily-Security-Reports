import { supabase } from '../../lib/supabaseClient.js';
import type {
  ActionCatalog,
  WeeklyReport,
  ReportLine,
  ReportEntry,
  ReportLineWithAction,
} from '../../types/database.js';

/**
 * Fetch all actions from catalog
 */
export async function fetchActionCatalog(): Promise<ActionCatalog[]> {
  const { data, error } = await supabase
    .from('action_catalog')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

/**
 * Get or create a weekly report for an employee
 */
export async function getOrCreateWeeklyReport(
  employeeId: string,
  weekStartDate: string
): Promise<WeeklyReport> {
  // First try to get existing report
  const { data: existing, error: fetchError } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('week_start_date', weekStartDate)
    .single();

  if (existing) return existing;

  // If not found (and that's the only error), create new
  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  // Create new report
  const { data: newReport, error: createError } = await supabase
    .from('weekly_reports')
    .insert({
      employee_id: employeeId,
      week_start_date: weekStartDate,
      status: 'draft',
    })
    .select()
    .single();

  if (createError) throw createError;
  return newReport;
}

/**
 * Fetch report with all lines and entries
 */
export async function fetchReportWithLinesAndEntries(
  reportId: string
): Promise<{ report: WeeklyReport; lines: ReportLineWithAction[] }> {
  // Fetch report
  const { data: report, error: reportError } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (reportError) throw reportError;

  // Fetch lines with actions
  const { data: lines, error: linesError } = await supabase
    .from('report_lines')
    .select(`
      *,
      action:action_catalog(*)
    `)
    .eq('report_id', reportId);

  if (linesError) throw linesError;

  // Fetch all entries for these lines
  const lineIds = lines?.map((l: { id: string }) => l.id) || [];
  
  let entries: ReportEntry[] = [];
  if (lineIds.length > 0) {
    const { data: entriesData, error: entriesError } = await supabase
      .from('report_entries')
      .select('*')
      .in('line_id', lineIds);

    if (entriesError) throw entriesError;
    entries = entriesData || [];
  }

  // Combine lines with their entries
  const linesWithEntries: ReportLineWithAction[] = (lines || []).map((line: ReportLine & { action: ActionCatalog | ActionCatalog[] }) => ({
    ...line,
    action: Array.isArray(line.action) ? line.action[0] : line.action,
    entries: entries.filter((e) => e.line_id === line.id),
  }));

  return { report, lines: linesWithEntries };
}

/**
 * Add or update a report line
 */
export async function upsertReportLine(
  reportId: string,
  actionId: number,
  dailyTarget: number
): Promise<ReportLine> {
  const { data, error } = await supabase
    .from('report_lines')
    .upsert(
      {
        report_id: reportId,
        action_id: actionId,
        daily_target: dailyTarget,
      },
      { onConflict: 'report_id,action_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update or insert an entry value for a specific day
 */
export async function upsertEntry(
  lineId: string,
  entryDate: string,
  value: number
): Promise<ReportEntry> {
  const { data, error } = await supabase
    .from('report_entries')
    .upsert(
      {
        line_id: lineId,
        entry_date: entryDate,
        value: value,
      },
      { onConflict: 'line_id,entry_date' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Submit a report (change status to submitted)
 */
export async function submitReport(reportId: string): Promise<void> {
  const { error } = await supabase
    .from('weekly_reports')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) throw error;
}

/**
 * Delete a report line (and its entries via cascade)
 */
export async function deleteReportLine(lineId: string): Promise<void> {
  const { error } = await supabase
    .from('report_lines')
    .delete()
    .eq('id', lineId);

  if (error) throw error;
}

/**
 * Fetch reports for manager's direct reports
 */
export async function fetchManagerReports(): Promise<WeeklyReport[]> {
  const { data, error } = await supabase
    .from('weekly_reports')
    .select(`
      *,
      employee:profiles!weekly_reports_employee_id_fkey(*)
    `)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Approve a report
 */
export async function approveReport(reportId: string): Promise<void> {
  const { error } = await supabase
    .from('weekly_reports')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) throw error;
}

/**
 * Request changes on a report
 */
export async function requestChanges(
  reportId: string,
  comment: string
): Promise<void> {
  const { error } = await supabase
    .from('weekly_reports')
    .update({
      status: 'needs_changes',
      manager_comment: comment,
    })
    .eq('id', reportId);

  if (error) throw error;
}
