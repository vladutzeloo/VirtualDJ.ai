# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VirtualDJ.AI is a professional AI-powered DJ workstation delivered as a single-page React app. It pairs a 3D turntable UI (Three.js / React Three Fiber) with multi-provider AI agents:

- **Google Gemini** with Google Search grounding — live track discovery and recommendations.
- **Anthropic Claude** — DJ skill agents (setlist curator, crowd reader, mix coach).
- **Moonshot Kimi** — auxiliary OpenAI-compatible chat surface.
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
- `ANTHROPIC_API_KEY` — required for `claudeAgentService` (DJ skills).
- `KIMI_API_KEY` — optional, Moonshot AI.
- `APP_URL` — auto-injected by AI Studio at runtime (Cloud Run URL).

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
│   ├── musicService.ts         # Gemini + Google Search grounding
│   ├── claudeAgentService.ts   # Anthropic SDK, DJ_SKILLS registry
│   ├── imageService.ts         # AI artwork / avatar generation
│   ├── biometricService.ts     # WebAuthn registration & assertion
│   └── gestureService.ts       # MediaPipe hand-gesture pipeline
├── constants/agentImages.ts
└── data/devices.ts
```

`@/*` resolves to the repo root (see `tsconfig.json` and `vite.config.ts`).

### State model

`App.tsx` is the single source of truth for runtime state (tracks, mixer values, logs, vault open state, theme, etc.). There is no Redux / Zustand / Context store — adding global state should generally extend `App.tsx` or pass props, not introduce a new framework.

### AI service conventions

Each service in `src/services/` lazy-initializes its SDK client inside a `getClient()` / `getAI()` helper and throws a descriptive error when the matching env var is missing. When adding a new AI provider, follow the same pattern:

1. Lazy singleton client.
2. Strongly-typed request/response interfaces exported alongside the function.
3. Robust JSON extraction — models often wrap output in ```json fences. See `extractJsonArray` in `musicService.ts` and the regex strip in `claudeAgentService.ts`.
4. Errors logged with the raw response, then re-thrown with a user-friendly message.

### Claude SDK usage

`claudeAgentService.ts` uses `@anthropic-ai/sdk` directly from the browser with `dangerouslyAllowBrowser: true`. The default model is `claude-sonnet-4-6`. The DJ skill registry (`DJ_SKILLS`) is the single place to add or modify Claude personas; each skill owns its system prompt and expected JSON schema.

When upgrading Claude models, refer to model IDs documented in this repo's environment notes — current defaults: Opus 4.7 (`claude-opus-4-7`), Sonnet 4.6 (`claude-sonnet-4-6`), Haiku 4.5 (`claude-haiku-4-5-20251001`).

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
