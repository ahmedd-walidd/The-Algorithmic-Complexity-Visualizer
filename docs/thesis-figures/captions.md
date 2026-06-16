# Thesis Figure Captions

## landing-experiment-setup.png
Suggested placement: Chapter 1, Section 1.2 From visualizer to Graph Search Auditor / Chapter 4 before Section 4.1.1 System Components

Caption: Experiment initialization screen of the Algorithmic Complexity Visualizer. The learner selects the grid scale and equation-overlay instrumentation before entering the audit lab, making the chosen problem instance explicit before algorithm execution.

## 50x50-grid-model.png
Suggested placement: Chapter 3, Section 3.4.1, immediately after the equations |V| = 2500 and |E| = 4900

Caption: Obstacle-free 50 x 50 grid instantiated in the implemented visualizer. The board contains |V| = 2500 cells and, under 4-connected movement, |E| = 4900 undirected adjacency edges.

## 50x50-race-start.png
Suggested placement: Chapter 3, Section 3.4.1, optional setup figure before the BFS and A* branching-factor comparison

Caption: Race Mode initialized on the same obstacle-free 50 x 50 graph for BFS and A*. Both algorithms are evaluated on the identical start state s=(25,5) and target state t=(25,44).

## 50x50-bfs-astar-result.png
Suggested placement: Chapter 3, Section 3.4.1, immediately after the finite-grid BFS bound

Caption: Completed 50 x 50 obstacle-free comparison. BFS expanded 1625 states before reaching the target, while A* expanded 40 states and followed the optimal path directly.

## 50x50-branching-analysis.png
Suggested placement: Chapter 3, Section 3.4.1, immediately after the final search-space compression claim

Caption: Formal result analysis for the 50 x 50 run. The implementation reports b<sub>graph</sub> as 3.92 for both algorithms, b<sub>observed</sub> as 3.94 for BFS and 3.90 for A*, and b<sub>effective</sub> reduced from 1.15 for BFS to 1.00 for A*.

## system-overview-lab.png
Suggested placement: Chapter 4, Section 4.1 System Overview / 4.1.2 Key Components

Caption: System overview of the Algorithmic Complexity Visualizer. The interface combines the grid artifact, algorithm controls, run state, and the schema-guided knowledge panel K = (A, D, S) used to ground visual execution in formal audit concepts.

## custom-maze-editor-lab.png
Suggested placement: Chapter 4, Section 4.1.5 User Workflow / 4.5.1 User Journey

Caption: Custom maze editing and obstacle configuration. Learners can generate or draw blocked cells on the 20 x 50 grid, defining the graph artifact G = (V, E) before executing BFS or A*.

## prediction-checkpoint-lab.png
Suggested placement: Chapter 4, Section 4.6 Prediction Mechanism

Caption: Pause-Prediction checkpoint during A* execution. The visualizer pauses at a frontier decision point, highlights candidate nodes, and asks the learner to predict the next expansion according to the algorithm rule.

## prediction-feedback-lab.png
Suggested placement: Chapter 4, Section 4.6.5 User Feedback System / 4.6.6 Gamification Design

Caption: Immediate prediction feedback. A selected candidate is evaluated against the formal next-node rule, and the interface explains whether the choice satisfies BFS depth ordering or A* f(n) = g(n) + h(n) minimization.

## mathematical-trace-lab.png
Suggested placement: Chapter 4, Section 4.6.8 Frontend Architecture / Chapter 5, Section 5.3

Caption: Mathematical trace view for a completed single-algorithm run. Each expansion is represented with its selected node, scoring equation, decision rule, and neighbor audit evidence.

## race-mode-comparison-lab.png
Suggested placement: Chapter 5, Section 5.1 Algorithm Performance Evaluation

Caption: Race Mode comparison between BFS and A*. Both algorithms run on the same maze artifact, allowing node-expansion and shortest-path metrics to be compared under identical conditions.

## formal-result-analysis-lab.png
Suggested placement: Chapter 5, Section 5.3 System Validation and Framework Alignment

Caption: Formal result analysis generated after execution. The summary links measured outputs, complexity indicators, effective branching behaviour, and prediction-learning signals to the audited run.

## visual-legend-lab.png
Suggested placement: Chapter 4, Section 4.5.4 Visual Feedback Language

Caption: Visualizer legend mapping colors and node states to semantic meaning, including start, goal, obstacle, visited state, shortest path, quiz candidate, and paused next-choice markers.

## settings-and-grid-scale.png
Suggested placement: Chapter 4, Section 4.1.2 Implementation Stack / 4.7.1 Experimental Conditions

Caption: Simulation settings dialog showing animation speed, Pause-Prediction cadence, equation-overlay control, and configurable grid size. These controls define the experimental conditions used by the visualizer.

## knowledge-space-manifesto-panel.png
Suggested placement: Chapter 4, Section 4.3 Algorithm Execution and Trace Logging / Chapter 5, Section 5.6

Caption: Knowledge-space side panel representing the active run as K = (A, D, S). The interface exposes artifacts, generated trace documents, schema dimensions, retrieval expressions, and verification constraints used to audit algorithm behaviour.

## score-hud-prediction-loop.png
Suggested placement: Chapter 4, Section 4.5 Feedback and Learning Signal Design / Chapter 5, Section 5.4

Caption: Pause-Prediction scoring interface after a learner response. The HUD records score, accuracy, attempts, and response-time signals, connecting prediction feedback to measurable learning indicators.

## truth-scanner-concept-layer.png
Suggested placement: Chapter 4, after Section 4.6 System Architecture and Execution Loop

Caption: Truth Scanner concept layer explaining the graph model, branching factor, BFS rule, A* priority rule, and heuristic interpretation in prose linked to formal terms.

## truth-scanner-concept-tabs.png
Suggested placement: Chapter 4, after Section 4.6 System Architecture and Execution Loop

Caption: Truth Scanner concept tabs for formal vocabulary such as graph model, effective branching, g(n), h(n), f(n), frontier, admissibility, consistency, relaxation, Pause-Prediction, and space complexity.
