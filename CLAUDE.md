# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pokémon Web Arcade — a collection of Pokémon-themed web games for young kids (age 6). Built with React 19, TypeScript, Tailwind CSS 4, and Vite 7. Static site using HashRouter for GitHub Pages compatibility.

## Commands

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # TypeScript check + Vite production build → /dist
npm run lint      # ESLint (flat config, TS + React rules)
npm run preview   # Preview production build locally
```

No test framework is configured.

## Architecture

**Routing**: `App.tsx` uses HashRouter. Games are nested under `/game` with `GameShell` as the layout wrapper (provides header + back button). Home page is at `/`.

**Game Registry Pattern**: `src/gameRegistry.ts` is the central config. Each game has an entry with id, title, description, icon, path, and color. The Home page renders game cards by mapping over this registry. To add a new game:
1. Create `src/games/<name>/<Name>Game.tsx`
2. Add metadata to `gameRegistry.ts`
3. Add a `<Route>` in `App.tsx` under the `/game` parent route

**Game Components**: Each game (`src/games/<name>/`) is a self-contained React component managing its own state via `useState`/`useRef`. Games use `useEffect` for event listeners and timers, `useCallback` for handlers. Common game states: idle → playing → game-over.

**Styling**: Tailwind CSS utility classes exclusively. Custom Pokémon theme colors defined as CSS custom properties in `src/index.css` (`--color-pokemon-yellow`, `--color-pokemon-blue`, `--color-pokemon-red`, `--color-pokemon-gold`). Dynamic positioning uses inline styles.

**Input**: All games support both keyboard (arrow keys) and touch/mouse for tablet use. Touch targets are deliberately large.
