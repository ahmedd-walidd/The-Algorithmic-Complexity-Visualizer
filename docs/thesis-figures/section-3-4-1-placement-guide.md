# Section 3.4.1 Figure Placement Guide

Use these figures in Section 3.4.1, "Formal Branching-Factor Proof on a 50 x 50 Grid".

## After the Graph-Size Equations

Place `figure-3-4-1-50x50-grid-model.png` after:

> Thus, the graph-level BFS complexity is:
> T_BFS in O(V + E) = O(2500 + 4900) = O(7400).

This figure visually grounds the values |V| = 2500 and |E| = 4900 in the implemented 50 x 50 board.

## Before the Empirical BFS/A* Comparison

Optionally place `figure-3-4-2-50x50-race-start.png` before:

> For A* with a binary heap priority queue:
> T_A* in O((V + E) log V) = O(7400 log 2500).

Use this only if you want to show that both algorithms are being run on the same visual artifact before the result is shown.

## After the BFS Finite-Grid Bound

Place `figure-3-4-3-50x50-bfs-astar-result.png` after:

> In practice, the grid has finite size, so BFS cannot expand more than all reachable cells:
> N_BFS <= 2500.

This figure shows the implemented run: BFS expands 1625 states on the obstacle-free 50 x 50 board, while A* expands 40 states.

## After the Final Search-Space Compression Claim

Place `figure-3-4-4-50x50-branching-analysis.png` after:

> Comparing the estimated b* values for BFS and A* provides a quantitative measure of heuristic-induced search-space compression.

This is the strongest evidence figure for the section because it shows the actual measured branching values:

| Metric | BFS | A* |
|---|---:|---:|
| Expanded states | 1625 | 40 |
| Path depth | 39 | 39 |
| b_graph | 3.92 | 3.92 |
| b_observed | 3.94 | 3.90 |
| b_effective | 1.15 | 1.00 |

