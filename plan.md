# HostelHub implementation and operations plan

## Current status — 2026-10-02

HostelHub is deployed as two Vercel portals backed by one Render REST/Socket.IO service, one MongoDB Atlas database, and Cloudinary image storage.

### Production services

| Service | Source | Production URL | Purpose |
| --- | --- | --- | --- |
| Admin portal | `main/client` | `https://hostel-site-admin.vercel.app` | Administrator login, moderation, users, and analytics |
| Owner/customer portal | `master/client` | `https://hostel-site-user.vercel.app` | Owner registration, property management, images, submission, profile, and messages |
| Shared API | `main/server` | `https://hostel-site-u3kd.onrender.com/api` | Authentication, authorization, REST resources, uploads, and Socket.IO |
| Database | MongoDB Atlas | Private connection string | Users, sessions, hostels, favorites, conversations, and messages |
| Image storage | Cloudinary | Server-side integration | Original image files; MongoDB stores references and metadata |

The `main` deployment is the admin portal and the `master` deployment is the owner/customer portal. The backend retains `STUDENT`, `OWNER`, and `ADMIN` role support and related API contracts from the original requirements, but there is no third Vercel project.

## How the deployed system works

1. A browser downloads the appropriate React/Vite application from Vercel.
2. The embedded `VITE_API_URL` sends REST requests to the Render API; `VITE_SOCKET_URL` connects real-time messaging to the same host.
3. Render accepts credentialed requests only from the configured exact Vercel origins and requires the application request header on browser writes.
4. Express validates request parameters and bodies with Zod, performs authentication and role/ownership checks, then reads or writes Atlas through Mongoose.
5. Image uploads pass through Express validation and are stored in Cloudinary. Atlas stores image URLs, public IDs, ordering, and the selected cover.
6. Socket.IO delivers live message events while MongoDB remains the durable message store.

### Authentication and authorization

- Passwords are hashed with bcrypt and are independent of `JWT_SECRET`.
- A successful login creates a random session UUID in the MongoDB `sessions` collection.
- The API signs a one-day HS256 JWT containing the user ID and session ID, then sends it as an HTTP-only, secure cookie.
- Each protected request verifies the signature, algorithm, issuer, audience, expiry, matching database session, current user, and active status.
- Roles are loaded from the current MongoDB user record; the API does not trust a role supplied by the browser or JWT payload.
- Admin routes require the live database role `ADMIN`; owner routes require `OWNER`; hostel mutations also verify ownership.
- Logout deletes the database session. Suspending an account deletes all of that user's sessions and disconnects its sockets.
- Public registration can create allowed non-admin roles only. The first administrator is provisioned with `npm run create-admin` against Atlas.

Rotating `JWT_SECRET` invalidates existing cookies and requires users to sign in again. It does not change password hashes, delete accounts, or require re-registration.

### Owner/customer listing lifecycle

1. The owner registers or signs in through the `master` portal.
2. The owner creates and edits a `DRAFT` listing.
3. Images are uploaded to Cloudinary, reordered, deleted, and assigned a cover through protected owner endpoints.
4. Submission changes the listing to `PENDING`.
5. An administrator reviews it in the `main` portal and approves or rejects it through protected admin REST endpoints.
6. Approval changes it to `APPROVED`; rejection records moderation feedback.
7. Important owner edits return an approved/rejected listing to the review lifecycle.
8. Admin suspension hides an approved listing. Admin restoration returns a suspended listing to `DRAFT` for review-safe editing.

### Implemented REST API

Authentication and profiles:

```text
GET    /api/auth/username-available
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
PATCH  /api/auth/me
```

Hostels, images, and favorites:

```text
GET    /api/hostels
GET    /api/hostels/:id
POST   /api/hostels
PUT    /api/hostels/:id
DELETE /api/hostels/:id
GET    /api/owner/hostels
GET    /api/owner/summary
POST   /api/hostels/:id/submit
POST   /api/hostels/:id/images
PUT    /api/hostels/:id/images
DELETE /api/hostels/:id/images
GET    /api/favorites
POST   /api/hostels/:id/favorite
DELETE /api/hostels/:id/favorite
```

Administration:

```text
GET    /api/admin/hostels
PATCH  /api/admin/hostels/:id/approve
PATCH  /api/admin/hostels/:id/reject
PATCH  /api/admin/hostels/:id/suspend
PATCH  /api/admin/hostels/:id/restore
GET    /api/admin/users
PATCH  /api/admin/users/:id
GET    /api/admin/analytics
```

Persistent messaging:

```text
GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/:id/messages
POST   /api/conversations/:id/messages
PATCH  /api/conversations/:id/read
```

## Completed work

- [x] Shared Express/Mongoose REST API with separated routes, controllers, middleware, models, and services.
- [x] Email/username-compatible authentication, bcrypt passwords, HTTP-only JWT cookies, database-backed sessions, logout, expiry, and revocation.
- [x] Backend-enforced `STUDENT`, `OWNER`, and `ADMIN` authorization plus resource-ownership checks.
- [x] Admin moderation queues, approve/reject/suspend/restore transitions, user suspension/restoration, and database-backed analytics.
- [x] Owner registration, profile, summary, listing CRUD, photo management, submission, moderation feedback, and messaging.
- [x] Search, listing details, favorites, profiles, and persistent conversations retained in the shared API contract.
- [x] Socket.IO new-message delivery, unread counts, message history, pagination, and read receipts.
- [x] Cloudinary upload boundary with magic-byte/type, file-size, count, ordering, cover, and deletion validation.
- [x] Strict request validation, exact-origin credentialed CORS, browser-write origin/header protection, Helmet, rate limits, and consistent errors.
- [x] Responsive React/Vite interfaces with protected routes and loading, empty, error, and session-expiry states.
- [x] Vercel SPA rewrites and build-time rejection of missing, local, insecure, or malformed production API URLs.
- [x] Render-compatible Node start path, Dockerfile, health check, graceful shutdown, proxy/cookie configuration, and optional DNS resolver override.
- [x] DNS resolver configuration moved into the shared database module so API, seed, and `create-admin` entry points use it consistently.
- [x] Deployment documentation, manual release guide, read-only production smoke checker, branch-consistency checker, and GitHub workflows.
- [x] Shared backend and shared client modules synchronized between `main` and `master`.

## Verification completed

### Automated local verification

- Backend integration suite passes 5/5, covering authentication, validation, CSRF-style browser write protection, role/owner isolation, moderation state transitions, favorites, chat, sockets, image validation, session revocation, and both portal contracts.
- Both client configuration tests pass.
- Both Vite production builds pass with a valid HTTPS API URL.
- The isolated Playwright workflow passes across both portals, one temporary API, and one temporary MongoDB; only external Cloudinary storage is stubbed.
- The branch-consistency check reports all declared shared backend/client files identical.

### Production verification

The read-only deployment checker passed all of the following on 2026-10-02:

```text
PASS API and database health
PASS Credentialed CORS for https://hostel-site-admin.vercel.app
PASS SPA deep links for https://hostel-site-admin.vercel.app
PASS Built API URL for https://hostel-site-admin.vercel.app
PASS Credentialed CORS for https://hostel-site-user.vercel.app
PASS SPA deep links for https://hostel-site-user.vercel.app
PASS Built API URL for https://hostel-site-user.vercel.app
```

Additional live checks succeeded:

- Render `/api/health` returned HTTP 200 with Atlas connected.
- Production admin login returned HTTP 200.
- The secure session cookie survived the follow-up `/api/auth/me` request.
- The authenticated browser reached `/admin` successfully.
- `/api/admin/analytics` returned live Atlas-backed counts.
- The production API correctly rejected a display name that was not an account username and accepted the administrator's registered email.
- Atlas administrator creation succeeded through `npm run create-admin` after enabling the DNS resolver override.

## Secrets and production configuration

- Production secrets belong in Render/Atlas/Cloudinary dashboards, never Git or Vercel `VITE_*` values.
- Both Vercel projects use the same Render API URL.
- Render `CLIENT_URL` must list the two exact production Vercel origins.
- Unrelated Render/Vercel domains require secure cross-site cookies (`COOKIE_SAME_SITE=none`).
- Run one backend instance until shared Socket.IO, rate-limit, and session coordination are implemented.
- Any credential exposed during setup—including Atlas passwords, administrator passwords, and JWT secrets—must be rotated in the appropriate service before treating the release as secure.
- Changing a Vercel build variable requires a new deployment; changing a Render runtime variable requires a restart/redeploy.

## Remaining production acceptance checks

The core deployment and REST authentication path are verified. These external boundaries should still be checked whenever credentials or deployments change:

- [ ] Upload, reorder, display, and delete genuine images using the production Cloudinary account.
- [ ] Complete one live owner submission and admin approve/reject cycle after the final credential rotation.
- [ ] Confirm production owner messaging and Socket.IO reconnect behavior in two real browsers.
- [ ] Confirm the final rotated JWT, Atlas, Cloudinary, and administrator credentials are active and the exposed setup values are revoked.
- [ ] Check primary screens on current mobile Safari/Chrome and desktop browsers, especially third-party-cookie behavior across unrelated domains.

These are operational acceptance checks, not missing REST endpoints.

## Deferred features

The following are intentionally not presented as active functionality:

- Payments and subscriptions.
- Reports workflow.
- Password reset and email verification.
- Owner identity/document verification.
- Online presence.
- Persistent moderation audit history.
- Safe horizontal backend scaling across multiple instances.

Multiple backend replicas will require shared Socket.IO coordination, shared rate limits, and cross-process session revocation before scaling beyond one instance.

## Operational references

- [README.md](README.md) or `readme.md`: repository overview and local commands.
- [DEPLOYMENT.md](DEPLOYMENT.md): technical deployment configuration.
- [MANUAL_RELEASE_GUIDE.md](MANUAL_RELEASE_GUIDE.md): dashboard-by-dashboard owner checklist.
- [server/README.md](server/README.md): API behavior and contracts.
