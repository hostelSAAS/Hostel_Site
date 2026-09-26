# HostelHub shared API

One Express/Mongoose API serves STUDENT, OWNER, and ADMIN roles. Both frontend deployments use the same API and MongoDB database. `main` contains the student/admin UI; `master` contains the owner UI. Keep `/server` identical across branches and deploy it from **one** designated branch (recommended: `main`). Splitting backend services by frontend branch would duplicate authentication, data, and moderation logic.

## Local setup

Use Node.js 22 or newer. In `server`, run `npm ci`, copy `.env.example` to `.env`, set a random `JWT_SECRET` of at least 32 characters, and configure `MONGODB_URI`. MongoDB may run locally or in Atlas. For Atlas, configure database credentials and network access for your backend host.

Run `npm run dev` (port 5000). In each `client`, run `npm ci`, copy `.env.example` to `.env`, then `npm run dev`. Run the second frontend with `npm run dev -- --port 5174`. `CLIENT_URL` is a comma-separated list of exact allowed frontend origins; localhost ports 5173 and 5174 are included in the example.

`GET /api/health` returns 200 when MongoDB is connected, otherwise 503. Missing or invalid required environment variables prevent startup.

## Deploying owner registration

Owner registration and login use the API, so registration from the Vercel site works once the public API and the environment variables below are configured. The account, profile fields, password hash, and session are written to the MongoDB database selected by the API's `MONGODB_URI`. The rest of the dashboard still contains mock presentation data.

Deploy `server` once as a publicly reachable persistent Node service. Install with `npm ci --omit=dev` and run `npm start`. Configure these environment variables on that API host:

- `NODE_ENV=production`
- `MONGODB_URI`: the Atlas connection string
- `JWT_SECRET`: a unique random secret of at least 32 characters
- `CLIENT_URL`: the exact Vercel site origin, including `https://` and no path (for example `https://hostelhub.vercel.app`). Add more exact origins as a comma-separated list if needed. Vercel preview URLs must also be listed if those previews should allow login and registration.
- `COOKIE_SAME_SITE=none` when the Vercel and API hostnames are on different sites; production then uses secure cookies. If they are custom subdomains on the same site, `lax` can be used.
- Cloudinary credentials if image upload is enabled
- `TRUST_PROXY`: the actual trusted proxy-hop count for the API host (0 by default)

On the Vercel client project, set `VITE_API_URL` to the public API origin plus `/api`, for example `https://api.example.com/api`. Set `VITE_SOCKET_URL` to the API origin, for example `https://api.example.com`. Redeploy the client after changing either variable; Vite embeds these values during the build. Never put `MONGODB_URI` or `JWT_SECRET` in Vercel's client environment variables.

In MongoDB Atlas, add the API host's outbound IP address to Network Access. The Vercel browser talks to the API; it does not connect directly to Atlas. After deployment, verify `https://<api-host>/api/health` returns `{"data":{"status":"ok"}}`, then try registration from the Vercel site.

Terminate TLS at the API host. Keep both API and client on HTTPS in production. This API uses credentialed CORS and an exact `CLIENT_URL` origin allowlist; the existing auth client sends cookies and the required request header.

Prefer frontend and API custom subdomains under one site, e.g. `app.example.com`, `owner.example.com`, and `api.example.com`, with `COOKIE_SAME_SITE=lax`. If using unrelated domains, set `COOKIE_SAME_SITE=none` (requires HTTPS). Browsers that block third-party cookies can still block those sessions; custom domains or a same-origin proxy are needed for reliable authentication. Cookies are host-only, HTTP-only, secure in production, and expire after one day.

This implementation targets one persistent backend process. Before running multiple replicas, add a Socket.IO shared adapter, a shared rate-limit store, and cross-process session-disconnect coordination. Vercel now documents WebSocket beta support, but function instances need external room/pub-sub coordination and reconnect handling: [Vercel WebSockets](https://vercel.com/docs/functions/websockets). This repository does not include a Vercel Functions adapter; the existing frontend deployments are unaffected.

## Authentication and security

Registration accepts only STUDENT or OWNER. For an initial production admin, set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (12-72 bytes) in the process environment and run `npm run create-admin`. Existing users are never silently promoted or overwritten. Remove the password variable afterward.

Every mutating request, including login and multipart uploads, requires an allowed `Origin` and `X-Requested-With: HostelHub`. JSON requests also use `Content-Type: application/json`. Include cookies with `credentials: 'include'`. The client helper supplies these headers and credentials; browsers supply Origin. Scripts must supply Origin explicitly. This custom-header requirement plus exact CORS allowlisting prevents cross-site cookie-based writes.

JWTs contain an opaque session ID backed by a MongoDB session with a TTL index. Logout revokes that session, and suspending an account revokes all its sessions and disconnects its sockets. Socket sessions are also rechecked every 15 seconds. Passwords use bcrypt with cost 12 and a 72-byte limit. API input schemas reject unrecognized body fields; database filters are built from validated scalar values. Errors never expose server stack traces. Rate limits are currently per process: 180 API requests/minute/IP and 30 auth attempts/15 minutes/IP. TLS and correct proxy configuration are required in production.

## API contract

Success responses use `{ "data": ... }`; paginated public/admin lists additionally provide `{ "pagination": { "page", "limit", "total" } }`. Errors use `{ "error": { "message", "details"? } }`. Deletions, logout, favorites, and marking messages read return 204 without a body. MongoDB records expose `_id`; auth user responses expose `id`. Page size defaults to 20 and is capped at 50.

| Route | Access / payload |
| --- | --- |
| `POST /api/auth/register` | `{name,email,password,role: STUDENT or OWNER}`; password 10-72 bytes |
| `POST /api/auth/login` | `{email,password}` |
| `POST /api/auth/logout` | Signed-in session |
| `GET /api/auth/me` | Signed-in user |
| `PATCH /api/auth/me` | `{name}` |
| `GET /api/hostels` | Public approved listings; `q,city,gender,minPrice,maxPrice,sort,page,limit` |
| `GET /api/hostels/:id` | Public approved listing |
| `GET /api/owner/hostels` | Owner's non-deleted listings, all statuses; `page,limit` |
| `POST /api/hostels` | OWNER; listing payload below |
| `PUT /api/hostels/:id` | Owning OWNER; full listing payload |
| `DELETE /api/hostels/:id` | Owning OWNER; soft delete |
| `POST /api/hostels/:id/submit` | Owning OWNER; requires an image |
| `POST /api/hostels/:id/images` | Owning OWNER; multipart `images` files |
| `PUT /api/hostels/:id/images` | Owning OWNER; `{publicIds: [...],coverImage: publicId}` |
| `DELETE /api/hostels/:id/images` | Owning OWNER; `{publicId}` |
| `GET /api/favorites` | STUDENT; `page,limit` |
| `POST, DELETE /api/hostels/:id/favorite` | STUDENT; idempotent |
| `GET /api/conversations` | Participant's conversations, last message and unread count; `page,limit` |
| `POST /api/conversations` | STUDENT; `{hostelId}`; reuses existing conversation |
| `GET /api/conversations/:id/messages` | Participant; `before` message ID and `limit` (max 100) |
| `POST /api/conversations/:id/messages` | Participant; `{text}` (max 4000 characters) |
| `PATCH /api/conversations/:id/read` | Participant; `{through: messageId}` |
| `GET /api/admin/hostels` | ADMIN; `status,page,limit` |
| `PATCH /api/admin/hostels/:id/approve` | ADMIN; pending -> approved; `{reason?}` |
| `PATCH /api/admin/hostels/:id/reject` | ADMIN; pending -> rejected; `{reason?}` |
| `PATCH /api/admin/hostels/:id/suspend` | ADMIN; approved -> suspended; `{reason?}` |
| `PATCH /api/admin/hostels/:id/restore` | ADMIN; suspended -> draft; `{reason?}` |
| `GET /api/admin/users` | ADMIN; `page,limit` |
| `PATCH /api/admin/users/:id` | ADMIN; `{active: boolean}`; cannot suspend admin accounts |
| `GET /api/admin/analytics` | ADMIN; actual user/listing counts by role/status, conversation and message totals |

Listing payload example:

```json
{"name":"Campus Lodge","description":"Quiet rooms near campus","city":"Lahore","address":"Gulberg III","price":20000,"beds":5,"gender":"ANY","amenities":["WiFi","Laundry"]}
```

Gender is `MALE`, `FEMALE`, or `ANY`; sort is `newest`, `priceAsc`, or `priceDesc`. City matching is case-insensitive. Search escapes regex metacharacters. Listing writes cannot assign owner or approval status. Every listing/image edit resets to DRAFT; the owner submits it for review again. Suspended listings cannot be edited or resubmitted until an admin restores them. Account reactivation does not automatically republish suspended listings. Deleted listings disappear from public and owner lists; existing conversations remain available.

## Images

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` from the Cloudinary dashboard. Uploads are limited to 10 images per hostel, 5 MiB each, with JPEG/PNG/WebP magic-byte checks. Cloudinary stores image bytes; MongoDB stores public IDs, URLs, ordering, and cover selection. Database concurrency checks prevent simultaneous uploads from exceeding the image limit. Failed batches attempt cleanup. Cleanup failures are logged for operator action; a durable cleanup queue is future work. Soft-deleted listing images are retained for recovery.

## Real-time messaging

Use Socket.IO v4 with `io(VITE_SOCKET_URL, { withCredentials: true, transports: ['websocket'] })`. The cookie must already have been established by login. The server assigns private user rooms; clients cannot select arbitrary rooms. Subscribe to `message:new` and `messages:read`. Send messages and read acknowledgements through REST. MongoDB remains the source of truth: reload conversations/history on connection or reconnection because live events are best effort. No online-presence indicator is implemented yet.

History returns messages oldest-to-newest within a page, with `nextCursor` for older messages (pass it as `before`). Mark only messages the UI has displayed as read by sending the last displayed message ID in `through`.

## Seed and tests

Run `npm run seed` to add `student`, `owner`, and `admin` demo usernames, demo listings, a favorite and a conversation. Locally the password defaults to `Password123!`; set `SEED_PASSWORD` to a password of 10-72 bytes to override it. Existing accounts/passwords are unchanged; seeding never wipes the database and is disabled in production. Demo listings intentionally have no Cloudinary uploads.

`npm test` launches an isolated temporary MongoDB server and exercises cookies, session revocation, role escalation rejection, CSRF, owner isolation, moderation, search, favorites, private chat, unread counts/read receipts, real Socket.IO delivery, user suspension, and image validation. The first run downloads a MongoDB binary and needs network access. Cloudinary success paths require real credentials and are not covered by live integration tests.

## Structure and remaining work

`src/config` validates configuration and connects MongoDB; `models` define persistence/indexes; `routes` define API schemas and middleware; `controllers` handle requests; `services` implement session, ownership, image, and chat operations; `middleware` handles authentication, authorization, CSRF, validation, and errors; `sockets` handles live delivery; `seed` provides safe local demo data and admin provisioning.

This is the backend phase. Connecting existing React mock screens, route guards and login forms is still required for the full end-to-end product described in `plan.md`. Password reset/email verification, subscriptions/payments, reports, online presence, persistent audit history, and distributed deployment are not implemented.
