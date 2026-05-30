# IRA — Ambient AI Desktop Assistant

An elegant, always-on-top floating AI assistant that lives on your desktop. Click the glowing orb or press `Ctrl+Space` to summon the command bar. Ask IRA anything, or give it a task — it'll send emails, set reminders, schedule events, take notes, and have a real conversation.

Built with **Electron**, **React**, **TypeScript**, and **Google Gemini AI**.

---

## Run Locally

**Prerequisites:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Set your Gemini API key
#    Copy .env.example → .env and fill in your key
#    Get a free key at: https://aistudio.google.com/app/apikey

# 3. Launch the desktop app
npm run dev
```

This starts the floating orb + the Vite dev server simultaneously.

---

## Build for Distribution

```bash
npm run dist:linux   # → release/*.AppImage + *.deb
npm run dist:mac     # → release/*.dmg
npm run dist:win     # → release/*.exe
```

---

## Project Structure

```
ira-desktop-assistant/
├── electron/
│   ├── main.ts          ← Electron brain (windows, IPC, Gemini AI)
│   └── preload.ts       ← Secure React ↔ Electron bridge
├── src/
│   ├── App.tsx           ← Main workspace root
│   ├── OrbApp.tsx        ← Floating orb root
│   ├── components/
│   │   ├── StandaloneOrb.tsx   ← The floating orb widget
│   │   ├── DesktopEnv.tsx      ← Full workspace UI
│   │   ├── Onboarding.tsx      ← 7-step onboarding flow
│   │   ├── FloatingOrb.tsx     ← Orb inside workspace view
│   │   └── MockWindow.tsx      ← Draggable in-app windows
├── orb.html              ← Orb window entry
├── index.html            ← Workspace window entry
└── .env.example          ← Environment template
```

---

## Features

- 🌟 **Always-on-top floating orb** — never hidden behind other apps
- 🖱️ **Draggable** — move it anywhere on your screen, position is saved
- ⌨️ **Global shortcut** — `Ctrl+Space` summons the command bar from anywhere
- 🤖 **Dual AI mode** — executes tasks AND answers general questions/chat
- 📧 **Email drafting** — *"mail irfan meeting looks good"*
- ⏰ **Reminders & timers** — *"remind me to stretch in 20 minutes"*
- 📅 **Calendar events** — *"schedule a sync tomorrow at 3pm"*
- 📝 **Quick notes** — *"note this idea for the product roadmap"*
- 🎨 **5 themes** — Dark Slate, Alabaster, Frosted Glass, Tokyo Cyberpunk, Monochrome
- 🖥️ **Cross-platform** — Mac, Windows, Linux
