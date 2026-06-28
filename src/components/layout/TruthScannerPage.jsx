import { useEffect, useState } from 'react';
import TopNavigation from './TopNavigation';
import MathExpr, { MathFraction } from '../common/MathExpr/MathExpr';

const CONCEPTS = [
  {
    id: 'graph-model',
    label: 'Graph Model',
    formula: <MathExpr>G = (V, E)</MathExpr>,
    plain:
      'A maze is treated as a finite graph: every traversable cell is a vertex and every legal movement between adjacent cells is an edge.',
    formal:
      'Let M=(R,C,W,s,g) where R and C are grid row/column counts, W is the wall set, s is the start cell, and g is the goal cell. Let V be the set of non-wall cells. Let E contain an undirected edge (u,v) when u and v are orthogonally adjacent in the grid. Search algorithms operate over G, not over pixels.',
    visual: '[cell] -- [cell] -- [cell]\n   |                 |\n[cell]     wall     [cell]',
  },
  {
    id: 'branching-factor',
    label: 'Branching Factor',
    formula: 'b = average number of successors',
    plain:
      'Branching factor measures how many choices a search algorithm typically has after expanding a node.',
    formal:
      <>For a grid graph, <MathExpr>b<sub>graph</sub> = <MathFraction numerator="2|E|" denominator="|V|" /></MathExpr> where <MathExpr>V</MathExpr> is the set of non-wall cells and <MathExpr>E</MathExpr> is the adjacency edge set. For a trace, <MathExpr>b<sub>observed</sub></MathExpr> is the average number of legal successors per expansion in the recorded run.</>,
    visual: '        up\n         |\nleft -- node -- right\n         |\n       down',
  },
  {
    id: 'effective-branching',
    label: 'Effective Branching',
    formula: <MathExpr>N = 1 + b* + (b*)<sup>2</sup> + ... + (b*)<sup>d</sup></MathExpr>,
    plain:
      'Effective branching asks: what branching factor would explain the number of states actually expanded by this run?',
    formal:
      <>Given <MathExpr>N</MathExpr> expanded states and solution depth <MathExpr>d</MathExpr>, solve the expansion series for <MathExpr>b^*</MathExpr>. Here <MathExpr>N</MathExpr> is the count of expanded states in the run and <MathExpr>d</MathExpr> is the solution depth of the returned path.</>,
    visual: 'depth 0: 1\n depth 1: b*\n depth 2: (b*)²\n depth d: (b*)ᵈ',
  },
  {
    id: 'g-score',
    label: 'g(n)',
    formula: <MathExpr>g(n) = cost(s,n)</MathExpr>,
    plain:
      'g(n) is the known path cost already paid to reach a node.',
    formal:
      'In this unit-cost grid, each move costs 1, so g(n) equals the number of edges on the current best path from the start state s to node n. Here s is the start cell and g is the goal cell in M=(R,C,W,s,g).',
    visual: 'S -> . -> . -> n\ncost: 0    1    2    3',
  },
  {
    id: 'h-score',
    label: 'h(n)',
    formula: <MathExpr>h(n) = |row(n)-row(g)| + |col(n)-col(g)|</MathExpr>,
    plain:
      'h(n) is the Manhattan distance from a node to the goal, ignoring walls.',
    formal:
      'A* uses h(n)=|row(n)-row(g)|+|col(n)-col(g)|. The heuristic reads only coordinates; walls affect A* only when neighbor validation rejects blocked cells.',
    visual: 'n -> ? -> ? -> G\nestimated remaining distance = h(n)',
  },
  {
    id: 'f-score',
    label: 'f(n)',
    formula: <MathExpr>f(n) = g(n) + h(n)</MathExpr>,
    plain:
      'f(n) is A*’s priority score: paid cost plus estimated remaining cost.',
    formal:
      'A* repeatedly expands a frontier node with minimum f. Here g(n) is the path cost so far and h(n) is the estimated remaining cost to the goal.',
    visual: 'g(n): S -> ... -> n\nh(n): n -> ... -> G\nf(n): complete route estimate',
  },
  {
    id: 'frontier',
    label: 'Frontier',
    formula: 'OPEN / queue',
    plain:
      'The frontier is the set of discovered nodes waiting to be expanded.',
    formal:
      'BFS stores the frontier in FIFO order. A* stores the frontier by priority, selecting minimum f(n), then minimum h(n) as the tie-breaker.',
    visual: 'expanded: closed\nfrontier: [a] [b] [c]\nunseen: rest of graph',
  },
  {
    id: 'admissible',
    label: 'Admissible Heuristic',
    formula: <MathExpr>h(n) ≤ h<sup>*</sup>(n)</MathExpr>,
    plain:
      'An admissible heuristic is optimistic: it never claims the goal is cheaper than it truly is.',
    formal:
      <>If <MathExpr>h(n)</MathExpr> never overestimates the optimal remaining cost <MathExpr>h<sup>*</sup>(n)</MathExpr> (the true shortest cost from n to the goal), A* is guaranteed to preserve optimality on graphs with non-negative edge costs.</>,
    visual: 'estimated ≤ true remaining cost\noptimism preserves optimal paths',
  },
  {
    id: 'consistent',
    label: 'Consistent Heuristic',
    formula: <MathExpr>h(n) ≤ c(n,m) + h(m)</MathExpr>,
    plain:
      'Consistency means the heuristic obeys a triangle inequality across every edge.',
    formal:
      <>For each edge from n to m with cost <MathExpr>c(n,m)</MathExpr> (1 per grid move), consistency requires <MathExpr>h(n) ≤ c(n,m)+h(m)</MathExpr>. This keeps f-values non-decreasing along optimal paths.</>,
    visual: 'n --cost--> m --estimate--> G\nh(n) cannot beat that route',
  },
  {
    id: 'relaxation',
    label: 'Relaxation',
    formula: <MathExpr>if g<sub>new</sub> &lt; g<sub>old</sub>, update parent</MathExpr>,
    plain:
      'Relaxation is the check that decides whether a newly found route to a neighbor is better.',
    formal:
      <>For neighbor m of node n, compute <MathExpr>g<sub>new</sub> = g(n)+c(n,m)</MathExpr>, where <MathExpr>g<sub>new</sub></MathExpr> is the candidate cost and <MathExpr>g<sub>old</sub></MathExpr> is the best known cost to m. If <MathExpr>g<sub>new</sub></MathExpr> improves g(m), update g(m), f(m), and previousNode(m).</>,
    visual: 'old route to m: cost 9\nnew route via n: cost 6\nupdate m',
  },
  {
    id: 'pause-prediction',
    label: 'Pause-Prediction',
    formula: <MathExpr>learner predicts argmin frontier rule</MathExpr>,
    plain:
      'Pause-Prediction turns the visualizer into an active-recall assessment instead of passive animation.',
    formal:
      'At selected expansion points, the system exposes the frontier and asks the learner to choose the node satisfying the algorithm rule. The answer is checked against BFS depth ordering or A* f-minimization.',
    visual: 'frontier nodes glow\nstudent chooses next node\nsystem verifies rule',
  },
  {
    id: 'space-complexity',
    label: 'Space Complexity',
    formula: 'memory as a function of |V|',
    plain:
      'Space complexity measures how much memory the algorithm needs as the graph grows.',
    formal:
      'Both BFS and A* can store O(|V|) nodes in visited/frontier structures on a finite grid, where |V| is the number of non-wall cells. The frontier peak is the practical memory-pressure signal.',
    visual: 'memory = visited set + frontier + parent links',
  },
];

const conceptById = Object.fromEntries(CONCEPTS.map((concept) => [concept.id, concept]));

const GROUNDING_TABS = [
  {
    id: 'knowledge-space',
    label: 'Knowledge Space',
    title: <MathExpr>K = (A, D, S)</MathExpr>,
    body:
      'Each completed run becomes a small knowledge space, not just an animation. A is the board and algorithm artifact, D is the evidence produced by the UI and exported logs, and S is the schema that says which rule is being checked.',
    items: [
      ['A - Artifacts', <><MathExpr>a<sub>i</sub> = (M<sub>i</sub>, G<sub>i</sub>, alg<sub>i</sub>, trace<sub>i</sub>)</MathExpr>: the visible maze, its mapped graph, the selected algorithm, and the run trace behind the board. <MathExpr>M<sub>i</sub>=(R,C,W,s,g)</MathExpr> records rows, columns, walls, start, and goal.</>],
      ['D - Evidence', <>The evidence is generated while the learner uses the system: frontier snapshots, equation rows, heuristic-audit tables, branching metrics, prediction responses, and the exported run table. These records are the documents behind the visual claims.</>],
      ['S - Schema', 'Schema dimensions name the question being asked: GridToGraph, BFSDepthOrder, AStarMinimumF, HeuristicAdmissibility, EffectiveBranchingFactor, and PredictionCorrectness. They decide which log fields matter for each claim.'],
    ],
  },
  {
    id: 'retrieval',
    label: 'Retrieval',
    title: <MathExpr>R : (A × S) → P(D)</MathExpr>,
    body:
      'Retrieval is what happens when the interface turns a visual moment into evidence. Hover overlays, the heuristic audit panel, the run summary, and the export table all read selected records from the same run trace instead of relying on a separate explanation.',
    items: [
      ['AStarMinimumF', <>The audit retrieves the frontier <MathExpr>F<sub>t</sub></MathExpr>, candidate scores <MathExpr>g(n), h(n), f(n)</MathExpr>, and selected node <MathExpr>n*<sub>t</sub></MathExpr>; those are exactly the rows shown in the A* Heuristic Audit table.</>],
      ['EffectiveBranchingFactor', <>The formal ledger retrieves expanded states <MathExpr>N</MathExpr>, solution depth <MathExpr>d</MathExpr>, observed legal successors, and graph edges before solving <MathExpr>N = 1 + b* + (b*)<sup>2</sup> + ... + (b*)<sup>d</sup></MathExpr>.</>],
      ['PredictionCorrectness', <>Quiz feedback retrieves the learner choice, the current frontier, and the valid next-node set. The same schema explains whether the answer matched BFS depth order or A* minimum <MathExpr>f(n)</MathExpr>.</>],
    ],
  },
  {
    id: 'verification',
    label: 'Verification',
    title: <MathExpr>d ⊨ p</MathExpr>,
    body:
      'Verification is the final check: a UI statement is accepted only when the retrieved run document entails it. The result modal therefore works like an evidence receipt for the board, audit panels, and exported rows.',
    items: [
      ['BFS claim', <>The claim is valid when the selected node <MathExpr>n*<sub>t</sub></MathExpr> belongs to <MathExpr>argmin<sub>n∈F<sub>t</sub></sub> depth(n)</MathExpr>; the queue/frontier trace provides the evidence.</>],
      ['A* claim', <>The claim is valid when <MathExpr>n*<sub>t</sub> ∈ argmin<sub>n∈F<sub>t</sub></sub>(g(n)+h(n))</MathExpr>, with equal f-values resolved by lower Manhattan <MathExpr>h(n)</MathExpr>; the heuristic audit table exposes that check.</>],
      ['Learning claim', <>The learning signal is valid as in-run evidence when the prediction log contains the prompt, learner response, valid candidate set, and attempts. It supports rule fluency during the session, not a standalone causal learning claim.</>],
    ],
  },
];

const FORMAL_CONTRACT = [
  {
    label: 'Maze Artifact',
    expression: <MathExpr>M = (R, C, W, s, g)</MathExpr>,
    statement:
      'R and C define the finite grid; W is the wall set; s and g are the start and goal cells. A cell is traversable exactly when it is not in W.',
  },
  {
    label: 'Perception Mapping',
    expression: <MathExpr>Φ(M) = G<sub>M</sub> = (V<sub>M</sub>, E<sub>M</sub>)</MathExpr>,
    statement:
      <><MathExpr>V<sub>M</sub></MathExpr> contains every traversable cell. <MathExpr>E<sub>M</sub></MathExpr> contains exactly the orthogonal adjacencies satisfying <MathExpr>|i-k| + |j-l| = 1</MathExpr>, where (i,j) and (k,l) are row/column cell coordinates.</>,
  },
  {
    label: 'Uniform Edge Cost',
    expression: <MathExpr>c((i,j),(k,l)) = 1</MathExpr>,
    statement:
      'Every legal grid move has unit cost, so path cost equals edge count and BFS shortest-depth reasoning applies. Here c is the edge cost between adjacent cells.',
  },
  {
    label: 'Branching Bound',
    expression: <MathExpr>deg(v) ≤ 4, b<sub>max</sub> ≤ 4</MathExpr>,
    statement:
      'The implemented grid is 4-connected. deg(v) is the number of legal neighbors of vertex v. Boundaries and walls can reduce degree, but no cell has more than four legal successors.',
  },
];

const PROOF_OBLIGATIONS = [
  {
    label: 'P2.1 Mapping Correctness',
    expression: <MathExpr>legal visual move ⇔ edge in G<sub>M</sub></MathExpr>,
    statement:
      'Every visual movement corresponds to an edge, and every edge corresponds to one legal visual movement in the mapped graph G_M.',
  },
  {
    label: 'P2.4 BFS Optimality',
    expression: <MathExpr>n*<sub>t</sub> ∈ argmin depth(n)</MathExpr>,
    statement:
      'Because all edges have cost 1, BFS reaches the goal first at the shortest possible depth. Here n*_t is the selected node at step t.',
  },
  {
    label: 'P2.6/P2.7 Heuristic Validity',
    expression: <MathExpr>h(n) ≤ h<sup>*</sup>(n), h(n) ≤ c(n,m)+h(m)</MathExpr>,
    statement:
      'The Manhattan heuristic h(n)=|row(n)-row(g)|+|col(n)-col(g)| is admissible and consistent on 4-connected unit-cost grids. It does not compute wall-adjusted distances. Here h*(n) is the true shortest remaining cost and c(n,m)=1 per move.',
  },
  {
    label: 'P2.9 Trace Soundness',
    expression: <MathExpr>n*<sub>t</sub> ∈ argmin<sub>n∈F<sub>t</sub></sub>(g(n)+h(n))</MathExpr>,
    statement:
      'If the selected frontier node minimizes f(n)=g(n)+h(n), the recorded expansion is sound with respect to the A* rule. Here F_t is the frontier at step t.',
  },
];

const AUDIT_TRACE_ROWS = [
  { step: 2, node: '(5, 3)', g: 1, h: 19, f: 20, selected: 'Yes' },
  { step: 2, node: '(4, 2)', g: 1, h: 21, f: 22, selected: 'No' },
  { step: 2, node: '(5, 1)', g: 1, h: 21, f: 22, selected: 'No' },
  { step: 2, node: '(6, 2)', g: 1, h: 21, f: 22, selected: 'No' },
  { step: 3, node: '(5, 4)', g: 2, h: 18, f: 20, selected: 'Yes' },
  { step: 3, node: '(6, 3)', g: 2, h: 20, f: 22, selected: 'No' },
  { step: 3, node: '(4, 3)', g: 2, h: 20, f: 22, selected: 'No' },
  { step: 3, node: '(6, 2)', g: 1, h: 21, f: 22, selected: 'No' },
  { step: 3, node: '(4, 2)', g: 1, h: 21, f: 22, selected: 'No' },
  { step: 3, node: '(5, 1)', g: 1, h: 21, f: 22, selected: 'No' },
];

const VALIDITY_METRICS = [
  ['Expansion reduction', 'A* reduced expanded states versus BFS by 83.2% to 96.6% across tested conditions.'],
  ['Trace validation', 'For each audited A* step, the selected node had minimum frontier f(n)=g(n)+h_M(n), with the recorded tie-break rule.'],
  ['Explanation support', 'The interface links selected audit claims to trace rows, equations, and branching metrics. A separate quantified explanation-validity study was not performed.'],
  ['Learning limitation', 'Prediction logs measure accuracy and attempts; they do not by themselves prove long-term learning gain.'],
];

function TruthTerm({ id, children, onOpen }) {
  return (
    <button
      type="button"
      className="truth-term"
      onClick={() => onOpen(id)}
      title={`Open ${conceptById[id]?.label || children} concept tab`}
    >
      {children}
    </button>
  );
}

function TruthScannerPage({
  hasRunSummary,
  onNavigate,
  onOpenFormalAnalysis,
  onReturnToFormalAnalysis,
  showReturnToAnalysis = false,
  initialConceptId,
  onOpenLegend,
  onOpenSettings,
  isLegendOpen,
  isSettingsOpen,
  isQuizMode,
  scoreState,
  scorePopup,
  averageTryAccuracy,
  averageTriesPerQuestion,
  isLightMode,
  onThemeToggle,
}) {
  const [activeConceptId, setActiveConceptId] = useState('f-score');
  const [activeGroundingId, setActiveGroundingId] = useState('knowledge-space');
  const activeConcept = conceptById[activeConceptId] || CONCEPTS[0];
  const activeGrounding =
    GROUNDING_TABS.find((item) => item.id === activeGroundingId) || GROUNDING_TABS[0];

  useEffect(() => {
    if (!initialConceptId || !conceptById[initialConceptId]) return;
    const timeoutId = window.setTimeout(() => {
      setActiveConceptId(initialConceptId);
      document.getElementById('truth-concepts')?.scrollIntoView({ behavior: 'smooth' });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialConceptId]);

  const openConcept = (id) => {
    setActiveConceptId(id);
    window.setTimeout(() => {
      document.getElementById('truth-concepts')?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  const termProps = { onOpen: openConcept };

  return (
    <main className="truth-page">
      <TopNavigation
        currentRoute="/truth-scanner"
        hasRunSummary={hasRunSummary}
        onNavigate={onNavigate}
        onOpenFormalAnalysis={onOpenFormalAnalysis}
        onOpenLegend={onOpenLegend}
        onOpenSettings={onOpenSettings}
        isLegendOpen={isLegendOpen}
        isSettingsOpen={isSettingsOpen}
        isQuizMode={isQuizMode}
        scoreState={scoreState}
        scorePopup={scorePopup}
        averageTryAccuracy={averageTryAccuracy}
        averageTriesPerQuestion={averageTriesPerQuestion}
        isLightMode={isLightMode}
        onThemeToggle={onThemeToggle}
      />

      <section className="truth-hero">
        <div>
          <span className="landing-badge">Graph Search Auditor</span>
          <h1>Truth Scanner Formal Audit</h1>
          <p>
            The visualizer turns each maze run into evidence: the board is mapped by <MathExpr>Φ</MathExpr>
            into a graph <MathExpr>G=(V,E)</MathExpr>, the trace is organized as <MathExpr>K=(A,D,S)</MathExpr>, and
            expansion decisions are checked against BFS depth order or A*{' '}
            <TruthTerm id="f-score" {...termProps}>f(n)=g(n)+h(n)</TruthTerm> minimization. The same records feed the audit panels,
            formal result modal, and exported run table.
          </p>
        </div>
        <div className="truth-actions">
          {showReturnToAnalysis && onReturnToFormalAnalysis && (
            <button type="button" className="truth-secondary-btn" onClick={onReturnToFormalAnalysis}>
              Back To Formal Results
            </button>
          )}
          <button type="button" className="truth-secondary-btn" onClick={() => onNavigate('/visualizer')}>
            Back To Visualizer Lab
          </button>
          <button type="button" className="truth-primary-btn" onClick={() => onNavigate('/')}>
            Restart Guided Flow
          </button>
        </div>
      </section>

      <section className="truth-section truth-section-accent">
        <div className="truth-section-heading">
          <span>Formal Contract</span>
          <h2>Definitions From The Thesis</h2>
        </div>
        <div className="truth-axiom-grid">
          {FORMAL_CONTRACT.map((item) => (
            <article key={item.label} className="truth-axiom-card">
              <span>{item.label}</span>
              <code>{item.expression}</code>
              <p>{item.statement}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="truth-section">
        <div className="truth-section-heading">
          <span>Proof Obligations</span>
          <h2>What The Scanner Must Prove</h2>
        </div>
        <div className="truth-axiom-grid">
          {PROOF_OBLIGATIONS.map((item) => (
            <article key={item.label} className="truth-axiom-card truth-axiom-card-proof">
              <span>{item.label}</span>
              <code>{item.expression}</code>
              <p>{item.statement}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="truth-section truth-section-accent">
        <div className="truth-section-heading">
          <span>Schema-Guided Grounding</span>
          <h2>Why The Visualizer Counts As Evidence</h2>
        </div>
        <div className="truth-manifesto-shell">
          <div className="truth-manifesto-tabs" role="tablist" aria-label="Schema-guided grounding model">
            {GROUNDING_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeGrounding.id === tab.id}
                className={activeGrounding.id === tab.id ? 'active' : ''}
                onClick={() => setActiveGroundingId(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <article className="truth-manifesto-panel" role="tabpanel">
            <span>{activeGrounding.label}</span>
            <h3>{activeGrounding.title}</h3>
            <p>{activeGrounding.body}</p>
            <div className="truth-manifesto-list">
              {activeGrounding.items.map(([label, value]) => (
                <div key={label} className="truth-manifesto-item">
                  <strong>{label}</strong>
                  <p>{value}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="truth-section">
        <div className="truth-section-heading">
          <span>Formal Object</span>
          <h2>The Maze Is A Mapped Graph Instance</h2>
        </div>
        <div className="truth-formal-grid">
          <article className="truth-proof-card">
            <h3>State Space</h3>
            <p>
              A maze artifact <MathExpr>M=(R,C,W,s,g)</MathExpr> becomes the finite{' '}
              <TruthTerm id="graph-model" {...termProps}>graph model</TruthTerm> <MathExpr>G<sub>M</sub>=(V<sub>M</sub>,E<sub>M</sub>)</MathExpr>,
              where R and C are the grid rows/columns, W is the wall set, s is the start cell, and g is the goal cell.
              The set <MathExpr>V<sub>M</sub></MathExpr> contains exactly the non-wall cells, and <MathExpr>E<sub>M</sub></MathExpr> contains exactly the
              legal 4-neighbor moves.
            </p>
          </article>
          <article className="truth-proof-card">
            <h3>Successor Function</h3>
            <p>
              The successor relation is defined by <MathExpr>|i-k|+|j-l|=1</MathExpr> over traversable cells (i,j) and (k,l).
              Therefore <MathExpr>deg(v) ≤ 4</MathExpr>, while walls and boundaries lower the actual{' '}
              <TruthTerm id="branching-factor" {...termProps}>branching factor</TruthTerm>.
            </p>
          </article>
          <article className="truth-proof-card">
            <h3>Measured Evidence</h3>
            <p>
              The trace logs frontier snapshots, selected nodes, equations, and neighbor
              decisions. These become the D evidence documents used by hover overlays, the A* audit panel,
              the Formal Result Analysis modal, and the exported run table, so a UI claim is valid only
              when the retrieved trace entails it.
            </p>
          </article>
        </div>
      </section>

      <section className="truth-section truth-section-accent">
        <div className="truth-section-heading">
          <span>Algorithm Proof</span>
          <h2>BFS Baseline</h2>
        </div>
        <div className="truth-proof-layout">
          <div className="truth-proof-card">
            <h3>Rule</h3>
            <p>
              BFS is the uninformed baseline. At step <MathExpr>t</MathExpr>, with frontier <MathExpr>F<sub>t</sub></MathExpr>, it selects a node
              in <MathExpr>argmin depth(n)</MathExpr>. The frontier <MathExpr>F<sub>t</sub></MathExpr> is the queue of discovered but unexpanded nodes.
              Since <MathExpr>depth(n)=</MathExpr><TruthTerm id="g-score" {...termProps}>g(n)</TruthTerm>{' '}
              under unit edge costs, queue order is shortest-depth order. In complexity terms, <MathExpr>|V|</MathExpr> counts non-wall cells and{' '}
              <MathExpr>|E|</MathExpr> counts legal adjacencies.
            </p>
          </div>
          <div className="truth-equation-card">
            <code><MathExpr>n*<sub>t</sub> ∈ argmin depth(n)</MathExpr></code>
            <code><MathExpr>h(n)=0</MathExpr></code>
            <code><MathExpr>f(n)=g(n)</MathExpr></code>
            <code><MathExpr>Time: O(|V|+|E|)</MathExpr></code>
            <code><MathExpr>Space: O(|V|)</MathExpr></code>
          </div>
          <div className="truth-proof-card">
            <h3>Optimality Sketch</h3>
            <p>
              Before any vertex at depth d+1 is removed from the queue, every reachable
              vertex at depth d has been discovered. If the goal were reachable by a shorter
              path, BFS would remove it earlier. Thus the returned path is shortest.
            </p>
          </div>
        </div>
      </section>

      <section className="truth-section truth-section-accent">
        <div className="truth-section-heading">
          <span>Algorithm Proof</span>
          <h2>A* Heuristic Scanner</h2>
        </div>
        <div className="truth-proof-layout">
          <div className="truth-proof-card">
            <h3>Priority Rule</h3>
            <p>
              A* is the informed search condition. It expands a{' '}
              <TruthTerm id="frontier" {...termProps}>frontier</TruthTerm> node satisfying the minimum{' '}
              <TruthTerm id="f-score" {...termProps}>f(n)</TruthTerm> rule, where f(n) combines the paid cost{' '}
              <TruthTerm id="g-score" {...termProps}>g(n)</TruthTerm> and the remaining estimate{' '}
              <TruthTerm id="h-score" {...termProps}>h(n)</TruthTerm>. Here the frontier is the open set of discovered, unexpanded nodes;{' '}
              g(n) is the cost from start s and h(n) estimates the remaining cost to goal g.
            </p>
          </div>
          <div className="truth-equation-card truth-equation-card-large">
            <code><MathExpr>f(n)=g(n)+h(n)</MathExpr></code>
            <code><MathExpr>choose argmin f(n)</MathExpr></code>
            <code><MathExpr>tie-break by lower h(n)</MathExpr></code>
          </div>
          <div className="truth-proof-card">
            <h3>Heuristic Conditions</h3>
            <p>
              A* uses the Manhattan heuristic{' '}
              <MathExpr>h(n)=|row(n)-row(g)|+|col(n)-col(g)|</MathExpr>. It is{' '}
              <TruthTerm id="admissible" {...termProps}>admissible</TruthTerm> because every 4-connected unit-cost route must pay at least the row and column offset. It is{' '}
              <TruthTerm id="consistent" {...termProps}>consistent</TruthTerm> because moving to one neighbor changes Manhattan distance by at most one.
            </p>
          </div>
        </div>
      </section>

      <section className="truth-section">
        <div className="truth-section-heading">
          <span>Heuristic Audit</span>
          <h2>Truth Scanner Trace Validation</h2>
        </div>
        <div className="truth-audit-layout">
          <article className="truth-proof-card">
            <h3>Soundness Criterion</h3>
            <p>
              For an A* step <MathExpr>t</MathExpr>, let <MathExpr>F<sub>t</sub></MathExpr> be the frontier before expansion (the open set).
              The trace is
              sound when the recorded node <MathExpr>n*<sub>t</sub></MathExpr> satisfies:
            </p>
            <code className="truth-inline-equation"><MathExpr>n*<sub>t</sub> ∈ argmin<sub>n∈F<sub>t</sub></sub>(g(n)+h(n))</MathExpr></code>
            <p>
              If several nodes share the same minimum f(n), this implementation deterministically selects the one with lower Manhattan h(n).
            </p>
          </article>
          <div className="truth-table-wrap">
            <table className="truth-audit-table">
              <caption>Sample A* frontier audit from the thesis experiment trace</caption>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Candidate</th>
                  <th>g(n)</th>
                  <th>Manhattan heuristic h(n)</th>
                  <th>f(n)</th>
                  <th>Selected</th>
                </tr>
              </thead>
              <tbody>
                {AUDIT_TRACE_ROWS.map((row) => (
                  <tr key={`${row.step}-${row.node}`} className={row.selected === 'Yes' ? 'selected' : ''}>
                    <td>{row.step}</td>
                    <td>{row.node}</td>
                    <td>{row.g}</td>
                    <td>{row.h}</td>
                    <td>{row.f}</td>
                    <td>{row.selected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="truth-section">
        <div className="truth-section-heading">
          <span>Heuristic Efficiency</span>
          <h2>Branching Factor Is The Scientific Measurement</h2>
        </div>
        <div className="truth-compare-grid">
          <article className="truth-algorithm-card">
            <h3><MathExpr>b<sub>graph</sub></MathExpr></h3>
            <p>
              The structural branching factor estimates how dense the graph is before any algorithm
              runs:
            </p>
            <code><MathExpr>b<sub>graph</sub> = <MathFraction numerator="2|E|" denominator="|V|" /></MathExpr></code>
            <p>
              Here <MathExpr>|V|</MathExpr> is the count of non-wall cells and <MathExpr>|E|</MathExpr> is the count of legal adjacencies.
            </p>
          </article>
          <article className="truth-algorithm-card">
            <h3><MathExpr>b<sub>observed</sub></MathExpr></h3>
            <p>
              The trace branching factor measures the legal successor decisions actually encountered:
            </p>
            <code><MathExpr>b<sub>observed</sub> = <MathFraction numerator="legal successors" denominator="expansions" /></MathExpr></code>
          </article>
          <article className="truth-algorithm-card truth-algorithm-card-astar">
            <h3><MathExpr>b<sub>effective</sub></MathExpr></h3>
            <p>
              The <TruthTerm id="effective-branching" {...termProps}>effective branching</TruthTerm> factor asks what search
              tree would produce the observed expansion count:
            </p>
            <code><MathExpr>N = 1 + b* + (b*)<sup>2</sup> + ... + (b*)<sup>d</sup></MathExpr></code>
          </article>
        </div>
        <div className="truth-verdict">
          <span>Scientific Interpretation</span>
          <strong>Heuristic value is a measured reduction in effective search space.</strong>
          <p>
            If A* reaches the same optimal depth as BFS while expanding fewer states and producing a
            lower b*, then h(n) has made the search behave as if the graph were narrower. That is the
            Truth Scanner claim in mathematical form.
          </p>
        </div>
      </section>

      <section className="truth-section truth-section-accent">
        <div className="truth-section-heading">
          <span>Empirical Grounding</span>
          <h2>What The Thesis Results Actually Support</h2>
        </div>
        <div className="truth-metric-grid">
          {VALIDITY_METRICS.map(([label, value]) => (
            <article key={label} className="truth-metric">
              <span>{label}</span>
              <small>{value}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="truth-section">
        <div className="truth-section-heading">
          <span>Learning Mechanism</span>
          <h2>Pause-Prediction Makes The Lab Testable</h2>
        </div>
        <div className="truth-proof-layout">
          <div className="truth-proof-card">
            <h3>Pause</h3>
            <p>
              Spacebar pause freezes the current <TruthTerm id="frontier" {...termProps}>frontier</TruthTerm>, turning a fast
              animation into inspectable evidence.
            </p>
          </div>
          <div className="truth-proof-card">
            <h3>Predict</h3>
            <p>
              <TruthTerm id="pause-prediction" {...termProps}>Pause-Prediction</TruthTerm> asks the learner to choose the next
              node from the frontier according to the formal BFS or A* rule.
            </p>
          </div>
          <div className="truth-proof-card">
            <h3>Verify</h3>
            <p>
              Feedback is scored against the rule: minimum g(n) for BFS, or minimum f(n) with h(n)
              tie-break for A*, where f(n)=g(n)+h(n). That makes the UI an assessment of algorithmic reasoning.
            </p>
          </div>
        </div>
      </section>

      <section className="truth-section" id="truth-concepts">
        <div className="truth-section-heading">
          <span>Clickable Jargon</span>
          <h2>Concept Tabs</h2>
        </div>
        <div className="truth-concept-shell">
          <div className="truth-concept-tabs" role="tablist" aria-label="Mathematical concepts">
            {CONCEPTS.map((concept) => (
              <button
                key={concept.id}
                type="button"
                role="tab"
                aria-selected={activeConcept.id === concept.id}
                className={activeConcept.id === concept.id ? 'active' : ''}
                onClick={() => setActiveConceptId(concept.id)}
              >
                {concept.label}
              </button>
            ))}
          </div>
          <article className="truth-concept-panel" role="tabpanel">
            <span>{activeConcept.label}</span>
            <h3>{activeConcept.formula}</h3>
            <p>{activeConcept.plain}</p>
            <p>{activeConcept.formal}</p>
            <pre>{activeConcept.visual}</pre>
          </article>
        </div>
      </section>
    </main>
  );
}

export default TruthScannerPage;
