// Database types based on Supabase schema

export type UserRole = 'employee' | 'manager';

export type ReportStatus = 'draft' | 'submitted' | 'approved' | 'needs_changes';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  manager_id: string | null;
  created_at?: string;
}

export interface ActionCatalog {
  id: number;
  name: string;
  default_daily_target: number;
  sort_order: number;
}

export interface WeeklyReport {
  id: string;
  employee_id: string;
  week_start_date: string;
  status: ReportStatus;
  submitted_at: string | null;
  approved_at: string | null;
  manager_comment: string | null;
  created_at: string;
}

export interface ReportLine {
  id: string;
  report_id: string;
  action_id: number;
  daily_target: number;
}

export interface ReportEntry {
  id: string;
  line_id: string;
  entry_date: string;
  value: number;
}

// Extended types for UI with joined data

export interface ReportLineWithAction extends ReportLine {
  action: ActionCatalog;
  entries: ReportEntry[];
}

export interface WeeklyReportWithDetails extends WeeklyReport {
  employee: Profile;
  lines: ReportLineWithAction[];
}

// API response types

export interface SaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  message?: string;
}
