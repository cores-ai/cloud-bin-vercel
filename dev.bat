@echo off
title MOMO - Vercel App (Local Dev Server)
color 0E
cd /d "%~dp0"
cls
echo =====================================================================
echo           MOMO - VERCEL APP (LOCAL DEV SERVER)
echo =====================================================================
echo.
echo Starting Next.js at http://localhost:3000 ...
echo.
npm run dev
pause
