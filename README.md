# The Algorithmic Complexity Visualizer

A Vite + React application for visualizing algorithmic complexity.

## Getting Started

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

## Validation

```bash
node scripts/validateAlgorithms.js
npm run validate:algorithms
```

Validation checks BFS shortest-path behaviour, A* optimality against BFS, f=g+h trace equations, A* minimum-f selection, no-path handling, and effective branching factor sanity checks.

### Preview production build

```bash
npm run preview
```
