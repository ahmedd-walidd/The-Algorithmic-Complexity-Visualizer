import { useState, useCallback, useRef, useEffect } from 'react';
import Grid from './components/Grid/Grid';
import ControlPanel from './components/ControlPanel/ControlPanel';
import {
  createGrid,
  clearPath,
  cloneGrid,
  getNodesInShortestPathOrder,
  START_ROW,
  START_COL,
  END_ROW,
  END_COL,
} from './utils/gridHelpers';
import { generateMaze } from './utils/mazeGenerator';
import { bfs } from './algorithms/bfs';
import { astar } from './algorithms/astar';
import './App.css';

// Increased base delays so traversal is easier to follow visually.
const SPEED_MS = { slow: 140, medium: 80, fast: 40 };
const RACE_CELL = 14; // smaller cells when two grids are side-by-side

const PROOF_CHECK_INFO = {
  frontierMinRuleHolds: {
    label: 'Best frontier node was selected',
    description:
      'A* must expand a frontier node with the smallest total score f(n)=g(n)+h(n), using h as tie-break.',
  },
  queueDepthRuleHolds: {
    label: 'Shallowest queue layer was selected',
    description:
      'BFS must expand nodes in non-decreasing depth, so the queue front has the minimum depth g(n).',
  },
  equationHolds: {
    label: 'Score equation is consistent',
    description: 'The displayed values satisfy f(n)=g(n)+h(n).',
  },
};

function App() {
  // ── state ────────────────────────────────────────────────
  const [grid, setGrid] = useState(() => createGrid());
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [algorithm, setAlgorithm] = useState('bfs');
  const [isRaceMode, setIsRaceMode] = useState(false);
  const [speed, setSpeed] = useState('medium');
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [stats, setStats] = useState(null);
  const timeoutsRef = useRef([]);

  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizState, setQuizState] = useState({ active: false, candidates: [], nextCorrectIndex: -1, message: '' });
  const [formalTrace, setFormalTrace] = useState([]);
  const [activeTraceIndex, setActiveTraceIndex] = useState(-1);
  const [traceNotice, setTraceNotice] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [pausedComparison, setPausedComparison] = useState(null);
  const [hoveredGoldNode, setHoveredGoldNode] = useState(null);

  const isPausedRef = useRef(false);
  const isQuizModeRef = useRef(false);
  const quizStateRef = useRef(quizState);
  const formalTraceRef = useRef(formalTrace);
  const runStateRef = useRef({
    phase: 'idle',
    visited: [],
    path: [],
    prefix: '',
    ms: SPEED_MS.medium,
    optionsByIndex: null,
    onDone: null,
    onStep: null,
    visitedIndex: 0,
    pathIndex: 0,
    pauseInterval: 15,
    stepFunc: null,
  });

  useEffect(() => {
    isQuizModeRef.current = isQuizMode;
  }, [isQuizMode]);

  useEffect(() => {
    quizStateRef.current = quizState;
  }, [quizState]);

  useEffect(() => {
    formalTraceRef.current = formalTrace;
  }, [formalTrace]);

  // ── wall drawing / quiz clicks ─────────────────────────
  const handleMouseDown = useCallback(
    (row, col) => {
      // Quiz interaction
      if (quizState.active) {
        if (isPaused) {
          setQuizState((prev) => ({
            ...prev,
            message: 'Paused. Press Space to resume, then choose the next node.',
          }));
          return;
        }

        const isCandidate = quizState.candidates?.some(c => c.row === row && c.col === col);
        if (!isCandidate) return;

        // Check if the clicked node is one of the correct ones
        const isCorrect = quizState.correctNodes?.some(c => c.row === row && c.col === col);
        
        if (isCorrect) {
            // Right answer!
            quizState.resumeFunc();
        } else {
            // Wrong answer
            const el = document.getElementById(`node-${row}-${col}`) || document.getElementById(`bfs-node-${row}-${col}`) || document.getElementById(`astar-node-${row}-${col}`);
            if (el) el.classList.add('node-prediction-wrong');
            setQuizState(prev => ({ ...prev, message: 'Incorrect! That node is not next in the queue. Try another highlighted node.' }));
        }
        return;
      }

      if (isVisualizing) return;
      if (row === START_ROW && col === START_COL) return;
      if (row === END_ROW && col === END_COL) return;

      setIsMousePressed(true);
      setGrid((prev) => {
        const next = prev.map((r) => r.map((n) => ({ ...n })));
        next[row][col] = { ...next[row][col], isWall: !next[row][col].isWall };
        return next;
      });
    },
    [isVisualizing, quizState, isPaused]
  );

  const handleMouseEnter = useCallback(
    (row, col) => {
      if (isPaused && pausedComparison) {
        const hovered = (pausedComparison.candidateNodes || []).find(
          (n) => n.row === row && n.col === col
        );
        setHoveredGoldNode(hovered || null);
      } else if (hoveredGoldNode) {
        setHoveredGoldNode(null);
      }

      if (!isMousePressed || isVisualizing) return;
      if (row === START_ROW && col === START_COL) return;
      if (row === END_ROW && col === END_COL) return;

      setGrid((prev) => {
        const next = prev.map((r) => r.map((n) => ({ ...n })));
        next[row][col] = { ...next[row][col], isWall: true };
        return next;
      });
    },
    [isMousePressed, isVisualizing, isPaused, pausedComparison, hoveredGoldNode]
  );

  const handleMouseUp = useCallback(() => setIsMousePressed(false), []);

  // ── helpers ──────────────────────────────────────────────
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const clearNextChoiceHighlight = useCallback(() => {
    document.querySelectorAll('.node-next-choice').forEach((el) => {
      el.classList.remove('node-next-choice');
    });
  }, []);

  const applyNextChoiceHighlight = useCallback((nodes, prefix = '') => {
    clearNextChoiceHighlight();
    (nodes || []).forEach((n) => {
      const el = document.getElementById(`${prefix}node-${n.row}-${n.col}`);
      if (!el) return;
      if (el.classList.contains('node-wall')) return;
      el.classList.add('node-next-choice');
    });
  }, [clearNextChoiceHighlight]);

  const resetRunState = () => {
    runStateRef.current = {
      phase: 'idle',
      visited: [],
      path: [],
      prefix: '',
      ms: SPEED_MS.medium,
      optionsByIndex: null,
      onDone: null,
      onStep: null,
      visitedIndex: 0,
      pathIndex: 0,
      pauseInterval: 15,
      stepFunc: null,
    };
  };

  const clearDomClasses = () => {
    ['', 'bfs-', 'astar-'].forEach((prefix) => {
      document
        .querySelectorAll(`[id^="${prefix}node-"]`)
        .forEach((el) =>
          el.classList.remove(
            'node-visited',
            'node-shortest-path',
            'node-prediction-candidate',
            'node-prediction-wrong',
            'node-prediction-correct',
            'node-prediction-not-correct',
            'node-next-choice'
          )
        );
    });
  };

  const getNextTraversalComparison = useCallback(() => {
    if (isRaceMode) return null;

    const run = runStateRef.current;
    if (run.phase !== 'visited') return null;

    const nextIndex = run.visitedIndex;
    const nextTrace = formalTraceRef.current[nextIndex];
    if (!nextTrace) return null;

    const frontier = nextTrace.frontierBeforeExpansion || [];
    if (frontier.length === 0) {
      return {
        stepIndex: nextIndex,
        chosenNode: nextTrace.expandedNode,
        chosenScores: nextTrace.expandedScores,
        candidateNodes: [],
        minComparison: null,
        algorithm: nextTrace.algorithm,
      };
    }

    if (nextTrace.algorithm === 'astar') {
      const minF = Math.min(...frontier.map((n) => n.f));
      const minHAmongMinF = Math.min(
        ...frontier.filter((n) => n.f === minF).map((n) => n.h)
      );
      const candidateNodes = frontier
        .filter((n) => n.f === minF && n.h === minHAmongMinF)
        .map((n) => ({ row: n.row, col: n.col, g: n.g, h: n.h, f: n.f }));

      return {
        stepIndex: nextIndex,
        chosenNode: nextTrace.expandedNode,
        chosenScores: nextTrace.expandedScores,
        candidateNodes,
        minComparison: {
          minF,
          minHAmongMinF,
        },
        algorithm: nextTrace.algorithm,
      };
    }

    const minG = Math.min(...frontier.map((n) => n.g));
    const candidateNodes = frontier
      .filter((n) => n.g === minG)
      .map((n) => ({ row: n.row, col: n.col, g: n.g, h: 0, f: n.g }));

    return {
      stepIndex: nextIndex,
      chosenNode: nextTrace.expandedNode,
      chosenScores: nextTrace.expandedScores,
      candidateNodes,
      minComparison: {
        minG,
      },
      algorithm: nextTrace.algorithm,
    };
  }, [isRaceMode]);

  const pauseRun = useCallback(() => {
    clearAllTimeouts();
    const comparison = getNextTraversalComparison();
    setPausedComparison(comparison);
    setHoveredGoldNode(null);
    applyNextChoiceHighlight(comparison?.candidateNodes || []);
  }, [getNextTraversalComparison, applyNextChoiceHighlight]);

  const resumeRun = useCallback(() => {
    clearNextChoiceHighlight();
    setPausedComparison(null);
    setHoveredGoldNode(null);

    const run = runStateRef.current;
    if (run.phase === 'idle' || run.phase === 'done') return;
    if (quizStateRef.current.active) return;

    const delay = run.phase === 'path' ? run.ms * 3 : run.ms;
    const t = setTimeout(() => {
      runStateRef.current.stepFunc?.();
    }, delay);
    timeoutsRef.current.push(t);
  }, [clearNextChoiceHighlight]);

  const togglePause = useCallback(() => {
    if (!isVisualizing || isRaceMode) return;

    setIsPaused((prev) => {
      const next = !prev;
      isPausedRef.current = next;

      if (next) {
        pauseRun();
      } else {
        resumeRun();
      }

      return next;
    });
  }, [isVisualizing, isRaceMode, pauseRun, resumeRun]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code !== 'Space') return;

      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button') {
        return;
      }

      if (!isVisualizing || isRaceMode) return;

      event.preventDefault();
      togglePause();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [togglePause, isVisualizing, isRaceMode]);

  // ── control-panel actions ────────────────────────────────
  const handleGenerateMaze = useCallback(() => {
    clearAllTimeouts();
    clearDomClasses();
    clearNextChoiceHighlight();
    resetRunState();
    setGrid((prev) => generateMaze(prev));
    setStats(null);
    setIsVisualizing(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setFormalTrace([]);
    setActiveTraceIndex(-1);
    setPausedComparison(null);
    setHoveredGoldNode(null);
    setTraceNotice('');
  }, [clearNextChoiceHighlight]);

  const handleClearBoard = useCallback(() => {
    clearAllTimeouts();
    clearDomClasses();
    clearNextChoiceHighlight();
    resetRunState();
    setGrid(createGrid());
    setStats(null);
    setIsVisualizing(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setFormalTrace([]);
    setActiveTraceIndex(-1);
    setPausedComparison(null);
    setHoveredGoldNode(null);
    setTraceNotice('');
  }, [clearNextChoiceHighlight]);

  const handleClearPath = useCallback(() => {
    clearAllTimeouts();
    clearDomClasses();
    clearNextChoiceHighlight();
    resetRunState();
    setGrid((prev) => clearPath(prev));
    setStats(null);
    setIsVisualizing(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setFormalTrace([]);
    setActiveTraceIndex(-1);
    setPausedComparison(null);
    setHoveredGoldNode(null);
    setTraceNotice('');
  }, [clearNextChoiceHighlight]);

  // ── animation engine ─────────────────────────────────────
  const animateAlgorithm = (visited, path, prefix, ms, optionsByIndex, onDone, onStep) => {
    if (visited.length === 0) {
      onDone?.();
      return;
    }
    runStateRef.current = {
      phase: 'visited',
      visited,
      path,
      prefix,
      ms,
      optionsByIndex,
      onDone,
      onStep,
      visitedIndex: 0,
      pathIndex: 0,
      pauseInterval: 15,
      stepFunc: null,
    };

    const scheduleNextTick = () => {
      const run = runStateRef.current;
      if (isPausedRef.current) return;
      if (run.phase === 'idle' || run.phase === 'done') return;

      const delay = run.phase === 'path' ? run.ms * 3 : run.ms;
      const t = setTimeout(() => {
        runStateRef.current.stepFunc?.();
      }, delay);
      timeoutsRef.current.push(t);
    };

    const step = () => {
      const run = runStateRef.current;
      if (isPausedRef.current) return;

      if (run.phase === 'visited') {
        const i = run.visitedIndex;

        if (i >= run.visited.length) {
          run.phase = 'path';
          if (run.path.length === 0) {
            run.phase = 'done';
            clearNextChoiceHighlight();
            run.onDone?.();
            return;
          }
          scheduleNextTick();
          return;
        }

        if (
          isQuizModeRef.current &&
          i > 0 &&
          i % run.pauseInterval === 0 &&
          run.optionsByIndex &&
          run.optionsByIndex[i]
        ) {
          const { selectable, correct } = run.optionsByIndex[i];
          if (selectable && selectable.length > 0) {
            const correctSet = new Set((correct || []).map((n) => `${n.row}-${n.col}`));

            selectable.forEach((c) => {
              const el = document.getElementById(`${run.prefix}node-${c.row}-${c.col}`);
              if (el && !el.classList.contains('node-visited') && !el.classList.contains('node-wall')) {
                el.classList.add('node-prediction-candidate');
                if (correctSet.has(`${c.row}-${c.col}`)) {
                  el.classList.add('node-prediction-correct');
                  el.classList.remove('node-prediction-not-correct');
                } else {
                  el.classList.add('node-prediction-not-correct');
                  el.classList.remove('node-prediction-correct');
                }
              }
            });

            setQuizState({
              active: true,
              candidates: selectable,
              correctNodes: correct,
              message: 'Quiz: Which node will be expanded next? (Click a glowing node)',
              resumeFunc: () => {
                if (isPausedRef.current) {
                  setQuizState((prev) => ({
                    ...prev,
                    message: 'Paused. Press Space to resume, then choose the next node.',
                  }));
                  return;
                }

                selectable.forEach((c) => {
                  const el = document.getElementById(`${run.prefix}node-${c.row}-${c.col}`);
                  if (el) {
                    el.classList.remove(
                      'node-prediction-candidate',
                      'node-prediction-correct',
                      'node-prediction-not-correct'
                    );
                  }
                });

                setQuizState({ active: false, candidates: [], correctNodes: [], message: '' });

                const n = run.visited[run.visitedIndex];
                const el = document.getElementById(`${run.prefix}node-${n.row}-${n.col}`);
                if (el && !n.isStart && !n.isEnd && !el.classList.contains('node-prediction-wrong')) {
                  el.classList.add('node-visited');
                }

                run.onStep?.(run.visitedIndex);
                run.visitedIndex += 1;
                scheduleNextTick();
              },
            });

            return;
          }
        }

        const n = run.visited[i];
        const el = document.getElementById(`${run.prefix}node-${n.row}-${n.col}`);
        if (el && !n.isStart && !n.isEnd && !el.classList.contains('node-prediction-wrong')) {
          el.classList.add('node-visited');
        }

        run.onStep?.(i);
        run.visitedIndex += 1;
        scheduleNextTick();
        return;
      }

      if (run.phase === 'path') {
        const i = run.pathIndex;
        if (i >= run.path.length) {
          run.phase = 'done';
          clearNextChoiceHighlight();
          run.onDone?.();
          return;
        }

        const n = run.path[i];
        const el = document.getElementById(`${run.prefix}node-${n.row}-${n.col}`);
        if (el && !n.isStart && !n.isEnd && !el.classList.contains('node-prediction-wrong')) {
          el.classList.remove('node-visited');
          el.classList.add('node-shortest-path');
        }

        run.pathIndex += 1;
        scheduleNextTick();
      }
    };

    runStateRef.current.stepFunc = step;
    step();
  };

  // ── visualise (single or race) ───────────────────────────
  const handleVisualize = useCallback(() => {
    if (isVisualizing) return;

    clearAllTimeouts();
    clearDomClasses();
    clearNextChoiceHighlight();
    resetRunState();

    const cleanGrid = clearPath(grid);
    setGrid(cleanGrid);
    setIsVisualizing(true);
    setIsPaused(false);
    isPausedRef.current = false;
    setStats(null);
    setFormalTrace([]);
    setActiveTraceIndex(-1);
    setPausedComparison(null);
    setHoveredGoldNode(null);
    setTraceNotice('');

    const ms = SPEED_MS[speed];

    if (isRaceMode) {
      /* ── race: run both algorithms on independent copies ── */
      const gBfs = cloneGrid(cleanGrid);
      const gAstar = cloneGrid(cleanGrid);

      const bfsVisited = bfs(gBfs, gBfs[START_ROW][START_COL], gBfs[END_ROW][END_COL]);
      const bfsEnd = gBfs[END_ROW][END_COL];
      const bfsPathNodes = bfsEnd.isVisited ? getNodesInShortestPathOrder(bfsEnd) : [];

      const astarVisited = astar(gAstar, gAstar[START_ROW][START_COL], gAstar[END_ROW][END_COL]);
      const astarEnd = gAstar[END_ROW][END_COL];
      const astarPathNodes = astarEnd.isVisited ? getNodesInShortestPathOrder(astarEnd) : [];

      let done = 0;
      const onDone = () => {
        done++;
        if (done >= 2) {
          setIsVisualizing(false);
          setIsPaused(false);
          isPausedRef.current = false;
          setHoveredGoldNode(null);
          setStats({
            bfs: { visited: bfsVisited.length, path: bfsPathNodes.length },
            astar: { visited: astarVisited.length, path: astarPathNodes.length },
          });
        }
      };

      setTraceNotice('Detailed formal trace is disabled in Race Mode to avoid mixed proof streams.');

      // race mode code block...
      animateAlgorithm(bfsVisited, bfsPathNodes, 'bfs-', ms, null, onDone);
      animateAlgorithm(astarVisited, astarPathNodes, 'astar-', ms, null, onDone);
    } else {
      /* ── single algorithm ── */
      const copy = cloneGrid(cleanGrid);
      const start = copy[START_ROW][START_COL];
      const end = copy[END_ROW][END_COL];

      const result =
        algorithm === 'bfs'
          ? bfs(copy, start, end, { withTrace: true })
          : astar(copy, start, end, { withTrace: true });

      const visited = result.visitedNodesInOrder;
      const predictionOptions = isQuizMode ? result.predictionOptionsByIndex : null;
      const traceByIndex = result.formalTraceByIndex || [];
      setFormalTrace(traceByIndex);
      setActiveTraceIndex(traceByIndex.length > 0 ? 0 : -1);

      const pathNodes = end.isVisited
        ? getNodesInShortestPathOrder(end)
        : [];

      animateAlgorithm(
        visited,
        pathNodes,
        '',
        ms,
        predictionOptions,
        () => {
          setIsVisualizing(false);
          setIsPaused(false);
          isPausedRef.current = false;
          setPausedComparison(null);
          setHoveredGoldNode(null);
          clearNextChoiceHighlight();
          setStats({
            [algorithm]: { visited: visited.length, path: pathNodes.length },
          });
        },
        (stepIndex) => {
          setActiveTraceIndex(stepIndex);
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, algorithm, isRaceMode, speed, isVisualizing, isQuizMode]);

  const currentTrace =
    activeTraceIndex >= 0 && activeTraceIndex < formalTrace.length
      ? formalTrace[activeTraceIndex]
      : null;

  const hoveredGoldEquation = hoveredGoldNode
    ? `f(n)=g(n)+h(n)=${hoveredGoldNode.g}+${hoveredGoldNode.h}=${hoveredGoldNode.f}`
    : '';

  // ── render ───────────────────────────────────────────────
  return (
    <div className="app" onMouseLeave={handleMouseUp}>
      <h1>The Algorithmic Complexity Visualizer</h1>

      <ControlPanel
        onGenerateMaze={handleGenerateMaze}
        onClearBoard={handleClearBoard}
        onClearPath={handleClearPath}
        algorithm={algorithm}
        onAlgorithmChange={setAlgorithm}
        isRaceMode={isRaceMode}
        onRaceModeToggle={() => setIsRaceMode((v) => !v)}
        isQuizMode={isQuizMode}
        onQuizModeToggle={() => setIsQuizMode((v) => !v)}
        onVisualize={handleVisualize}
        speed={speed}
        onSpeedChange={setSpeed}
        isVisualizing={isVisualizing}
      />

      <section className="legend-panel" aria-label="Visualizer legend">
        <h2>Legend</h2>
        <div className="legend-grid">
          <div className="legend-item">
            <span className="legend-swatch swatch-start" />
            <span>Start node</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-end" />
            <span>Goal node</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-wall" />
            <span>Wall (blocked)</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-unvisited" />
            <span>Unvisited node</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-visited" />
            <span>Visited during search</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-path" />
            <span>Shortest path</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-candidate" />
            <span>Quiz candidate node</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-next" />
            <span>Gold = next mathematically valid choice when paused</span>
          </div>
        </div>
      </section>

      {quizState.active && (
        <div className="quiz-overlay">
          <h2>{isPaused ? 'Paused — ' : ''}{quizState.message}</h2>
        </div>
      )}

      {isRaceMode ? (
        <div className="race-container">
          <Grid
            grid={grid}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseUp={handleMouseUp}
            prefix="bfs-"
            label="BFS"
            cellSize={RACE_CELL}
          />
          <Grid
            grid={grid}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseUp={handleMouseUp}
            prefix="astar-"
            label="A*"
            cellSize={RACE_CELL}
          />
        </div>
      ) : (
        <Grid
          grid={grid}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onMouseUp={handleMouseUp}
        />
      )}

      {!isRaceMode && isPaused && pausedComparison && hoveredGoldNode && (
        <section className="node-proof-hover-panel" aria-live="polite">
          <div className="node-proof-card">
            <p>
              <strong>Hovered node:</strong> ({hoveredGoldNode.row}, {hoveredGoldNode.col})
            </p>
            <p>
              <strong>Equation for this node:</strong> {hoveredGoldEquation}
            </p>

            {pausedComparison.algorithm === 'astar' ? (
              <>
                <p>
                  <strong>Chosen vs minimum frontier:</strong> hovered f={hoveredGoldNode.f}, minimum f={pausedComparison.minComparison?.minF ?? 'N/A'}
                </p>
                <p>
                  <strong>Tie-break check:</strong> hovered h={hoveredGoldNode.h}, minimum h among minimum-f nodes={pausedComparison.minComparison?.minHAmongMinF ?? 'N/A'}
                </p>
                <p>
                  <strong>Why this is valid:</strong> A* expands nodes with minimum f(n)=g(n)+h(n). For equal f, minimum h is selected. This node satisfies that rule.
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Chosen vs minimum frontier depth:</strong> hovered g={hoveredGoldNode.g}, minimum g={pausedComparison.minComparison?.minG ?? 'N/A'}
                </p>
                <p>
                  <strong>BFS metric mapping:</strong> h(n)=0, so f(n)=g(n). This node has minimum frontier depth.
                </p>
                <p>
                  <strong>Why this is valid:</strong> BFS always expands the shallowest queued layer first. This node satisfies that rule.
                </p>
              </>
            )}
          </div>
        </section>
      )}

      {!isRaceMode && (
        <section className="formal-trace-panel">
          <h2>Step-by-Step Mathematical Trace</h2>

          {isVisualizing && !isRaceMode && (
            <p className="trace-hotkey">
              Press <strong>Space</strong> to {isPaused ? 'resume' : 'pause'} the run.
            </p>
          )}

          <p className="formal-invariant">
            {algorithm === 'astar'
              ? 'Formal invariant (A*): each expansion chooses a node with minimum f(n)=g(n)+h(n) on the frontier (tie-broken by minimum h). With Manhattan h on this unit 4-neighbor grid, h is consistent, so once a node is closed, its g is optimal.'
              : 'Formal invariant (BFS): the queue expands nodes in non-decreasing depth g. Writing BFS as f(n)=g(n)+h(n) with h(n)=0 gives f(n)=g(n), so first discovery of a node is its shortest-path depth.'}
          </p>

          {traceNotice && <p className="trace-notice">{traceNotice}</p>}

          {!currentTrace && !traceNotice && (
            <p className="trace-empty">
              Run a single algorithm to see a complete formal proof trace for every move.
            </p>
          )}

          {currentTrace && (
            <div className="trace-card">
              <p>
                <strong>Step:</strong> {currentTrace.expansionIndex + 1} / {formalTrace.length}
              </p>
              <p>
                <strong>Expanded node:</strong> ({currentTrace.expandedNode.row}, {currentTrace.expandedNode.col})
              </p>
              <p>
                <strong>Node equation:</strong> {currentTrace.equation}
              </p>
              <p>
                <strong>Selection rule:</strong> {currentTrace.selectedBecause}
              </p>
              <p>
                <strong>Proof checks:</strong>{' '}
              </p>
              <div className="proof-check-list">
                {Object.entries(currentTrace.proofChecks || {}).map(([key, value]) => {
                  const info = PROOF_CHECK_INFO[key] || {
                    label: key,
                    description: 'This condition verifies a formal rule for the current expansion.',
                  };

                  return (
                    <div key={key} className="proof-check-item">
                      <p className={value ? 'proof-check pass' : 'proof-check fail'}>
                        <strong>{info.label}:</strong> {value ? 'Yes' : 'No'}
                      </p>
                      <p className="proof-check-description">{info.description}</p>
                    </div>
                  );
                })}
              </div>

              <p>
                <strong>Neighbor attempts:</strong> {(currentTrace.attempts || []).length}
              </p>

              <div className="attempt-list">
                {(currentTrace.attempts || []).map((attempt, idx) => (
                  <div key={`${attempt.to.row}-${attempt.to.col}-${idx}`} className="attempt-item">
                    <p>
                      <strong>Neighbor ({attempt.to.row}, {attempt.to.col}):</strong>{' '}
                      {attempt.decision.toUpperCase()} ({attempt.reason})
                    </p>
                    <p>{attempt.equation}</p>
                  </div>
                ))}
              </div>

              <p className="trace-summary">
                <strong>Step conclusion:</strong> {currentTrace.summary}
              </p>
            </div>
          )}
        </section>
      )}

      {/* ── stats cards ── */}
      {stats && (
        <div className="stats-container">
          {Object.entries(stats).map(([key, { visited, path }]) => (
            <div key={key} className="stat-card">
              <h3>{key === 'bfs' ? 'BFS' : 'A*'}</h3>
              <p>
                Nodes visited: <span className="stat-value">{visited}</span>
              </p>
              <p>
                Path length:{' '}
                <span className="stat-value">{path > 0 ? path : '—'}</span>
              </p>
              {path === 0 && <p className="no-path">No path found!</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
