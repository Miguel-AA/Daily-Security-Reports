# Architecture

## 1. System Context

This application is a **weekly production reporting** system with two roles:

* **Employee**: creates/edits their weekly report (Mon–Sun), enters integer values, and submits when allowed.
* **Manager**: reviews reports for direct reports, approves or requests changes.

The system uses:

* **React + Vite + TypeScript** (frontend)
* **Supabase** (Auth + Postgres + RLS)
* **Cloudflare Pages** (hosting)

There is **no custom backend** in MVP: the frontend talks directly to Supabase, and RLS enforces authorization.

---

## 2. High-Level Architecture

### 2.1 Components

**Client (React SPA)**

* Authentication (Supabase Auth)
* Employee reporting UI
* Manager inbox + report detail UI
* Client-side validation and computed totals
* Autosave interactions (debounced writes)

**Supabase**

* Postgres database for reports and entries
* RLS policies for access control
* Auth (email/password)
* Optional: functions/triggers/views later for analytics/audit

**Cloudflare Pages**

* Hosts the SPA build
* Provides static delivery + SPA routing

---

## 3. Data Flow

### 3.1 Employee flow (Create/Edit weekly report)

1. User selects any date in a week picker.
2. Client resolves `week_start_date = Monday`.
3. Client calls:

   * `getOrCreateWeeklyReport(employee_id, week_start_date)`
4. Client fetches:

   * `action_catalog`
   * `report_lines` and `report_entries` for the report
5. Employee adds actions (lines) and enters day values:

   * Writes are **debounced** (autosave)
6. Client computes totals live:

   * Row total (sum Mon–Sun)
   * Weekly total (sum all rows)
7. Client enables **Submit** only if:

   * `status in ('draft','needs_changes')`
   * submission time rule is satisfied (default: Sunday 6PM local or later)
8. On submit:

   * update report status to `submitted`
   * set `submitted_at = now()`
   * lock UI to read-only

### 3.2 Manager flow (Review)

1. Manager opens inbox:

   * query `weekly_reports` of direct reports (via RLS)
2. Manager selects a report:

   * load report with lines + entries and employee profile
3. Manager actions:

   * **Approve**: status → `approved`, set `approved_at`
   * **Request Changes**: status → `needs_changes`, require `manager_comment`
4. If `needs_changes`:

   * employee can edit again until resubmitted

---

## 4. Data Model (Logical)

### 4.1 Tables

**profiles**

* `id (uuid)` = auth user id
* `full_name (text)`
* `role ('employee'|'manager')`
* `manager_id (uuid nullable)` (direct report relationship)

**action_catalog**

* `id (bigint pk)`
* `name (text unique)`
* `default_daily_target (int >= 0)`
* `sort_order (int)`

**weekly_reports**

* `id (uuid pk)`
* `employee_id (uuid fk profiles.id)`
* `week_start_date (date)` Monday
* `status ('draft'|'submitted'|'approved'|'needs_changes')`
* `submitted_at (timestamptz)`
* `approved_at (timestamptz)`
* `manager_comment (text)`
* Unique `(employee_id, week_start_date)`

**report_lines**

* `id (uuid pk)`
* `report_id (uuid fk weekly_reports.id)`
* `action_id (bigint fk action_catalog.id)`
* `daily_target (int >= 0)`
* Unique `(report_id, action_id)`

**report_entries**

* `id (uuid pk)`
* `line_id (uuid fk report_lines.id)`
* `entry_date (date)` must be within report week
* `value (int >= 0)`
* Unique `(line_id, entry_date)`

Optional later:

* `audit_log`

---

## 5. Authorization (RLS-First)

### 5.1 Core Rule

**Never trust client-side role checks.** All access must be enforced by **RLS**.

### 5.2 Access Matrix

**Employee**

* Can `select/insert` their own weekly_reports
* Can `update` their weekly_reports only when `status in ('draft','needs_changes')`
* Can manage report_lines/report_entries only when report status editable
* Cannot view other employees' data

**Manager**

* Can `select` weekly_reports for direct reports:

  * `profiles.manager_id = auth.uid()`
* Can `update` status/comment for direct reports
* Can read associated lines/entries for those reports

**action_catalog**

* Read-only for authenticated users

---

## 6. Client-Side Computation & Validation

### 6.1 Input constraints

* All entry inputs are `type="number"` and must be integers
* Default: no negative values
* Sanitize on change; show inline validation when needed

### 6.2 Totals

* Totals are computed client-side for immediate feedback
* Backend remains source of truth for stored values

### 6.3 Submit rule

* `canSubmitReport(week_start_date, now)` returns `{ allowed, reason }`
* Default rule:

  * allowed starting Sunday at 18:00 local time (or later)

---

## 7. Frontend Structure (Feature-Based)

Recommended structure:

* `src/lib/`

  * `supabaseClient.ts`
  * `dateUtils.ts` (week helpers)
  * `validation.ts`
* `src/features/auth/`

  * `LoginPage.tsx`, `useAuth.ts`, route guards
* `src/features/reports/`

  * `api.ts` (typed queries/mutations)
  * `employee/EmployeeWeeklyReportPage.tsx`
  * `manager/ManagerInboxPage.tsx`
  * `manager/ManagerReportDetailPage.tsx`
* `src/components/` (shared)

  * `WeekPicker.tsx`, `NumberInput.tsx`, etc.

---

## 8. Error Handling & UX Requirements

* Always show:

  * loading states
  * save states (Saving / Saved / Error)
  * submit disabled reasons
* Autosave must not spam:

  * debounce writes ~400ms
* If a Supabase call fails:

  * show error message and keep UI consistent

---

## 9. Deployment (Cloudflare Pages)

* Build command: `npm run build`
* Output directory: `dist`
* Env vars:

  * `VITE_SUPABASE_URL`
  * `VITE_SUPABASE_ANON_KEY`
* SPA routing fallback required

---

## 10. Implementation Defaults (Unless Changed)

* Week starts Monday
* Submit window opens Sunday 6:00 PM local time
* Report is locked after submit
* Manager relationship is `profiles.manager_id`
