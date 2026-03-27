@echo off
title De Olho No Jogo
echo.
echo  ====================================
echo   De Olho No Jogo - Iniciando...
echo  ====================================
echo.

set RAIZ=%~dp0

:: Backend
echo [1/2] Iniciando backend (FastAPI)...
start "Backend - De Olho No Jogo" cmd /k "cd /d %RAIZ%backend && call %RAIZ%venv\Scripts\activate.bat && uvicorn app.main:app --reload"

:: Aguarda backend subir
timeout /t 3 /nobreak > nul

:: Frontend
echo [2/2] Iniciando frontend (React)...
start "Frontend - De Olho No Jogo" cmd /k "cd /d %RAIZ%frontend && npm run dev"

:: Aguarda frontend subir
timeout /t 4 /nobreak > nul

:: Abre no browser
echo.
echo  Abrindo no browser...
start http://localhost:5173

echo.
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo  Docs API: http://localhost:8000/docs
echo.
echo  Feche as duas janelas abertas para encerrar.
