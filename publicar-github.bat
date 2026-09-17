@echo off
title ATHENA - Publicar no GitHub
echo ========================================================
echo   ATHENA - Publicacao no GitHub (jh0nnyg4rcia/athena-app)
echo ========================================================
echo.

set PATH=C:\Users\jhonn\antigravity\mingit\cmd;C:\Users\jhonn\antigravity\gh\bin;%PATH%
cd /d "C:\Users\jhonn\antigravity\athena"

echo [1/3] Verificando conexao com sua conta GitHub...
gh auth status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Autenticacao Rapida no GitHub]
    echo Uma janela do navegador sera aberta para autorizar o envio.
    echo.
    gh auth login --hostname github.com --git-protocol https --web
)

echo.
echo [2/3] Configurando credenciais de envio...
gh auth setup-git

echo.
echo [3/3] Enviando arquivos para https://github.com/jh0nnyg4rcia/athena-app.git...
git remote remove origin 2>nul
git remote add origin https://github.com/jh0nnyg4rcia/athena-app.git
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   [SUCESSO ABSOLUTO!]
    echo   O projeto ATHENA foi publicado no seu GitHub!
    echo.
    echo   Abrindo a aba Actions para acompanhar a geracao do APK:
    echo   https://github.com/jh0nnyg4rcia/athena-app/actions
    echo ========================================================
    start https://github.com/jh0nnyg4rcia/athena-app/actions
) else (
    echo [Aviso] Verifique se a autorizacao foi concluida no navegador.
)
echo.
pause
