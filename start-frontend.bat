@echo off
title AgriSense AI - Frontend & Auto-Backend
cd /d %~dp0frontend
echo ===================================================
echo   AgriSense AI - Frontend Dev Server
echo   (FastAPI Backend will auto-start if not running)
echo ===================================================
npm run dev
pause

