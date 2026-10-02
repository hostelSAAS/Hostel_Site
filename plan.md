# Hostel Application Plan

## Implementation Status (2026-10-01)

The shared MERN API and core frontend flows are connected locally. Production hosting configuration and live Atlas/Cloudinary verification are still required; repository changes alone do not update deployed sites. See [DEPLOYMENT.md](DEPLOYMENT.md).

### Work completed and remaining

Completed: the two portals now share one backend contract and Axios client; authentication, HTTP-only sessions, role guards, student search/details/favorites/profile, owner listings/photos/submission/profile, admin moderation/users/analytics, persistent conversations, Socket.IO updates, loading/error/empty states, Vercel SPA rewrites, production API-URL validation, deployment documentation, Docker support, backend contract tests, client configuration tests, and an isolated cross-portal browser test harness are in place.

Remaining before release: choose and deploy the public API host from `main`; configure MongoDB Atlas network access and credentials, Cloudinary credentials, exact `CLIENT_URL` origins, proxy trust, and production cookie settings; set `VITE_API_URL`, `VITE_SOCKET_URL`, and the owner portal URL in both Vercel projects; rebuild both frontends; run the read-only deployment smoke check; and verify the authenticated student, owner, and admin flows against the live API, Atlas, Cloudinary, HTTPS cookies, and mobile layouts. Keep the shared backend and client modules synchronized between `main` and `master`.

### Session summary

This session traced the deployment failures to a live owner bundle using `http://localhost:5000/api`, missing SPA rewrites, and incompatible username/email authentication contracts between the branches. The shared API was made compatible with both contracts, both portals were connected to the real API, mock student/owner/admin flows were replaced with persisted API-backed behavior, and production configuration now rejects unsafe or missing API URLs. Backend integration tests pass 5/5, client configuration tests pass, and both production builds pass. No production deployment or live database configuration was performed; the remaining release work is listed above.

### Architecture and Branches

- `main`: student/admin frontend.
- `master`: standalone owner frontend.
- Keep `/server` identical across branches and deploy one API from `main`, with one MongoDB database.
- Retain separate React/Vite clients, shared Axios request/session behavior, HTTP-only cookies and server-enforced role/ownership checks.
- This backend targets one persistent Node process with both frontend origins explicitly allowed.

### Completed implementation

- [x] Shared email/username authentication contracts, legacy email-account compatibility and role-safe registration.
- [x] Axios request layer, React session context, login/registration/logout, protected routes and expired-session handling on both portals.
- [x] Student search/filtering/pagination, listing details, persisted favorites and profile updates.
- [x] Owner listing creation/editing/deletion, real summary counts, profile updates and moderation feedback.
- [x] Multipart photo upload, cover selection, ordering, deletion and draft submission controls.
- [x] Admin moderation queues, approval/rejection/suspension/restoration, user management and database-backed analytics.
- [x] Persistent conversations/replies on both portals, Socket.IO updates, history reload on reconnect, older history and visible-message read receipts.
- [x] Loading, empty and error states instead of fabricated records; deferred pages state that features are unavailable.
- [x] Vercel SPA rewrites and production build validation rejecting missing/local/insecure API URLs.
- [x] Portable API Dockerfile, deployment runbook and read-only live smoke checker.
- [x] Backend contract regressions and browser workflow test harness with isolated MongoDB.

### Verification and remaining release work

- Backend tests cover authentication, CSRF, role/owner isolation, moderation, favorites, chat, sockets and session revocation.
- Browser tests exercise both frontends against one isolated real API/database; only the external Cloudinary storage boundary is stubbed.
- Confirm the public API host, deploy the synchronized backend from main and configure both client build environments.
- Configure Atlas network access for the API host, Cloudinary credentials, exact CLIENT_URL origins and production cookie settings.
- Verify live Cloudinary uploads, Atlas connectivity, HTTPS cookies and deployed browser flows before calling the release complete.
- Keep both shared backend and shared client modules synchronized in future changes.

### Deferred Features

Subscriptions/payments, reports, password reset/email verification, online presence, persistent moderation audit history, and distributed backend operation remain unimplemented. Any existing UI for these features is a placeholder and must not imply live functionality. Multiple backend replicas require shared Socket.IO coordination, shared rate limits, and cross-process session revocation.



## Important Tech Stack Requirement

Build this application using the MERN stack.

### Frontend

- React
- Vite
- JavaScript or TypeScript
- Tailwind CSS
- React Router
- Axios
- Context API or an appropriate lightweight state-management solution

React is the frontend framework. Do not use Next.js or build the frontend as a server-rendered Next.js application.

### Backend

- Node.js
- Express.js
- REST API architecture
- MongoDB
- Mongoose

The backend and frontend must be separate applications, with the recommended structure:

```text
/client
/server
```

### Authentication

Implement authentication using JWT, HTTP-only cookies, secure password hashing, and role-based authorization.

Roles:

- STUDENT
- OWNER
- ADMIN

The backend must verify user roles on protected API routes. Never rely only on frontend route protection for security.

### API

Create clean REST API endpoints, including:

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/hostels
GET    /api/hostels/:id
POST   /api/hostels
PUT    /api/hostels/:id
DELETE /api/hostels/:id

POST   /api/hostels/:id/favorite
DELETE /api/hostels/:id/favorite

GET    /api/conversations
POST   /api/conversations
GET    /api/conversations/:id/messages
POST   /api/conversations/:id/messages

GET    /api/admin/hostels
PATCH  /api/admin/hostels/:id/approve
PATCH  /api/admin/hostels/:id/reject
PATCH  /api/admin/hostels/:id/suspend

GET    /api/admin/users
GET    /api/admin/analytics
```

Keep controllers, routes, models, middleware, and services separated.

### Real-Time Chat

Use Socket.IO for real-time messaging between students and hostel owners. Support real-time messages, conversation lists, unread counts, timestamps, read status, online status where practical, and notifications.

Store messages in MongoDB. Use Socket.IO only for real-time communication; MongoDB remains the persistent database.

### Image Uploads

Use Cloudinary or another configurable cloud image-storage provider. Do not store large image files directly inside MongoDB.

Hostel owners must be able to upload multiple images, select a cover image, delete images, and reorder images. Validate file type, file size, and image count.

### Frontend Routing

Use React Router with role-protected routes:

```text
/                       → Landing page
/hostels                → Search hostels
/hostels/:id            → Hostel details
/favorites              → Student favorites
/messages               → Student messages
/profile                → Student profile

/owner                  → Owner dashboard
/owner/hostel           → Manage hostel
/owner/messages         → Owner messages
/owner/subscription     → Subscription
/owner/profile          → Owner profile

/admin                  → Admin dashboard
/admin/hostels          → Manage hostels
/admin/users            → Manage users
/admin/reports          → Reports
/admin/subscriptions    → Subscriptions
/admin/analytics        → Analytics
```

### React UI Requirements

The UI must be minimalist, modern, responsive, and commercial-quality. Use Tailwind CSS, reusable components, responsive layouts, clean cards and forms, simple navigation, consistent spacing, good typography, subtle animations, loading skeletons, empty states, error states, and toast notifications. Mobile responsiveness is mandatory.

### Environment Variables

Use environment variables for all secrets and provide a `.env.example` file.

```text
VITE_API_URL=
MONGODB_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=
```

Never hard-code secrets.

### Development Requirements

Create `/client` and `/server`, and provide `README.md` explaining:

1. Installing dependencies
2. Configuring MongoDB
3. Configuring Cloudinary
4. Configuring environment variables
5. Starting the backend
6. Starting the React frontend
7. Seeding demo data
8. Demo accounts
9. API architecture
10. Project structure

Add proper error handling, backend validation, frontend form validation, loading states, and error states. The complete application must work end-to-end. Do not create only static frontend pages; connect the React frontend to the Express API and MongoDB.

### Most Important User Flows

Build these three fully functional experiences before adding secondary features:

#### Student

Register/login → Search → Filter → View hostel → Save → Chat

#### Owner

Register/login → Create hostel → Upload images → Submit → Get approved → Receive messages → Reply

#### Admin

Login → Review listings → Approve/reject → Manage users → Manage hostels → View analytics
