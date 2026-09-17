@echo off
title ATHENA - Mentoria Juridica
echo ========================================================
echo   Iniciando ATHENA - Mentoria Juridica (Modo Otimizado)
echo ========================================================
echo.
cd /d "%~dp0"
echo Abrindo http://localhost:3000 no navegador...
start http://localhost:3000
echo.
echo Iniciando servidor Node.js + Vite...
npm.cmd run dev
pause
