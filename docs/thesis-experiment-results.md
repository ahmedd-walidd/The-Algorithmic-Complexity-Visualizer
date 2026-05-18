# Thesis Experiment Results

Generated at: 2026-04-30T14:12:25.065Z

## Method

The experiment ran 40 deterministic trials for each grid size, wall density, and algorithm. Each trial used the project implementation of BFS and A* with formal traces enabled.

The tested grid sizes were Small (10x25), App default (20x50), and Large (30x75). Wall densities were 0%, 15%, 25%, and 35%. A direct start-goal corridor was kept open in every grid so the algorithms always had a valid path.

Important learning note: the automated experiment measures search behavior and the number of prediction-pause opportunities. It does not prove human learning improvement by itself. To claim learning gain, use the app logs with a participant pre/post or control-group study.

## A* Heuristic Audit Trace

Table 3.5 was captured from one deterministic real maze run using the implemented A* formal trace: Small 10x25, 25% wall density, trial 7, seed 10275007, start (5, 2), goal (5, 22).

| Step | Candidate Node | g(n) | h(n) | f(n) | Selected? |
|---:|---|---:|---:|---:|---|
| 2 | (5, 3) | 1 | 19 | 20 | Yes |
| 2 | (4, 2) | 1 | 21 | 22 | No |
| 2 | (6, 2) | 1 | 21 | 22 | No |
| 2 | (5, 1) | 1 | 21 | 22 | No |
| 3 | (5, 4) | 2 | 18 | 20 | Yes |
| 3 | (4, 3) | 2 | 20 | 22 | No |
| 3 | (6, 3) | 2 | 20 | 22 | No |
| 3 | (4, 2) | 1 | 21 | 22 | No |
| 3 | (6, 2) | 1 | 21 | 22 | No |
| 3 | (5, 1) | 1 | 21 | 22 | No |

For each audited step, the selected candidate has the minimum frontier f(n)=g(n)+h(n). This verifies that the animated expansion agrees with the theoretical A* rule used in the teaching explanation.

## Algorithm Efficiency And Branching

| Size | Density | Algorithm | Trials | Visited nodes | Path depth | b<sub>graph</sub> | b<sub>observed</sub> | b<sub>effective</sub> | Max frontier | Prediction pauses | Compute ms |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Small | 0% | BFS | 40 | 205.0 +/- 0.0 | 20.0 +/- 0.0 | 3.72 +/- 0.00 | 3.75 +/- 0.00 | 1.19 +/- 0.00 | 15.0 +/- 0.0 | 13.0 +/- 0.0 | 0.356 +/- 0.294 |
| Small | 0% | A* | 40 | 21.0 +/- 0.0 | 20.0 +/- 0.0 | 3.72 +/- 0.00 | 3.81 +/- 0.00 | 1.00 +/- 0.00 | 42.0 +/- 0.0 | 1.0 +/- 0.0 | 0.132 +/- 0.138 |
| Small | 15% | BFS | 40 | 178.1 +/- 5.6 | 20.0 +/- 0.0 | 3.22 +/- 0.10 | 3.27 +/- 0.10 | 1.18 +/- 0.00 | 13.5 +/- 1.1 | 11.3 +/- 0.5 | 0.201 +/- 0.119 |
| Small | 15% | A* | 40 | 21.0 +/- 0.0 | 20.0 +/- 0.0 | 3.22 +/- 0.10 | 3.55 +/- 0.10 | 1.00 +/- 0.00 | 36.5 +/- 2.2 | 1.0 +/- 0.0 | 0.074 +/- 0.023 |
| Small | 25% | BFS | 40 | 151.8 +/- 10.8 | 20.0 +/- 0.0 | 2.86 +/- 0.12 | 2.94 +/- 0.12 | 1.17 +/- 0.01 | 12.0 +/- 1.2 | 9.5 +/- 0.7 | 0.168 +/- 0.144 |
| Small | 25% | A* | 40 | 21.0 +/- 0.0 | 20.0 +/- 0.0 | 2.86 +/- 0.12 | 3.32 +/- 0.13 | 1.00 +/- 0.00 | 31.7 +/- 2.7 | 1.0 +/- 0.0 | 0.053 +/- 0.010 |
| Small | 35% | BFS | 40 | 125.0 +/- 12.4 | 20.0 +/- 0.0 | 2.56 +/- 0.13 | 2.72 +/- 0.12 | 1.15 +/- 0.01 | 10.7 +/- 1.1 | 7.8 +/- 0.8 | 0.084 +/- 0.036 |
| Small | 35% | A* | 40 | 21.0 +/- 0.0 | 20.0 +/- 0.0 | 2.56 +/- 0.13 | 3.10 +/- 0.15 | 1.00 +/- 0.00 | 27.0 +/- 3.0 | 1.0 +/- 0.0 | 0.056 +/- 0.030 |
| App default | 0% | BFS | 40 | 800.0 +/- 0.0 | 39.0 +/- 0.0 | 3.86 +/- 0.00 | 3.88 +/- 0.00 | 1.12 +/- 0.00 | 31.0 +/- 0.0 | 53.0 +/- 0.0 | 1.129 +/- 0.440 |
| App default | 0% | A* | 40 | 40.0 +/- 0.0 | 39.0 +/- 0.0 | 3.86 +/- 0.00 | 3.90 +/- 0.00 | 1.00 +/- 0.00 | 80.0 +/- 0.0 | 2.0 +/- 0.0 | 0.215 +/- 0.092 |
| App default | 15% | BFS | 40 | 683.1 +/- 11.7 | 39.0 +/- 0.0 | 3.31 +/- 0.05 | 3.34 +/- 0.05 | 1.12 +/- 0.00 | 28.9 +/- 2.0 | 45.0 +/- 0.8 | 0.815 +/- 0.200 |
| App default | 15% | A* | 40 | 40.0 +/- 0.0 | 39.0 +/- 0.0 | 3.31 +/- 0.05 | 3.61 +/- 0.08 | 1.00 +/- 0.00 | 68.3 +/- 3.3 | 2.0 +/- 0.0 | 0.182 +/- 0.075 |
| App default | 25% | BFS | 40 | 591.8 +/- 19.0 | 39.0 +/- 0.0 | 2.93 +/- 0.05 | 2.99 +/- 0.05 | 1.11 +/- 0.00 | 26.4 +/- 2.0 | 39.0 +/- 1.3 | 0.661 +/- 0.330 |
| App default | 25% | A* | 40 | 40.0 +/- 0.0 | 39.0 +/- 0.0 | 2.93 +/- 0.05 | 3.40 +/- 0.09 | 1.00 +/- 0.00 | 59.9 +/- 3.5 | 2.0 +/- 0.0 | 0.186 +/- 0.084 |
| App default | 35% | BFS | 40 | 464.9 +/- 43.7 | 39.0 +/- 0.0 | 2.57 +/- 0.08 | 2.71 +/- 0.08 | 1.10 +/- 0.00 | 21.9 +/- 3.2 | 30.5 +/- 3.0 | 0.530 +/- 0.188 |
| App default | 35% | A* | 40 | 40.0 +/- 0.0 | 39.0 +/- 0.0 | 2.57 +/- 0.08 | 3.20 +/- 0.10 | 1.00 +/- 0.00 | 52.1 +/- 3.9 | 2.0 +/- 0.0 | 0.157 +/- 0.032 |
| Large | 0% | BFS | 40 | 1815.0 +/- 0.0 | 60.0 +/- 0.0 | 3.91 +/- 0.00 | 3.92 +/- 0.00 | 1.09 +/- 0.00 | 45.0 +/- 0.0 | 120.0 +/- 0.0 | 3.221 +/- 0.785 |
| Large | 0% | A* | 40 | 61.0 +/- 0.0 | 60.0 +/- 0.0 | 3.91 +/- 0.00 | 3.93 +/- 0.00 | 1.00 +/- 0.00 | 122.0 +/- 0.0 | 4.0 +/- 0.0 | 0.424 +/- 0.135 |
| Large | 15% | BFS | 40 | 1549.0 +/- 15.3 | 60.0 +/- 0.0 | 3.34 +/- 0.03 | 3.36 +/- 0.03 | 1.08 +/- 0.00 | 42.6 +/- 2.4 | 102.7 +/- 1.0 | 2.737 +/- 0.705 |
| Large | 15% | A* | 40 | 61.0 +/- 0.0 | 60.0 +/- 0.0 | 3.34 +/- 0.03 | 3.65 +/- 0.05 | 1.00 +/- 0.00 | 104.7 +/- 3.3 | 4.0 +/- 0.0 | 0.317 +/- 0.032 |
| Large | 25% | BFS | 40 | 1348.8 +/- 21.1 | 60.0 +/- 0.0 | 2.96 +/- 0.03 | 3.00 +/- 0.04 | 1.08 +/- 0.00 | 38.5 +/- 3.7 | 89.4 +/- 1.4 | 1.990 +/- 0.450 |
| Large | 25% | A* | 40 | 61.0 +/- 0.0 | 60.0 +/- 0.0 | 2.96 +/- 0.03 | 3.46 +/- 0.09 | 1.00 +/- 0.00 | 92.8 +/- 5.3 | 4.0 +/- 0.0 | 0.285 +/- 0.021 |
| Large | 35% | BFS | 40 | 1065.8 +/- 70.0 | 60.0 +/- 0.0 | 2.60 +/- 0.04 | 2.71 +/- 0.04 | 1.07 +/- 0.00 | 31.6 +/- 3.2 | 70.5 +/- 4.7 | 1.335 +/- 0.433 |
| Large | 35% | A* | 40 | 61.0 +/- 0.0 | 60.0 +/- 0.0 | 2.60 +/- 0.04 | 3.24 +/- 0.08 | 1.00 +/- 0.00 | 79.8 +/- 5.2 | 4.0 +/- 0.0 | 0.242 +/- 0.014 |

## BFS Versus A*

| Size | Density | BFS visited | A* visited | A* expansion reduction | BFS pause opportunities | A* pause opportunities |
|---|---:|---:|---:|---:|---:|---:|
| Small | 0% | 205.0 | 21.0 | 89.8% | 13.0 | 1.0 |
| Small | 15% | 178.1 | 21.0 | 88.2% | 11.3 | 1.0 |
| Small | 25% | 151.8 | 21.0 | 86.2% | 9.5 | 1.0 |
| Small | 35% | 125.0 | 21.0 | 83.2% | 7.8 | 1.0 |
| App default | 0% | 800.0 | 40.0 | 95.0% | 53.0 | 2.0 |
| App default | 15% | 683.1 | 40.0 | 94.1% | 45.0 | 2.0 |
| App default | 25% | 591.8 | 40.0 | 93.2% | 39.0 | 2.0 |
| App default | 35% | 464.9 | 40.0 | 91.4% | 30.5 | 2.0 |
| Large | 0% | 1815.0 | 61.0 | 96.6% | 120.0 | 4.0 |
| Large | 15% | 1549.0 | 61.0 | 96.1% | 102.7 | 4.0 |
| Large | 25% | 1348.8 | 61.0 | 95.5% | 89.4 | 4.0 |
| Large | 35% | 1065.8 | 61.0 | 94.3% | 70.5 | 4.0 |

## Thesis Interpretation

- BFS behaves like exhaustive breadth expansion in the reachable state space. Its formal rule is v_i = argmin g(u), so the frontier grows by distance layers.
- A* behaves like informed search. Its formal rule is v_i = argmin f(u)=g(u)+h(u). In this implementation h is the exact remaining grid distance, so A* expands far fewer states while preserving the same shortest path depth.
- The b<sub>graph</sub> value estimates average graph branching from the grid topology, while b<sub>observed</sub> estimates the legal successor branching encountered during expansion. b<sub>effective</sub> estimates the branching factor that would generate the observed number of expanded states at the measured solution depth.
- Prediction-pause opportunities scale with visited nodes: BFS usually creates more prompts because it expands more states, while A* creates fewer but more targeted prompts. To evaluate learning, compare participant accuracy, attempts, response time, and pre/post test scores with Pause-Prediction enabled versus disabled.

## Explanation Validity Audit

The explanation-validity audit was computed over 1,920 generated feedback statements collected from 960 deterministic runs. The run set consisted of 3 grid sizes, 4 wall-density levels, 40 trials per condition, and 2 algorithms. For each run, the audit checked two generated feedback statements against the recorded trace evidence: the node-selection rule explanation and the generated step/feedback summary.

A statement was marked valid if it could be directly matched to one of the retrieved evidence items in Drel, such as a queue state, frontier trace row, metric table, or formal decision rule. Unsupported statements were cases where the explanation was too general, ambiguous under tie conditions, or not directly entailed by the recorded trace.

The resulting audit counts were 1,786 supported statements and 134 unsupported statements, giving 93.02% explanation validity and 6.98% unsupported explanations. By algorithm, BFS had 874 supported statements out of 960 audited statements, or 91.04%, while A* had 912 supported statements out of 960 audited statements, or 95.00%.

