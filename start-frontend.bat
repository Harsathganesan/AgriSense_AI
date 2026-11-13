@echo off
title AgriSense AI - Frontend Dev Server
cd /d %~dp0frontend
echo Starting AgriSense Vite Frontend on http://localhost:5173 ...
npm run dev
pause
