# Overleaf Placement Guide for Implementation Screenshots

Use the PNG files in `docs/thesis-figures/`. For Overleaf, upload the images into a folder such as `figures/implementation/`, then reference them with `\includegraphics`.

The strongest thesis set is 10-12 figures. The remaining images are useful backups if a page has extra space.

## Recommended Figure Sequence

### Chapter 1, Section 1.2: From Visualiser to Graph Search Auditor

Use `landing-experiment-setup.png`.

Purpose: introduces the completed implementation as an audit lab rather than a passive animation page.

Suggested caption:

```latex
\caption{Experiment setup screen of the Algorithmic Complexity Visualizer. The learner configures the grid scale and instrumentation before entering the audit lab, making the graph instance explicit before execution.}
```

### Chapter 3, Section 3.4: A* Trace Validation Rule

Use `prediction-checkpoint-lab.png`.

Purpose: visually connects the formal next-expansion rule to the UI state where candidates are highlighted. This is better than a text-heavy screenshot because the colored candidate nodes carry the main meaning.

Suggested caption:

```latex
\caption{Pause-prediction checkpoint during A* execution. Candidate frontier nodes are highlighted and the learner must choose the next expansion according to the minimum $f(n)=g(n)+h(n)$ rule.}
```

### Chapter 3, Section 3.4.1: 50x50 Branching-Factor Analysis

Use these as a compact sequence:

1. `50x50-grid-model.png`
2. `50x50-bfs-astar-result.png`
3. `50x50-branching-analysis.png`

Purpose: shows the actual implemented 50x50 graph, the visual BFS vs A* result, and the formal metric summary.

Suggested caption for the result figure:

```latex
\caption{Completed 50 by 50 obstacle-free comparison. BFS expands a broad region of the graph, while A* follows the direct optimal route under the Manhattan heuristic.}
```

### Chapter 4, Section 4.1: Methodological Aim and System Overview

Use `system-overview-lab.png`.

Purpose: establishes the main implemented workspace: controls, grid artifact, execution state, and audit panel.

Suggested caption:

```latex
\caption{Implemented visualizer workspace. The interface combines maze construction, algorithm selection, graph execution, trace logging, and the side audit panel in one environment.}
```

### Chapter 4, Section 4.1.1: System Components

Use `ui-building-block-control-panel.png`.

Purpose: close-up of the UI building blocks: algorithm selector, race mode, obstacle editing, pause-prediction toggle, and execution controls. This is one of the best "implementation building block" figures.

Suggested caption:

```latex
\caption{Control-panel building blocks used by the implementation. The panel exposes algorithm selection, race mode, obstacle editing, pause-prediction, and timeline controls.}
```

### Chapter 4, Section 4.2: Maze Artifact and Graph Representation

Use `ui-building-block-grid-artifact.png` or `custom-maze-editor-lab.png`.

Purpose: shows the grid as the concrete maze artifact. Prefer `ui-building-block-grid-artifact.png` if you want a tighter, less text-heavy figure.

Suggested caption:

```latex
\caption{Grid artifact used to instantiate the graph model. Walls, start state, goal state, and traversable cells define the visual maze that is mapped to $G=(V,E)$.}
```

### Chapter 4, Section 4.3.1: Heuristic Audit and Truth Scanner Implementation

Use `mathematical-trace-lab.png` or `knowledge-space-manifesto-panel.png`.

Purpose: shows that the implementation records and exposes trace evidence, not only animation. Use `mathematical-trace-lab.png` when discussing A* scores; use `knowledge-space-manifesto-panel.png` when discussing the schema-guided audit model.

Suggested caption:

```latex
\caption{Trace-audit panel for a completed A* run. The implementation exposes the selected expansion, frontier evidence, and score components used to validate the search decision.}
```

### Chapter 4, Section 4.5: Feedback and Learning Signal Design

Use `prediction-feedback-lab.png` and optionally `score-hud-prediction-loop.png`.

Purpose: shows the implemented learning loop after a response. The screenshot is visually useful because the feedback state and node colors show the interaction outcome.

Suggested caption:

```latex
\caption{Prediction feedback after a learner response. The interface marks the selected node against the valid next-expansion choice and updates the pause-prediction score state.}
```

### Chapter 4, Section 4.5.4: Visual Feedback Language

Use `visual-legend-lab.png` or `ui-building-block-node-states.png`.

Purpose: supports your explanation of UI colors and node states. Prefer `ui-building-block-node-states.png` if you want less modal text and more grid visual evidence.

Suggested caption:

```latex
\caption{Implemented node-state language. Color and cell styling distinguish start, goal, walls, visited nodes, shortest-path nodes, and prediction candidates.}
```

### Chapter 4, Section 4.7.1: Experimental Conditions

Use `settings-and-grid-scale.png`.

Purpose: documents configurable speed, pause-prediction cadence, equation overlay, and grid scale.

Suggested caption:

```latex
\caption{Simulation settings used to configure execution conditions. The implementation supports animation speed, pause-prediction interval, equation overlay, and grid-size selection.}
```

### Chapter 5, Section 5.1: Overview of Evaluation Results

Use `race-mode-comparison-lab.png`.

Purpose: shows the same maze artifact evaluated by BFS and A* side by side.

Suggested caption:

```latex
\caption{Race-mode comparison between BFS and A*. Both algorithms execute on the same maze artifact, allowing node expansion and path metrics to be compared under identical conditions.}
```

### Chapter 5, Section 5.4: Heuristic Audit and Truth Scanner Validation

Use `formal-result-analysis-lab.png`.

Purpose: supports the results chapter by showing the completed run summary and formal metric ledger.

Suggested caption:

```latex
\caption{Formal result analysis generated after execution. The summary connects measured outputs, branching metrics, path depth, and prediction signals to the audited run.}
```

### Chapter 5, Section 5.4.1: Implementation Validation Script

Use `truth-scanner-concept-layer.png` or `truth-scanner-concept-tabs.png`.

Purpose: shows the Truth Scanner layer as an implementation artifact that links formal vocabulary to validation concepts. These are more text-heavy, so use at most one.

Suggested caption:

```latex
\caption{Truth Scanner interface layer. Formal graph-search concepts are organized into inspectable tabs that support validation of the implemented audit claims.}
```

## Optional Figure Grouping

If page count is tight, combine related screenshots as subfigures:

```latex
\begin{figure}[htbp]
  \centering
  \begin{subfigure}{0.48\textwidth}
    \includegraphics[width=\linewidth]{figures/implementation/ui-building-block-control-panel.png}
    \caption{Control panel}
  \end{subfigure}
  \hfill
  \begin{subfigure}{0.48\textwidth}
    \includegraphics[width=\linewidth]{figures/implementation/ui-building-block-grid-artifact.png}
    \caption{Grid artifact}
  \end{subfigure}
  \caption{Implementation building blocks of the visualizer workspace.}
\end{figure}
```

## Practical Overleaf Notes

- Prefer `width=\textwidth` for full workspace screenshots.
- Prefer `width=0.75\textwidth` for cropped UI building-block screenshots.
- Avoid placing more than two text-heavy screenshots back to back.
- The clearest UI-first figures are `ui-building-block-control-panel.png`, `ui-building-block-grid-artifact.png`, `ui-building-block-node-states.png`, `prediction-checkpoint-lab.png`, `prediction-feedback-lab.png`, and `race-mode-comparison-lab.png`.
