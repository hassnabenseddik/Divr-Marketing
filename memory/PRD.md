# Divr Marketing Site — PRD

## Goal
A standalone, mobile-first Next.js marketing site for **divr.world** with three signup pages and a unified design system. Independent from the main Divr platform.

## Pages
- **/** — minimal landing with logo, headline, CTAs to `/waitlist` and `/for-operators`.
- **/waitlist** — Diver waitlist (hero + form: First Name, Email, Country, Dive Region).
- **/for-operators** — Founding partner application (hero + 3 benefit blocks + form: Full Name, Dive Center Name, Country & Destination, Email, WhatsApp, Monthly Bookings).
- **/for-guides** — Independent guide application (hero + 3 benefit blocks + form: Full Name, Specialty, Country & Base Location, Certifications, Email, WhatsApp).

Each page renders `<Header>` (Divr logo only) and `<Footer>` (4-column with required links + copyright "© 2026 Divr." + trust line + legal disclaimer).

## Design system
- Colors: `#0B1C2D` (navy), `#B7F34A` (lime/neon green), `#F6F1E8` (cream).
- Typography: Plus Jakarta Sans (display) + Manrope (body), both via `next/font/google`.
- Tailwind tokens: `navy`, `navy-deep`, `navy-soft`, `lime`, `lime-bright`, `cream`.
- Hero uses Unsplash underwater photography with a navy gradient overlay.

## Backend (FastAPI + MongoDB)
All endpoints under `/api`:
- `POST /api/waitlist` → `waitlist_submissions`
- `POST /api/operators` → `operator_applications`
- `POST /api/guides` → `guide_applications`
- `GET /api/admin/{waitlist|operators|guides}` — list (no `_id` projected).

Each document is stored with: `id` (uuid), `source` (`waitlist` / `for-operators` / `for-guides`), `created_at` (ISO UTC), and the validated form fields. Pydantic `Literal` enums + `EmailStr` enforce input validity (returns 422 on bad data).

## Email (deferred)
SendGrid integration planned for confirmation emails from `hello@divrworld.com`. Current implementation has TODO markers in each route handler.

## Tech stack
- Frontend: Next.js 15 App Router, Tailwind CSS, lucide-react icons, TypeScript.
- Backend: FastAPI, Motor (async MongoDB), Pydantic v2.
- Supervisor runs `yarn expo start --tunnel --port 3000`; `package.json` defines an `expo` script that delegates to `next dev` via a small wrapper at `scripts/start.js`.

## Out of scope
- Authentication (no sign in / sign up).
- Routing into the main Divr platform.
- About / Blog / Careers / Press pages (links only — pages stubbed for later).
