@echo off
title SIH26154 FastAPI Backend
echo ========================================================
echo Starting SIH26154 FastAPI Backend on http://127.0.0.1:8000
echo Swagger UI docs available at: http://127.0.0.1:8000/docs
echo Press Ctrl+C to stop the server.
echo ========================================================
cd /d "%~dp0backend"
if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
) else (
    python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
)
pause
