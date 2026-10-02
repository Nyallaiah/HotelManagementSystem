Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Starting Grand Azure Hotel & Suites ERP Development Servers" -ForegroundColor Gold
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host "1. Verifying & Seeding Database..." -ForegroundColor Yellow
python -m backend.seed_data

Write-Host "2. Launching FastAPI Backend on http://localhost:8000" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload"

Write-Host "3. Launching React Vite Frontend on http://localhost:5173" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nAll servers initiated!" -ForegroundColor Cyan
Write-Host "Guest Portal & Operations ERP: http://localhost:5173" -ForegroundColor White
Write-Host "Interactive Swagger API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
