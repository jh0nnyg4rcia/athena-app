@echo off
title ATHENA - Mentoria Juridica (Producao)
echo ========================================================
echo   Iniciando ATHENA (Modo Producao Ultra-Rapido)
echo ========================================================
echo.
cd /d "%~dp0"
set NODE_ENV=production
echo Abrindo http://localhost:3000 no navegador...
start http://localhost:3000
echo.
echo Executando node dist/server.cjs...
node dist/server.cjs
pause
