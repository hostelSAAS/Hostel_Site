# HostelHub

A MERN hostel discovery and management application with separate React/Vite portals and one shared Express/Mongoose API.

- `main`: student and administrator portal.
- `master`: standalone owner portal.
- Both frontends use the same backend and MongoDB database. Keep the shared backend synchronized.

See [plan.md](plan.md) for implementation scope, [server/README.md](server/README.md) for API contracts, and [DEPLOYMENT.md](DEPLOYMENT.md) for production setup and verification.

## Local setup

Use Node 22 or newer. In `server`, run `npm ci`, copy `.env.example` to `.env`, set `MONGODB_URI` and a random `JWT_SECRET` of at least 32 characters, and run `npm run dev`. Include both localhost frontend origins in `CLIENT_URL`.

In each branch checkout, run `npm ci` inside `client`, copy its `.env.example` to `.env`, and run `npm run dev`. Use port 5173 for the student portal and `npm run dev -- --port 5174` for the owner portal. Both clients default to the local API on port 5000 in development.

Configure Cloudinary on the API to enable real photo uploads. MongoDB stores records and image references, not image bytes.

## Supported flows

Students can register/sign in, search and filter approved hostels, view details, save favorites, update profiles and message owners. Owners can manage multiple listings, upload and arrange photos, submit drafts for review and reply to students. Admins can review listings, manage users and view database-backed analytics. Sessions use HTTP-only cookies and all roles/ownership are checked by the backend.

Subscriptions, payments, reports, verification emails, password reset, online presence and audit history are deferred; the interface does not imply these are active services.

## Checks and deployment

Run `npm test` in `server` for isolated MongoDB integration tests and in `client` for production configuration tests. Browser workflow checks and their setup are documented in [DEPLOYMENT.md](DEPLOYMENT.md).

A production client build requires `VITE_API_URL=https://<public-api-host>/api`; missing, local or insecure values fail the build. Set Vercel Root Directory to `client` for both projects. Deploy `server` separately as one persistent Node process (or use its Dockerfile). Configure host secrets privately, then rebuild both frontends.

Run `node scripts/check-shared.mjs <owner-checkout> <main-checkout>` before publishing changes to verify that both branches contain the same backend and shared frontend modules. The manual Cross-portal browser verification workflow checks both selected branch refs together.
