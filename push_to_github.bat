@echo off
title MOMO - Push Vercel App to GitHub
color 0E
cd /d "%~dp0"
cls
echo =====================================================================
echo         MOMO - PUSHING VERCEL APP TO GITHUB REPOSITORY
echo =====================================================================
echo Repo: https://github.com/cores-ai/cloud-bin-vercel
echo Branch: main
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [✓] SUCCESS: Vercel App successfully pushed to GitHub!
) else (
    echo [!] Notice: If GitHub requested authorization, complete the login.
)
echo.
pause
