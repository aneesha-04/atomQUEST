@echo off
echo ========================================================
echo Launching AquaSense End-to-End Suite for atomQUEST 2026
echo ========================================================
start "AquaSense Backend (FastAPI)" cmd /c "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
timeout /t 2 /nobreak >nul
start "AquaSense Frontend (Vite)" cmd /c "cd frontend && npm run dev"
echo Backend running at http://127.0.0.1:8000/docs
echo Frontend running at http://localhost:5173
pause

