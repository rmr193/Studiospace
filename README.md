# StudioSpace — Peer-to-Peer Creative Workspace & Production Studio Platform

**StudioSpace** is a full-stack creative production marketplace where studio hosts list specialized production environments—**3-Wall Photography Cyclorama Lofts, NC-20 Cinema Sound Stages, 4K Broadcast Podcast Lounges, SSL Analog Music Recording Suites, and Industrial Art & Scenic Fabrication Workshops**—and creators discover, filter, inspect real-time slot availability, and book studio hours with automated double-booking prevention.

---

## 🌐 Live Deployment URLs

- **Live Frontend (Vercel):** [https://studiospace-lyart.vercel.app/](https://studiospace-lyart.vercel.app/)
- **Client-Side Repository:** [https://github.com/rmr193/Studiospace/tree/main/client](https://github.com/rmr193/Studiospace/tree/main/client)
- **Server-Side Repository:** [https://github.com/rmr193/Studiospace/tree/main/server](https://github.com/rmr193/Studiospace/tree/main/server)

---

## 🔑 Examiner Test Credentials

 Email verification barriers are disabled so examiners can sign in and test all host and creator flows immediately. You can also click the **"Auto-Fill"** button directly on the `/login` page.

| Role | Email | Password | Pre-Seeded Data |
| :--- | :--- | :--- | :--- |
| **Primary Examiner / Studio Host** | `examiner@studiospace.io` | `StudioPassword123` | 5 Studio Listings, 3 Bookings (`Confirmed`, `Pending`, `Completed`), 2 Saved Wishlist Studios |
| **Secondary Host / Creator** | `marcus@studiospace.io` | `CreatorPassword123` | 3 Studio Listings (SSL Suite, Atmos Stage, Foundry Lab) |

---

## ✨ Key Platform Features

1. **BetterAuth + HTTPOnly JWT Cookie Security (Challenge 1):**
   - Combines **BetterAuth** (`mongodbAdapter` with Email/Password & Google OAuth) and custom **HTTPOnly JWT cookies** (`POST /api/auth/jwt`, `POST /api/auth/logout`, `verifyToken` middleware) to protect all private studio CRUD, booking, and wishlist endpoints.
2. **Real-Time Double-Booking Overlap Prevention (Challenge 2):**
   - Prevents slot collisions before inserting reservations by querying MongoDB with range overlap operators (`{ studioId, bookingDate, status: "Confirmed", startTime: { $lt: newEndTime }, endTime: { $gt: newStartTime } }`) and returning `409 Conflict` when hours overlap.
3. **Persistent Light & Dark Cinema Theme System (Challenge 3):**
   - Full dark/light mode support across every section, form, table, and custom accessible modal, persisted in `localStorage`.
4. **Full Host Studio Lifecycle (CRUD + ImgBB Upload):**
   - Authenticated hosts can publish new studios (`/add-studio`) with client-side **ImgBB** upload (plus direct URL fallback), manage their inventory (`/my-listings`), update specifications (`/studios/edit/[id]`), and delete listings via custom accessible confirmation modals.
5. **Interactive Booking Engine & Branded PDF Invoice Generator:**
   - Creators can inspect live reserved slots on any date, calculate hourly rental + refundable gear deposit in real time, cancel `"Pending"` bookings, and download a branded **StudioSpace Production Invoice (PDF)** powered by `jsPDF`.
6. **Saved Location Scout Wishlist (`$addToSet` / `$pull`):**
   - One-click heart toggling on any studio card persists directly to the user's MongoDB document and syncs with the dedicated `/wishlist` route.

---

## 🛠️ Full Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 15 (App Router), React 19, TypeScript | SSR/CSR routing, dynamic studio pages, private route guards |
| **Styling & UI** | Tailwind CSS, Space Grotesk & Plus Jakarta Sans | Responsive dark/light cinema design system, equal-height cards |
| **Sliders & Carousels** | Swiper.js (`swiper`) | Interactive Hero Slider & Studio Details image galleries |
| **Notifications & Modals** | Sonner (`sonner`) + Custom Accessible React Modals | Zero native browser alerts (`window.alert` / `window.confirm` free) |
| **Icons** | Lucide React + Official X SVG Logo | Production icons & modern social branding |
| **PDF Generation** | jsPDF (`jspdf`) | Client-side itemized StudioSpace booking receipt downloads |
| **Backend Runtime** | Node.js, Express.js | RESTful API server, CORS (`credentials: true`), cookie parsing |
| **Database** | MongoDB Official Native Driver (`mongodb`) | Collections (`users`, `studios`, `bookings`) + automatic local fallback |
| **Authentication** | BetterAuth + `jsonwebtoken` (`httpOnly` cookies) | Session management & stateless API route protection |

---

## 🚀 Step-by-Step Local Setup Instructions

### Prerequisites
- **Node.js** `v18+` (tested on `v24`) and **npm**
- **MongoDB** (Local `mongod` on `127.0.0.1:27017` or a **MongoDB Atlas** connection string). *Note: If no local MongoDB server is running, the backend automatically activates its persistent local MongoDB engine (`server/data/studiospace-db.json`) and seeds all 8 studios and examiner accounts out of the box.*

### 1. Clone & Configure Backend (`server/`)

```bash
cd server
npm install
```

Create or verify `server/.env` (a pre-configured `.env` and `.env.example` are included):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/studiospace
JWT_SECRET=studiospace_jwt_secret_replace_in_production_2026
BETTER_AUTH_SECRET=studiospace_better_auth_secret_replace_in_production_2026
BETTER_AUTH_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
```

Seed the database with the 8 creative studios, sample bookings, and examiner credentials:

```bash
npm run seed
```

Start the Express API server on `http://localhost:5000`:

```bash
npm run dev
```

---

### 2. Configure & Run Frontend (`client/`)

Open a new terminal window:

```bash
cd client
npm install
```

Create or verify `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_IMGBB_API_KEY=your_optional_imgbb_api_key
```

Start the Next.js development server on `http://localhost:3000`:

```bash
npm run dev
```

Open **`http://localhost:3000`** in your browser to explore StudioSpace!

