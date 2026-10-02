@echo off
echo ============================================================
echo Starting Grand Azure Hotel & Suites ERP Development Servers
echo ============================================================

echo 1. Seeding and verifying database...
python -m backend.seed_data

echo 2. Launching FastAPI Backend on http://localhost:8000
start "Hotel ERP Backend" cmd /k "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

echo 3. Launching React Vite Frontend on http://localhost:5173
start "Hotel ERP Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers started!
echo - Guest & Operations Portal: http://localhost:5173
echo - Backend API Docs: http://localhost:8000/docs
echo ============================================================
pause
