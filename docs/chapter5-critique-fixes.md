# Chapter 5 Critique Fixes

Use these insertions in `c:\Users\ahmed\Downloads\final-draft2.md`. Line numbers refer to the current Markdown export inspected on 2026-06-06.

## 1. Add A* Trace Table

Placement: Chapter 5, Section 5.4, immediately after the paragraph ending:

> These logs support the reported BFS and A* node-expansion results, path depths, effective branching-factor calculations, runtime measurements, maximum frontier sizes, and prediction-pause counts. They also support the formal A* trace examples used in the heuristic audit, including the recorded values of g(n), h_M(n), and f(n) = g(n) + h_M(n) for audited frontier candidates.

In the current export, place this after line 3402 and before "Table 5.5 summarises the validation coverage provided by the exported logs."

Suggested table text:

Table 5.5: Example A* frontier trace from one deterministic audit run. The run uses the implemented Manhattan heuristic on a small 10 x 25 grid with 25% wall density, trial 7, seed 10275007, start (5, 2), and goal (5, 22). The selected candidate in each audited step has the minimum f(n) value on the frontier.

| Step | Candidate node | g(n) | h_M(n) | f(n)=g+h_M | Selected |
|---:|---|---:|---:|---:|---|
| 2 | (5, 3) | 1 | 19 | 20 | Yes |
| 2 | (4, 2) | 1 | 21 | 22 | No |
| 2 | (5, 1) | 1 | 21 | 22 | No |
| 2 | (6, 2) | 1 | 21 | 22 | No |
| 3 | (5, 4) | 2 | 18 | 20 | Yes |
| 3 | (6, 3) | 2 | 20 | 22 | No |
| 3 | (4, 3) | 2 | 20 | 22 | No |
| 3 | (6, 2) | 1 | 21 | 22 | No |
| 3 | (4, 2) | 1 | 21 | 22 | No |
| 3 | (5, 1) | 1 | 21 | 22 | No |

This trace is important because it shows the audit evidence behind the visual expansion, not only the final path. At step 2, A* selects (5, 3) because f(5,3)=1+19=20, while the other frontier candidates have f=22. At step 3, it selects (5, 4) because f(5,4)=2+18=20, while the remaining candidates again have f=22. Therefore, the recorded expansion agrees with the formal A* rule used by the Truth Scanner.

Note: If the thesis uses automatic table numbering, this will become the new Table 5.5 and the existing trace-coverage table will become Table 5.6. If numbering is manual, rename the existing "Table 5.5: Trace-evidence coverage..." to "Table 5.6".

## 2. Add Compact Frontier And Observed Branching Table

Placement: Chapter 5, Section 5.2.3, immediately after the existing Table 5.2 and before the sentence:

> This metric should not be confused with the maximum grid branching factor.

In the current export, place this after line 3090 and before line 3091.

Suggested table text:

Table 5.3: Compact frontier and observed-branching evidence for representative 25% wall-density runs. Maximum frontier reports the largest frontier snapshot recorded during a run. Observed branching factor reports the mean number of legal successors encountered per expansion. Values are mean +/- standard deviation over 40 deterministic trials.

| Grid size | Algorithm | Max frontier | Observed branching factor |
|---|---|---:|---:|
| Small 10 x 25 | BFS | 12.0 +/- 1.2 | 2.94 +/- 0.12 |
| Small 10 x 25 | A* | 31.7 +/- 2.7 | 3.32 +/- 0.13 |
| Default 20 x 50 | BFS | 26.4 +/- 2.0 | 2.99 +/- 0.05 |
| Default 20 x 50 | A* | 59.9 +/- 3.5 | 3.40 +/- 0.09 |
| Large 30 x 75 | BFS | 38.5 +/- 3.7 | 3.00 +/- 0.04 |
| Large 30 x 75 | A* | 92.8 +/- 5.3 | 3.46 +/- 0.09 |

The table separates frontier width from expanded-node count. In these representative runs, A* expands far fewer nodes than BFS, but its maximum frontier can be larger because the priority queue keeps multiple alternative candidates available while the heuristic-selected path advances. Therefore, the headline evaluation should describe A* as reducing expanded nodes and effective branching factor, not as universally reducing every memory-adjacent frontier metric.

Note: If this table is inserted before the current "Table 5.3: Formal branching-factor comparison...", rename the current Table 5.3 to Table 5.4 and shift later manual table numbers by one. If you want to avoid renumbering pressure, place it as an unnumbered "Representative frontier note"; but a numbered table is stronger.

## 3. Compress Runtime To A Secondary Note

Placement: Replace the current Section 5.2.5 "Computation Time" text. In the current export, this is lines 3208-3229.

Suggested replacement:

## 5.2.5 Computation Time as a Secondary Metric

Runtime was recorded for each algorithm run, but it is treated as secondary evidence rather than as a headline evaluation metric. The reason is that JavaScript timing can be affected by browser state, hardware, rendering boundaries, priority-queue implementation details, and measurement overhead. Expanded nodes, solution depth, frontier size, observed branching factor, and effective branching factor are more stable indicators of graph-search behaviour because they are derived from the recorded algorithm trace.

As a representative timing example from the deterministic export, the large 30 x 75 open-grid condition recorded BFS at 3.666 +/- 1.201 ms and A* at 0.815 +/- 0.278 ms over 40 trials. This is consistent with the expansion results, where BFS expanded 1815.0 nodes and A* expanded 61.0 nodes in the same condition. However, the timing values should be read only as implementation-level measurements, not as universal runtime guarantees.

This change directly addresses the critique: runtime remains present, but it is no longer competing with the stronger trace-based metrics.

## 4. Add Adversarial-Maze Stress Test

Placement: Add a new subsection after Section 5.2.5 and before Section 5.3 "Pause-Prediction Opportunity Analysis". In the current export, insert after line 3229 and before line 3230.

Suggested subsection:

## 5.2.6 Adversarial Maze Stress Test

The main experiment uses corridor-preserving mazes so that BFS and A* are compared on controlled, reachable graph instances. To test the limitation of this setup, one additional adversarial maze was constructed. The grid size was 20 x 50, with start s=(10,5) and goal g=(10,44). A vertical wall was placed at column 25 for rows 1 through 19, leaving only one opening at the top row. This layout keeps the Manhattan distance admissible and consistent, but it makes the direct horizontal direction misleading because the algorithm must travel upward to cross the barrier.

Table 5.7: Adversarial vertical-barrier stress test on a 20 x 50 grid. This is a single deterministic stress instance, not a 40-trial topology average.

| Metric | BFS | A* |
|---|---:|---:|
| Solution depth d | 59 | 59 |
| Expanded nodes N | 871 | 476 |
| A* expansion reduction | - | 45.4% |
| Maximum frontier size | 31 | 74 |
| Observed branching factor | 3.824 | 3.861 |
| Effective branching factor b* | 1.072 | 1.057 |

The stress test does not invalidate the main results: A* still finds an optimal path of the same depth as BFS and still expands fewer nodes. However, it substantially reduces the expansion advantage from the 91.4%-95.0% range observed in the default 20 x 50 corridor-preserving conditions to 45.4% in this adversarial layout. It also shows that A* can maintain a larger frontier even when it expands fewer nodes. This supports the more precise conclusion that Manhattan-guided A* is highly effective when the heuristic aligns with the maze topology, but less dominant when obstacles deliberately force a detour that the heuristic cannot see.

## 5. Update Threats And Summary

Placement: Chapter 5, Section 5.5, after the second threat paragraph about preserved solution corridors. In the current export, place after line 3494.

Suggested addition:

The adversarial vertical-barrier stress test partially addresses this threat by including one manually designed layout where Manhattan distance points toward a blocked direction. The result shows that A* remains optimal but its expansion reduction is much smaller than in the corridor-preserving benchmark. This confirms that the main results should be interpreted as controlled-topology evidence, not as a claim that A* will always produce near-path-only expansion.

Placement: Chapter 5, Section 5.6 Summary, after the sentence:

> In more adversarial layouts, Manhattan distance may still be admissible and consistent, but it may be less effective at reducing expansion.

Suggested addition:

This limitation was demonstrated by the added vertical-barrier stress test. In that instance, BFS and A* both found a shortest path of depth 59, but A* expanded 476 nodes instead of 871, giving a 45.4% reduction rather than the much larger reductions observed in the corridor-preserving benchmark. The result strengthens the evaluation by showing both the benefit and the boundary of Manhattan-guided A* in the implemented system.

