# Weekly Production Report App

A streamlined web application for managing weekly productivity reports with employee submission and manager review workflows.

## Project Overview

This system replaces manual Excel/Google Sheets reporting with a standardized, validated, and auditable weekly production reporting tool. Built for simplicity and operational clarity, not enterprise complexity.

**Core Value Proposition:**
- Eliminate manual spreadsheet friction and errors
- Provide real-time totals and target tracking
- Enable manager oversight without heavy process overhead
- Maintain clear audit trail of submissions and approvals

---

## Business Context

### Purpose
- Replace error-prone manual spreadsheets
- Standardize how employees report weekly productivity
- Give managers visibility into team performance
- Reduce rework caused by unclear or missing data

### Who Uses This Data
- **Primary:** Direct managers reviewing team performance
- **Future:** Operations supervisors for broader analysis

### Decisions Enabled
- Weekly performance tracking and trend analysis
- Operational issue detection (call outs, recurring problems)
- Activity validation (hours worked, tasks completed)
- Team capacity planning

### Current State
- **Not** connected to payroll systems (yet)
- **Not** used for compliance or legal requirements (yet)
- **Not** executive-facing dashboards (yet)

---

## Users & Roles

### Current Roles

#### Employee
- Creates and submits weekly production reports
- Adds productivity actions with daily values
- Can only view their own reports (no peer visibility)
- Cannot edit after submission unless manager requests changes

#### Manager
- Reviews reports from direct reports only
- Approves or requests changes (cannot edit values directly)
- Can also be an employee who submits their own reports
- Their reports are reviewed by their own manager (recursive logic)

### Not Included (Yet)
- Global admin role
- Executive/HR roles
- Auditor role with special access
- Peer visibility
- Cross-team visibility

### Hierarchy Rules
- One employee → one direct manager (1:1 relationship)
- Simple single-level hierarchy (multi-level possible in future)
- No manager delegation for vacations/coverage
- Historical data access: unlimited (no retention limits defined)

---

## Core Features & Workflows

### Week Definition
- **Week span:** Monday (start) → Sunday (end)
- **Week identifier:** `week_start_date` (the Monday)
- **Submission window:** Opens Sunday 6:00 PM
  - Cannot submit before this time (hard rule)
  - No hard deadline for submission (late submissions allowed but flagged)
- **Timezone:** Browser/user timezone (no server-side timezone management)

### Employee Workflow

1. **Create Report (Draft)**
   - System creates draft for current week
   - Employee adds actions from global catalog
   - Each action has:
     - Target (editable per report, copied from defaults)
     - Daily values (Mon–Sun)
     - Optional comments
   - Live totals calculated client-side

2. **Fill Daily Values**
   - All values are non-negative integers (counts only)
   - Zero (`0`) is explicit and valid (different from empty/blank)
   - No maximum limits enforced
   - No required minimum data to submit

3. **Submit**
   - Available starting Sunday 6:00 PM
   - Once submitted, report is **read-only** to employee
   - Status changes: `draft` → `submitted`

4. **If Changes Requested**
   - Manager sets status to `needs_changes`
   - Employee can edit again
   - Must resubmit
   - Can cycle through `needs_changes` multiple times

### Manager Workflow

1. **Review Submitted Reports**
   - See list of direct reports with submitted reports
   - Review actions, daily values, totals vs targets
   - Cannot edit employee data (read-only)

2. **Approve or Request Changes**
   - **Approve:** Status → `approved` (final)
   - **Request Changes:** Status → `needs_changes` (unlocks for employee)
   - Can add comments explaining decision

3. **Revert if Needed**
   - Can change `approved` back to `needs_changes` if error discovered

### Status Flow
```
draft → submitted → approved
           ↓            ↑
      needs_changes ----+
```

---

## Data Model & Rules

### Productivity Actions

**Global Catalog**
- Fixed list of actions defined at system level
- Examples: Patrols, Incidents Responded, Training Hours, etc.
- Employees select from catalog (cannot create custom actions)
- Managers cannot customize action lists per team

**Action Properties**
- Name
- Default target (weekly)
- No categories, weights, or scoring
- No required comments per action

**Targets**
- Copied from system defaults when action is added
- Editable per report (manager or system may adjust)
- Changes to targets do NOT affect historical reports
- No audit trail for target changes (not needed now)

### Daily Values

**Data Type:** Integer counts only
- No decimals, no negative values
- Not hours, percentages, or other units
- All actions use the same data type

**Validation Rules**
- Value ≥ 0 (enforced)
- No maximum limits
- No cross-action validation (e.g., incidents vs patrols)
- Target not met: **warning only**, does NOT block submission

**Empty vs Zero**
- Empty/blank = not entered yet
- `0` = explicit value (meaningful)

### Comments
- Optional at report level
- Not required for low performance
- Not required for specific actions
- No character limits defined

---

## Validation & Enforcement

### Blocking Validations (Hard Rules)
- Values must be ≥ 0
- Report must have week_start_date
- At least one action must be added (assumed, adjustable)

### Warning Validations (Soft Rules)
- Target not met (informational only)
- All daily values empty for an action (allowed)

### Not Implemented
- Suspicious pattern detection
- Reasonable maximum value checks
- Compliance or regulatory validations

---

## Security & Permissions

### Row-Level Security (RLS)
All data access enforced at Supabase database level using RLS policies.

**Employee Permissions:**
- Read: own reports only
- Create: own reports only (enforced by `user_id = auth.uid()`)
- Update: own reports only, and only if status = `draft` or `needs_changes`
- Delete: none

**Manager Permissions:**
- Read: direct reports only (via `reports.user_id IN (SELECT id FROM employees WHERE manager_id = auth.uid())`)
- Update: can change status and add manager comments, cannot edit daily values
- Create/Delete: none

**Trust Model:**
- Never trust client-side role checks
- All access control via database RLS
- No soft deletes (data is permanent)

### Data Retention
- Reports stored indefinitely
- No automatic deletion
- No manual deletion by users
- Employees who leave: their reports remain

### Audit Logging
- Desired for future (who changed what, when)
- Not required for MVP
- No immutable audit log requirements yet

---

## Special Cases

### Holidays & PTO
- Employee enters `0` for days not worked
- No special "holiday" flag or status
- No automatic adjustment of targets

### Mid-Week Start
- Employee starting mid-week reports what they actually worked
- No pro-rating logic
- No special handling

### Late Submissions
- No hard deadline enforcement
- Future: flag for "submitted after Monday" (visual indicator)
- No automatic escalation or notifications

### Historical Data Changes
- If action catalog or targets change, old reports remain frozen
- No retroactive updates to historical reports

---

## Technical Stack

### Frontend
- **React 18** (functional components, hooks)
- **Vite** (build tool)
- **TypeScript** (strict mode, no implicit any)

### Backend
- **Supabase**
  - PostgreSQL database
  - Row-Level Security (RLS)
  - Built-in authentication
  - Real-time subscriptions (future)

### Deployment
- **Cloudflare Pages**
- Environment variables via `.env` files

### Code Principles
- Feature-based folder structure (`src/features/`)
- Explicit and readable code over cleverness
- User-facing validation messages
- No negative numbers or floating-point values in production data

---

## Development Guidelines

### File Structure
```
src/
├── features/          # Feature-based organization
│   └── reports/
│       ├── api.ts     # Supabase queries
│       ├── components/
│       └── types.ts
├── lib/               # Shared utilities
│   ├── supabaseClient.ts
│   ├── dateUtils.ts
│   └── validation.ts
├── types/
│   └── database.ts    # Generated from Supabase
└── App.tsx
```

### Key Conventions
- Week always starts Monday (`week_start_date`)
- All numeric inputs are integers ≥ 0
- Totals computed client-side for live feedback
- Submit button enabled only when rules satisfied
- After submit, report is read-only unless `needs_changes`

### TypeScript Rules
- Strict mode enabled
- No `any` types allowed
- Explicit types for all function parameters
- Use generated types from Supabase schema

---

## Current Limitations (By Design)

### Not Implemented Yet
- Email or push notifications
- Automatic reminders for overdue reports
- Manager bulk approval
- Side-by-side employee comparison
- Export to CSV/PDF
- Executive dashboards
- Multi-tenant support
- Multi-location configurations
- Offline mode
- Mobile app (mobile-responsive web only)

### Known Simplifications
- No timezone management (uses browser timezone)
- No manager delegation/coverage
- No custom action creation
- No weighted scoring or action priorities
- No integration with external systems (payroll, HR, etc.)

---

## Future Roadmap

### Near Term
- CSV export for manager reports
- Basic email notifications (submit, approve, needs_changes)
- Audit log (change history)
- "Late submission" flag

### Medium Term
- Manager dashboard with team trends
- Comparison across weeks (employee self-view)
- Comment improvements (required for certain scenarios)

### Long Term (Potential)
- Multi-level hierarchy support
- Custom action catalogs per team
- Advanced analytics and trending
- Integration with scheduling systems
- Mobile native app

---

## Non-Functional Requirements

### Performance
- Small to medium scale (tens → hundreds of users)
- No specific SLA requirements
- Standard web app responsiveness expectations

### Browser Support
- Modern browsers only (Chrome, Firefox, Safari, Edge)
- No IE11 or legacy browser support

### Accessibility
- Basic keyboard navigation
- Semantic HTML
- No WCAG certification required (but good practices encouraged)

### Localization
- UI in English
- Date formatting: browser locale (MM/DD vs DD/MM)
- No multi-language support needed

### UX Goals
- **Simpler than Excel**
- Card-based layouts over heavy tables
- Fast data input (keyboard-friendly)
- Live feedback (totals update as you type)
- Clear status indicators

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- Supabase account and project
- Cloudflare account (for deployment)

### Environment Variables
Copy `.env.example` to `.env` and fill in:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

---

## Key Design Decisions

### Why Supabase?
- Built-in auth with RLS (security at database level)
- No separate backend to maintain
- Real-time capabilities for future features
- PostgreSQL for complex queries when needed

### Why Client-Side Totals?
- Instant feedback for users
- Reduces server round-trips
- Simple calculations (sum of integers)

### Why Status-Based Locking?
- Clear state machine (draft → submitted → approved)
- Prevents accidental edits after submission
- Manager controls unlock via `needs_changes`

### Why No Soft Deletes?
- Data integrity and audit requirements
- Simpler queries (no `deleted_at IS NULL` everywhere)
- Low risk of accidental deletes (no delete UI)

### Why Integer-Only Values?
- Simplifies validation (no floating-point edge cases)
- Matches real-world counting (patrols, incidents, etc.)
- Prevents precision errors in calculations

---

## Success Metrics

This system is successful if:
1. Employees submit reports in **less time** than spreadsheets
2. Managers can review reports in **less time** than spreadsheets
3. **Zero calculation errors** (automated totals)
4. **Clear audit trail** of who submitted what and when
5. **Reduction in "I forgot to submit" or "I lost my spreadsheet"** issues

---

## Support & Maintenance

### Current State
- MVP/Internal tool
- No formal SLA or support structure
- Issues tracked via GitHub Issues (if applicable)

### Deployment
- Deployed via Cloudflare Pages
- Automatic deploys from `main` branch
- No staging environment (yet)

---

## License & Attribution

This is an internal tool. No public license defined.

---

## Contact

For questions or feature requests, contact the development team.

---

**Last Updated:** January 22, 2026  
**Version:** 1.0 (MVP)
