# Production Report App - Copilot Instructions

## Project Overview
Weekly Production Reporting System built with React + Vite + TypeScript + Supabase.

## Core Principles
- Feature-based folder structure
- TypeScript strict mode - no implicit any
- No negative numbers or floating values in production data
- User-facing validation messages
- RLS enforced at database level
- Explicit and readable code over cleverness

## Tech Stack
- React 18
- Vite
- TypeScript (strict)
- Supabase (Auth + Postgres + RLS)
- Cloudflare Pages (deployment)

## Key Features
- Employee: Create/edit weekly reports, add actions, enter daily values, submit
- Manager: Review direct reports, approve/request changes
- Submission rule: Available starting Sunday 6 PM
- Status flow: draft → submitted → approved/needs_changes

## Implementation Rules
- Week starts Monday (week_start_date)
- All numeric inputs must be integers >= 0
- Totals computed client-side for live feedback
- Submit button enabled only when rules satisfied
- After submit, report is read-only unless needs_changes
- RLS policies enforce all access control
- Never trust client-side role checks
