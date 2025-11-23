# Aplicativo Grupo Emanuel

Aplicativo mobile do Grupo Emanuel desenvolvido com React + Capacitor + Firebase.

## Funcionalidades

- 📱 **Multiplataforma**: Android/iOS via Capacitor
- 🎵 **Gerenciamento de Músicas**: Letras, cifras, áudios e PDFs
- 📰 **Feed de Notícias**: Atualizações do grupo
- 📅 **Agenda**: Ensaios e escalas
- 📍 **Locais**: Mapa de locais importantes
- 🎤 **Performance Mode**: Modo cinema com auto-scroll para apresentações
- 🔒 **Wake Lock**: Tela não desliga durante performance/PDF
- ⏱️ **Duração**: Tempo estimado de cada música
- 🎼 **Metronomo Visual**: BPM integrado

## Tecnologias

- React + TypeScript + Vite
- Capacitor (Mobile)
- Firebase Realtime Database
- TailwindCSS
- PDF.js
- Lucide React Icons

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para Android
npm run build
npx cap sync android
npx cap open android
```

## Setup

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure o Firebase em `src/config/firebase-config.ts`
4. Execute: `npm run dev`

---

**Grupo Emanuel** © 2024
