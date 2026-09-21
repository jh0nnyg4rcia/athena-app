<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ATHENA — Mentoria Jurídica

https://ai.studio/apps/f105a637-d2e2-4288-9bf8-ec3fabf74bfb

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` (server-only; never commit it, never prefix with `VITE_`)
3. Run: `npm run dev` (Express + Vite na porta 3000; o browser chama `/api/*` no mesmo origin)

O app (web e Capacitor) **não** embute a chave Gemini. O APK precisa de `VITE_API_URL` apontando para o proxy HTTPS no momento do `npm run build`.
