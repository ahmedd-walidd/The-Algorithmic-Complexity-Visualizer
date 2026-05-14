# Thesis Figure Captions

## figure-3-4-1-50x50-grid-model.png
Suggested placement: Chapter 3, Section 3.4.1, immediately after the equations |V| = 2500 and |E| = 4900.

Caption: Obstacle-free 50 x 50 grid instantiated in the implemented visualizer. The board contains |V| = 2500 cells and, under 4-connected movement, |E| = 4900 undirected adjacency edges.

## figure-3-4-2-50x50-race-start.png
Suggested placement: Chapter 3, Section 3.4.1, optional setup figure before the BFS and A* branching-factor comparison.

Caption: Race Mode initialized on the same obstacle-free 50 x 50 graph for BFS and A*. Both algorithms are evaluated on the identical start state s=(25,5) and target state t=(25,44).

## figure-3-4-3-50x50-bfs-astar-result.png
Suggested placement: Chapter 3, Section 3.4.1, immediately after the paragraph ending "BFS cannot expand more than all reachable cells: NBFS <= 2500."

Caption: Completed 50 x 50 obstacle-free comparison. BFS expanded 1625 states before reaching the target, while A* expanded 40 states and followed the optimal path directly.

## figure-3-4-4-50x50-branching-analysis.png
Suggested placement: Chapter 3, Section 3.4.1, immediately after the final sentence about "heuristic-induced search-space compression."

Caption: Formal result analysis for the 50 x 50 run. The implementation reports b_graph = 3.92 for both algorithms, b_observed = 3.94 for BFS and 3.90 for A*, and b_effective reduced from 1.15 for BFS to 1.00 for A*.

## figure-4-1-system-overview.png
Suggested placement: Chapter 4, Section 4.1 System Overview / 4.1.2 Key Components

Caption: System overview of the Algorithmic Complexity Visualizer. The interface combines the grid artifact, algorithm controls, run state, and the schema-guided knowledge panel K = (A, D, S) used to ground visual execution in formal audit concepts.

## figure-4-2-custom-maze-editor.png
Suggested placement: Chapter 4, Section 4.1.5 User Workflow / 4.5.1 User Journey

Caption: Custom maze editing and obstacle configuration. Learners can generate or draw blocked cells on the 20 x 50 grid, defining the graph artifact G = (V, E) before executing BFS or A*.

## figure-4-3-prediction-checkpoint.png
Suggested placement: Chapter 4, Section 4.6 Prediction Mechanism

Caption: Pause-Prediction checkpoint during A* execution. The visualizer pauses at a frontier decision point, highlights candidate nodes, and asks the learner to predict the next expansion according to the algorithm rule.

## figure-4-4-prediction-feedback.png
Suggested placement: Chapter 4, Section 4.6.5 User Feedback System / 4.6.6 Gamification Design

Caption: Immediate prediction feedback. A selected candidate is evaluated against the formal next-node rule, and the interface explains whether the choice satisfies BFS depth ordering or A* f(n) = g(n) + h(n) minimization.

## figure-4-5-mathematical-trace.png
Suggested placement: Chapter 4, Section 4.6.8 Frontend Architecture / Chapter 5, Section 5.3

Caption: Mathematical trace view for a completed single-algorithm run. Each expansion is represented with its selected node, scoring equation, decision rule, and neighbor audit evidence.

## figure-5-1-race-mode-comparison.png
Suggested placement: Chapter 5, Section 5.1 Algorithm Performance Evaluation

Caption: Race Mode comparison between BFS and A*. Both algorithms run on the same maze artifact, allowing node-expansion and shortest-path metrics to be compared under identical conditions.

## figure-5-2-formal-result-analysis.png
Suggested placement: Chapter 5, Section 5.3 System Validation and Framework Alignment

Caption: Formal result analysis generated after execution. The summary links measured outputs, complexity indicators, effective branching behaviour, and prediction-learning signals to the audited run.

## figure-4-6-visual-legend.png
Suggested placement: Chapter 4, Section 4.5.4 Visual Feedback Language

Caption: Visualizer legend mapping colors and node states to semantic meaning, including start, goal, obstacle, visited state, shortest path, quiz candidate, and paused next-choice markers.
