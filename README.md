# ParkEase - Smart Mall Parking Management System

A full-stack **portfolio / demo** project: reserve a mall parking bay, check in on arrival, watch your fee tick up live, pay with a **simulated** payment, download a receipt, and watch the bay release itself two minutes later. Includes a complete admin console.

> **DEMO PROJECT - No real money is charged and no real payment details are ever collected or stored.**

## 1. Real-world problem
Mall drivers circle for bays, nobody knows how much they will pay until the barrier, and operators cannot see occupancy or revenue in real time. ParkEase gives drivers a guaranteed bay for a short arrival window, transparent per-minute billing, and operators live occupancy, pricing and reporting.

## 2. Main features
- JWT auth with `VISITOR` / `ADMIN` roles (role always read from the database, never from the client)
- Vehicles: add / edit / delete with normalised registration numbers and active-use protection
- Live parking layout by floor and zone with the 5 slot states (Available, Reserved, Occupied, Release pending, Maintenance)
- Reservations with a **server-enforced 15-minute arrival window**, cancellation, and **"I have arrived"** check-in
- **Live timer + fee** (INR 2/min default, per-vehicle-type rates, rate snapshot per session, ceil-to-minute billing, 1-minute minimum)
- **"I'm leaving"** freezes an invoice; the amount can never grow or be changed by the client
- Demo checkout (UPI / card / net banking / wallet), idempotent payment, success page, downloadable HTML receipt
- **Two-minute automatic slot release** driven by the backend (scheduler + reconciliation + self-healing)
- User dashboard, history, payment history; admin dashboard with Recharts, floor/zone/slot management, rates and rules, reservations / sessions / payments / users, reports

## 3. Tech stack
| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, JavaScript, React Router, Axios, plain CSS (one file per page / major component), Lucide, Recharts, react-hot-toast, Context API |
| Backend | Node.js (ESM), Express, Mongoose, JWT, bcryptjs, dotenv, CORS, helmet, express-rate-limit |
| Database | MongoDB (Atlas) |
| Deploy | Vercel (client), Render (server), MongoDB Atlas |

## 4. Architecture
```
Browser (React) --Axios+JWT--> Express API --Mongoose--> MongoDB
                                  |
        routes -> controllers -> services -> models
                                  |
        jobs (every 10 s) + reconcile() on every read/mutation
```
* **Routes** define endpoints, **controllers** handle HTTP, **services** hold business rules, **models** hold schemas + indexes, **middleware** handles auth / roles / errors / rate limits.
* The browser clock is display-only. The server returns `X-Server-Time` on every response and the client uses it to align countdowns.

## 5. Folder structure
```
parkease/
  render.yaml                  optional Render blueprint
  server/
    app.js  server.js  .env.example
    config/        env.js db.js
    models/        User Vehicle ParkingFloor ParkingZone ParkingSlot ParkingReservation
                   ParkingSession ParkingRate Setting Payment
    services/      parkingAvailabilityService (reconcile) reservationService reservationExpiryService
                   slotReleaseService parkingBillingService paymentService receiptService
                   settingsService reportService
    controllers/ routes/ middleware/ jobs/ utils/
    scripts/       seedAdmin.js seedParkingData.js e2eSmoke.js
    tests/         billing.test.js   (unit tests: billing, state machine, validators)
  client/
    vercel.json  .env.example  index.html
    src/ components/{common,layout,parking,reservations,sessions,payments,admin}
         pages/{public,auth,user,payment,admin,errors}  context/ hooks/ services/ utils/ css/
```

## 6. Prerequisites
Node.js **22+**, npm, and a MongoDB database (free MongoDB Atlas cluster, or a local `mongod`).

## 7. Local setup
```bash
# 1) backend
cd server
cp .env.example .env          # then edit MONGO_URI, JWT_SECRET, ADMIN_* values
npm install
npm run seed                  # floors, zones, 74 slots, rates, settings, then the admin user
npm run dev                   # http://localhost:5000  (health: /api/health)

# 2) frontend (new terminal)
cd client
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                   # http://localhost:5173
```

### Environment variables
Server (`server/.env`):

| Name | Purpose |
|---|---|
| `MONGO_URI` | MongoDB connection string (required) |
| `JWT_SECRET` | 32+ random chars (required) |
| `PORT`, `NODE_ENV` | server port / environment |
| `CLIENT_URL` | allowed browser origin(s), comma-separated (your Vercel URL in production) |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | used **only** by `npm run seed:admin` |
| `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | optional: seeds a demo visitor with two vehicles |
| `MALL_NAME`, `APP_TIMEZONE`, `APP_TZ_OFFSET` | display name and reporting timezone (default Asia/Kolkata, +05:30) |

Client (`client/.env`): `VITE_API_URL` (must end in `/api`).

### Seeding
* `npm run seed:data` - floors (Basement 2, Basement 1, Ground, First), zones (A, B, C, EV, Accessible), **74 slots**, INR 2/min rates for all vehicle types, settings. Re-running never duplicates anything.
* `npm run seed:admin` - creates the admin from `ADMIN_*` env vars if it does not exist. Credentials never appear in frontend code.

## 8. Business rules
**Reservation.** Slot `AVAILABLE -> RESERVED` via one atomic conditional update; partial unique indexes guarantee at most one `ACTIVE` reservation per slot and per vehicle. `expiresAt = createdAt + 15 min` (server clock, stored in MongoDB). A check-in request is accepted only if `expiresAt > serverNow` - enforced inside the database query. Late check-in -> reservation `EXPIRED`, slot released, HTTP 410.

**Expiry** is idempotent and runs from (a) a 10-second job, (b) `reconcile()` before every availability read / booking / check-in, and (c) once at boot. If Render sleeps, the first request after the deadline corrects the state.

**Fee.** `billableMinutes = max(1, ceil(elapsedMs / 60000))`, `fee = billableMinutes x ratePerMinute` (+ convenience fee, - discount). Examples at INR 2/min: 1 min = 2, 5 = 10, 15 = 30, 30 = 60, 45 = 90, 60 = 120. The rate is **snapshotted** into the session at check-in, so admin rate changes never touch a running session.

**Leaving.** `ACTIVE -> PAYMENT_PENDING` (conditional update) stores `departureAt`, minutes, charge and invoice number. Repeated / concurrent clicks return the same invoice.

**Demo payment.** `POST /api/payments/demo` accepts only `{ sessionId, method, provider }` (anything else, e.g. an `amount` or a card number, is rejected with 400). The amount is read from the finalized invoice in MongoDB. One payment per session is enforced by a unique index; the `PENDING -> SUCCESS` update is atomic, so double-clicks and retries yield one transaction. Card numbers, CVVs and UPI IDs never leave the browser.

**Two-minute release.** On payment success: session `PAID`, `releaseAt = paidAt + 2 min`, slot `OCCUPIED -> RELEASE_PENDING` (unbookable). When `now >= releaseAt` the backend sets the session `COMPLETED` and the slot `AVAILABLE` - conditional on the slot still belonging to that session, so a newer reservation can never be clobbered. No browser involvement. `healStaleSlots()` and `healSuccessfulPayments()` repair any state left half-written by a crash.

**Slot state machine** (`utils/slotStateMachine.js`, unit-tested): AVAILABLE->RESERVED->OCCUPIED->RELEASE_PENDING->AVAILABLE, RESERVED->AVAILABLE (expiry/cancel), AVAILABLE<->MAINTENANCE.

> MongoDB transactions are intentionally **not required** (they need a replica set). Every multi-step transition is built from conditional single-document updates plus a recovery pass, so it also works on a standalone local `mongod`.

## 9. API (all under `/api`; responses are `{ success, message?, data }`)
| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register` `POST /auth/login` `GET /auth/me` `PUT /auth/profile` |
| Vehicles | `GET/POST /vehicles` `GET/PUT/DELETE /vehicles/:id` |
| Parking (public) | `GET /parking/availability` `GET /parking/rates` `GET /parking/floors` `GET /parking/floors/:id/zones` `GET /parking/zones/:id/slots` `GET /parking/slots?floorId&zoneId&vehicleType&slotType&status&limit` `GET /parking/slots/:id` |
| Reservations | `POST /reservations` `GET /reservations/my` `GET /reservations/:id` `DELETE /reservations/:id` `POST /reservations/:id/check-in` |
| Sessions | `GET /parking/sessions/active` `GET /parking/sessions/history` `GET /parking/sessions/:id` `GET /parking/sessions/:id/bill` `POST /parking/sessions/:id/leave` |
| Payments | `GET /payments/options` `POST /payments/demo` `GET /payments/history` `GET /payments/:id` `GET /payments/:id/receipt` |
| Dashboard | `GET /dashboard/user` `GET /dashboard/admin` |
| Admin (ADMIN only) | floors `GET/POST /admin/floors`, `PUT /admin/floors/:id` - zones `GET/POST /admin/zones`, `PUT /admin/zones/:id` - slots `GET/POST /admin/slots`, `PUT /admin/slots/:id`, `POST /admin/slots/:id/maintenance`, `POST /admin/slots/:id/restore` - `GET /admin/rates`, `PUT /admin/rates/:vehicleType`, `PUT /admin/settings` - `GET /admin/reservations`, `/admin/sessions`, `/admin/payments` (read-only), `/admin/users`, `/admin/users/:id`, `/admin/reports?days=` |

There is deliberately **no** endpoint that sets a slot to AVAILABLE/OCCUPIED, creates a payment, or edits a payment status.

## 10. Testing
```bash
cd server
npm test        # unit tests: billing rules, slot state machine, validators (no database needed)
npm run smoke   # end-to-end journey against a RUNNING, SEEDED API (takes ~2 min, waits for the real slot release)
```
`npm run smoke` checks: register / duplicate / login, role protection, two users racing for one slot (exactly one wins), 15-minute deadline, cross-user cancel / leave / pay rejected, idempotent check-in and leave, tamper-proof payment payload, double-submit = one payment, receipt download, slot `RELEASE_PENDING` then `AVAILABLE` after `releaseAt`, rebooking.

Manual frontend checks: register, add a vehicle, book, refresh the reservation page (countdown rebuilds from the server), check in, refresh the active page (timer and fee rebuild), leave, pay, download receipt, wait for the release countdown, sign in as admin and review the dashboards.

## 11. Deployment
**MongoDB Atlas.** Create a free cluster -> Database Access: add a user -> Network Access: allow Render (for a demo `0.0.0.0/0`, then tighten) -> copy the connection string (include a database name, e.g. `/parkease`).

**Render (API).** New Web Service from this repo (or use `render.yaml`): Root Directory `server`, Build `npm install`, Start `npm start`, Health check `/api/health`. Env: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_URL=https://<your-vercel-app>.vercel.app`. Then run the seeds once from the Render Shell (`npm run seed`) with `ADMIN_*` set. The free tier sleeps; reconciliation on boot and on every request keeps expiry and release correct.

**Vercel (client).** Import the repo, Root Directory `client`, framework Vite, env `VITE_API_URL=https://<your-render-service>.onrender.com/api`. `client/vercel.json` rewrites all routes to `index.html` so deep links and refreshes work. Redeploy after changing env vars.

## 12. Troubleshooting
* **CORS error / network error in browser** - `CLIENT_URL` on Render must exactly equal the Vercel origin (no trailing path).
* **`Missing required environment variables`** - copy `.env.example` to `.env` and fill `MONGO_URI` + `JWT_SECRET`.
* **Atlas connection timeout** - check Network Access allow-list and that the password is URL-encoded.
* **Dashboard empty** - run `npm run seed` in `server/`.
* **Cannot log in as admin** - run `npm run seed:admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` set.
* **First request after idle is slow on Render free tier** - cold start; state is reconciled automatically.

## 13. Security notes
bcrypt (12 rounds) password hashes never returned; JWT verified on every protected call and the user/role re-loaded from MongoDB; ownership checks return 404 for other users' resources; `helmet`; origin-restricted CORS; rate limits on auth and sensitive actions; request body size limit; ObjectId validation; regex-escaped searches; centralized error handler hides stack traces; payment credentials are rejected by the API and never stored or logged; receipts are owner/admin only.

## 14. Known limitations
* Receipts are printable HTML (use the in-page "Print / Save as PDF"), not server-generated PDFs.
* Polling (8-20 s) instead of WebSockets.
* Admin cannot delete floors/zones/slots (only close / maintenance) to protect history.
* No email/SMS notifications and no automated frontend tests.

## 15. Future enhancements
Real gateway (Razorpay/Stripe test mode), PDF receipts, WebSockets/SSE, licence-plate recognition at the barrier, dynamic pricing, loyalty discounts, Playwright E2E suite, audit log.

## 16. Disclaimer
ParkEase is a portfolio project with sample data. Payments are simulated; receipts and bills have no legal or financial value.
