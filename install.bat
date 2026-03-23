@echo off
echo =====================================
echo  CLUBDIGI — Setup
echo =====================================
echo.
where node >nul 2>nul || (echo Node.js no encontrado. Instala desde nodejs.org & pause & exit)
where npm  >nul 2>nul || (echo npm no encontrado & pause & exit)
echo [1/4] Instalando dependencias...
npm install
echo [2/4] Instalando Expo CLI global...
npm install -g expo-cli eas-cli
echo [3/4] Verificando proyecto...
npx expo doctor
echo [4/4] Listo!
echo.
echo Para iniciar el proyecto:
echo   npm start
echo.
echo Para abrir en tu telefono instala la app Expo Go
echo y escanea el QR que aparecera en pantalla.
echo.
pause
