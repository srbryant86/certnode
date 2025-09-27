# CertNode Dashboard (Phase 1)

Enterprise-grade customer dashboard for the CertNode receipt infrastructure. This workspace follows the standards-first architecture defined in `../docs/DASHBOARD_ARCHITECTURE.md` and is focused on Phase 1: proving the standard works.

## Quickstart

1. Copy environment defaults and configure secrets:
   ```bash
   cp .env.example .env.local
   ```
   - Update `AUTH_URL`, `NEXTAUTH_URL`, and `AUTH_SECRET` for NextAuth v5.
   - Point `DATABASE_URL` to a PostgreSQL instance.
   - Provide SMTP + Stripe credentials (required for production flows).
   - Optionally set `SEED_OWNER_PASSWORD` before running the seeder.
2. Install dependencies and generate the Prisma client:
   ```bash
   npm install
   npm run db:generate
   ```
3. Apply the schema to your database:
   ```bash
   npm run db:push
   ```
4. Seed reference data (enterprise + owner account):
   ```bash
   npm run db:seed
   ```
   The seed creates `owner@certnode.io` with the password supplied in `SEED_OWNER_PASSWORD` (default `ChangeMe@2025!`).
5. Start the development server:
   ```bash
   npm run dev
   ```

## Key Scripts

- `npm run dev` - Next.js dev server (App Router).
- `npm run build` / `npm run start` - production build + serve.
- `npm run lint` - lint with Next.js strict config.
- `npm run db:generate` - regenerate Prisma client.
- `npm run db:push` - push schema to a local database.
- `npm run db:migrate` - create tracked migrations.
- `npm run db:seed` - seed baseline enterprise + owner records.
- `npm run db:studio` - open Prisma Studio for inspection.

## Directory Guide

- `app/` - Next.js App Router entry point (pages, layouts, routes).
- `components/` - Reusable UI building blocks (WIP).
- `lib/` - Shared utilities (Prisma client, auth helpers, etc.).
- `prisma/` - Data model (`schema.prisma`), seeds, migrations.
- `types/` - Shared TypeScript definitions for dashboard modules.
- `docs/` - Living module specs and governance notes for the dashboard.

## Authentication Overview

- Email/password authentication powered by NextAuth v5 with Prisma adapter.
- Passwords are Argon2id hashed (`lib/password.ts`) and validated via server actions.
- Registration provisions a dedicated enterprise workspace and assigns an `ADMIN` role.
- Protected dashboard routes enforce authentication through the App Router layout guard.

## Current Focus

- Wire Stripe billing portal access and plan telemetry into the dashboard experience.
- Expand API key analytics with per-key usage insights and rotation tooling.
- Integrate dual-axis transaction validation into receipt issuance flows.

The implementation must remain enterprise credible (access controls, auditability, and performance). Use the architecture spec as the source of truth for data contracts and UI modules.

## Pricing & Validation

- Dual-axis pricing model enforced: per-receipt volume and per-transaction value limits.
- Overage calculations include $0.50/receipt (Foundation) and plan-specific transaction surcharges.
- Upgrade prompts surface automatically as usage approaches configured thresholds.
