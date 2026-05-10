# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VirtualDJ.AI is a professional AI-powered DJ workstation delivered as a single-page React app. It pairs a 3D turntable UI (Three.js / React Three Fiber) with multi-provider AI agents:

- **Google Gemini** with Google Search grounding — live track discovery and recommendations.
- **NVIDIA NIM** — primary AI for DJ skills + taste analysis. OpenAI-compatible Llama / Nemotron / Mixtral inference (`nvidiaService`).
- **Moonshot Kimi** — second link in the AI provider chain (`kimiService`).
- **Local LLM fallback** — generic OpenAI-compatible endpoint (Ollama / LM Studio / llama.cpp / vLLM) used when no cloud key is set or all cloud providers fail (`localLlmService`).
- **MediaPipe Tasks Vision** — gesture/vision input.
- **WebAuthn (SimpleWebAuthn)** — Neural Vault biometric auth.

The app is built with Vite, ships as both a web app (AI Studio / Cloud Run) and an Android APK via Capacitor, and uses Tailwind CSS v4.

## Common Commands

```bash
npm install            # install dependencies
npm run dev            # vite dev server on 0.0.0.0:3000
npm run build          # production build to dist/
npm run preview        # preview built dist/
npm run lint           # tsc --noEmit (type-check only; no ESLint)
npm run clean          # rm -rf dist
```

There is no test runner configured; `npm run lint` is the only verification gate.

## Environment

Secrets are loaded by Vite from `.env.local` and injected into the bundle via `define` in `vite.config.ts`. They are exposed to the browser as `process.env.*` — **never put server-only secrets here**.

Required / optional keys (see `.env.example`):

- `GEMINI_API_KEY` — required for `musicService` (track recommendations + Google Search grounding).
- `NVIDIA_API_KEY` — primary key for `djSkillService` and `preferenceAgentService` (DJ skills + taste analysis). NVIDIA NIM (`nvapi-…`), OpenAI-compatible.
- `KIMI_API_KEY` — second link in the AI provider chain (Moonshot, OpenAI-compatible).
- Local LLM endpoint — final fallback when no cloud key is configured. Base URL + model are stored in localStorage and edited from the Neural Vault, **not** via env vars (defaults to `http://localhost:11434/v1` for Ollama).
- `OPENAI_API_KEY` — optional, recognized by the Neural Vault for future drop-in use.
- `APP_URL` — auto-injected by AI Studio at runtime (Cloud Run URL).

All provider keys may also be supplied at runtime via the WebAuthn-gated **Neural Vault**
(`src/components/Vault.tsx`). Services resolve keys through `apiKeyManager.getApiKey()`,
which prefers a vault-stored key and falls back to the `process.env.*` injected at build time.
**Never read `process.env.*_API_KEY` directly from a service or component** — always go
through `apiKeyManager`.

`DISABLE_HMR=true` disables Vite HMR — set by AI Studio to prevent flicker during agent edits. Do not change the HMR guard in `vite.config.ts`.

## Architecture

```
src/
├── main.tsx                    # React 19 entry, StrictMode root
├── App.tsx                     # Single-file root component (~1300 lines, holds most app state)
├── index.css                   # Tailwind v4 entry
├── components/                 # Presentational + 3D components
│   ├── Turntable3D.tsx         # R3F turntable
│   ├── AudioKnob3D.tsx         # R3F knob
│   ├── ControlDeck.tsx, MixerKnob.tsx, TrackLayer.tsx, TrackModal.tsx
│   ├── AIBrain.tsx, JulesAgent.tsx, AgentShowcase.tsx
│   ├── Vault.tsx               # WebAuthn-gated Neural Vault UI
│   ├── VisionScanner.tsx       # MediaPipe camera input
│   ├── DeviceIdentity.tsx, PhoneFrame.tsx, RecordPicker.tsx,
│   ├── SocialPickups.tsx, StatItem.tsx, Logo.tsx
├── hooks/
│   └── useDeviceTelemetry.ts   # FPS, network, battery sampling
├── services/                   # All external I/O lives here
│   ├── apiKeyManager.ts        # Vault-backed key resolution (prefer over process.env)
│   ├── usageTracker.ts         # Token / cost ledger surfaced in the Neural Vault
│   ├── musicService.ts         # Gemini + Google Search grounding
│   ├── aiProviderChain.ts      # NVIDIA → Kimi → local LLM fallback orchestrator
│   ├── djSkillService.ts       # DJ_SKILLS registry on top of the chain
│   ├── preferenceAgentService.ts # Taste-profile analyzer on top of the chain
│   ├── nvidiaService.ts        # NVIDIA NIM (OpenAI-compatible) chat completions
│   ├── kimiService.ts          # Moonshot Kimi (OpenAI-compatible) chat completions
│   ├── localLlmService.ts      # Generic OpenAI-compatible local endpoint (Ollama, LM Studio, llama.cpp, vLLM)
│   ├── imageService.ts         # AI artwork / avatar generation
│   ├── audiusService.ts        # Audius public discovery + streaming
│   ├── soundService.ts         # Local SFX / notification cues
│   ├── biometricService.ts     # WebAuthn registration & assertion
│   └── gestureService.ts       # MediaPipe hand-gesture pipeline
├── constants/agentImages.ts
└── data/devices.ts
```

`@/*` resolves to the repo root (see `tsconfig.json` and `vite.config.ts`).

### State model

`App.tsx` is the single source of truth for runtime state (tracks, mixer values, logs, vault open state, theme, etc.). There is no Redux / Zustand / Context store — adding global state should generally extend `App.tsx` or pass props, not introduce a new framework.

### AI service conventions

Each service in `src/services/` lazy-initializes its SDK client inside a `getClient()` / `getAI()` helper and throws a descriptive error when the matching key is missing. When adding a new AI provider, follow the same pattern:

1. **Resolve keys via `apiKeyManager.getApiKey('<provider>')`** — never read `process.env` directly. The manager unifies vault-stored keys + env fallback and emits a `markKeyUsed` ping for the UI.
2. Lazy singleton client; rebuild the client when the resolved key changes.
3. Strongly-typed request/response interfaces exported alongside the function.
4. Robust JSON extraction — models often wrap output in ```json fences. See `extractJsonArray` in `musicService.ts` and the regex strip in `nvidiaService.ts` / `kimiService.ts` / `localLlmService.ts`.
5. Record cost via `usageTracker.recordUsage({ provider, model, feature, inputTokens, outputTokens })` after every completion.
6. Errors logged with the raw response, then re-thrown with a user-friendly message.

### AI provider chain

DJ skills and the taste-profile analyzer route through `aiProviderChain.ts`, which tries providers in order and falls through on failure:

1. **NVIDIA NIM** (primary) — `nvidiaService` against `https://integrate.api.nvidia.com/v1/chat/completions`. Default model: `meta/llama-3.1-70b-instruct`.
2. **Moonshot Kimi** — `kimiService` against `https://api.moonshot.ai/v1/chat/completions`. Default model: `moonshot-v1-32k`.
3. **Local LLM** (final fallback) — `localLlmService` against any OpenAI-compatible endpoint. Default: `http://localhost:11434/v1` (Ollama) with model `llama3.2`. Base URL + model are user-configurable from the Neural Vault; an optional Bearer token is stored under provider id `local` in `apiKeyManager`.

Use `runAiChat` for raw text and `runAiJson<T>` for JSON. Both return the provider/model that actually served the request so you can show it in the UI. Add new pricing rows to `MODEL_PRICING` in `usageTracker.ts` when you wire additional cloud models.

### NVIDIA NIM usage

`nvidiaService.ts` calls the OpenAI-compatible endpoint at
`https://integrate.api.nvidia.com/v1/chat/completions` directly via `fetch` (no SDK dependency). The default model is `meta/llama-3.1-70b-instruct`. Use `runNvidiaChat({ model, messages })` for raw text or `runNvidiaJson({ ... })` for JSON-mode-style helpers — though most callers should prefer `aiProviderChain` so the Kimi/local fallbacks engage automatically.

### 3D / Three.js

3D components use `@react-three/fiber` and `@react-three/drei`. Keep heavy assets out of the main bundle and prefer GPU-friendly geometry. The turntable is mounted inside `PhoneFrame` for the mobile preview.

## Mobile / Capacitor

`capacitor.config.ts` declares `appId: ai.virtualdj.app`, `webDir: dist`. The Android project is **generated in CI** (`.github/workflows/android-apk.yml`) — `android/` is gitignored. Do not commit a generated `android/` folder.

To produce an APK locally you must first `npm run build`, then run Capacitor sync against a freshly generated `android/` project.

## AI Studio Considerations

This repo is hosted in Google AI Studio. A few constraints follow from that:

- HMR is gated behind `DISABLE_HMR` to avoid flicker during agent file edits.
- `GEMINI_API_KEY` and `APP_URL` are injected at runtime by AI Studio from user secrets — do not hardcode them.
- The dev server binds to `0.0.0.0:3000` so the AI Studio preview iframe can reach it.

## Working Rules

1. **Type-check after every change** — `npm run lint` is the only gate; run it before committing.
2. **Never commit `.env.local`** — `.gitignore` covers `.env*` except `.env.example`. Update `.env.example` whenever you add a new secret.
3. **Don't introduce a new state library** — extend `App.tsx` or lift state through props.
4. **Keep external I/O in `src/services/`** — components should call services, not SDKs directly.
5. **Mind the bundle** — every dependency ships to the browser. Prefer dynamic `import()` for large optional features (e.g. MediaPipe, Three.js add-ons) when feasible.
6. **No new test framework without buy-in** — the project has none today; if you need verification, prefer a typecheck-friendly runtime assertion.

## Git Workflow

Develop on the branch assigned in the task instructions (currently `claude/rehual-claude-md-elYRh`). Never push directly to `main`.

```bash
git checkout -b <assigned-branch>     # if it doesn't exist yet
git add <specific files>              # avoid `git add -A`
git commit -m "..."                   # descriptive, focused commits
git push -u origin <branch>           # always include -u
```

After pushing, open a draft pull request via the GitHub MCP tools.

## Prerequisites

- Node.js (current LTS)
- npm
- Browser with WebAuthn + MediaPipe support for full feature coverage
