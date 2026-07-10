@echo off
setlocal enabledelayedexpansion

title ImmoSocial - Gestionnaire

:: ------------------------------------------------------------
::  CONFIGURATION
:: ------------------------------------------------------------
set "BACKEND_DIR=%~dp0backend"
set "FRONTEND_DIR=%~dp0frontend"
set "JAR_NAME=immobiliersocial-0.0.1-SNAPSHOT.jar"
set "BACKEND_TITLE=ImmoSocial - Backend"
set "FRONTEND_TITLE=ImmoSocial - Frontend"

:: ------------------------------------------------------------
::  VERIFICATIONS INITIALES
:: ------------------------------------------------------------
if not exist "%BACKEND_DIR%" (
    echo [ERREUR] Dossier backend introuvable : %BACKEND_DIR%
    pause
    exit /b 1
)
if not exist "%BACKEND_DIR%\mvnw.cmd" (
    echo [ERREUR] mvnw.cmd introuvable dans %BACKEND_DIR%
    pause
    exit /b 1
)
if not exist "%FRONTEND_DIR%\package.json" (
    echo [ERREUR] package.json introuvable dans %FRONTEND_DIR%
    pause
    exit /b 1
)
where.exe node >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js non installe.
    pause
    exit /b 1
)
where.exe java >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Java non installe.
    pause
    exit /b 1
)

:: ------------------------------------------------------------
::  FONCTIONS (placées APRÈS le flux principal pour éviter les retours intempestifs)
:: ------------------------------------------------------------
goto :MAIN

:SHOW_BANNER
cls
echo.
echo  =====================================================
echo   IMMOBILIER SOCIAL - Plateforme Immobiliere Sociale
echo   Backend  : Spring Boot  ^| http://localhost:8080
echo   Frontend : React + Vite ^| http://localhost:5173
echo  =====================================================
echo.
goto :EOF

:BUILD_BACKEND
echo [BUILD] Compilation du backend (clean package)...
pushd "%BACKEND_DIR%"
call mvn clean package
if errorlevel 1 (
    echo [ERREUR] La compilation a echoue.
    popd
    pause
    exit /b 1
)
popd
if not exist "%BACKEND_DIR%\target\%JAR_NAME%" (
    echo [ERREUR] JAR introuvable : %BACKEND_DIR%\target\%JAR_NAME%
    pause
    exit /b 1
)
echo [BUILD] Backend compile avec succes.
goto :EOF

:INSTALL_FRONTEND
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [NPM] Installation des dependances...
    pushd "%FRONTEND_DIR%"
    call npm install
    if errorlevel 1 (
        echo [ERREUR] npm install a echoue.
        popd
        pause
        exit /b 1
    )
    popd
    echo [NPM] Dependances installees.
)
goto :EOF

:START_BACKEND
echo [BACKEND] Demarrage...
pushd "%BACKEND_DIR%"
start "%BACKEND_TITLE%" cmd /k "title %BACKEND_TITLE% && mvn spring-boot:run"
popd
echo [BACKEND] Lance dans une nouvelle fenetre.
goto :EOF

:START_FRONTEND
echo [FRONTEND] Demarrage...
pushd "%FRONTEND_DIR%"
start "%FRONTEND_TITLE%" cmd /k "title %FRONTEND_TITLE% && npm run dev -- --host"
popd
echo [FRONTEND] Lance dans une nouvelle fenetre.
goto :EOF

:STOP_BACKEND
echo [BACKEND] Arret en cours...
taskkill /FI "WINDOWTITLE eq %BACKEND_TITLE%*" /T /F >nul 2>&1
if errorlevel 1 ( echo [BACKEND] Aucune fenetre trouvee. ) else ( echo [BACKEND] Fenetre fermee. )
goto :EOF

:STOP_FRONTEND
echo [FRONTEND] Arret en cours...
taskkill /FI "WINDOWTITLE eq %FRONTEND_TITLE%*" /T /F >nul 2>&1
if errorlevel 1 ( echo [FRONTEND] Aucune fenetre trouvee. ) else ( echo [FRONTEND] Fenetre fermee. )
goto :EOF

:START_ALL
call :INSTALL_FRONTEND
call :START_BACKEND
timeout /t 5 /nobreak > nul
call :START_FRONTEND
echo Tous les serveurs ont ete lances.
goto :EOF

:STOP_ALL
call :STOP_BACKEND
call :STOP_FRONTEND
echo Tous les serveurs ont ete arretes.
goto :EOF

:RESTART_ALL
call :STOP_ALL
timeout /t 2 /nobreak > nul
call :START_ALL
goto :EOF

:RESTART_BACKEND
call :STOP_BACKEND
timeout /t 2 /nobreak > nul
call :START_BACKEND
goto :EOF

:RESTART_FRONTEND
call :STOP_FRONTEND
timeout /t 2 /nobreak > nul
call :START_FRONTEND
goto :EOF

:OPEN_BROWSER
start "" "http://localhost:5173"
goto :EOF

:: ------------------------------------------------------------
::  FLUX PRINCIPAL (démarrage automatique puis menu)
:: ------------------------------------------------------------
:MAIN
call :SHOW_BANNER
echo [OK] Java et Node.js detectes.
echo.
echo *** DEMARRAGE AUTOMATIQUE ***
call :START_ALL
echo.
set /p OPEN_BROWSER="Ouvrir http://localhost:5173 dans le navigateur ? [O/n] : "
if /i not "!OPEN_BROWSER!"=="n" start "" "http://localhost:5173"
echo.
echo =====================================================
echo  Le gestionnaire reste actif.
echo  Vous pouvez gerer les serveurs via le menu.
echo =====================================================
echo.
pause

:: ------------------------------------------------------------
::  MENU INTERACTIF
:: ------------------------------------------------------------
:MENU_LOOP
call :SHOW_BANNER
echo Que souhaitez-vous faire ?
echo.
echo  [1] Demarrer tous les serveurs
echo  [2] Arreter tous les serveurs
echo  [3] Redemarrer tous les serveurs
echo  [4] Redemarrer le backend uniquement
echo  [5] Redemarrer le frontend uniquement
echo  [6] Ouvrir le navigateur (http://localhost:5173)
echo  [7] Quitter ce gestionnaire
echo.
set "CHOICE="
set /p CHOICE="Votre choix [1-7] : "
if "%CHOICE%"=="1" call :START_ALL
if "%CHOICE%"=="2" call :STOP_ALL
if "%CHOICE%"=="3" call :RESTART_ALL
if "%CHOICE%"=="4" call :RESTART_BACKEND
if "%CHOICE%"=="5" call :RESTART_FRONTEND
if "%CHOICE%"=="6" call :OPEN_BROWSER
if "%CHOICE%"=="7" goto :QUIT
echo.
echo Appuyez sur une touche pour revenir au menu...
pause > nul
goto :MENU_LOOP

:QUIT
echo Au revoir !
timeout /t 2 > nul
exit /b 0
