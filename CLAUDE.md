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
/             → Landing.tsx         (section selector: Pokémon vs Maskiner)
/pokemon      → pages/Home.tsx      (Pokémon game selection)
/maskiner     → pages/MachinesHome.tsx  (Machines game selection)
/game         → GameShell layout wrapper (Pokémon games)
  /game/snake
  /game/pacman
  /game/memory
  /game/jump
  /game/quiz
  /game/toss
  /game/run
```

**GameShell**: Layout wrapper for Pokémon games. Provides header with back button (navigates to `/pokemon`). The back button has a two-tap confirmation guard when a game is active (`isGameActive` context).

**Game Registry Pattern**: `src/gameRegistry.ts` is the central config for Pokémon games. Each entry has id, title, description, pokemonId, path, gradient, and bgVariant. The Home page maps over this registry to render game cards. To add a new Pokémon game:
1. Create `src/games/<name>/<Name>Game.tsx`
2. Add metadata to `gameRegistry.ts`
3. Add a `<Route>` in `App.tsx` under the `/game` parent route

**Game Components**: Each game (`src/games/<name>/`) is a self-contained React component managing its own state via `useState`/`useRef`. Games use `useEffect` for event listeners and timers, `useCallback` for handlers. Common game states: idle → playing → game-over.

**Styling**: Tailwind CSS utility classes exclusively. Custom Pokémon theme colors defined as CSS custom properties in `src/index.css` (`--color-pokemon-yellow`, `--color-pokemon-blue`, `--color-pokemon-red`, `--color-pokemon-gold`). Dynamic positioning uses inline styles.

**Input**: All games support both keyboard (arrow keys) and touch/mouse for tablet use. Touch targets are deliberately large.

**Language**: All UI text is in Danish.
