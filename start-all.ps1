Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting AI Interview & Candidate Assessment Platform" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "Launching Backend Service (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev"

Write-Host "Launching Frontend Portal (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

Write-Host "Launching Python AI Engine (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\ai-service'; uvicorn app.main:app --reload --port 8000"

Write-Host "`nAll platform services launched in separate windows!" -ForegroundColor Green
Write-Host "Frontend Portal:   http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend API:       http://localhost:5000" -ForegroundColor Cyan
Write-Host "AI Microservice:   http://localhost:8000/docs" -ForegroundColor Cyan
