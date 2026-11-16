# StudioSpace — Peer-to-Peer Creative Workspace & Production Studio Platform

**StudioSpace** is a full-stack creative production marketplace where hosts list specialised production environments — photography cyclorama lofts, cinema sound stages, 4K podcast lounges, SSL recording suites, and fabrication workshops — and creators discover, filter, check live availability, and book studio hours with automatic double-booking prevention.

---

## 🔗 Live Deployment

| Service | URL |
| :--- | :--- |
| **Frontend (Vercel)** | [https://studiospace-lyart.vercel.app/](https://studiospace-lyart.vercel.app/) |
| **Backend API (Render)** | [https://studiospace-t70a.onrender.com/](https://studiospace-t70a.onrender.com/) |
| **Repository** | [https://github.com/rmr193/Studiospace](https://github.com/rmr193/Studiospace) |
| **Client source** | [client/](https://github.com/rmr193/Studiospace/tree/main/client) |
| **Server source** | [server/](https://github.com/rmr193/Studiospace/tree/main/server) |

---

## 🔑 Examiner Test Credentials

Use these credentials on the live site or a locally seeded database:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Examiner / Host** | `examiner@studiospace.com` | `Test123@` |
| Demo host | `maya@studiospace.com` | `Studio123@` |
| Demo host | `jon@studiospace.com` | `Studio123@` |

The examiner account is a real BetterAuth credential account. It comes with sample bookings in **Pending**, **Confirmed**, **Completed**, and **Cancelled** states so every dashboard and invoice flow can be tested immediately.

---

## ✨ Key Features

1. **BetterAuth + MongoDB with HTTPOnly JWT cookies**
   - Email/password accounts and Google OAuth 2.0 are handled by BetterAuth using `better-auth/adapters/mongodb` (`usePlural: true`).
   - After a verified BetterAuth session, `POST /api/auth/jwt` mints a 7-day API JWT into an `HttpOnly`, `Secure`, `SameSite=None` cookie. The token is never written to `localStorage` or exposed in a redirect URL.
   - Protected studio, booking, wishlist, dashboard, and account routes return **401** for missing or invalid sessions.

2. **Double-booking prevention with MongoDB range operators**
   - Before a booking is inserted, the API checks for overlapping `Pending` or `Confirmed` reservations using `startTime: { $lt: newEndTime }` and `endTime: { $gt: newStartTime }`.
   - Conflicts return **409 Conflict** with a clear message; successful bookings return **201 Created**.

3. **Persistent light/dark theme**
   - Powered by `next-themes` with `attribute="class"` and the `studiospace-theme` storage key. The choice survives full page reloads without a flash of the wrong theme.

4. **Complete host studio lifecycle**
   - Publish a studio at `/add-studio`, manage inventory at `/my-listings`, edit at `/studios/edit/[id]`, and delete with a custom accessible confirmation modal.
   - Images can be uploaded through ImgBB or added by direct URL.

5. **Booking engine and PDF invoices**
   - Studio pages show reserved slots for a selected date, calculate hourly rental plus the refundable security deposit, and prevent self-overlap in the UI.
   - `/my-bookings` supports cancelling `Pending` bookings and downloads a branded, itemised StudioSpace PDF invoice generated with jsPDF.

6. **Saved-studios wishlist**
   - The heart control on every studio card toggles the studio in MongoDB with `$addToSet` / `$pull`. Saved spaces appear at `/wishlist` and in the dashboard.

7. **Production dashboard and legal pages**
   - `/dashboard` aggregates booking stats, upcoming reservations, listing counts, saved studios, and quick actions.
   - `/terms` documents the marketplace rules for hosts and creators.

8. **Polished, responsive UX**
   - Responsive layouts on mobile/tablet/desktop, loading skeletons, purposeful empty states, Sonner toast notifications, custom modals, analytics-style cards, and a Swiper hero.
   - No Lorem ipsum and no native `alert()` or `confirm()` dialogs.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS, Space Grotesk + Plus Jakarta Sans |
| **HTTP client** | Axios (`withCredentials: true`) |
| **Theme** | `next-themes` |
| **Carousels** | Swiper.js |
| **Notifications / modals** | Sonner + custom accessible React modals |
| **PDF invoices** | jsPDF |
| **Backend** | Node.js, Express (ES modules), `cookie-parser`, `cors`, `jsonwebtoken` |
| **Database** | MongoDB Atlas + official `mongodb` driver |
| **Authentication** | BetterAuth 1.7 (`better-auth/adapters/mongodb`) + Google OAuth |
| **Deployment** | Vercel (client) and Render (API) |

---

## 🗺️ Pages

| Route | Purpose |
| :--- | :--- |
| `/` | Marketing home page, hero slider, categories, featured studios |
| `/studios` | Explore/filter studios by category, price, capacity, and search |
| `/studios/[id]` | Studio detail, gallery, amenities, availability, booking modal |
| `/studios/edit/[id]` | Protected edit form for a host's own listing |
| `/add-studio` | Protected create-listing form |
| `/my-listings` | Protected host inventory with edit/delete actions |
| `/my-bookings` | Protected reservation history, cancellation, PDF invoices |
| `/wishlist` | Protected saved-studios grid |
| `/dashboard` | Protected production summary, stats, and quick actions |
| `/login` | Email/password and Google sign-in |
| `/register` | Account registration with live password validation |
| `/terms` | Terms of service |
| `/not-found` | Custom 404 page |

---

## 🔌 API Overview

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/sign-up/email` | Public | BetterAuth email registration |
| `POST` | `/api/auth/sign-in/email` | Public | BetterAuth email sign-in |
| `GET` | `/api/auth/callback/google` | Public | BetterAuth Google OAuth callback |
| `POST` | `/api/auth/jwt` | BetterAuth session | Mint HTTPOnly API JWT cookie |
| `GET` | `/api/auth/me` | JWT cookie | Current user profile |
| `POST` | `/api/auth/logout` | JWT cookie | Revoke session, clear cookie |
| `GET` | `/api/studios` | Public | Filter/search studios |
| `GET` | `/api/studios/featured` | Public | Featured studios |
| `GET` | `/api/studios/:id` | Public | Studio detail |
| `POST` | `/api/studios` | JWT | Create listing |
| `PATCH` | `/api/studios/:id` | JWT | Update own listing |
| `DELETE` | `/api/studios/:id` | JWT | Delete own listing |
| `GET` | `/api/my-listings` | JWT | Listings owned by current user |
| `GET` | `/api/bookings/studio/:studioId` | Public | Reserved slots for a date |
| `POST` | `/api/bookings` | JWT | Create booking (`409` on overlap) |
| `GET` | `/api/my-bookings` | JWT | Current user's bookings |
| `GET` | `/api/bookings/stats` | JWT | Dashboard booking metrics |
| `PATCH` | `/api/bookings/:id/cancel` | JWT | Cancel own `Pending` booking |
| `GET` | `/api/wishlist` | JWT | Saved studios |
| `POST` | `/api/wishlist/toggle` | JWT | Add/remove a saved studio |

All protected endpoints return **401** when the HTTPOnly cookie is missing, expired, or invalid.

---

## 🚀 Local Setup

### Prerequisites

- **Node.js 20+** and **npm**
- A **MongoDB Atlas** connection string, or a local MongoDB server on `127.0.0.1:27017`

### 1. Backend (`server/`)

```bash
cd server
npm install
```

Create `server/.env` from `server/.env.example` and fill in the required values:

```env
PORT=5000
NODE_ENV=development

# MongoDB Atlas or local MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/studiospace

# Secrets — use long random values in production
JWT_SECRET=replace-with-a-long-random-jwt-secret
BETTER_AUTH_SECRET=replace-with-a-long-random-better-auth-secret
BETTER_AUTH_URL=http://localhost:5000

# Frontend origin allowed by CORS and OAuth redirects
CLIENT_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Seed the demo accounts, sample studios, and examiner bookings:

```bash
npm run seed
```

> The seed is **idempotent**. It creates the examiner/demo accounts through BetterAuth and inserts sample bookings only when they are missing. Do **not** run `npm run seed -- --force` against a database you care about: `--force` deletes all studios and bookings before reseeding.

Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

### 2. Frontend (`client/`)

```bash
cd client
npm install
```

Create `client/.env.local` from `client/.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
# Optional: enables client-side ImgBB uploads
NEXT_PUBLIC_IMGBB_API_KEY=your_imgbb_api_key
```

Start Next.js:

```bash
npm run dev
```

Open **http://localhost:3000** and sign in with `examiner@studiospace.com` / `Test123@`.

---

## ☁️ Deployment Notes

### Backend — Render

- **Root directory:** `server`
- **Build command:** `npm install`
- **Start command:** `npm start`
- **Environment variables:** `MONGODB_URI`, `JWT_SECRET`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=https://studiospace-t70a.onrender.com`, `CLIENT_URL=https://studiospace-lyart.vercel.app`, plus `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` if Google login is enabled.
- **Google OAuth redirect URI:** `https://studiospace-t70a.onrender.com/api/auth/callback/google`

### Frontend — Vercel

- **Root directory:** `client`
- **Build command:** `npm run build`
- **Environment variable:** `NEXT_PUBLIC_API_URL=https://studiospace-t70a.onrender.com`

Run `npm run seed` once against the production `MONGODB_URI` to create the examiner account and demo bookings. The seed never deletes existing studios or bookings unless `--force` is supplied.

---

## 📁 Project Structure

```text
Studiospace/
├── client/                 # Next.js 15 App Router application
│   └── src/
│       ├── app/            # Routes (home, studios, bookings, dashboard, terms…)
│       ├── components/     # Navbar, Footer, StudioCard, PrivateRoute, modals…
│       ├── lib/            # Axios API wrapper, auth client, invoice generator
│       ├── providers/      # AuthProvider + next-themes ThemeProvider
│       └── types/          # Shared TypeScript models
└── server/                 # Express API (ES modules)
    └── src/
        ├── config/         # MongoDB connection + BetterAuth configuration
        ├── middleware/     # JWT verification
        ├── routes/         # Auth, studios, bookings, wishlist
        └── seed/           # Idempotent demo accounts, studios, bookings
```

---

## 🧪 Quick Verification Checklist

1. `GET /api/auth/me` without a cookie → **401**.
2. Sign in with the examiner account → `token` cookie is **HttpOnly** and **Secure** in production.
3. Open `/dashboard` → stats and four demo bookings appear.
4. Book an already-reserved slot → API returns **409 Conflict** and the UI shows an error toast.
5. Toggle a studio heart → it persists after reload and appears at `/wishlist`.
6. Download an invoice from `/my-bookings` → branded PDF opens.
7. Toggle the theme → reload → the selected theme is still applied.

---

Built for creators and independent studio hosts.
