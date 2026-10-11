# 🇮🇳 Lok Samadhan - Enterprise Civic Redressal Backend
> **लोक समाधान: AI-Powered Multi-Lingual Citizen Grievance Redressal & Spatial Sentinel**

Backend engine designed for the **Lok Samadhan** Flutter citizen application. Built with **Node.js & Express**, **Gemma 4 through Google Gemini API**, **Supabase & PostgreSQL**, **OpenStreetMap (Nominatim API)**, and fully configured for **DigitalOcean** deployment.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Key Capabilities |
|---|---|---|
| **Runtime & Server** | Node.js (v20+ / v24) & Express.js | High concurrency, CORS, Helmet security, rate limiting |
| **AI Redressal Engine** | Gemma 4 via Google Gemini API (`@google/generative-ai`) | Multilingual NLP (Gujarati, Hindi, Bhojpuri, Maithili, English), department auto-routing, SLA prediction, multimodal photo inspection, official resolution drafting |
| **Database** | Supabase & PostgreSQL (`@supabase/supabase-js`, `pg`) | Dual-mode: Direct PostgreSQL pool or Supabase REST/PostgREST. Auto-fallback to seed memory store |
| **Maps & Spatial** | OpenStreetMap (Nominatim API & Leaflet) | Reverse geocoding (Lat/Lng to Village/Ward/Block/District), forward search, GeoJSON layers, hotspot cluster detection |
| **Deployment** | DigitalOcean | DigitalOcean App Platform (`.do/app.yaml`), Production Dockerfile, Docker Compose, PM2 Clustering (`ecosystem.config.js`), Droplet Bash Setup |

---

## ⚡ Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd "lok Samadhan_backend"
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
PORT=5000
NODE_ENV=development

# Google AI Studio API Key (Free from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash # or gemma-2-27b-it

# Supabase (Optional - Runs in seed memory mode if empty)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# PostgreSQL Connection String (Optional alternative to Supabase)
DATABASE_URL=postgresql://user:password@localhost:5432/lok_samadhan

# OpenStreetMap
OSM_NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
OSM_USER_AGENT=LokSamadhan-CivicApp/1.0 (contact@lok-samadhan.gov.in)
```

### 3. Start the Server
```bash
# Production start
npm start

# Development mode with hot-reloading
npm run dev
```

### 4. Open the Web Dashboard & Map Explorer
Navigate to **`http://localhost:5000`** in your browser to view:
- 🗺️ **Live OpenStreetMap Sentinel** with color-coded complaint markers & SLA badges
- 🤖 **Gemma AI Redressal Playground** with audio/text sample phrases in regional dialects
- 📋 **Triage Data Table** with search, filters, audit trail modal, and quick resolve/escalate actions
- 🩺 **Health Check**: `http://localhost:5000/api/health`

---

## 🧪 Automated Verification Test Suite

Run the comprehensive automated test suite (16 tests covering health, 8 departments, Gemma AI classification, OSM reverse geocoding, grievance lifecycle, and GeoJSON):
```bash
npm test
```

---

## 🗄️ Database Setup (Supabase & PostgreSQL)

### Option A: Supabase
1. Create a project at [supabase.com](https://supabase.com/).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste the contents of [`database/schema.sql`](database/schema.sql) and run it.
4. Paste the contents of [`database/seed.sql`](database/seed.sql) to populate initial departments and realistic complaints.
5. Copy your **Project URL** and **API Keys** into `.env`.

### Option B: Local / DigitalOcean Managed PostgreSQL
Run the seed script directly:
```bash
npm run seed
```

---

## 🚀 Deployment to DigitalOcean

### Method 1: DigitalOcean App Platform (Recommended - 1-Click)
1. Push this repository to GitHub or GitLab.
2. In DigitalOcean Console, go to **Apps** -> **Create App**.
3. Select your repository. DigitalOcean will automatically detect `.do/app.yaml`.
4. Add your `GEMINI_API_KEY` and database credentials as encrypted Environment Variables.
5. Click **Deploy**. DigitalOcean automatically provisions SSL, health check routing, and zero-downtime rolling deploys.

### Method 2: DigitalOcean Droplet (Ubuntu 22.04 / 24.04 LTS)
1. SSH into your Droplet:
   ```bash
   ssh root@your_droplet_ip
   ```
2. Clone repository & run the automated setup script:
   ```bash
   git clone <your-repo-url> lok-samadhan-backend
   cd lok-samadhan-backend
   chmod +x deploy/setup-droplet.sh
   sudo ./deploy/setup-droplet.sh
   ```
   *The script automatically installs Node 22, Nginx reverse proxy, firewall rules, and starts the PM2 cluster.*

### Method 3: Docker & Docker Compose
To run both backend and PostgreSQL containerized:
```bash
docker compose up -d --build
```

---

## 📡 REST API Reference

### 1. Grievance Management
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/grievances` | List grievances (filters: `status`, `departmentCategory`, `urgency`, `district`, `citizenPhone`, `search`) |
| `GET` | `/api/grievances/:id` | Get grievance details with audit log history |
| `POST` | `/api/grievances` | Submit a new grievance (auto-triggers AI routing & OSM geocoding) |
| `PATCH` | `/api/grievances/:id/status` | Update status (`underReview`, `inProgress`, `resolved`, `escalated`) |
| `POST` | `/api/grievances/:id/escalate` | Escalate overdue grievance to higher authority |
| `GET` | `/api/grievances/nearby` | Spatial query (`?lat=...&lng=...&radiusKm=5`) |
| `GET` | `/api/grievances/stats` | Analytics summary & resolution metrics |
| `GET` | `/api/grievances/geojson` | GeoJSON FeatureCollection for OpenStreetMap layers |

### 2. Gemma / Gemini AI Redressal
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/classify` | Takes speech transcript, outputs Department (1 of 8), Urgency, Dialect, and English/Hindi translation |
| `POST` | `/api/ai/chat` | Conversational complaint lodging chatbot |
| `POST` | `/api/ai/analyze-image` | Multimodal photo analysis (verifies hazard, wire sparks, potholes) |
| `POST` | `/api/ai/suggest-resolution` | Official response & engineering SOP suggestion for government officers |

### 3. OpenStreetMap
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/maps/reverse-geocode` | Coordinates (`lat`, `lng`) -> Village, Ward, Block, District, Postcode |
| `GET` | `/api/maps/search` | Search places on OpenStreetMap (`?q=Sanand`) |
| `GET` | `/api/maps/hotspots` | Spatial cluster algorithm to detect recurring issue hotspots |
| `GET` | `/api/maps/config` | Tile server settings & attribution for frontend maps |

### 4. Civic Departments
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/departments` | Returns all 8 civic departments with SLAs and trilingual titles |

---

## 📱 Connecting to the Flutter App (`Lok Samadhan`)

In your Flutter app (`c:\Users\victus\Downloads\Lok Samadhan\Lok Samadhan`), point your API service base URL to this backend:

```dart
// For local emulator:
const String kBackendBaseUrl = 'http://10.0.2.2:5000/api';

// For Flutter Web / Local Device:
const String kBackendBaseUrl = 'http://localhost:5000/api';

// For DigitalOcean Production:
const String kBackendBaseUrl = 'https://your-app-domain.ondigitalocean.app/api';
```

---

## 🏛️ The 8 Official Civic Departments
1. **Drinking Water & Sanitation (PHED)** (`PHED-WTR` - 48h SLA)
2. **Electricity Distribution (DISCOM)** (`DISCOM-ELEC` - 24h SLA)
3. **Public Works & Roads (PWD)** (`PWD-ROAD` - 72h SLA)
4. **Public Health & Local Sanitation** (`HLTH-SANI` - 24h SLA)
5. **Food & Civil Supplies (PDS Ration)** (`FCS-RATION` - 48h SLA)
6. **Social Welfare & Pensions** (`SWD-WELFARE` - 96h SLA)
7. **Local Police & Public Safety** (`POL-SAFETY` - 12h SLA)
8. **Panchayati Raj & Rural Development** (`PRD-PANCHAYAT` - 72h SLA)

---

## 📄 License
MIT © 2026 Lok Samadhan Civic Redressal Initiative.
