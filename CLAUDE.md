# PlotManager White-Label — Claude Guide

## Project Overview

A full-stack white-label property/plot management and sales platform for real estate companies. Built with Next.js App Router, Supabase, and Paystack.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Auth:** Supabase Auth
- **Payments:** Paystack
- **Email:** Resend
- **Styling:** TailwindCSS 3 (dynamic HSL theme via env vars)
- **Forms:** React Hook Form + Zod
- **PDF:** jsPDF + jsPDF AutoTable
- **Charts:** Recharts

## Project Structure

```
app/
  api/              # API routes (buyers, agents, estates, payments, commissions)
  dashboard/        # Admin dashboard (analytics, settings, agents, buyers, estates)
  auth/             # Auth callbacks
  form/[slug]/      # Public buyer registration form
components/
  ui/               # Reusable UI components
  *.tsx             # Feature components (AdminList, BuyerActions, RecordPayment, etc.)
lib/
  supabase/         # Supabase client & server helpers
  config.ts         # App configuration
  auth.ts           # Auth utilities
  api-helpers.ts    # Shared API utilities
  email-templates.ts
  generate-receipt-pdf.ts
  validations.ts    # Zod schemas
  rate-limit.ts
  schedule.ts       # Payment/reminder scheduling
  constants.ts
types/
  database.types.ts # Supabase-generated types
supabase/
  migrations/       # SQL migration files
```

## Key Features

- Multi-tenant white-label (one company per deployment)
- Public buyer registration with dynamic estate/plot allocation
- Admin dashboard: estates, agents, buyers, payments, commissions
- Paystack payment integration with proof-of-payment uploads
- Installment/payment schedule tracking
- Email reminders via Resend
- Receipt PDF generation
- Role-based access control: `super_admin`, `admin`
- Dynamic theme via environment variables

## Environment Variables

Copy `.env.local.example` to `.env.local`. Key variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
RESEND_API_KEY=
ADMIN_EMAILS=          # Comma-separated list of admin email addresses
NEXT_PUBLIC_PRIMARY_COLOR=  # HSL hue value for brand color
```

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm run lint      # ESLint
```

## Database

Migrations are in `supabase/migrations/`. Apply in order:

1. `000_full_schema.sql` — Base schema
2. `002_add_allocation_status.sql`
3. `003_add_payment_proof.sql`
4. `004_agents_commissions.sql`
5. `005_security_hardening.sql`

Supabase types are in `types/database.types.ts` — regenerate with:
```bash
npx supabase gen types typescript --project-id <project-id> > types/database.types.ts
```

## Architecture Notes

- All API routes are in `app/api/` using Next.js Route Handlers
- Supabase client usage: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server)
- Rate limiting applied to public-facing API routes via `lib/rate-limit.ts`
- RLS policies enforce data isolation at the database level
- Theme colors are generated dynamically in `tailwind.config.js` using HSL from env vars
