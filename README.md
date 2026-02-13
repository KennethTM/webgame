# Pokémon Web Arcade

A collection of simple, Pokémon-themed web games for kids. Built with React, TypeScript, and Tailwind CSS.

## Setup & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Build & Deployment

```bash
# Build for production (output in /dist)
npm run build

# Preview production build locally
npm run preview
```

### Deploy to GitHub Pages

1. Install the deployment package:
   ```bash
   npm install -D gh-pages
   ```

2. Add these scripts to `package.json`:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

## Games Included
- **PokéSnake**: Classic snake game with Ekans.
- **PokéBall Maze**: Pac-Man style maze game.
- **Pokémon Match**: Memory card matching.
- **Magikarp Jump**: High-speed button mashing.# webgame
