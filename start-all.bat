@echo off
echo ========================================================
echo  Starting AI Interview & Candidate Assessment Platform
echo ========================================================
echo.

echo Starting Backend Service (Port 5000)...
start "AI Interview Backend" cmd /k "cd /d %~dp0backend && npm run dev"

echo Starting Frontend Web App (Port 5173)...
start "AI Interview Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Starting Python AI Assessment Engine (Port 8000)...
start "AI Python Engine" cmd /k "cd /d %~dp0ai-service && uvicorn app.main:app --reload --port 8000"

echo.
echo All services launched in separate windows!
echo - Frontend Portal:   http://localhost:5173
echo - Backend API:       http://localhost:5000
echo - AI Microservice:   http://localhost:8000/docs
echo ========================================================
pause
