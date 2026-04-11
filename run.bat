@echo off
setlocal enabledelayedexpansion
title ImmobilierSocial - Lanceur

:: ─── Couleurs ANSI (Windows 10+) ─────────────────────────────────────────────
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "CYAN=[96m"
set "BOLD=[1m"
set "RESET=[0m"

:: ─── Chemins ──────────────────────────────────────────────────────────────────
set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%frontend"

:: ─── URL de santé (retourne 2xx/4xx quand Spring est prêt) ───────────────────
set "HEALTH_URL=http://localhost:8080/api/auth/login"

:: ─── Fichiers PID temporaires ─────────────────────────────────────────────────
set "B_PID=%TEMP%\immosocial_backend.pid"
set "F_PID=%TEMP%\immosocial_frontend.pid"

:: ─── Logs ─────────────────────────────────────────────────────────────────────
set "B_LOG=%ROOT%backend.log"
set "F_LOG=%ROOT%frontend.log"

:: ─────────────────────────────────────────────────────────────────────────────
::  DÉMARRAGE AUTOMATIQUE
:: ─────────────────────────────────────────────────────────────────────────────
cls
echo %CYAN%%BOLD%
echo  ╔═══════════════════════════════════════════════╗
echo  ║       ImmobilierSocial  —  Lanceur            ║
echo  ║   Backend : http://localhost:8080             ║
echo  ║   Frontend: http://localhost:5173             ║
echo  ╚═══════════════════════════════════════════════╝
echo %RESET%

call :fn_start_backend
call :fn_start_frontend

echo.
echo %GREEN%%BOLD% ✓ Application prête !%RESET%
echo %GREEN%   Backend  → http://localhost:8080%RESET%
echo %GREEN%   Frontend → http://localhost:5173%RESET%
echo.

:: ─────────────────────────────────────────────────────────────────────────────
::  BOUCLE INTERACTIVE
:: ─────────────────────────────────────────────────────────────────────────────
:menu
echo %CYAN%──────────────────────────────────────────────────%RESET%
echo  %YELLOW%b%RESET%   Redémarrer le  Backend
echo  %YELLOW%f%RESET%   Redémarrer le  Frontend
echo  %YELLOW%r%RESET%   Redémarrer les DEUX
echo  %YELLOW%sb%RESET%  Arrêter le     Backend
echo  %YELLOW%sf%RESET%  Arrêter le     Frontend
echo  %YELLOW%lb%RESET%  Voir le log    Backend  (50 dernières lignes)
echo  %YELLOW%lf%RESET%  Voir le log    Frontend (50 dernières lignes)
echo  %YELLOW%q%RESET%   Quitter (arrête tout)
echo %CYAN%──────────────────────────────────────────────────%RESET%
set /p "CMD=  > "

if /i "!CMD!"=="b"  goto :do_restart_backend
if /i "!CMD!"=="f"  goto :do_restart_frontend
if /i "!CMD!"=="r"  goto :do_restart_all
if /i "!CMD!"=="sb" goto :do_stop_backend
if /i "!CMD!"=="sf" goto :do_stop_frontend
if /i "!CMD!"=="lb" goto :do_log_backend
if /i "!CMD!"=="lf" goto :do_log_frontend
if /i "!CMD!"=="q"  goto :do_quit

echo %RED% Commande inconnue : "!CMD!" — tapez b, f, r, sb, sf, lb, lf ou q%RESET%
goto :menu

:do_restart_backend
  call :fn_stop_backend
  call :fn_start_backend
  goto :menu

:do_restart_frontend
  call :fn_stop_frontend
  call :fn_start_frontend
  goto :menu

:do_restart_all
  call :fn_stop_backend
  call :fn_stop_frontend
  call :fn_start_backend
  call :fn_start_frontend
  goto :menu

:do_stop_backend
  call :fn_stop_backend
  goto :menu

:do_stop_frontend
  call :fn_stop_frontend
  goto :menu

:do_log_backend
  echo.
  echo %CYAN%═══ backend.log (50 dernières lignes) ══════════════%RESET%
  if exist "%B_LOG%" ( powershell -command "Get-Content '%B_LOG%' -Tail 50" ) else ( echo %RED% Fichier introuvable%RESET% )
  echo %CYAN%═══════════════════════════════════════════════════%RESET%
  echo.
  goto :menu

:do_log_frontend
  echo.
  echo %CYAN%═══ frontend.log (50 dernières lignes) ═════════════%RESET%
  if exist "%F_LOG%" ( powershell -command "Get-Content '%F_LOG%' -Tail 50" ) else ( echo %RED% Fichier introuvable%RESET% )
  echo %CYAN%═══════════════════════════════════════════════════%RESET%
  echo.
  goto :menu

:do_quit
  call :fn_stop_backend
  call :fn_stop_frontend
  echo %GREEN% Au revoir !%RESET%
  exit /b 0


:: ═════════════════════════════════════════════════════════════════════════════
::  FONCTIONS
:: ═════════════════════════════════════════════════════════════════════════════

:: ─── Démarrer le Backend ─────────────────────────────────────────────────────
:fn_start_backend
  echo %CYAN%[BACKEND] Démarrage...%RESET%

  :: Tuer l'ancien processus si PID connu
  call :fn_kill_pid "%B_PID%"

  :: Lancer mvnw dans une fenêtre séparée (minimisée)
  cd /d "%BACKEND_DIR%"
  start /min "ImmobilierSocial-Backend" cmd /c "mvnw.cmd spring-boot:run > "%B_LOG%" 2>&1"
  cd /d "%ROOT%"

  :: Attendre que Spring Boot réponde (poll HTTP, max 120 s)
  echo %YELLOW%[BACKEND] Attente du démarrage de Spring Boot (max 120 s)...%RESET%
  set "RETRY=0"

:_backend_poll
  if !RETRY! GEQ 60 (
    echo %RED%[BACKEND] ✗ Timeout ! Consultez backend.log pour diagnostiquer.%RESET%
    goto :eof
  )
  :: Attendre 2 s entre chaque tentative
  timeout /t 2 /nobreak >nul

  :: curl silencieux — on teste juste que le port répond (2xx ou 4xx = Spring est prêt)
  for /f %%H in ('curl -s -o NUL -w "%%{http_code}" "%HEALTH_URL%" 2^>nul') do set "HTTP_CODE=%%H"
  if "!HTTP_CODE!"=="" ( set "HTTP_CODE=000" )

  :: Accepter tout code >= 200 (Spring répond = serveur démarré)
  if !HTTP_CODE! GEQ 200 (
    echo %GREEN%[BACKEND] ✓ Prêt  (HTTP !HTTP_CODE!)  →  http://localhost:8080%RESET%

    :: Stocker le PID java le plus récent
    for /f "tokens=2" %%P in ('tasklist /fi "imagename eq java.exe" /fo list 2^>nul ^| findstr /i "PID"') do (
      echo %%P> "%B_PID%"
    )
    goto :eof
  )

  set /a "RETRY+=1"
  set /a "ELAPSED=RETRY*2"
  echo %YELLOW%[BACKEND]   ... !ELAPSED! s (HTTP !HTTP_CODE!)%RESET%
  goto :_backend_poll


:: ─── Démarrer le Frontend ────────────────────────────────────────────────────
:fn_start_frontend
  echo %CYAN%[FRONTEND] Démarrage...%RESET%

  call :fn_kill_pid "%F_PID%"

  cd /d "%FRONTEND_DIR%"

  :: Installer les dépendances si node_modules absent
  if not exist "node_modules" (
    echo %YELLOW%[FRONTEND] Installation des dépendances npm...%RESET%
    call npm install
  )

  start /min "ImmobilierSocial-Frontend" cmd /c "npm run dev > "%F_LOG%" 2>&1"
  cd /d "%ROOT%"

  :: Attendre quelques secondes que Vite démarre
  timeout /t 4 /nobreak >nul

  :: Stocker le PID node
  for /f "tokens=2" %%P in ('tasklist /fi "imagename eq node.exe" /fo list 2^>nul ^| findstr /i "PID"') do (
    echo %%P> "%F_PID%"
  )

  echo %GREEN%[FRONTEND] ✓ Prêt  →  http://localhost:5173%RESET%
  goto :eof


:: ─── Arrêter le Backend ──────────────────────────────────────────────────────
:fn_stop_backend
  echo %RED%[BACKEND] Arrêt...%RESET%
  call :fn_kill_pid "%B_PID%"
  :: Tuer tous les java.exe par sécurité (mvnw fork aussi un processus java)
  taskkill /fi "imagename eq java.exe" /F >nul 2>&1
  if exist "%B_PID%" del "%B_PID%" >nul 2>&1
  echo %RED%[BACKEND] ✓ Arrêté%RESET%
  goto :eof


:: ─── Arrêter le Frontend ─────────────────────────────────────────────────────
:fn_stop_frontend
  echo %RED%[FRONTEND] Arrêt...%RESET%
  call :fn_kill_pid "%F_PID%"
  taskkill /fi "imagename eq node.exe" /F >nul 2>&1
  if exist "%F_PID%" del "%F_PID%" >nul 2>&1
  echo %RED%[FRONTEND] ✓ Arrêté%RESET%
  goto :eof


:: ─── Tuer un PID depuis un fichier ───────────────────────────────────────────
:fn_kill_pid
  if exist "%~1" (
    set /p "_PID="<"%~1"
    if defined _PID (
      taskkill /PID !_PID! /F >nul 2>&1
    )
    del "%~1" >nul 2>&1
  )
  goto :eof
