@echo off
echo 🚀 Starting TaskGuru Project...

:: Start backend (FastAPI)
cd taskguru-backend
start cmd /k "uvicorn main:app --reload --port 8003"

:: Start frontend (Vite React)
cd ..
cd taskguru-frontend
start cmd /k "npm run dev"

echo ✅ Both frontend & backend are running!
pause
