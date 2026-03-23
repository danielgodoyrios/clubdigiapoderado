#!/bin/bash
echo "====================================="
echo " CLUBDIGI — Setup"
echo "====================================="
command -v node >/dev/null 2>&1 || { echo "Node.js no encontrado. Instala desde nodejs.org"; exit 1; }
echo "[1/4] Instalando dependencias..."
npm install
echo "[2/4] Instalando Expo CLI..."
npm install -g expo-cli eas-cli
echo "[3/4] Verificando proyecto..."
npx expo doctor
echo "[4/4] Listo!"
echo ""
echo "Para iniciar: npm start"
