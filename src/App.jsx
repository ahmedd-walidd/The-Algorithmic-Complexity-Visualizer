import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
import { COLS } from './utils/gridHelpers';
import './App.css';

// Custom hook to calculate responsive cell size based on viewport width
function useResponsiveCellSize(isRaceMode = false) {
  const [cellSize, setCellSize] = useState(25);

  useEffect(() => {
    const calculateCellSize = () => {
      // Constants (in pixels)
      const sidePanelWidth = 280;
      const mainGap = 24; // 1.5rem ≈ 24px
      const appPadding = 32; // 2rem = 32px
      const minCellSize = 12;
      const maxCellSize = 28;

      const vw = window.innerWidth;
      const availableWidth = vw * 0.95 - appPadding * 2;

      let calculatedSize;
      if (isRaceMode) {
        // Two grids side-by-side + gap between them
        const twoGridsGap = mainGap;
        const usableWidth = availableWidth - twoGridsGap;
        calculatedSize = Math.floor(usableWidth / (COLS * 2));
      } else {
        // Single grid + side panel
        const totalSidePanelWithGap = sidePanelWidth + mainGap;
        const usableWidth = availableWidth - totalSidePanelWithGap;
        calculatedSize = Math.floor(usableWidth / COLS);
      }

      // Clamp to reasonable range
      const clampedSize = Math.max(minCellSize, Math.min(maxCellSize, calculatedSize));
      setCellSize(clampedSize);
    };

    calculateCellSize();
    window.addEventListener('resize', calculateCellSize);

    return () => {
      window.removeEventListener('resize', calculateCellSize);
    };
  }, [isRaceMode]);

  return cellSize;
}

// Increased base delays so traversal is easier to follow visually.
const SPEED_MS = { slow: 140, medium: 80, fast: 40 };
const RACE_CELL = 14; // smaller cells when two grids are side-by-side
const GAMIFICATION_WEIGHTS = {
  alpha: 0.9,
  beta: 0.1,
  maxQuestionScore: 100,
};

const DEFAULT_SETTINGS = {
  speed: 'medium',
  quizPromptInterval: 15,
};

const INITIAL_SCORE_STATE = {
  totalScore: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  totalAttempts: 0,
  totalAccuracyScore: 0,
  totalResponseTime: 0,
  lastQuestionScore: 0,
  lastAccuracy: 0,
  lastResponseTime: 0,
  lastAttempts: 0,
};

function buildPreviewPath(grid, start, end, algorithm) {
  if (!grid?.length || !start || !end) return [];

  const previewGrid = clearPath(cloneGrid(grid));
  const startNode = previewGrid[start.row]?.[start.col];
  const endNode = previewGrid[end.row]?.[end.col];

  if (!startNode || !endNode) return [];

  if (algorithm === 'astar') {
    astar(previewGrid, startNode, endNode);
  } else {
    bfs(previewGrid, startNode, endNode);
  }

  return endNode.isVisited ? getNodesInShortestPathOrder(endNode) : [];
}

function App() {
  // ── state ────────────────────────────────────────────────
  const [grid, setGrid] = useState(() => createGrid());
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [isObstacleMode, setIsObstacleMode] = useState(false);
  const [algorithm, setAlgorithm] = useState('bfs');
  const [isRaceMode, setIsRaceMode] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SETTINGS.speed);
  const [quizPromptInterval, setQuizPromptInterval] = useState(DEFAULT_SETTINGS.quizPromptInterval);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(DEFAULT_SETTINGS);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [simulationPhase, setSimulationPhase] = useState('idle');
  const [stats, setStats] = useState(null);
  const timeoutsRef = useRef([]);
  const obstacleDragModeRef = useRef(null);

  // ── responsive cell size ─────────────────────────────────
  const responsiveCellSize = useResponsiveCellSize(isRaceMode);

  const [isQuizMode, setIsQuizMode] = useState(false);
  const [scorePopup, setScorePopup] = useState(null);
  const [quizState, setQuizState] = useState({
    active: false,
    candidates: [],
    nextCorrectIndex: -1,
    message: '',
    awaitingContinue: false,
    continueFunc: null,
    feedbackType: 'question',
  });
  const [scoreState, setScoreState] = useState(INITIAL_SCORE_STATE);
  const [formalTrace, setFormalTrace] = useState([]);
  const [activeTraceIndex, setActiveTraceIndex] = useState(-1);
  const [traceNotice, setTraceNotice] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [pausedComparison, setPausedComparison] = useState(null);
  const [hoveredFrontierNode, setHoveredFrontierNode] = useState(null);

  const getSimulationPhaseDisplay = useCallback(() => {
    switch (simulationPhase) {
      case 'idle':
        return 'Idle';
      case 'visited':
        return 'Traversing...';
      case 'path':
        return 'Showing Path...';
      case 'done':
        return 'Done';
      default:
        return 'Idle';
    }
  }, [simulationPhase]);

  const isPausedRef = useRef(false);
  const isQuizModeRef = useRef(false);
  const quizStateRef = useRef(quizState);
  const quizProgressRef = useRef({
    questionStartedAt: 0,
    attempts: 0,
    selectedKeys: new Set(),
    awarded: false,
    correctKey: null,
  });
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
    pauseInterval: DEFAULT_SETTINGS.quizPromptInterval,
    stepFunc: null,
  });

  const buildWrongPredictionMessage = useCallback((row, col, state) => {
    const key = `${row}-${col}`;
    const clicked = state?.frontierByKey?.[key];
    const ruleMeta = state?.ruleMeta;

    if (!clicked || !ruleMeta) {
      return 'Incorrect. Formal rule: the next expansion must satisfy the algorithm ordering rule over the current frontier.';
    }

    if (ruleMeta.algorithm === 'astar') {
      const clickedF = clicked.f;
      const clickedH = clicked.h;
      const minF = ruleMeta.minF;
      const minH = ruleMeta.minHAmongMinF;

      if (clickedF > minF) {
        return `Incorrect: this node has f=${clickedF} (g+h=${clicked.g}+${clicked.h}), but A* must choose minimum frontier f=${minF}.`;
      }

      return `Incorrect: this node ties on f=${clickedF}, but its h=${clickedH} is larger than the minimum tie-break h=${minH}.`;
    }

    const clickedG = clicked.g;
    const minG = ruleMeta.minG;
    return `Incorrect: this node has depth g=${clickedG}, but BFS expands minimum frontier depth first (h=0 ⇒ f=g), so next must have g=${minG}.`;
  }, []);

  const buildCorrectPredictionMessage = useCallback((row, col, state) => {
    const key = `${row}-${col}`;
    const clicked = state?.frontierByKey?.[key];
    const ruleMeta = state?.ruleMeta;

    if (!clicked || !ruleMeta) {
      return 'Correct. This node satisfies the algorithm ordering rule for the current frontier. Press Continue.';
    }

    if (ruleMeta.algorithm === 'astar') {
      return `Correct: this node has minimum frontier f=${ruleMeta.minF}, and tie-break minimum h=${ruleMeta.minHAmongMinF}. (g+h=${clicked.g}+${clicked.h}=${clicked.f}) Press Continue.`;
    }

    return `Correct: this node has minimum frontier depth g=${ruleMeta.minG}. In BFS, h=0 so f=g, therefore it is a valid next expansion. Press Continue.`;
  }, []);

  const applyObstacleState = useCallback((row, col, isWall) => {
    if (row === START_ROW && col === START_COL) return;
    if (row === END_ROW && col === END_COL) return;

    setGrid((prev) => {
      const currentNode = prev[row]?.[col];
      if (!currentNode || currentNode.isWall === isWall) return prev;

      const next = prev.map((r) => r.map((n) => ({ ...n })));
      next[row][col] = { ...next[row][col], isWall };
      return next;
    });
  }, []);

  const showPositiveGamifiedText = useCallback((row, col, text) => {
    const ids = [`node-${row}-${col}`, `bfs-node-${row}-${col}`, `astar-node-${row}-${col}`];
    let el = null;
    for (const id of ids) {
      el = document.getElementById(id);
      if (el) break;
    }
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const floater = document.createElement('div');
    floater.className = 'node-gamified-popup node-gamified-popup-positive';
    floater.innerText = text;
    floater.style.left = `${rect.left + rect.width / 2}px`;
    floater.style.top = `${rect.top - 10}px`;
    floater.style.transform = 'translate(-50%, -100%)';

    document.body.appendChild(floater);
    setTimeout(() => {
      floater.remove();
    }, 2000);
  }, []);

  const resetGamification = useCallback(() => {
    setScoreState(INITIAL_SCORE_STATE);
    quizProgressRef.current = {
      questionStartedAt: 0,
      attempts: 0,
      selectedKeys: new Set(),
      awarded: false,
      correctKey: null,
    };
  }, []);

  const calculateQuestionScore = useCallback((attempts, responseTimeMs) => {
    const accuracy = attempts > 0 ? 1 / attempts : 0;
    const responseSeconds = Math.max(responseTimeMs / 1000, 0);
    const responseComponent = 1 / (1 + responseSeconds);
    const rawScore =
      GAMIFICATION_WEIGHTS.alpha * accuracy + GAMIFICATION_WEIGHTS.beta * responseComponent;

    return {
      accuracy,
      responseSeconds,
      responseComponent,
      questionScore: Math.round(rawScore * GAMIFICATION_WEIGHTS.maxQuestionScore),
    };
  }, []);

  useEffect(() => {
    isQuizModeRef.current = isQuizMode;
  }, [isQuizMode]);

  useEffect(() => {
    quizStateRef.current = quizState;
  }, [quizState]);

  useEffect(() => {
    formalTraceRef.current = formalTrace;
  }, [formalTrace]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;

      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return;
      }

      if (isLegendOpen) {
        setIsLegendOpen(false);
        return;
      }

      setIsObstacleMode(false);
      setIsMousePressed(false);
      obstacleDragModeRef.current = null;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isLegendOpen]);

  const openSettings = useCallback(() => {
    setIsLegendOpen(false);
    setSettingsDraft({
      speed,
      quizPromptInterval,
    });
    setIsSettingsOpen(true);
  }, [speed, quizPromptInterval]);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
    setSettingsDraft({
      speed,
      quizPromptInterval,
    });
  }, [speed, quizPromptInterval]);

  const openLegend = useCallback(() => {
    setIsSettingsOpen(false);
    setIsLegendOpen(true);
  }, []);

  const closeLegend = useCallback(() => {
    setIsLegendOpen(false);
  }, []);

  const saveSettings = useCallback(() => {
    setSpeed(settingsDraft.speed);
    setQuizPromptInterval(settingsDraft.quizPromptInterval);
    runStateRef.current.pauseInterval = settingsDraft.quizPromptInterval;
    setIsSettingsOpen(false);
  }, [settingsDraft]);

  const resetSettingsToDefaults = useCallback(() => {
    setSettingsDraft(DEFAULT_SETTINGS);
  }, []);

  // ── wall drawing / quiz clicks ─────────────────────────
  const handleMouseDown = useCallback(
    (row, col, event) => {
      if (event?.button !== undefined && event.button !== 0) return;

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

        if (quizState.awaitingContinue) {
          setQuizState((prev) => ({
            ...prev,
            message: 'Answer already evaluated. Press Continue to proceed.',
          }));
          return;
        }

        const key = `${row}-${col}`;
        if (quizProgressRef.current.selectedKeys.has(key)) {
          setQuizState((prev) => ({
            ...prev,
            message: 'This node was already evaluated for this prompt. Pick another candidate.',
          }));
          return;
        }
        quizProgressRef.current.selectedKeys.add(key);

  quizProgressRef.current.attempts += 1;

        // Check if the clicked node is one of the correct ones
        const isCorrect = quizState.correctNodes?.some(c => c.row === row && c.col === col);
        
        if (isCorrect) {
          const responseTimeMs =
            quizProgressRef.current.questionStartedAt > 0
              ? performance.now() - quizProgressRef.current.questionStartedAt
              : 0;
          const scoring = calculateQuestionScore(
            quizProgressRef.current.attempts,
            responseTimeMs
          );
          const attemptsUsed = quizProgressRef.current.attempts;
          quizProgressRef.current.awarded = true;
          quizProgressRef.current.correctKey = `${row}-${col}`;

          setScoreState((prev) => ({
            ...prev,
            totalScore: prev.totalScore + scoring.questionScore,
            questionsAnswered: prev.questionsAnswered + 1,
            correctAnswers: prev.correctAnswers + 1,
            totalAttempts: prev.totalAttempts + attemptsUsed,
            totalAccuracyScore: prev.totalAccuracyScore + scoring.accuracy,
            totalResponseTime: prev.totalResponseTime + scoring.responseSeconds,
            lastQuestionScore: scoring.questionScore,
            lastAccuracy: scoring.accuracy,
            lastResponseTime: scoring.responseSeconds,
            lastAttempts: attemptsUsed,
          }));

          const detailedMessage = buildCorrectPredictionMessage(row, col, quizState);
          setQuizState((prev) => ({
            ...prev,
            awaitingContinue: true,
            feedbackType: 'correct',
            attemptCount: attemptsUsed,
            scoreBreakdown: scoring,
            message: detailedMessage,
          }));

          setScorePopup(scoring);
          setTimeout(() => setScorePopup(null), 3000);

          const el = document.getElementById(`node-${row}-${col}`) || document.getElementById(`bfs-node-${row}-${col}`) || document.getElementById(`astar-node-${row}-${col}`);
          if (el) el.classList.add('node-prediction-correct');

          showPositiveGamifiedText(row, col, `+${scoring.questionScore}`);
        } else {
            // Wrong answer
            const el = document.getElementById(`node-${row}-${col}`) || document.getElementById(`bfs-node-${row}-${col}`) || document.getElementById(`astar-node-${row}-${col}`);
            if (el) el.classList.add('node-prediction-wrong');

          const detailedMessage = buildWrongPredictionMessage(row, col, quizState);
          setQuizState(prev => ({
            ...prev,
            feedbackType: 'incorrect',
            message: detailedMessage,
            attemptCount: quizProgressRef.current.attempts,
            // Keep Continue visible if the learner already selected a valid next node.
            awaitingContinue: prev.awaitingContinue,
          }));
        }
        return;
      }

      if (isVisualizing) return;
      if (!isObstacleMode) return;
      if (row === START_ROW && col === START_COL) return;
      if (row === END_ROW && col === END_COL) return;

      const currentNode = grid[row]?.[col];
      if (!currentNode) return;

      setIsMousePressed(true);
      obstacleDragModeRef.current = currentNode.isWall ? 'erase' : 'wall';
      applyObstacleState(row, col, obstacleDragModeRef.current === 'wall');
    },
    [
      isVisualizing,
      quizState,
      isPaused,
      grid,
      isObstacleMode,
      buildWrongPredictionMessage,
      buildCorrectPredictionMessage,
      calculateQuestionScore,
      showPositiveGamifiedText,
      applyObstacleState,
    ]
  );

  const handleMouseEnter = useCallback(
    (row, col) => {
      const hoverSource = (() => {
        if (isRaceMode) return null;

        if (isPaused && pausedComparison) {
          const frontierByKey = {};
          (pausedComparison.frontierNodes || []).forEach((n) => {
            frontierByKey[`${n.row}-${n.col}`] = n;
          });

          return {
            frontierByKey,
          };
        }

        if (quizState.active && quizState.frontierByKey) {
          return {
            frontierByKey: quizState.frontierByKey,
          };
        }

        return null;
      })();

      if (hoverSource?.frontierByKey) {
        const hovered = hoverSource.frontierByKey[`${row}-${col}`] || null;
        setHoveredFrontierNode(hovered);
      } else if (hoveredFrontierNode) {
        setHoveredFrontierNode(null);
      }

      if (!isMousePressed || isVisualizing || !isObstacleMode) return;

      const dragMode = obstacleDragModeRef.current ?? 'wall';
      applyObstacleState(row, col, dragMode === 'wall');
    },
    [
      isMousePressed,
      isVisualizing,
      isPaused,
      pausedComparison,
      hoveredFrontierNode,
      isRaceMode,
      quizState,
      isObstacleMode,
      applyObstacleState,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsMousePressed(false);
    obstacleDragModeRef.current = null;
  }, []);

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

  const clearFrontierHoverHighlight = useCallback(() => {
    document.querySelectorAll('.node-frontier-hoverable').forEach((el) => {
      el.classList.remove('node-frontier-hoverable');
    });
  }, []);

  const clearPreviewPathHighlight = useCallback(() => {
    document.querySelectorAll('.node-hover-preview-path').forEach((el) => {
      el.classList.remove(
        'node-hover-preview-path',
        'node-hover-preview-path-source',
        'node-hover-preview-path-goal',
        'node-hover-preview-forward',
        'node-hover-preview-backward'
      );
      delete el.dataset.forwardLabel;
      delete el.dataset.backwardLabel;
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

  const applyFrontierHoverHighlight = useCallback((nodes, prefix = '') => {
    clearFrontierHoverHighlight();
    (nodes || []).forEach((n) => {
      const el = document.getElementById(`${prefix}node-${n.row}-${n.col}`);
      if (!el) return;
      if (el.classList.contains('node-wall')) return;
      el.classList.add('node-frontier-hoverable');
    });
  }, [clearFrontierHoverHighlight]);

  const applyPreviewPathHighlight = useCallback((nodes, options = {}) => {
    const {
      prefix = '',
      kind = 'forward',
      labelMode = 'remaining',
      goalRow = END_ROW,
      goalCol = END_COL,
      clearBefore = false,
    } = options;

    if (clearBefore) clearPreviewPathHighlight();

    const isForward = kind === 'forward';
    const totalSteps = Math.max((nodes || []).length - 1, 0);

    (nodes || []).forEach((n, index) => {
      const el = document.getElementById(`${prefix}node-${n.row}-${n.col}`);
      if (!el) return;
      if (el.classList.contains('node-wall')) return;
      el.classList.add('node-hover-preview-path');
      el.classList.add(isForward ? 'node-hover-preview-forward' : 'node-hover-preview-backward');

      if (index === 0) {
        el.classList.add('node-hover-preview-path-source');
      }
      if (index === nodes.length - 1) {
        el.classList.add('node-hover-preview-path-goal');
      }

      const labelValue = (() => {
        if (labelMode === 'heuristic') {
          return Math.abs(n.row - goalRow) + Math.abs(n.col - goalCol);
        }
        if (labelMode === 'remaining') {
          return totalSteps - index;
        }
        return index;
      })();
      if (isForward) {
        el.dataset.forwardLabel = String(labelValue);
      } else {
        el.dataset.backwardLabel = String(labelValue);
      }
    });
  }, [clearPreviewPathHighlight]);

  const resetRunState = useCallback(() => {
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
      pauseInterval: quizPromptInterval,
      stepFunc: null,
    };
  }, [quizPromptInterval]);

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
            'node-frontier-hoverable',
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
        frontierNodes: [],
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
        frontierNodes: frontier.map((n) => ({ row: n.row, col: n.col, g: n.g, h: n.h, f: n.f })),
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
      frontierNodes: frontier.map((n) => ({ row: n.row, col: n.col, g: n.g, h: 0, f: n.g })),
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
    setHoveredFrontierNode(null);
    applyFrontierHoverHighlight(comparison?.frontierNodes || []);
    applyNextChoiceHighlight(comparison?.candidateNodes || []);
  }, [getNextTraversalComparison, applyNextChoiceHighlight, applyFrontierHoverHighlight]);

  const resumeRun = useCallback(() => {
    clearNextChoiceHighlight();
    clearFrontierHoverHighlight();
    setPausedComparison(null);
    setHoveredFrontierNode(null);

    const run = runStateRef.current;
    if (run.phase === 'idle' || run.phase === 'done') return;
    if (quizStateRef.current.active) return;

    const delay = run.phase === 'path' ? run.ms * 3 : run.ms;
    const t = setTimeout(() => {
      runStateRef.current.stepFunc?.();
    }, delay);
    timeoutsRef.current.push(t);
  }, [clearNextChoiceHighlight, clearFrontierHoverHighlight]);

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
    resetGamification();
    setFormalTrace([]);
    setActiveTraceIndex(-1);
    setPausedComparison(null);
    setHoveredFrontierNode(null);
    setTraceNotice('');
    setSimulationPhase('idle');
  }, [clearNextChoiceHighlight, resetGamification, resetRunState]);

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
    resetGamification();
    setFormalTrace([]);
    setActiveTraceIndex(-1);
    setPausedComparison(null);
    setHoveredFrontierNode(null);
    setTraceNotice('');
  }, [clearNextChoiceHighlight, resetGamification, resetRunState]);

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
    resetGamification();
    setFormalTrace([]);
    setActiveTraceIndex(-1);
    setPausedComparison(null);
    setHoveredFrontierNode(null);
    setTraceNotice('');
  }, [clearNextChoiceHighlight, resetGamification, resetRunState]);

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
      pauseInterval: quizPromptInterval,
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
          setSimulationPhase('path');
          if (run.path.length === 0) {
            run.phase = 'done';
            setSimulationPhase('done');
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

            selectable.forEach((c) => {
              const el = document.getElementById(`${run.prefix}node-${c.row}-${c.col}`);
              if (el && !el.classList.contains('node-visited') && !el.classList.contains('node-wall')) {
                el.classList.add('node-prediction-candidate');
              }
            });

            const continueAfterFeedback = () => {
              if (isPausedRef.current) {
                setQuizState((prev) => ({
                  ...prev,
                  message: 'Paused. Press Space to resume, then continue.',
                }));
                return;
              }

              selectable.forEach((c) => {
                const el = document.getElementById(`${run.prefix}node-${c.row}-${c.col}`);
                if (el) {
                  const key = `${c.row}-${c.col}`;
                  el.classList.remove('node-prediction-candidate', 'node-prediction-not-correct');
                  if (key !== quizProgressRef.current.correctKey) {
                    el.classList.remove('node-prediction-correct');
                  }
                }
              });

              setQuizState({
                active: false,
                candidates: [],
                correctNodes: [],
                message: '',
                awaitingContinue: false,
                continueFunc: null,
                feedbackType: 'question',
              });
              quizProgressRef.current = {
                questionStartedAt: 0,
                attempts: 0,
                selectedKeys: new Set(),
                awarded: false,
              };

              const n = run.visited[run.visitedIndex];
              const el = document.getElementById(`${run.prefix}node-${n.row}-${n.col}`);
              if (el && !n.isStart && !n.isEnd && !el.classList.contains('node-prediction-wrong')) {
                el.classList.add('node-visited');
              }

              run.onStep?.(run.visitedIndex);
              run.visitedIndex += 1;
              scheduleNextTick();
            };

            setQuizState({
              active: true,
              candidates: selectable,
              correctNodes: correct,
              message: 'Quiz: Which frontier node is the mathematically valid next choice under the current algorithm rule? (Click a glowing node)',
              awaitingContinue: false,
              continueFunc: continueAfterFeedback,
              feedbackType: 'question',
              ruleMeta: (() => {
                const traceStep = formalTraceRef.current[i];
                const frontier = traceStep?.frontierBeforeExpansion || [];
                if (!traceStep || frontier.length === 0) return null;

                if (traceStep.algorithm === 'astar') {
                  const minF = Math.min(...frontier.map((n) => n.f));
                  const minHAmongMinF = Math.min(
                    ...frontier.filter((n) => n.f === minF).map((n) => n.h)
                  );
                  return { algorithm: 'astar', minF, minHAmongMinF };
                }

                const minG = Math.min(...frontier.map((n) => n.g));
                return { algorithm: 'bfs', minG };
              })(),
              frontierByKey: (() => {
                const traceStep = formalTraceRef.current[i];
                const frontier = traceStep?.frontierBeforeExpansion || [];
                const byKey = {};
                frontier.forEach((n) => {
                  byKey[`${n.row}-${n.col}`] = n;
                });
                return byKey;
              })(),
            });
            quizProgressRef.current = {
              questionStartedAt: performance.now(),
              attempts: 0,
              selectedKeys: new Set(),
              awarded: false,
            };

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
        setSimulationPhase('visited');
        scheduleNextTick();
        return;
      }

      if (run.phase === 'path') {
        const i = run.pathIndex;
        if (i >= run.path.length) {
          run.phase = 'done';
          setSimulationPhase('done');
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
        setSimulationPhase('path');
        scheduleNextTick();
      }
    };

    runStateRef.current.stepFunc = step;
    step();
  };

  const animateAlgorithmRace = (visited, path, prefix, ms, onDone, onPathStart) => {
    if (visited.length === 0) {
      onDone?.();
      return;
    }

    let visitedIndex = 0;

    const animateRacePath = () => {
      if (path.length === 0) {
        onDone?.();
        return;
      }
      onPathStart?.();

      let pathIndex = 0;
      const pathStep = () => {
        if (pathIndex >= path.length) {
          onDone?.();
          return;
        }

        const n = path[pathIndex];
        const el = document.getElementById(`${prefix}node-${n.row}-${n.col}`);
        if (el && !n.isStart && !n.isEnd) {
          el.classList.remove('node-visited');
          el.classList.add('node-shortest-path');
        }

        pathIndex += 1;
        const t = setTimeout(pathStep, ms * 3);
        timeoutsRef.current.push(t);
      };

      pathStep();
    };

    const visitStep = () => {
      if (visitedIndex >= visited.length) {
        animateRacePath();
        return;
      }

      const n = visited[visitedIndex];
      const el = document.getElementById(`${prefix}node-${n.row}-${n.col}`);
      if (el && !n.isStart && !n.isEnd) {
        el.classList.add('node-visited');
      }

      visitedIndex += 1;
      const t = setTimeout(visitStep, ms);
      timeoutsRef.current.push(t);
    };

    visitStep();
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
    resetGamification();
    setStats(null);
    setFormalTrace([]);
    setActiveTraceIndex(-1);
    setPausedComparison(null);
    setHoveredFrontierNode(null);
    setTraceNotice('');

    const ms = SPEED_MS[speed];
    runStateRef.current.pauseInterval = quizPromptInterval;

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

      setSimulationPhase('visited');
      let done = 0;
      let pathPhaseShown = false;
      const onPathStart = () => {
        if (pathPhaseShown) return;
        pathPhaseShown = true;
        setSimulationPhase('path');
      };
      const onDone = () => {
        done++;
        if (done >= 2) {
          setIsVisualizing(false);
          setIsPaused(false);
          isPausedRef.current = false;
          setHoveredFrontierNode(null);
          setSimulationPhase('done');
          setStats({
            bfs: { visited: bfsVisited.length, path: bfsPathNodes.length },
            astar: { visited: astarVisited.length, path: astarPathNodes.length },
          });
        }
      };

      setTraceNotice('Detailed formal trace is disabled in Race Mode to avoid mixed proof streams.');

      // race mode: independent animation loops for both sides
      animateAlgorithmRace(bfsVisited, bfsPathNodes, 'bfs-', ms, onDone, onPathStart);
      animateAlgorithmRace(astarVisited, astarPathNodes, 'astar-', ms, onDone, onPathStart);
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
          setHoveredFrontierNode(null);
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
  }, [grid, algorithm, isRaceMode, speed, quizPromptInterval, isVisualizing, isQuizMode, resetGamification]);

  const currentTrace =
    activeTraceIndex >= 0 && activeTraceIndex < formalTrace.length
      ? formalTrace[activeTraceIndex]
      : null;

  const hoveredFrontierEquation = hoveredFrontierNode
    ? `f(n)=g(n)+h(n)=${hoveredFrontierNode.g}+${hoveredFrontierNode.h}=${hoveredFrontierNode.f}`
    : '';
  const activeHoverComparison = (() => {
    if (isRaceMode) return null;

    if (isPaused && pausedComparison) {
      return {
        algorithm: pausedComparison.algorithm,
        minComparison: pausedComparison.minComparison,
      };
    }

    if (quizState.active && quizState.ruleMeta) {
      return {
        algorithm: quizState.ruleMeta.algorithm,
        minComparison:
          quizState.ruleMeta.algorithm === 'astar'
            ? {
                minF: quizState.ruleMeta.minF,
                minHAmongMinF: quizState.ruleMeta.minHAmongMinF,
              }
            : {
                minG: quizState.ruleMeta.minG,
              },
      };
    }

    return null;
  })();

  const hoveredNodeDecision = (() => {
    if (!hoveredFrontierNode || !activeHoverComparison) return '';

    if (activeHoverComparison.algorithm === 'astar') {
      const minF = activeHoverComparison.minComparison?.minF;
      const minHAmongMinF = activeHoverComparison.minComparison?.minHAmongMinF;
      const hasMinF = hoveredFrontierNode.f === minF;
      const hasBestTieBreak = hoveredFrontierNode.h === minHAmongMinF;

      if (hasMinF && hasBestTieBreak) {
        return 'Would be chosen next: minimum frontier f and minimum tie-break h.';
      }

      if (!hasMinF) {
        return `Not chosen yet: f=${hoveredFrontierNode.f} is larger than frontier minimum f=${minF}.`;
      }

      return `Not chosen yet: ties on f=${hoveredFrontierNode.f}, but h=${hoveredFrontierNode.h} is larger than minimum tie-break h=${minHAmongMinF}.`;
    }

    const minG = activeHoverComparison.minComparison?.minG;
    if (hoveredFrontierNode.g === minG) {
      return 'Would be chosen next: minimum frontier depth g (BFS queue rule).';
    }
    return `Not chosen yet: depth g=${hoveredFrontierNode.g} is larger than frontier minimum g=${minG}.`;
  })();

  const hoveredForwardPreviewPath = useMemo(() => {
    if (!hoveredFrontierNode || !activeHoverComparison) return [];
    if (activeHoverComparison.algorithm !== 'astar') return [];
    return buildPreviewPath(
      grid,
      { row: hoveredFrontierNode.row, col: hoveredFrontierNode.col },
      { row: END_ROW, col: END_COL },
      activeHoverComparison.algorithm
    );
  }, [grid, hoveredFrontierNode, activeHoverComparison]);

  const hoveredBackwardPreviewPath = useMemo(() => {
    if (!hoveredFrontierNode || !activeHoverComparison) return [];
    return buildPreviewPath(
      grid,
      { row: START_ROW, col: START_COL },
      { row: hoveredFrontierNode.row, col: hoveredFrontierNode.col },
      'bfs'
    );
  }, [grid, hoveredFrontierNode, activeHoverComparison]);

  useEffect(() => {
    clearPreviewPathHighlight();
    applyPreviewPathHighlight(hoveredBackwardPreviewPath, {
      kind: 'backward',
      labelMode: 'index',
    });
    if (activeHoverComparison?.algorithm === 'astar') {
      applyPreviewPathHighlight(hoveredForwardPreviewPath, {
        kind: 'forward',
        labelMode: 'remaining',
        goalRow: END_ROW,
        goalCol: END_COL,
      });
    }
    return () => clearPreviewPathHighlight();
  }, [
    hoveredForwardPreviewPath,
    hoveredBackwardPreviewPath,
    activeHoverComparison,
    applyPreviewPathHighlight,
    clearPreviewPathHighlight,
  ]);

  const averageTryAccuracy =
    scoreState.questionsAnswered > 0
      ? scoreState.totalAccuracyScore / scoreState.questionsAnswered
      : 0;
  const averageTriesPerQuestion =
    scoreState.questionsAnswered > 0
      ? scoreState.totalAttempts / scoreState.questionsAnswered
      : 0;

  // ── render ───────────────────────────────────────────────
  return (
    <div className={`app${isObstacleMode ? ' obstacle-mode' : ''}`} onMouseLeave={handleMouseUp}>
      <h1 className="app-title">
        <span className="app-title-top">The Algorithmic Complexity</span>
        <span className="app-title-bottom">Visualizer</span>
      </h1>

      <button
        type="button"
        className="settings-fab"
        onClick={openSettings}
        aria-haspopup="dialog"
        aria-expanded={isSettingsOpen}
        aria-label="Open settings"
        title="Open settings"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="settings-fab-icon">
          <path d="M19.14 12.94a7.43 7.43 0 0 0 .05-.94c0-.32-.02-.63-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.25 7.25 0 0 0-1.63-.94l-.36-2.54a.5.5 0 0 0-.5-.42H9.28a.5.5 0 0 0-.5.42l-.36 2.54c-.58.22-1.12.53-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L1.88 7.84a.5.5 0 0 0 .12.64l2.03 1.58c-.03.31-.05.62-.05.94s.02.63.05.94L2 13.52a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54a.5.5 0 0 0 .5.42h3.72a.5.5 0 0 0 .5-.42l.36-2.54c.58-.22 1.12-.53 1.63-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.02-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" />
        </svg>
      </button>

      <button
        type="button"
        className="legend-fab"
        onClick={openLegend}
        aria-haspopup="dialog"
        aria-expanded={isLegendOpen}
        aria-label="Open legend"
        title="Open legend"
      >
        ?
      </button>

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
        isObstacleMode={isObstacleMode}
        onObstacleModeToggle={() => setIsObstacleMode((v) => !v)}
        onVisualize={handleVisualize}
        isVisualizing={isVisualizing}
      />

      <div className={`simulation-status simulation-status-${simulationPhase}`} role="status" aria-live="polite">
        <span className="simulation-status-label">Simulation State</span>
        <span className="simulation-status-value">{getSimulationPhaseDisplay()}</span>
      </div>

      {isObstacleMode && (
        <div className="board-tip" role="note" aria-live="polite">
          Hold left click and drag to paint obstacles. Start on a wall to erase while dragging. Press Esc to exit obstacle mode.
        </div>
      )}

      {isSettingsOpen && (
        <div
          className="settings-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSettings();
            }
          }}
        >
          <section
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            <header className="settings-modal-header">
              <div>
                <p className="settings-kicker">Preferences</p>
                <h2 id="settings-title">Simulation Settings</h2>
              </div>
              <button type="button" className="settings-close-btn" onClick={closeSettings}>
                Close
              </button>
            </header>

            <div className="settings-modal-body">
              <section className="settings-card">
                <h3>Simulation Speed</h3>
                <p>Controls how quickly traversal steps are animated.</p>
                <div className="settings-option-list" role="radiogroup" aria-label="Simulation speed">
                  {[
                    { value: 'slow', label: 'Slow', detail: 'Easier to follow' },
                    { value: 'medium', label: 'Medium', detail: 'Balanced pace' },
                    { value: 'fast', label: 'Fast', detail: 'Quick runs' },
                  ].map((option) => (
                    <label key={option.value} className="settings-option-card">
                      <input
                        type="radio"
                        name="simulation-speed"
                        value={option.value}
                        checked={settingsDraft.speed === option.value}
                        onChange={() => setSettingsDraft((prev) => ({ ...prev, speed: option.value }))}
                      />
                      <span>
                        <strong>{option.label}</strong>
                        <small>{option.detail}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="settings-card">
                <h3>Pause-Prediction cadence</h3>
                <p>How many algorithm steps pass before a quiz prompt appears.</p>
                <div className="settings-slider-row">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={settingsDraft.quizPromptInterval}
                    onChange={(event) =>
                      setSettingsDraft((prev) => ({
                        ...prev,
                        quizPromptInterval: Number(event.target.value),
                      }))
                    }
                  />
                  <div className="settings-slider-value">
                    <strong>{settingsDraft.quizPromptInterval}</strong>
                    <span>steps</span>
                  </div>
                </div>
              </section>

              <section className="settings-card settings-card-muted">
                <h3>Quick actions</h3>
                <p>Use the defaults if you want the original pacing back.</p>
                <button type="button" className="settings-secondary-btn" onClick={resetSettingsToDefaults}>
                  Restore defaults
                </button>
              </section>
            </div>

            <footer className="settings-modal-footer">
              <button type="button" className="settings-secondary-btn" onClick={closeSettings}>
                Cancel
              </button>
              <button type="button" className="settings-primary-btn" onClick={saveSettings}>
                Apply Settings
              </button>
            </footer>
          </section>
        </div>
      )}

      {isLegendOpen && (
        <div
          className="legend-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLegend();
            }
          }}
        >
          <section className="legend-modal" role="dialog" aria-modal="true" aria-labelledby="legend-title">
            <header className="legend-modal-header">
              <div>
                <p className="legend-kicker">Reference</p>
                <h2 id="legend-title">Visualizer Legend</h2>
              </div>
              <button type="button" className="legend-close-btn" onClick={closeLegend}>
                Close
              </button>
            </header>

            <div className="legend-modal-body">
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
                  <span>Obstacle / wall</span>
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
                  <span>Paused next valid choice</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {isQuizMode && (
        <div className="game-hud" aria-label="Gamification score">
          <div className="hud-row">
            <span className="hud-label">TRIES AVG</span>
            <span className="hud-value">
              {scoreState.questionsAnswered > 0 ? averageTriesPerQuestion.toFixed(1) : '-.-'}
            </span>
          </div>
          <div className="hud-row">
            <span className="hud-label">SCORE</span>
            <span className="hud-value-wrap">
              <span className="hud-value">
                {scoreState.totalScore.toString().padStart(6, '0')}
              </span>
              {scorePopup && (
                <span className="score-popup-floating score-popup-score">
                  +{scorePopup.questionScore}
                </span>
              )}
            </span>
          </div>
          <div className="hud-row">
            <span className="hud-label">ACCURACY</span>
            <span className="hud-value-wrap">
              <span className="hud-value">
                {scoreState.questionsAnswered > 0 ? `${Math.round(averageTryAccuracy * 100)}%` : '--%'}
              </span>
              {scorePopup && (
                <span className="score-popup-floating score-popup-accuracy">
                  {Math.round(scorePopup.accuracy * 100)}% in {scorePopup.responseSeconds.toFixed(1)}s
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {quizState.active && (
        <div className="quiz-overlay">
          <h2>{isPaused ? 'Paused — ' : ''}{quizState.message}</h2>
          {quizState.awaitingContinue && (
            <button
              className="quiz-continue-btn"
              type="button"
              onClick={() => quizState.continueFunc?.()}
              disabled={isPaused}
            >
              Continue
            </button>
          )}
        </div>
      )}

      <div className="main-layout">
        <div className="visualizer-container">
          {isRaceMode ? (
            <>
              <div className="race-container">
                <Grid
                  grid={grid}
                  onMouseDown={handleMouseDown}
                  onMouseEnter={handleMouseEnter}
                  onMouseUp={handleMouseUp}
                  prefix="bfs-"
                  label="BFS"
                  cellSize={responsiveCellSize}
                />
                <Grid
                  grid={grid}
                  onMouseDown={handleMouseDown}
                  onMouseEnter={handleMouseEnter}
                  onMouseUp={handleMouseUp}
                  prefix="astar-"
                  label="A*"
                  cellSize={responsiveCellSize}
                />
              </div>
              {stats && (
                <div className="stats-container">
                  {Object.entries(stats).map(([key, { visited, path }]) => (
                    <div key={key} className="stat-card">
                      <h3>{key === 'bfs' ? 'BFS' : 'A*'}</h3>
                      <p>Visited Nodes: <span className="stat-value">{visited}</span></p>
                      <p>Path Length: <span className="stat-value">{path > 0 ? path : '—'}</span></p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Grid
              grid={grid}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
              onMouseUp={handleMouseUp}
              cellSize={responsiveCellSize}
            />
          )}

          {!isRaceMode && activeHoverComparison && hoveredFrontierNode && (
            <section className="node-proof-hover-panel formal-trace-panel" aria-live="polite">
              <h2>Hovered Node Trace</h2>
              <div className="trace-card">
                <p>
                  <strong>Hovered node:</strong> ({hoveredFrontierNode.row}, {hoveredFrontierNode.col})
                </p>
                <p>
                  <strong>Equation for this node:</strong> {hoveredFrontierEquation}
                </p>
                <p>
                  <strong>Decision:</strong> {hoveredNodeDecision}
                </p>

                {activeHoverComparison.algorithm === 'astar' ? (
                  <>
                    <p>
                      <strong>Heuristic h(n):</strong> {hoveredFrontierNode.h}
                    </p>
                    <p>
                      <strong>Depth g(n):</strong> {hoveredFrontierNode.g}
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Depth g(n):</strong> {hoveredFrontierNode.g}
                    </p>
                    <p>
                      <strong>BFS rule:</strong> minimum frontier depth g is expanded first.
                    </p>
                  </>
                )}

                {activeHoverComparison.algorithm === 'astar' ? (
                  <>
                    <p>
                      <strong>Chosen vs minimum frontier:</strong> hovered f={hoveredFrontierNode.f}, minimum f={activeHoverComparison.minComparison?.minF ?? 'N/A'}
                    </p>
                    <p>
                      <strong>Tie-break check:</strong> hovered h={hoveredFrontierNode.h}, minimum h among minimum-f nodes={activeHoverComparison.minComparison?.minHAmongMinF ?? 'N/A'}
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Chosen vs minimum frontier depth:</strong> hovered g={hoveredFrontierNode.g}, minimum g={activeHoverComparison.minComparison?.minG ?? 'N/A'}
                    </p>
                  </>
                )}
              </div>
            </section>
          )}
        </div>

        {!isRaceMode && (
          <aside className="side-panel">
            <section className="formal-trace-panel">
              <h2>Mathematical Trace</h2>

              {isVisualizing && (
                <p className="trace-hotkey">
                  Press <strong>Space</strong> to {isPaused ? 'resume' : 'pause'}.
                </p>
              )}

              {traceNotice && <p className="trace-notice">{traceNotice}</p>}

              {!currentTrace && !traceNotice && (
                <p className="trace-empty">
                  Run a single algorithm to see the formal proof trace.
                </p>
              )}

              {currentTrace && (
                <div className="trace-card">
                  <p>
                    <strong>Step:</strong> {currentTrace.expansionIndex + 1} / {formalTrace.length}
                  </p>
                  <p>
                    <strong>Expanded:</strong> ({currentTrace.expandedNode.row}, {currentTrace.expandedNode.col})
                  </p>
                  <p>
                    <strong>Equation:</strong> {currentTrace.equation}
                  </p>
                  <p>
                    <strong>Rule:</strong> {currentTrace.selectedBecause}
                  </p>

                  <div className="attempt-list">
                    {(currentTrace.attempts || []).slice(0, 4).map((attempt, idx) => (
                      <div key={`${attempt.to.row}-${attempt.to.col}-${idx}`} className="attempt-item-mini">
                        <span>
                          <strong>Neighbor ({attempt.to.row}, {attempt.to.col}):</strong>{' '}
                          {attempt.decision.toUpperCase().substring(0, 10)}
                        </span>
                      </div>
                    ))}
                    {(currentTrace.attempts || []).length > 4 && (
                      <p className="more-attempts">...</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* ── stats cards inside sidebar ── */}
            {stats && (
              <div className="stats-sidebar">
                {Object.entries(stats).map(([key, { visited, path }]) => (
                  <div key={key} className="stat-card-mini">
                    <h3>{key === 'bfs' ? 'BFS' : 'A*'}</h3>
                    <p>Visited: <strong>{visited}</strong></p>
                    <p>Path: <strong>{path > 0 ? path : '—'}</strong></p>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

export default App;
