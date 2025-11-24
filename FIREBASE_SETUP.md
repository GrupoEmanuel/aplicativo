# 🔥 Guia de Deploy - Firebase Hosting para Deep Links

## ✅ O que você já fez (está correto!)

1. ✅ Criou o projeto Firebase: `grupoemanuel46-bb986`
2. ✅ Pegou o SHA-256 do Android Studio (versão debug)
3. ✅ Criou `public/.well-known/assetlinks.json` com as configurações corretas
4. ✅ Instalou `firebase-tools` globalmente

## 📝 Arquivos criados/atualizados automaticamente

- ✅ `firebase.json` - Configuração do Firebase Hosting
- ✅ `.firebaserc` - Configuração do projeto
- ✅ `AndroidManifest.xml` - Atualizado com domínio do Firebase

## 🚀 Próximos Passos

### 1. Fazer login no Firebase
```bash
firebase login
```
Isso abrirá o navegador para você fazer login com sua conta Google.

### 2. Verificar a configuração
```bash
firebase projects:list
```
Deve mostrar o projeto `grupoemanuel46-bb986` na lista.

### 3. Build do projeto
```bash
npm run build
```
Isso criará a pasta `dist` com os arquivos compilados.

### 4. Copiar assetlinks.json para dist
```bash
mkdir dist\.well-known
copy public\.well-known\assetlinks.json dist\.well-known\assetlinks.json
```

### 5. Deploy no Firebase Hosting
```bash
firebase deploy --only hosting
```

### 6. Testar o assetlinks.json
Após o deploy, acesse: `https://grupoemanuel46-bb986.web.app/.well-known/assetlinks.json`

Deve retornar o JSON com suas configurações.

### 7. Sincronizar com Android
```bash
npx cap sync android
```

### 8. Recompilar o APK
Abra o Android Studio e gere um novo APK de **debug** (mesma versão do SHA-256 que você pegou).

## ⚠️ IMPORTANTE: SHA-256 Release vs Debug

Você mencionou que pegou o SHA-256 da versão **debug**. 

- **Debug**: Use para testes durante desenvolvimento
- **Release**: Precisará pegar outro SHA-256 quando for publicar na Play Store

### Como pegar o SHA-256:
**No Android Studio:**
1. Gradle → app → Tasks → android → signingReport
2. Copie o SHA-256 da versão desejada (debug ou release)

**Ou via linha de comando (Windows):**
```powershell
# Debug
cd android
.\gradlew signingReport
```

## 🔍 Verificar se funcionou

1. **Testar o assetlinks.json:**
   ```
   https://grupoemanuel46-bb986.web.app/.well-known/assetlinks.json
   ```

2. **Testar o deep link:**
   - Envie este link pelo WhatsApp: 
     `https://grupoemanuel46-bb986.web.app/musicas?playlist=teste&songs=1,2,3`
   - Ao clicar, deve oferecer para abrir com o app Grupo Emanuel

3. **Verificar App Links no Android:**
   ```bash
   adb shell am start -a android.intent.action.VIEW -d "https://grupoemanuel46-bb986.web.app/musicas?playlist=teste&songs=1,2,3"
   ```

## 📱 Importante sobre App Links vs Deep Links

- **Custom Scheme** (`grupoemanuel://`): Funciona sempre, mas não é clicável em todos os apps
- **HTTPS App Links**: Clicável no WhatsApp, mas precisa de verificação (assetlinks.json)

Ambos estão configurados! O Android tentará usar App Links primeiro, e cairá para custom scheme se falhar.

## 🐛 Troubleshooting

### Se o link HTTPS não abrir o app:
1. Verifique se o assetlinks.json está acessível
2. Confirme que o SHA-256 está correto
3. Reinstale o app após o deploy
4. Limpe os dados do app: Configurações → Apps → Grupo Emanuel → Limpar dados
5. Em alguns casos, pode levar algumas horas para o Android verificar os App Links

### Se o custom scheme não funcionar:
- Reinstale o app com o novo AndroidManifest.xml
- Teste com: `adb shell am start -a android.intent.action.VIEW -d "grupoemanuel://musicas?playlist=teste&songs=1,2,3"`
