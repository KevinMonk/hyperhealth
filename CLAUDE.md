# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run types` - Run TypeScript type checking
- `npm run format:write` - Format code with Prettier
- `npm run clean` - Run both lint:fix and format:write

### Database
- `npx drizzle-kit push` - Push schema changes to database
- `npx drizzle-kit generate` - Generate migration files
- `npx drizzle-kit migrate` - Run migrations
- `npx bun db/seed` - Seed database
- `npx supabase start` - Start local Supabase instance

### Git & OpenEHR Records
- OpenEHR records are stored in external repository: `https://github.com/tijno/hhdata.git`
- Application fetches and displays health record versions and history
- Demonstrates collaborative editing and version control for health records

### Testing
- `npm run test` - Run all tests (unit + e2e)
- `npm run test:unit` - Run Jest unit tests
- `npm run test:e2e` - Run Playwright e2e tests

### Shadcn UI Components
- `npx shadcn@latest add [component-name]` - Install new Shadcn UI components

## Project Overview

HyperHealth is a distributed Electronic Health Record (EHR) system proof-of-concept that demonstrates Git-based version control for OpenEHR records. Built on McKay's Next.js template, it shows how health records can be collaboratively maintained without a single source of truth.

**Key Concept**: Uses Git's distributed model for health record management, with OpenEHR records stored at `https://github.com/tijno/hhdata.git` and consumed by this Next.js application.

## Architecture

This is a Next.js 15 application using the App Router with clear separation between authenticated and unauthenticated routes.

### Route Structure
- `/app/(unauthenticated)` - Public routes
  - `(marketing)` - Landing pages, pricing, features
  - `(auth)` - Login and signup flows
- `/app/(authenticated)` - Protected routes requiring Clerk auth
  - `dashboard` - Main application with account, billing, support sections
- `/app/api` - API routes including Stripe webhook handler

### Key Patterns
- **Server Actions** in `/actions` for data mutations (customers, Stripe operations)
- **Database Schema** in `/db/schema` using Drizzle ORM with PostgreSQL
- **UI Components** in `/components/ui` from Shadcn UI library
- **Authentication** handled by Clerk middleware with protected route groups
- **Payments** integrated via Stripe with webhook handling
- **OpenEHR Integration** for consuming health records from external Git repository

### Data Flow
1. Authentication state managed by Clerk (`@clerk/nextjs`)
2. Customer data stored in PostgreSQL via Drizzle ORM
3. Stripe integration for subscription management
4. OpenEHR records fetched from `https://github.com/tijno/hhdata.git` repository
5. Server actions handle all data mutations with proper auth checks

### Environment Variables Required
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `STRIPE_SECRET_KEY` - Stripe secret key
- Database connection handled by Supabase CLI