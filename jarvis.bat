@echo off
setlocal
title JARVIS Copilot

cd /d "%~dp0"

:: 1. Verifica se Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js nao foi encontrado no PATH.
    echo Por favor, instale o Node.js v18+ em https://nodejs.org e tente novamente.
    pause
    exit /b 1
)

:: 2. Verifica se dependencias foram instaladas
if not exist "node_modules\" (
    echo [JARVIS] Primeira inicializacao detectada. Instalando dependencias...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Falha ao instalar dependencias.
        pause
        exit /b 1
    )
)

:: 3. Verifica se o build da Web UI existe
if not exist "packages\web\dist\" (
    echo [JARVIS] Compilando interface web...
    call npm run build:web
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Falha ao compilar interface web.
        pause
        exit /b 1
    )
)

echo =================================================
echo         [JARVIS] INICIANDO COPILOT               
echo =================================================
echo O daemon sera iniciado e o navegador abrira.
echo Para encerrar, basta fechar esta janela.
echo =================================================

call npm run start
pause
