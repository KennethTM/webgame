# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kids Web Arcade — a collection of themed web games for young children. Built with React 19, TypeScript, Tailwind CSS 4, and Vite 7. Static site using HashRouter for GitHub Pages compatibility.

- **Pokémon section** (`/pokemon`): 7 Pokémon-themed games for age 6+
- **Maskiner section** (`/maskiner`): Machine/vehicle-themed games for age 3+

## Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # TypeScript check + Vite production build → /dist
npm run lint      # ESLint (flat config, TS + React rules)
npm run preview   # Preview production build locally
```

No test framework is configured.

## Architecture

**Routing**: `App.tsx` uses HashRouter with the following structure:

```
/             → Landing.tsx              (section selector: Pokémon vs Maskiner)
/pokemon      → pages/Home.tsx           (Pokémon game selection)
/maskiner     → pages/MachinesHome.tsx   (Machines game selection)
/game         → GameShell layout wrapper (Pokémon games)
  /game/snake
  /game/pacman
  /game/memory
  /game/jump
  /game/quiz
  /game/toss
  /game/run
/maskiner/game → MachinesShell layout wrapper (Machine games)
  /maskiner/game/memory
  /maskiner/game/tractor
  /maskiner/game/appletree
  /maskiner/game/brandbil
  /maskiner/game/vaskbil
  /maskiner/game/gravemaskine
```

Every game route is wrapped in `<ErrorBoundary>` (see `src/components/ErrorBoundary.tsx`) so a crash in one game cannot take down the rest of the app.

**GameShell / MachinesShell**: Layout wrappers for each section. Provide a header with back button. The back button has a two-tap confirmation guard when a game is active (`isGameActive` context).

**Game Registry Pattern**: Two central config files:
- `src/gameRegistry.ts` — Pokémon games. Fields: id, title, description, pokemonId, path, gradient, bgVariant.
- `src/machineRegistry.ts` — Machine games. Fields: id, title, description, emoji, path, gradient, bgColor.

The respective Home pages map over these registries to render game cards.

To add a new Pokémon game:
1. Create `src/games/<name>/<Name>Game.tsx`
2. Add metadata to `gameRegistry.ts`
3. Add `<Route path="<name>" element={<ErrorBoundary><NameGame /></ErrorBoundary>} />` in `App.tsx` under `/game`

To add a new machine game:
1. Create `src/games/<name>/<Name>Game.tsx`
2. Add metadata to `machineRegistry.ts`
3. Add `<Route path="<name>" element={<ErrorBoundary><NameGame /></ErrorBoundary>} />` in `App.tsx` under `/maskiner/game`

**Game Components**: Each game (`src/games/<name>/`) is a self-contained React component managing its own state via `useState`/`useRef`. Games use `useEffect` for event listeners and timers, `useCallback` for handlers. Common game states: idle → playing → game-over (or won/lost).

**High Scores**: `src/hooks/useHighScore.ts` wraps `src/lib/highScores.ts` (localStorage). All Pokémon games and some machine games (memory, tractor) use it. Call `submitScore(score, stars)` on game-over/win. Display `best.bestScore` in the UI. Pass `lowerIsBetter = true` for move/step counts.

**Confetti**: Each game that shows confetti defines a module-level `makeConfetti()` function (plain function, not a hook — safe to call anywhere) and initialises confetti state with `useState<ConfettiPiece[]>(makeConfetti)` (lazy initialiser). Do **not** call `Math.random()` inside `useMemo` or `useEffect` bodies — the strict `react-hooks/purity` and `react-hooks/set-state-in-effect` lint rules will reject it.

**Styling**: Tailwind CSS utility classes exclusively. Custom Pokémon theme colors defined as CSS custom properties in `src/index.css`. Dynamic positioning uses inline styles. Game-specific animations (fire flicker, bubbles, excavator arm, etc.) are defined as `@keyframes` in `src/index.css`.

**Input**: All games support both keyboard (arrow keys) and touch/mouse for tablet use. Touch targets are deliberately large.

**Language**: All UI text is in Danish.
