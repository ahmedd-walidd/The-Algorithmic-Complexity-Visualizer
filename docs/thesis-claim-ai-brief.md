# Thesis Claim AI Brief: BFS vs A* Mathematical Evidence

## Core Thesis Claim

This implementation shows that future app creators can use measured search metrics from BFS and A* simulations to choose an algorithm for grid-based pathfinding. The claim is not based only on animation; it is based on mathematical decision rules, expansion counts, path depth, branching factors, frontier size, and trace verification.

## Implemented Graph Model

The visual board is treated as a grid graph:

- G = (V, E)
- V = all non-wall grid cells
- E = valid 4-neighbor adjacencies between open cells
- Every edge has unit cost
- Walls are excluded from V or rejected during successor generation
- Start node is s
- Goal node is t
- Solution path is pi
- Solution depth is d = pathLength - 1

For a grid with R rows and C columns:

- Total cells = R * C
- |V| = open cells = R * C - |W|
- |E| = undirected open-cell adjacencies
- On a 4-neighbor grid, each open cell has at most 4 neighbors

## BFS Rule

BFS expands by distance layers from the start.

Formal rule:

```text
n*_i in argmin_{n in F_i} g(n)
```

Where:

- F_i = frontier at expansion step i
- g(n) = distance from start to node n
- h(n) = 0 for BFS
- f(n) = g(n)

Interpretation:

- BFS is uninformed search.
- It does not use goal direction.
- It is optimal on this unweighted grid because the first discovery of a node gives the shortest g(n).
- It often expands many nodes because it explores all shallow states before deeper states.

Complexity:

```text
Time: O(|V| + |E|)
Memory: O(|V|)
Grid bound: O(R * C)
```

## A* Rule

A* expands the node with the smallest estimated total cost.

Formal rule:

```text
n*_i in argmin_{n in F_i} f(n)
f(n) = g(n) + h_M(n)
h_M(n) = |row(n) - row(goal)| + |col(n) - col(goal)|
```

Tie-breaking in this implementation:

```text
1. lowest f(n)
2. lowest Manhattan h_M(n)
3. earliest insertion order
```

Interpretation:

- A* is informed search.
- g(n) measures cost already paid from the start.
- h_M(n) estimates remaining distance to the goal.
- f(n) balances known cost and goal-directed estimate.
- Manhattan distance is O(1) to compute.
- On a 4-connected unit-cost grid, Manhattan distance is admissible and consistent, so A* preserves shortest-path optimality.
- Walls are handled by successor generation, not by changing h_M(n).

Complexity:

```text
Time with binary heap: O((|V| + |E|) log |V|)
Memory: O(|V|)
Grid bound: O(R * C log(R * C))
```

## Metrics Calculated By The Implementation

The implementation records:

- visitedCount: number of expanded/visited nodes, N
- pathLength: number of nodes in the returned path
- solutionDepth: pathLength - 1
- graphBranchingFactor: average degree of the open-cell graph
- observedBranchingFactor: average legal successors encountered during expansion
- effectiveBranchingFactor: estimated b* that explains the measured expansion count at depth d
- maxFrontier: largest frontier size during the run
- durationMs: measured compute time
- predictionOpportunities: number of pause-prediction learning prompts
- formalTraceByIndex: step-by-step expansion evidence
- proofChecks: whether the implementation obeyed the algorithm's mathematical rule

## Branching Factor Equations

Graph branching:

```text
b_graph = 2|E| / |V|
```

This is the average degree of the open-cell grid graph.

Observed branching:

```text
b_observed = legalSuccessors / expansionCount
```

This measures the legal neighbor options actually seen during the run.

Effective branching:

```text
N = 1 + b* + (b*)^2 + ... + (b*)^d
```

Where:

- N = expanded nodes
- d = solution depth
- b* = effective branching factor solved from N and d

Interpretation:

- Lower b* means the algorithm effectively searched a smaller space.
- A* usually reduces b* because the heuristic points expansion toward the goal.
- BFS usually has a higher b* because it expands broad layers.

## Experimental Setup

The thesis experiment ran:

- 40 deterministic trials per condition
- Grid sizes:
  - Small: 10x25
  - App default: 20x50
  - Large: 30x75
- Wall densities:
  - 0%
  - 15%
  - 25%
  - 35%
- Algorithms:
  - BFS
  - A* with Manhattan heuristic
- Every grid preserved a direct start-goal corridor, so all trials had a valid path.

Important limitation:

These results measure controlled corridor-preserving topologies. They do not automatically prove performance on every arbitrary maze shape, and they do not by themselves prove human learning improvement.

## Key Measured Results

Across all tested grid sizes and densities, A* returned the same path depth as BFS but expanded far fewer nodes.

Examples:

- Small 10x25, 0% walls:
  - BFS visited 205.0 nodes
  - A* visited 21.0 nodes
  - A* expansion reduction: 89.8%

- App default 20x50, 0% walls:
  - BFS visited 800.0 nodes
  - A* visited 40.0 nodes
  - A* expansion reduction: 95.0%

- Large 30x75, 0% walls:
  - BFS visited 1815.0 nodes
  - A* visited 61.0 nodes
  - A* expansion reduction: 96.6%

- Large 30x75, 35% walls:
  - BFS visited 1065.8 nodes
  - A* visited 61.0 nodes
  - A* expansion reduction: 94.3%

General pattern:

- BFS expansion grows broadly with the reachable state space.
- A* expansion stays near the direct path length in the controlled corridor experiments.
- Both algorithms keep shortest-path correctness in this grid setting.
- A* is usually the better choice when a reliable admissible heuristic exists.
- BFS remains useful when no heuristic is available, when exhaustive layer exploration is desired, or when implementation simplicity matters.

## Algorithm Selection Guidance For App Creators

Use A* when:

- The app needs shortest paths on a weighted or unweighted spatial graph.
- A meaningful heuristic can estimate distance to the goal.
- The heuristic is admissible and preferably consistent.
- Reducing expanded nodes matters for responsiveness.
- The search problem has a clear target.

Use BFS when:

- The graph is unweighted.
- No useful heuristic exists.
- The app needs all nodes by distance layer.
- The app needs simple, predictable exploration.
- The app is teaching or visualizing exhaustive breadth-first behavior.

Decision rule:

```text
If a trustworthy heuristic h(n) exists, prefer A*.
If no heuristic exists and edges are unweighted, use BFS.
If the goal is to explore the whole reachable region by distance, use BFS.
If the goal is to reach one target efficiently, use A*.
```

## Evidence From Formal Trace

The implementation does not only display final metrics. It records each expansion step:

- Current frontier
- Chosen node
- g(n), h(n), and f(n)
- Neighbor attempts
- Accepted and rejected successors
- Equation checks
- Selection-rule checks

A* trace verification:

```text
selected node has minimum f(n) = g(n) + h_M(n)
ties are resolved by lower h_M(n), then insertion order
```

BFS trace verification:

```text
selected node has minimum frontier depth g(n)
```

This supports the thesis claim because the output can be audited mathematically, not just watched visually.

## Caution For Defense

Do not overclaim:

- The experiment supports algorithm-selection guidance for this implemented grid model.
- It does not prove A* is always faster in all possible graphs.
- It does not prove human learning improvement without participant data.
- It does show that formal traces and metrics can turn a visualization into evidence for algorithm choice.

## Rehearsal Script Prompt For AI

Paste this into an AI script writer:

```text
Create a 3-5 minute thesis rehearsal script explaining my implementation claim.

My thesis claim is:
Future app creators can use the measured results from BFS and A* simulations to decide which algorithm to use for grid-based pathfinding. The implementation supports this claim through mathematical rules, trace verification, and metrics, not only through animation.

Use these mathematical details:

The app models the board as a grid graph G=(V,E), where V is the set of non-wall cells and E is the set of valid 4-neighbor unit-cost adjacencies. The start node is s, the goal node is t, the returned path is pi, and solution depth is d = pathLength - 1.

BFS uses the rule n*_i in argmin_{n in F_i} g(n), where F_i is the frontier and g(n) is distance from the start. BFS expands by depth layers, is optimal on unweighted grids, and has time O(|V|+|E|) and memory O(|V|).

A* uses the rule n*_i in argmin_{n in F_i} f(n), where f(n)=g(n)+h_M(n). The heuristic is Manhattan distance: h_M(n)=|row(n)-row(goal)|+|col(n)-col(goal)|. The implementation tie-breaks by lowest f(n), then lowest h_M(n), then insertion order. Manhattan distance is admissible and consistent on a 4-connected unit-cost grid, so A* preserves shortest-path optimality. With a binary heap, A* has time O((|V|+|E|)log|V|) and memory O(|V|).

The implementation calculates visited nodes N, path length, solution depth d, graph branching b_graph=2|E|/|V|, observed branching b_observed=legalSuccessors/expansionCount, effective branching b* from N=1+b*+(b*)^2+...+(b*)^d, max frontier size, compute time, prediction opportunities, and formal trace checks.

The experiment ran 40 deterministic trials for each grid size and density. Sizes were 10x25, 20x50, and 30x75. Wall densities were 0%, 15%, 25%, and 35%. A direct start-goal corridor was preserved so every trial had a valid path.

Key results:
- Small 10x25 at 0% walls: BFS visited 205.0 nodes; A* visited 21.0 nodes; A* reduced expansions by 89.8%.
- App default 20x50 at 0% walls: BFS visited 800.0 nodes; A* visited 40.0 nodes; A* reduced expansions by 95.0%.
- Large 30x75 at 0% walls: BFS visited 1815.0 nodes; A* visited 61.0 nodes; A* reduced expansions by 96.6%.
- Large 30x75 at 35% walls: BFS visited 1065.8 nodes; A* visited 61.0 nodes; A* reduced expansions by 94.3%.

Interpretation:
BFS is reliable and simple when the graph is unweighted and no heuristic is available, but it expands broadly by depth. A* should be preferred when a trustworthy heuristic exists and the app needs to reach one target efficiently. In this implementation, both algorithms return the same shortest path depth, but A* expands far fewer nodes because h_M directs the search toward the goal.

Include a careful limitation:
These results apply to the implemented 4-neighbor unit-cost grid and controlled corridor-preserving experiments. They do not prove A* is always best on every graph, and they do not prove human learning gains without participant data.

Tone:
Clear, confident, thesis-defense style. Explain the math in simple spoken language. End with a concise statement of why these metrics can guide future app creators.
```
