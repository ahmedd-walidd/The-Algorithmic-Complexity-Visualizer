# Thesis Visuals Recommendations

Reviewed source: `c:\Users\ahmed\Downloads\current-thesis.pdf`  
Project source: current React/Vite implementation in this repository.

## Current Thesis Coverage

The current 62-page thesis already explains the main research framing well: Graph Search Auditor, BFS and A* theory, grid-to-graph mapping, Pause-Prediction, trace logging, evaluation results, and formal result analysis. Its current list of figures covers:

- BFS/A* background diagrams in Chapter 3.
- System overview, Pause-Prediction, legend, and prediction feedback in Chapter 4.
- Race Mode, mathematical trace, and formal result analysis in Chapter 5.

The project now contains several implemented features that are either missing or only lightly represented in the PDF: the landing/configuration flow, settings and grid-scale controls, the live K=(A,D,S) knowledge-space side panel, the Truth Scanner concept layer, timeline controls, CSV export, and the 50x50 branching-factor proof screenshots.

## Recommended New Figure Placements

| File | Suggested placement | Caption |
|---|---|---|
| `figure-1-1-landing-experiment-setup.png` | Chapter 1, Section 1.2 after the Graph Search Auditor framing, or Chapter 4 before Section 4.1.1 | Experiment initialization screen of the Algorithmic Complexity Visualizer. The learner selects the grid scale and equation-overlay instrumentation before entering the audit lab, making the chosen problem instance explicit before algorithm execution. |
| `figure-3-4-1-50x50-grid-model.png` | Chapter 3, after the graph-size equations for the 50x50 grid if Section 3.4.1 is added | Obstacle-free 50 x 50 grid instantiated in the implemented visualizer. The board contains \|V\| = 2500 cells and, under 4-connected movement, \|E\| = 4900 undirected adjacency edges. |
| `figure-3-4-2-50x50-race-start.png` | Chapter 3, before the empirical BFS/A* branching-factor comparison | Race Mode initialized on the same obstacle-free 50 x 50 graph for BFS and A*. Both algorithms are evaluated on the identical start state s=(25,5) and target state t=(25,44). |
| `figure-3-4-3-50x50-bfs-astar-result.png` | Chapter 3, after the finite-grid BFS bound | Completed 50 x 50 obstacle-free comparison. BFS expanded 1625 states before reaching the target, while A* expanded 40 states and followed the optimal path directly. |
| `figure-3-4-4-50x50-branching-analysis.png` | Chapter 3, after the heuristic-induced search-space compression claim | Formal result analysis for the 50 x 50 run. The implementation reports b<sub>graph</sub> = 3.92 for both algorithms, b<sub>observed</sub> = 3.94 for BFS and 3.90 for A*, and b<sub>effective</sub> reduced from 1.15 for BFS to 1.00 for A*. |
| `figure-4-7-settings-and-grid-scale.png` | Chapter 4, Section 4.1.2 or Section 4.7.1 | Simulation settings dialog showing animation speed, Pause-Prediction cadence, equation-overlay control, and configurable grid size. These controls define the experimental conditions used by the visualizer. |
| `figure-4-8-knowledge-space-manifesto-panel.png` | Chapter 4, Section 4.3 or Chapter 5, Section 5.6 | Knowledge-space side panel representing the active run as K = (A, D, S). The interface exposes artifacts, generated trace documents, schema dimensions, retrieval expressions, and verification constraints used to audit algorithm behaviour. |
| `figure-4-9-score-hud-prediction-loop.png` | Chapter 4, Section 4.5 or Chapter 5, Section 5.4 | Pause-Prediction scoring interface after a learner response. The HUD records score, accuracy, attempts, and response-time signals, connecting prediction feedback to measurable learning indicators. |
| `figure-4-10-truth-scanner-concept-layer.png` | Chapter 4, after Section 4.6 as a new concept-layer subsection | Truth Scanner concept layer explaining the graph model, branching factor, BFS rule, A* priority rule, and heuristic interpretation in prose linked to formal terms. |
| `figure-4-11-truth-scanner-concept-tabs.png` | Same new Truth Scanner subsection, after the overview screenshot | Truth Scanner concept tabs for formal vocabulary such as graph model, effective branching, g(n), h(n), f(n), frontier, admissibility, consistency, relaxation, Pause-Prediction, and space complexity. |

## Thesis Text To Add Or Strengthen

Add a short paragraph in Chapter 1 or Chapter 4 describing the landing/configuration screen as part of the experimental protocol. The current thesis discusses user-defined mazes, but the implemented app now explicitly asks users to choose board scale and equation instrumentation before entering the lab.

Add implementation detail in Chapter 4 for configurable grid sizes: small 10x25, default 20x50, large 30x75, and custom grids bounded by 8-50 rows and 12-80 columns. This matters because the evaluation is about scaling behaviour and branching metrics.

Add a subsection for the Truth Scanner. The PDF currently does not mention it, but the project implements it as a mathematical concept layer covering graph model, branching factor, effective branching, g(n), h(n), f(n), frontier, admissibility, consistency, relaxation, Pause-Prediction, and space complexity.

Strengthen the schema-guided audit discussion by pointing to the live side panel. The thesis discusses K=(A,D,S), R(A,S), D<sub>rel</sub>, and verification, but the project exposes these constructs directly in the UI.

Mention timeline controls and Spacebar pause in Chapter 4. The thesis explains Pause-Prediction, but the implementation also supports pausing/resuming and stepping through traversal with rewind/fast-forward controls.

Mention CSV data export in Chapter 4 or Chapter 5. The project records run rows with turn, timestamp, mode, algorithm, nodes visited, and path length, which supports external evaluation and reproducibility.

If you keep the 50x50 proof material, add it as a new Chapter 3 subsection because it gives a strong visual bridge between asymptotic equations and a concrete implemented run.
