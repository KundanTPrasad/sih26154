@echo off
title SIH26154 Launcher
echo ========================================================
echo Starting SIH26154 Full Stack Application
echo Backend:  http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)
echo Frontend: http://localhost:5173
echo ========================================================
echo.
start "SIH26154 Backend" cmd /k "call "%~dp0start_backend.bat""
start "SIH26154 Frontend" cmd /k "call "%~dp0start_frontend.bat""
echo Both Backend and Frontend have been launched in dedicated terminal windows!
