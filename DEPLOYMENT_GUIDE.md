# Complete Deployment & Operations Guide
## Grand Azure Hotel & Suites ERP Management System

This guide explains how to deploy both the **Python FastAPI Backend** and **React Vite Frontend**, configure **MongoDB (Local or Atlas)**, and configure **Payment Gateways (Stripe, Razorpay, or Mock Sandbox)**.

---

## 1. Quick Start: Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- MongoDB (Running locally or a MongoDB Atlas connection string)

### Step 1: Run Backend
```bash
# In the project root directory
python -m pip install -r backend/requirements.txt

# Run seed data to populate staff accounts, rooms, dining menu, and bookings
python -m backend.seed_data

# Start FastAPI Uvicorn Server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Swagger Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Step 2: Run Frontend
```bash
cd frontend
npm install
npm run dev
```
- Open browser: [http://localhost:5173](http://localhost:5173)

---

## 2. Docker & Containerized Production Deployment

The project includes production-ready Dockerfiles and `docker-compose.yml` for 1-command deployment on any Linux/Mac/Windows server (AWS EC2, DigitalOcean, Hetzner, GCP, or Azure).

```bash
# Build and run MongoDB, FastAPI Backend, and Nginx Frontend
docker-compose up --build -d
```

### Verified Containers:
| Container | Port | Description |
|-----------|------|-------------|
| `hotel_erp_frontend` | `80` | Nginx serving compiled React SPA + reverse-proxying `/api/` |
| `hotel_erp_backend` | `8000` | FastAPI Uvicorn ASGI Server |
| `hotel_erp_mongo` | `27017` | Persistent MongoDB 7.0 database |

To stop:
```bash
docker-compose down
```

---

## 3. Cloud Deployment: Full PaaS Walkthrough

### A. Database: Free MongoDB Atlas Cluster
1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free shared cluster (**M0 Free Tier**).
3. Under **Database Access**, create a user with a secure password (e.g. `azure_admin`).
4. Under **Network Access**, add `0.0.0.0/0` (Allow access from anywhere).
5. Click **Connect** -> **Drivers** -> Copy the connection string:
   ```env
   MONGODB_URI=mongodb+srv://azure_admin:<password>@cluster0.mongodb.net/hotel_erp_db?retryWrites=true&w=majority
   ```

### B. Backend: Render or Railway
#### Deploying on Render (Free / Starter)
1. Push this repository to GitHub or GitLab.
2. In [render.com](https://render.com), click **New +** -> **Web Service**.
3. Select your repository.
4. Set:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port 10000`
5. Under **Environment Variables**, set:
   - `MONGODB_URI`: (Your MongoDB Atlas connection URI)
   - `DATABASE_NAME`: `hotel_erp_db`
   - `JWT_SECRET`: (Random 32-character string)
   - `PAYMENT_PROVIDER`: `mock` (or `stripe`)
   - `STRIPE_SECRET_KEY`: (Your Stripe Secret Key if using live Stripe)
   - `CORS_ORIGINS`: `*` (or your frontend domain)
6. Click **Deploy**. Note the assigned backend URL (e.g. `https://hotel-erp-backend.onrender.com`).

### C. Frontend: Vercel or Netlify
#### Deploying on Vercel
1. In [vercel.com](https://vercel.com), click **Add New** -> **Project**.
2. Select your repository and configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. In `frontend/vite.config.js` or via environment variable, configure the backend API proxy or set `API_BASE` to your deployed Render URL.
4. Deploy! Your hotel system is live with SSL, global CDN, and automatic CI/CD.

---

## 4. Payment Gateway Configuration

The system is engineered with a **multi-mode payment gateway**:

### Mode 1: Interactive Sandbox (Default)
- `PAYMENT_PROVIDER=mock`
- Ready out-of-the-box with zero API keys required.
- Provides a **"Fill Test Card"** button on the checkout modal.
- Generates valid transaction receipts and confirms reservations instantly.

### Mode 2: Stripe Gateway Integration
1. Obtain API keys from [dashboard.stripe.com](https://dashboard.stripe.com/test/apikeys).
2. Set in `.env`:
   ```env
   PAYMENT_PROVIDER=stripe
   STRIPE_SECRET_KEY=sk_test_51...
   STRIPE_PUBLISHABLE_KEY=pk_test_51...
   ```
3. The backend will automatically initialize official Stripe `PaymentIntent` sessions.

### Mode 3: Razorpay Integration
1. Set in `.env`:
   ```env
   PAYMENT_PROVIDER=razorpay
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   ```

---

## 5. Pre-Configured Staff Accounts

| Role | Department | Email | Password | Permissions |
|------|------------|-------|----------|-------------|
| **General Manager** | Executive | `admin@grandazure.com` | `Admin@123` | Full access, Financial KPIs, RevPAR, Staff |
| **Front Desk** | Reception | `reception@grandazure.com` | `Frontdesk@123` | Check-in, Check-out, Walk-in, Room Rack, Folios |
| **Housekeeping** | Facilities | `housekeeping@grandazure.com` | `Clean@123` | Visual PMS Matrix, Clean/Dirty room status toggle |
| **Executive Chef** | F&B | `dining@grandazure.com` | `Chef@123` | Live Kitchen Order Ticket (KOT) board, Room delivery |
