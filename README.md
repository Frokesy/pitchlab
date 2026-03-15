# PitchLab

PitchLab is a tactical board for football coaches to build, save, and share plays visually.

The current version is the MVP: a fast board-first workspace for shaping formations, moving players, drawing runs and passes, and saving ideas without friction.

## What It Does

- Load core formations like `4-3-3`, `4-2-3-1`, and `4-4-2`
- Drag players around the pitch
- Add home and opponent players
- Draw straight and curved tactical lines
- Erase annotations
- Save, update, load, and delete plays locally
- Generate shareable board links
- Work well on desktop and mobile
- Install as a PWA

## Product Direction

PitchLab is being built toward a simple idea:

**The Figma for football tactics.**

Near-term focus:

- complete and harden the MVP
- keep the tactical board as the center of the product
- move into team workspaces, invites, and shared tactical libraries next

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Framer Motion

## Getting Started

```bash
npm install
npm run dev
```

Open the local Vite URL in your browser to start using the app.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Project Structure

```text
src/
  components/         UI building blocks
  features/board/     board logic, helpers, hooks, types, data
  App.tsx             app composition layer
  main.tsx            app bootstrap + service worker registration

public/
  assets/             logo, favicon, PWA icons
  manifest.webmanifest
  sw.js
```

## Current Status

The MVP is largely in place and has already gone through multiple polish passes:

- board interactions
- save/load/share reliability
- responsive mobile UI
- visual cleanup
- persistence hardening
- PWA support

## Next Up

Likely next steps after MVP closeout:

- finish final QA and release checks
- move into team workspaces and coach/player onboarding
- connect boards to team-specific data and collaboration flows

## Build In Public

PitchLab is being built in public. The goal is to share progress openly as the product evolves from MVP into a real tool coaches can rely on.
