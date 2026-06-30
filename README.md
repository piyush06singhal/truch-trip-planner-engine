# Spotter: Full-Stack Truck Trip Planner & FMCSA ELD Compliance Engine

Spotter is an enterprise-grade SaaS dispatch routing and Hours of Service (HOS) auditing platform designed for property-carrying commercial truck drivers. It calculates compliance-safe cross-country routes, schedules mandatory sleep layovers and 30-minute meal breaks, and renders official, audit-ready daily ELD (Electronic Logging Device) log sheets.

---

## 📖 1. Project Overview & Motivation
Commercial drivers are strictly bound by the Federal Motor Carrier Safety Administration (FMCSA) **49 CFR Part 395 regulations** to limit driver fatigue. Violations of the 11-Hour Daily Driving limit, 14-Hour Shift limit, or the 30-Minute Rest Break mandate carry severe financial and operational penalties.

Spotter addresses this by automatically optimizing cross-country itineraries. By integrating a dynamic compliance-aware planning engine with responsive maps and interactive logging tools, Spotter ensures dispatchers and owner-operators remain compliant and safe.

---

## 🎨 2. Core Features
1. **Interactive Route Planner:** Glow-styled Leaflet map overlays rendering geocoded waypoint routes, fuel stops, and rest/sleep checkpoints.
2. **24-Hour ELD Chart Renderer:** Vector-drawn SVG grid charting driver duty states (Off Duty, Sleeper Berth, Driving, On Duty) with bidirectional hover sync between the chart and table.
3. **Hours of Service Auditor:** Real-time auditor highlighting violations (e.g. driving over 11h, shifts exceeding 14h, or missing rest breaks).
4. **History Dashboard:** Search, filter, sort, and paginate historical runs.
5. **Multi-Format Exports:** High-quality Letter-size PDF audit reports, JSON parameter dumps, and timeline CSV files.
6. **Atomic Templating:** One-click duplication to clone previous route templates.

---

## 🏗️ 3. Architecture & Tech Stack

```
             ┌────────────────────────┐
             │       React 19         │
             │   Vite + TypeScript    │
             └───────────┬────────────┘
                         │
             HTTPS JSON  │  API Requests
                         ▼
             ┌────────────────────────┐      OSM Geocoding
             │       Django 5.0       │ ──────────────────► [ Nominatim API ]
             │  REST Framework 3.15   │
             └───────────┬────────────┘ ◄──────────────────  OSRM Router
                         │                   Route Matrices
                         ▼
             ┌────────────────────────┐
             │   Supabase Postgres    │
             │     Database Tier      │
             └────────────────────────┘
```

### Tech Stack
* **Frontend SPA:** React 19, Vite, TypeScript, TailwindCSS (Vanilla overrides), Framer Motion, Sonner, React-Leaflet, jsPDF, html2canvas.
* **Backend API:** Django 5.0, Django REST Framework 3.15, Gunicorn, Whitenoise (Static asset compression).
* **Database & Hosting:** Supabase PostgreSQL database, Vercel (Frontend), Render (Backend).

---

## 📂 4. Folder Structure
```
spotterAI_assesment/
├── .github/workflows/
│   └── ci.yml                # CI/CD pipeline automation
├── backend/                  # Django backend service
│   ├── config/               # Settings, urls, wsgi/asgi
│   ├── trip_planner/         # Core application module
│   │   ├── models/           # Trip, Stop, ELDLogDay, ELDEvent
│   │   ├── views/            # Health, Trip, Stop, Log
│   │   ├── serializers/      # DRF DTO serializers
│   │   └── exceptions/       # Custom DRF exception handling handlers
│   └── requirements.txt      # Python dependencies
└── frontend/                 # React frontend application
    ├── src/
    │   ├── api/              # Axios clients & endpoint hooks
    │   ├── components/       # UI, Layout, Map Canvas, ELD elements
    │   ├── context/          # UI Context (state persistence)
    │   ├── pages/            # Dashboard, Planner, ELDLogs, History, Settings
    │   ├── utils/            # PDF and CSV exporter helpers
    │   └── types/            # TypeScript DTO definitions
    └── package.json          # Node dependencies
```

---

## 🗄️ 5. Database Schema & Design

### Entity Relationship Model
* **`Trip`**: Stores current location, pickup/dropoff coordinate sets, distance/duration aggregates, and cumulative cycle hours.
* **`Stop`**: Chronological routing waypoints (Stop Types: `ORIGIN`, `PICKUP`, `DROPOFF`, `REST_STOP`, `FUEL_STOP`, `SLEEP_STOP`). Linked to `Trip` via Foreign Key (`on_delete=models.CASCADE`).
* **`ELDLogDay`**: Log sheets grouped by date. Linked to `Trip` via Foreign Key (`on_delete=models.CASCADE`).
* **`ELDEvent`**: Specific status intervals (Off-Duty, Sleeper, Driving, On-Duty) with timestamp windows and remarks. Linked to `ELDLogDay` via Foreign Key (`on_delete=models.CASCADE`).

### Optimization Indexes
To support fast dashboard queries, the database utilizes B-Tree indexes:
* `trips` table: Index on `created_at` (sorting) and indexes on `current_location_name`, `pickup_location_name`, and `dropoff_location_name` (searching).
* `stops` table: Index on `(trip_id, arrival_time)` to speed up timeline reads.

---

## 🔌 6. API Documentation

### 1. Health Check
* **Method:** `GET`
* **URL:** `/api/health/`
* **Response (200 OK):** `{"status": "ok", "message": "Database and API services are online."}`

### 2. List Trips
* **Method:** `GET`
* **URL:** `/api/trips/`
* **Response (200 OK):** List of nested `Trip` objects containing stops, log days, and HOS events.

### 3. Generate Compliance Route
* **Method:** `POST`
* **URL:** `/api/trips/plan/`
* **Request Body:**
  ```json
  {
    "current_location": "Miami, FL",
    "pickup_location": "Atlanta, GA",
    "dropoff_location": "Dallas, TX",
    "cycle_hours_used": 10.0
  }
  ```
* **Response (201 Created):** Nested calculated route checkpoints, dynamic stops list, and 24-hour log structures.

### 4. Delete Trip
* **Method:** `DELETE`
* **URL:** `/api/trips/<uuid:id>/`
* **Response (204 No Content):** Deletes trip record and cascades deletions to all sub-stops, logs, and events.

### 5. Duplicate Trip Template
* **Method:** `POST`
* **URL:** `/api/trips/<uuid:id>/`
* **Response (201 Created):** Clones the original trip meta, stops lists, logs, and events inside a single transaction.

---

## ⚙️ 7. Environment Variables Guide

### Backend Environment Variables (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and update the database parameters:
```env
DEBUG=False
SECRET_KEY=production_secret_key_string
ALLOWED_HOSTS=localhost,127.0.0.1,.render.com
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://your-vercel-domain.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-render-domain.onrender.com,https://your-vercel-domain.vercel.app

# Database Supabase settings
DATABASE_URL=postgresql://postgres.[REF_ID]:[PASS]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
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
npm install --legacy-peer-deps
npm run dev
```
Open your browser to `http://localhost:5173`.

---

## 🔒 9. Security & Performance
* **SSL & Security Headers:** Enforced `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, and `CSRF_COOKIE_SECURE` in Django settings when `DEBUG = False`.
* **Whitenoise static caching:** Configured `CompressedManifestStaticFilesStorage` to automatically compile, hash, compress, and cache static admin styles.
* **Leaflet Optimization:** Dynamic Leaflet rendering only draws active routing vectors, keeping the browser DOM light.
* **Debounced Searches:** NOMINATIM geographical queries use a `400ms` debounce to prevent API rate-limiting blocks.

---

## 📄 10. License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
