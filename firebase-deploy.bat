@echo off
echo 🚀 Deploy Firebase Hosting - Grupo Emanuel
echo.

echo 📦 1. Building projeto...
call npm run build
if errorlevel 1 (
    echo ❌ Build falhou!
    exit /b 1
)

echo.
echo 📄 2. Copiando arquivos necessários...
if not exist "dist\.well-known" mkdir "dist\.well-known"
copy "public\.well-known\assetlinks.json" "dist\.well-known\assetlinks.json"
copy "public\musicas.html" "dist\musicas.html"

echo.
echo 🔥 3. Deploy no Firebase...
call firebase deploy --only hosting

echo.
echo ✅ Deploy concluído!
echo 🔗 Teste assetlinks: https://grupoemanuel46-bb986.web.app/.well-known/assetlinks.json
echo 🔗 Teste redirect: https://grupoemanuel46-bb986.web.app/musicas?playlist=teste^&songs=1,2,3
echo.
pause
