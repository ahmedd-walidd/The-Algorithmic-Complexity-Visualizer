import { useState } from 'react';

const CONCEPTS = [
  {
    id: 'graph-model',
    label: 'Graph Model',
    formula: 'G = (V, E)',
    plain:
      'A maze is treated as a finite graph: every traversable cell is a vertex and every legal movement between adjacent cells is an edge.',
    formal:
      'Let V be the set of non-wall cells. Let E contain an undirected edge (u,v) when u and v are orthogonally adjacent in the grid. Search algorithms operate over G, not over pixels.',
    visual: '[cell] -- [cell] -- [cell]\n   |                 |\n[cell]     wall     [cell]',
  },
  {
    id: 'branching-factor',
    label: 'Branching Factor',
    formula: 'b = average number of successors',
    plain:
      'Branching factor measures how many choices a search algorithm typically has after expanding a node.',
    formal:
      'For a grid graph, b_graph = 2|E| / |V| is the mean degree of the searchable graph. For a trace, b_observed = legal successor audits / expanded nodes.',
    visual: '        up\n         |\nleft -- node -- right\n         |\n       down',
  },
  {
    id: 'effective-branching',
    label: 'Effective Branching',
    formula: 'N = 1 + b* + (b*)^2 + ... + (b*)^d',
    plain:
      'Effective branching asks: what branching factor would explain the number of states actually expanded by this run?',
    formal:
      'Given N expanded states and solution depth d, solve the expansion series for b*. A lower b* means the algorithm behaved as if the search tree were narrower.',
    visual: 'depth 0: 1\n depth 1: b*\n depth 2: (b*)^2\n depth d: (b*)^d',
  },
  {
    id: 'g-score',
    label: 'g(n)',
    formula: 'g(n) = cost from start to n',
    plain:
      'g(n) is the known path cost already paid to reach a node.',
    formal:
      'In this unit-cost grid, each move costs 1, so g(n) equals the number of edges on the current best path from the start state s to node n.',
    visual: 'S -> . -> . -> n\ncost: 0    1    2    3',
  },
  {
    id: 'h-score',
    label: 'h(n)',
    formula: 'h(n) = estimated cost from n to goal',
    plain:
      'h(n) estimates how far a node is from the goal before the algorithm has actually traveled there.',
    formal:
      'A heuristic guides search by estimating remaining cost. If h never overestimates the true shortest remaining cost, it is admissible.',
    visual: 'n ? ? ? G\nestimated remaining distance = h(n)',
  },
  {
    id: 'f-score',
    label: 'f(n)',
    formula: 'f(n) = g(n) + h(n)',
    plain:
      'f(n) is A*’s priority score: paid cost plus estimated remaining cost.',
    formal:
      'A* repeatedly expands a frontier node with minimum f. This combines path-so-far evidence with goal-directed evidence.',
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
    formula: 'h(n) <= h*(n)',
    plain:
      'An admissible heuristic is optimistic: it never claims the goal is farther cheaper than it truly is.',
    formal:
      'If h(n) never overestimates the optimal remaining cost h*(n), A* is guaranteed to preserve optimality on graphs with non-negative edge costs.',
    visual: 'estimated <= true remaining cost\noptimism preserves optimal paths',
  },
  {
    id: 'consistent',
    label: 'Consistent Heuristic',
    formula: 'h(n) <= c(n,m) + h(m)',
    plain:
      'Consistency means the heuristic obeys a triangle inequality across every edge.',
    formal:
      'For each edge from n to m with cost c(n,m), consistency requires h(n) <= c(n,m)+h(m). This keeps f-values non-decreasing along optimal paths.',
    visual: 'n --cost--> m --estimate--> G\nh(n) cannot beat that route',
  },
  {
    id: 'relaxation',
    label: 'Relaxation',
    formula: 'if g_new < g_old, update parent',
    plain:
      'Relaxation is the check that decides whether a newly found route to a neighbor is better.',
    formal:
      'For neighbor m of node n, compute g_new = g(n)+c(n,m). If g_new improves the best known g(m), update g(m), f(m), and previousNode(m).',
    visual: 'old route to m: cost 9\nnew route via n: cost 6\nupdate m',
  },
  {
    id: 'pause-prediction',
    label: 'Pause-Prediction',
    formula: 'learner predicts argmin frontier rule',
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
      'Both BFS and A* can store O(|V|) nodes in visited/frontier structures on a finite grid. The frontier peak is the practical memory-pressure signal.',
    visual: 'memory = visited set + frontier + parent links',
  },
];

const conceptById = Object.fromEntries(CONCEPTS.map((concept) => [concept.id, concept]));

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

function TruthScannerPage({ onNavigate }) {
  const [activeConceptId, setActiveConceptId] = useState('f-score');
  const activeConcept = conceptById[activeConceptId] || CONCEPTS[0];

  const openConcept = (id) => {
    setActiveConceptId(id);
    window.setTimeout(() => {
      document.getElementById('truth-concepts')?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  };

  const termProps = { onOpen: openConcept };

  return (
    <main className="truth-page">
      <section className="truth-hero">
        <div>
          <span className="landing-badge">Mathematical Concept Layer</span>
          <h1>Truth Scanner for Search Algorithms</h1>
          <p>
            This page is a rigorous conceptual audit. It explains why the visualizer is a
            laboratory for reasoning about <TruthTerm id="graph-model" {...termProps}>graphs</TruthTerm>,{' '}
            <TruthTerm id="branching-factor" {...termProps}>branching factor</TruthTerm>,{' '}
            <TruthTerm id="f-score" {...termProps}>f(n)=g(n)+h(n)</TruthTerm>, and heuristic efficiency.
          </p>
        </div>
        <div className="truth-actions">
          <button type="button" className="truth-secondary-btn" onClick={() => onNavigate('/visualizer')}>
            Back To Visualizer Lab
          </button>
          <button type="button" className="truth-primary-btn" onClick={() => onNavigate('/')}>
            Restart Guided Flow
          </button>
        </div>
      </section>

      <section className="truth-section">
        <div className="truth-section-heading">
          <span>Formal Object</span>
          <h2>The Maze Is A Graph, Not A Toy</h2>
        </div>
        <div className="truth-formal-grid">
          <article className="truth-proof-card">
            <h3>State Space</h3>
            <p>
              A pathfinding maze becomes a finite <TruthTerm id="graph-model" {...termProps}>graph model</TruthTerm>{' '}
              G=(V,E). The set V contains all non-wall cells. The set E contains all legal
              orthogonal moves. Search is therefore a sequence of graph expansions, not a visual
              animation over colored squares.
            </p>
          </article>
          <article className="truth-proof-card">
            <h3>Successor Function</h3>
            <p>
              Every expansion applies a successor function to a current node. In a 4-neighbor grid,
              at most four outgoing moves exist, but walls and boundaries lower the actual{' '}
              <TruthTerm id="branching-factor" {...termProps}>branching factor</TruthTerm>.
            </p>
          </article>
          <article className="truth-proof-card">
            <h3>Measured Evidence</h3>
            <p>
              The visualizer records frontier snapshots, chosen nodes, score equations, and neighbor
              decisions. Those records are the audit documents that expose the algorithmic box.
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
              BFS expands nodes in non-decreasing <TruthTerm id="g-score" {...termProps}>g(n)</TruthTerm>. Because each edge
              has unit cost, queue order is depth order.
            </p>
          </div>
          <div className="truth-equation-card">
            <code>h(n)=0</code>
            <code>f(n)=g(n)</code>
            <code>Time: O(|V|+|E|)</code>
            <code>Space: O(|V|)</code>
          </div>
          <div className="truth-proof-card">
            <h3>Optimality Sketch</h3>
            <p>
              The first time BFS discovers a node, all shallower paths have already been explored.
              Therefore the first discovery depth is the shortest path depth. If the goal is reached,
              the returned path is optimal for an unweighted grid.
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
              A* expands the <TruthTerm id="frontier" {...termProps}>frontier</TruthTerm> node with minimum{' '}
              <TruthTerm id="f-score" {...termProps}>f(n)</TruthTerm>, where f(n) combines the paid cost{' '}
              <TruthTerm id="g-score" {...termProps}>g(n)</TruthTerm> and the remaining estimate{' '}
              <TruthTerm id="h-score" {...termProps}>h(n)</TruthTerm>.
            </p>
          </div>
          <div className="truth-equation-card truth-equation-card-large">
            <code>f(n)=g(n)+h(n)</code>
            <code>choose argmin f(n)</code>
            <code>tie-break by lower h(n)</code>
          </div>
          <div className="truth-proof-card">
            <h3>Heuristic Conditions</h3>
            <p>
              If h(n) is <TruthTerm id="admissible" {...termProps}>admissible</TruthTerm>, A* does not overestimate the
              remaining cost. If h(n) is <TruthTerm id="consistent" {...termProps}>consistent</TruthTerm>, f-values remain
              well ordered across edges. These conditions explain why A* can be both efficient and
              optimal.
            </p>
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
            <h3>b_graph</h3>
            <p>
              The structural branching factor estimates how dense the graph is before any algorithm
              runs:
            </p>
            <code>b_graph = 2|E| / |V|</code>
          </article>
          <article className="truth-algorithm-card">
            <h3>b_observed</h3>
            <p>
              The trace branching factor measures the legal successor decisions actually encountered:
            </p>
            <code>b_observed = legal successors / expansions</code>
          </article>
          <article className="truth-algorithm-card truth-algorithm-card-astar">
            <h3>b_effective</h3>
            <p>
              The <TruthTerm id="effective-branching" {...termProps}>effective branching</TruthTerm> factor asks what search
              tree would produce the observed expansion count:
            </p>
            <code>N = 1 + b* + (b*)^2 + ... + (b*)^d</code>
          </article>
        </div>
        <div className="truth-verdict">
          <span>Scientific Interpretation</span>
          <strong>Heuristic value is not a vibe; it is a reduction in effective search space.</strong>
          <p>
            If A* reaches the same optimal depth as BFS while expanding fewer states and producing a
            lower b*, then h(n) has made the search behave as if the graph were narrower. That is the
            “truth scan” claim in mathematical form.
          </p>
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
              tie-break for A*. That makes the UI an assessment of algorithmic reasoning.
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
