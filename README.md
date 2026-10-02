# Grand Azure Hotel & Suites ERP Management System
> Production-grade Full-Stack Hospitality ERP & Property Management System (PMS) tailored for medium hotels (30 to 200 rooms).

![Luxury Hotel Banner](https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80)

---

## Key Highlights & Features

### 1. Visitor & Guest Experience
- **Luxury Showcase**: Immersive UI presenting ocean suites, resort amenities, dining options, and customer guarantees.
- **Dynamic Availability Engine**: Real-time room availability calculation factoring in dates, party size, and overlapping reservations.
- **Payment Gateway Integration**: Multi-mode payment gateway (Instant Sandbox Simulator with 1-Click test card fill + live Stripe / Razorpay support).
- **Guest Self-Service Portal (`/my-booking`)**:
  - Secure booking lookup via Reference Code (e.g. `GAH-78214`) and guest email.
  - In-Room Dining & Room Service ordering with 1-click **"Charge to Room Folio"**.
  - Live running folio tracker.
  - Printable official hotel tax invoice.

### 2. Hotel Staff & Operations ERP (Admin Portal)
- **Role-Based Access Control (RBAC)**:
  - `General Manager (Admin)`: Comprehensive KPIs, staff administration, rates.
  - `Front Desk (Receptionist)`: Arrivals, Departures, Walk-ins, 1-Click Check-In & Check-Out, Folio Settlement.
  - `Housekeeper`: Floor-by-floor visual room rack, quick clean/dirty status toggle.
  - `Executive Chef (POS)`: Kitchen Order Ticket (KOT) board with live cooking & delivery status tracking.
- **Executive Operations Dashboard**:
  - Live Occupancy Rate %, Today's Arrivals & Departures.
  - Hospitality performance indicators: **ADR (Average Daily Rate)** and **RevPAR (Revenue Per Available Room)**.
  - Today's Revenue and Monthly Revenue trackers.
- **Visual PMS Room Rack & Housekeeping Matrix**:
  - Floor-by-floor grid view (Floors 1–4) with color-coded status tags (`Vacant Clean`, `Vacant Dirty`, `Occupied`, `Reserved`, `Maintenance`).
- **Billing, Invoicing & Folio Management**:
  - Master guest folios itemizing room charges, dining, minibar, spa, and taxes.
  - Printable official tax invoices conforming to hospitality accounting standards.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend Framework** | Python 3.13 + FastAPI (Async ASGI, OpenAPI Swagger Docs at `/docs`) |
| **Database** | MongoDB 7.0 via `motor` async driver + in-memory fallback engine |
| **Data Validation** | Pydantic v2 + Pydantic Settings |
| **Authentication** | JWT (JSON Web Tokens) with PBKDF2/SHA256 password hashing |
| **Payment Gateway** | Stripe API + Razorpay + Interactive Test Sandbox |
| **Frontend Framework** | React 18 + Vite |
| **Styling & Icons** | Tailwind CSS (Luxury Gold & Navy theme) + Lucide React |
| **Containerization** | Docker, Multi-stage Dockerfiles, Docker Compose, Nginx |

---

## Quick Start (Local Development)

### 1. Start Backend
```bash
# Install dependencies
python -m pip install -r backend/requirements.txt

# Run initial database seeder (Creates 24 rooms, 4 staff accounts, dining menu, sample bookings)
python -m backend.seed_data

# Launch FastAPI server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
- Open browser: [http://localhost:5173](http://localhost:5173)

### 3. One-Click Startup (Windows)
Double-click `run_dev.bat` or run in PowerShell:
```powershell
./run_dev.ps1
```

---

## 1-Click Demo Staff Logins

| Profile | Email | Password | Role |
|---------|-------|----------|------|
| **General Manager** | `admin@grandazure.com` | `Admin@123` | Full Access & Analytics |
| **Front Desk Reception** | `reception@grandazure.com` | `Frontdesk@123` | Check-in, Check-out, Folio |
| **Housekeeping Supervisor**| `housekeeping@grandazure.com` | `Clean@123` | Room Clean/Dirty Grid |
| **Executive Chef** | `dining@grandazure.com` | `Chef@123` | Kitchen Order Display (KOT) |

---

## Production Docker Deployment

Deploy the entire full-stack system with a single command:
```bash
docker-compose up --build -d
```
- Frontend (Nginx SPA): `http://localhost:80`
- Backend (FastAPI): `http://localhost:8000`
- MongoDB: `localhost:27017`

See [DEPLOYMENT_GUIDE.md](file:///c:/Users/Hp/Documents/antigravity/optimistic-einstein/DEPLOYMENT_GUIDE.md) for full cloud PaaS instructions (Render, Railway, Vercel, MongoDB Atlas).
