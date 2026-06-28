# The Algorithmic Complexity Visualizer

Interactive Vite + React visualizer for comparing BFS and A* on 4-connected unit-cost grid mazes. The app records formal traces, frontier audits, branching metrics, prediction-pause data, and experiment outputs for the bachelor thesis evidence pipeline.

A* uses the Manhattan-distance heuristic `h_M(n)=|row(n)-row(goal)|+|col(n)-col(goal)|`; walls are handled by the successor function, not by the heuristic.

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Validation

```bash
npm run validate:algorithms
```

This checks BFS shortest-path behavior and depth traces, Manhattan A* optimality against BFS path length, A* `f=g+h_M` trace equations, A* minimum-`f`/lower-`h_M`/insertion-order selection, no-path handling, and effective branching factor sanity checks.

## Experiments

```bash
npm run experiments
```

Experiment regeneration writes:

- `docs/thesis-experiment-results.json`
- `docs/thesis-experiment-results.md`

The generated experiment report uses the current implementation of BFS and Manhattan A* with formal traces enabled.

## Preview Production Build

```bash
npm run preview
```
