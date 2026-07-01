# Spotter: Full-Stack Truck Trip Planner & FMCSA ELD Compliance Engine

Spotter is an enterprise-grade SaaS dispatch routing and Hours of Service (HOS) auditing platform designed for property-carrying commercial truck drivers. It calculates compliance-safe cross-country routes, schedules mandatory sleep layovers and 30-minute meal breaks, and renders official, audit-ready daily ELD (Electronic Logging Device) log sheets.

---

## 📖 1. Project Overview & Motivation
Commercial drivers are strictly bound by the Federal Motor Carrier Safety Administration (FMCSA) **49 CFR Part 395 regulations** to limit driver fatigue. Violations of the 11-Hour Daily Driving limit, 14-Hour Shift limit, or the 30-Minute Rest Break mandate carry severe financial and operational penalties.

Spotter addresses this by automatically optimizing cross-country itineraries. By integrating a dynamic compliance-aware planning engine with responsive maps, user security gateways, and interactive logging tools, Spotter ensures dispatchers and owner-operators remain compliant and safe.

---

## 🎨 2. Core Features
1. **Interactive Route Planner:** Leaflet map overlays rendering geocoded waypoint routes, fuel stops, and rest/sleep checkpoints.
2. **Full-Screen Authentication Wall:** Secure login and driver account registration gates guarding all application pages.
3. **Password Recovery Workflow:** Fully integrated SMTP/HTTPS mail recovery dispatch system with dynamic user confirmation token validation.
4. **24-Hour ELD Chart Renderer:** Vector-drawn SVG grid charting driver duty states (Off Duty, Sleeper Berth, Driving, On Duty) with bidirectional hover sync between the chart and table.
5. **Hours of Service Auditor:** Real-time auditor highlighting violations (e.g. driving over 11h, shifts exceeding 14h, or missing rest breaks).
6. **High-Availability Geocoding Engine:** Multi-tier geocoding handler mapping LocationIQ (private API key), a static offline demo city database, Nominatim (public API), and Photon (HTTP backup) to guarantee uninterrupted lookups.
7. **History Dashboard:** Search, filter, sort, and paginate historical runs scoped to the authenticated driver.
8. **Multi-Format Exports:** High-quality Letter-size PDF audit reports, JSON parameter dumps, and timeline CSV files.
9. **Atomic Templating:** One-click duplication to clone previous route templates.

---

## 🏗️ 3. Architecture & Tech Stack

```
             ┌────────────────────────┐
             │       React 19         │
             │   Vite + TypeScript    │
             └───────────┬────────────┘
                         │
             HTTPS JSON  │  API Requests (Bearer JWT Auth)
                         ▼
             ┌────────────────────────┐      Geocoding API Key
             │       Django 5.0       │ ──────────────────► [ LocationIQ / Nominatim ]
             │  REST Framework 3.15   │
             └───────────┬────────────┘ ◄──────────────────  OSRM Router
                         │                   Route Matrices
                         ▼
             ┌────────────────────────┐
             │   Supabase Postgres    │
             │     Database Tier      │
             └───────────┬────────────┘
```

### Tech Stack
* **Frontend SPA:** React 19, Vite, TypeScript, TailwindCSS (Vanilla overrides), Framer Motion, Lucide icons, Sonner, React-Leaflet, jsPDF, html2canvas.
* **Backend API:** Django 5.0, Django REST Framework 3.15, Gunicorn, Whitenoise (Static asset compression).
* **Email Dispatch:** Resend Developer HTTPS API & standard SMTP mail connections.
* **Database & Hosting:** Supabase PostgreSQL database, Vercel (Frontend with SPA rewrite routing support), Render (Backend).

---

## 📂 4. Folder Structure
```
spotterAI_assesment/
├── .github/workflows/
│   └── ci.yml                # CI/CD pipeline automation
├── backend/                  # Django backend service
│   ├── config/               # Settings, urls, wsgi/asgi
│   ├── trip_planner/         # Core application module
│   │   ├── models/           # User, Trip, Stop, ELDLogDay, ELDEvent
│   │   ├── views/            # Health, Auth, Trip, Stop, Log
│   │   ├── serializers/      # DRF DTO serializers
│   │   └── exceptions/       # Custom DRF exception handling handlers
│   └── requirements.txt      # Python dependencies
└── frontend/                 # React frontend application
    ├── vercel.json           # Client-side SPA routing fallback rules
    └── src/
        ├── api/              # Axios clients, endpoint hooks, and auth APIs
        ├── components/       # UI, Layout, Map Canvas, ELD elements
        ├── context/          # UI Context (state persistence, auth session)
        ├── pages/            # AuthPage, ResetPassword, Dashboard, Planner, ELDLogs, History, Settings
        ├── utils/            # PDF and CSV exporter helpers
        └── types/            # TypeScript DTO definitions
```

---

## 🗄️ 5. Database Schema & Design

### Entity Relationship Model
* **`User`**: Custom user profile model managing username, email, and security tokens.
* **`Trip`**: Stores current location, pickup/dropoff coordinate sets, distance/duration aggregates, and cumulative cycle hours. Foreign Key linked to `User`.
* **`Stop`**: Chronological routing waypoints (Stop Types: `ORIGIN`, `PICKUP`, `DROPOFF`, `REST_STOP`, `FUEL_STOP`, `SLEEP_STOP`). Linked to `Trip` via Foreign Key (`on_delete=models.CASCADE`).
* **`ELDLogDay`**: Log sheets grouped by date. Linked to `Trip` via Foreign Key (`on_delete=models.CASCADE`).
* **`ELDEvent`**: Specific status intervals (Off-Duty, Sleeper, Driving, On-Duty) with timestamp windows and remarks. Linked to `ELDLogDay` via Foreign Key (`on_delete=models.CASCADE`).

### Optimization Indexes
To support fast dashboard queries, the database utilizes B-Tree indexes:
* `trips` table: Index on `created_at` (sorting) and indexes on `current_location_name`, `pickup_location_name`, and `dropoff_location_name` (searching).
* `stops` table: Index on `(trip_id, arrival_time)` to speed up timeline reads.

---

## 🔌 6. API Documentation

### 1. Authentication
* **Sign In:** `POST /api/auth/login/` (Payload: `username`, `password`)
* **Register:** `POST /api/auth/register/` (Payload: `username`, `email`, `password`)
* **Request Reset Email:** `POST /api/auth/password-reset/` (Payload: `email`)
* **Confirm Reset Password:** `POST /api/auth/password-reset/confirm/` (Payload: `uid`, `token`, `new_password`)

### 2. Health Check
* **Method:** `GET`
* **URL:** `/api/health/`
* **Response (200 OK):** `{"status": "ok", "message": "Database and API services are online."}`

### 3. List Trips (Scoped to Auth User)
* **Method:** `GET`
* **URL:** `/api/trips/`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`

### 4. Generate Compliance Route
* **Method:** `POST`
* **URL:** `/api/trips/plan/`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Request Body:**
  ```json
  {
    "current_location": "Miami, FL",
    "pickup_location": "Atlanta, GA",
    "dropoff_location": "Dallas, TX",
    "cycle_hours_used": 10.0
  }
  ```

---

## ⚙️ 7. Environment Variables Guide

### Backend Environment Variables (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and update the parameters:
```env
DEBUG=False
SECRET_KEY=production_secret_key_string
ALLOWED_HOSTS=localhost,127.0.0.1,.render.com
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://your-vercel-domain.vercel.app

# Database Supabase settings
DATABASE_URL=postgresql://postgres.[REF_ID]:[PASS]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require

# SMTP/Email configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
DEFAULT_FROM_EMAIL=your_email@gmail.com

# Resend HTTPS API Key (Required for Render Free Tier SMTP bypass)
RESEND_API_KEY=re_123456789...

# LocationIQ API Key (Bypasses public Nominatim IP blocks)
LOCATIONIQ_API_KEY=pk.123456789...
```

### Frontend Environment Variables (`frontend/.env.local`)
Copy `frontend/.env.example` to `frontend/.env.local`:
```env
VITE_API_URL=https://your-render-domain.onrender.com
```

---

## 🚀 8. Local Setup & Installation

### Using Docker (Recommended)
Build and spin up the complete full-stack environment:
```bash
docker-compose up --build
```

### Manual Development Setup

#### 1. Django Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### 2. React Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open your browser to `http://localhost:5173`.

---

## 🔒 9. Security & Performance
* **SSL & Security Headers:** Enforced `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, and `CSRF_COOKIE_SECURE` in Django settings when `DEBUG = False`.
* **Vercel SPA Rewrites:** Deployed `vercel.json` routing configuration to direct all deep subpaths to `index.html`, eliminating 404 router errors.
* **Geocoding Fail-Fast:** Set Nominatim retry parameters to `1` with a fail-fast catch. This guarantees a rapid (<1s) switch to key-authenticated LocationIQ or Photon fallback APIs.
* **Debounced Searches:** geographical queries use debounce configurations to prevent API rate-limiting blocks.

---

## 📄 10. License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
