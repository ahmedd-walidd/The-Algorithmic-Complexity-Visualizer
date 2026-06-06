import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import AppChrome from './components/layout/AppChrome';
import VisualizerWorkspace from './components/layout/VisualizerWorkspace';
import TraceEquation from './components/panels/TraceEquation';
import LandingScreen from './components/layout/LandingScreen';
import TruthScannerPage from './components/layout/TruthScannerPage';
import {
  createGrid,
  clearPath,
  cloneGrid,
  getNodesInShortestPathOrder,
  getGridEndpoints,
  getRandomGridEndpoints,
  DEFAULT_GRID_CONFIG,
  GRID_LIMITS,
} from './utils/gridHelpers';
import { generateMaze } from './utils/mazeGenerator';
import { bfs } from './algorithms/bfs';
import { astar } from './algorithms/astar';
import { buildRunSummary } from './framework/runAnalysis';
import { buildExportRows } from './utils/exportHelpers';
import {
  buildCorrectPredictionMessage,
  buildWrongPredictionMessage,
  calculateQuestionScore,
  getPredictionTimeLimitSeconds,
} from './utils/predictionFeedback';
import {
  getActiveHoverComparison,
  getHoveredNodeDecision,
  getHoveredPreviewPaths,
  getNextTraversalComparison,
  getRaceResultComparison,
  getScoreAverages,
  getSimulationPhaseDisplay,
} from './utils/visualizerDerivedState';
import {
  applyFrontierHoverHighlight,
  applyNextChoiceHighlight,
  applyPreviewPathHighlight,
  clearFrontierHoverHighlight,
  clearNextChoiceHighlight,
  clearPreviewPathHighlight,
  clearTimeoutQueue,
  clearVisualizerDomClasses,
  redrawRunTimeline,
} from './utils/domHighlights';
import { buildPreviewPath } from './utils/previewPath';
import useResponsiveCellSize from './hooks/useResponsiveCellSize';
import './App.css';

// Increased base delays so traversal is easier to follow visually.
const SPEED_MS = { slow: 140, medium: 80, fast: 40 };
const TIMELINE_JUMP_STEPS = 5;
const DEFAULT_SETTINGS = {
  speed: 'medium',
  quizPromptInterval: 15,
  showEquationOverlay: false,
  gridRows: DEFAULT_GRID_CONFIG.rows,
  gridCols: DEFAULT_GRID_CONFIG.cols,
};

const GRID_PRESETS = [
  { id: 'small', label: 'Small', rows: 10, cols: 25 },
  { id: 'default', label: 'Default', rows: 20, cols: 50 },
  { id: 'large', label: 'Large', rows: 30, cols: 75 },
  { id: 'custom', label: 'Custom', rows: DEFAULT_GRID_CONFIG.rows, cols: DEFAULT_GRID_CONFIG.cols },
];

const INITIAL_SCORE_STATE = {
  totalScore: 0,
  questionsAnswered: 0,
  correctAnswers: 0,
  totalAttempts: 0,
  totalAccuracyScore: 0,
  totalResponseTime: 0,
  totalSpeedBonus: 0,
  totalFrontierBonus: 0,
  currentStreak: 0,
  bestStreak: 0,
  comboMultiplier: 1,
  perfectAnswers: 0,
  questionHistory: [],
  lastQuestionScore: 0,
  lastAccuracy: 0,
  lastResponseTime: 0,
  lastAttempts: 0,
};

const INITIAL_ADAPTIVE_PREDICTION_STATE = {
  difficulty: 'medium',
  recent: [],
  repeatedHeuristicMistakes: 0,
};

const PREDICTION_DIFFICULTY_META = {
  easy: { label: 'Easy', maxDistractors: 1 },
  medium: { label: 'Medium', maxDistractors: 3 },
  hard: { label: 'Hard', maxDistractors: Infinity },
};

function nodeKey(node) {
  return `${node.row}-${node.col}`;
}

function getAdaptivePredictionDifficulty(state) {
  const recent = state.recent || [];
  const lastThree = recent.slice(-3);

  if ((state.repeatedHeuristicMistakes || 0) >= 2) return 'hard';
  if (lastThree.length >= 3 && lastThree.every((entry) => entry.correct)) return 'hard';
  if (recent.slice(-2).length >= 2 && recent.slice(-2).every((entry) => !entry.correct)) return 'easy';
  return state.difficulty || 'medium';
}

function rankPredictionDistractors(distractors, traceStep, shouldTargetHeuristicTrap) {
  if (traceStep?.algorithm === 'astar') {
    return [...distractors].sort((a, b) => {
      if (shouldTargetHeuristicTrap && a.h !== b.h) return a.h - b.h;
      return a.f - b.f || a.h - b.h || a.insertionOrder - b.insertionOrder || a.g - b.g;
    });
  }

  return [...distractors].sort((a, b) => a.g - b.g);
}

function buildAdaptivePredictionPrompt(option, traceStep, adaptiveState) {
  const frontier = traceStep?.frontierBeforeExpansion || [];
  const selectable = option?.selectable || [];
  const correct = option?.correct || [];
  if (selectable.length === 0 || correct.length === 0) return null;

  const difficulty = getAdaptivePredictionDifficulty(adaptiveState);
  const correctKeys = new Set(correct.map(nodeKey));
  const byKey = new Map(frontier.map((node) => [nodeKey(node), node]));
  const selectableWithScores = selectable.map((node) => byKey.get(nodeKey(node)) || node);
  const correctWithScores = selectableWithScores.filter((node) => correctKeys.has(nodeKey(node)));
  const distractors = selectableWithScores.filter((node) => !correctKeys.has(nodeKey(node)));
  const shouldTargetHeuristicTrap =
    traceStep?.algorithm === 'astar' && (adaptiveState.repeatedHeuristicMistakes || 0) >= 2;
  const rankedDistractors = rankPredictionDistractors(
    distractors,
    traceStep,
    shouldTargetHeuristicTrap
  );
  const maxDistractors = PREDICTION_DIFFICULTY_META[difficulty]?.maxDistractors ?? 3;
  const chosenDistractors = rankedDistractors.slice(0, maxDistractors);
  const adaptedSelectable = [...correctWithScores, ...chosenDistractors]
    .map(({ row, col }) => ({ row, col }));

  return {
    selectable: adaptedSelectable.length > 0 ? adaptedSelectable : selectable,
    correct,
    difficulty,
    adaptationReason: shouldTargetHeuristicTrap
      ? 'A* heuristic trap: compare f(n), not h(n) alone.'
      : difficulty === 'easy'
        ? 'Support round after recent misses.'
        : difficulty === 'hard'
          ? 'Challenge round after a stable streak.'
          : 'Balanced round.',
  };
}

function recordAdaptivePredictionResult(state, result) {
  const nextRecent = [...(state.recent || []), result].slice(-5);
  const repeatedHeuristicMistakes = result.heuristicMistake
    ? (state.repeatedHeuristicMistakes || 0) + 1
    : result.correct
      ? 0
      : state.repeatedHeuristicMistakes || 0;

  const nextState = {
    ...state,
    recent: nextRecent,
    repeatedHeuristicMistakes,
  };

  return {
    ...nextState,
    difficulty: getAdaptivePredictionDifficulty(nextState),
  };
}

function App() {
  // -- state --
  const getInitialRoute = () => {
    const path = window.location.pathname;
    if (path === '/visualizer' || path === '/truth-scanner') return path;
    return '/';
  };
  const [currentRoute, setCurrentRoute] = useState(getInitialRoute);
  const [gridConfig, setGridConfig] = useState(DEFAULT_GRID_CONFIG);
  const [gridEndpoints, setGridEndpoints] = useState(() =>
    getGridEndpoints(DEFAULT_GRID_CONFIG.rows, DEFAULT_GRID_CONFIG.cols)
  );
  const [grid, setGrid] = useState(() =>
    createGrid({
      rows: DEFAULT_GRID_CONFIG.rows,
      cols: DEFAULT_GRID_CONFIG.cols,
      ...getGridEndpoints(DEFAULT_GRID_CONFIG.rows, DEFAULT_GRID_CONFIG.cols),
    })
  );
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [isObstacleMode, setIsObstacleMode] = useState(false);
  const [algorithm, setAlgorithm] = useState('bfs');
  const [isRaceMode, setIsRaceMode] = useState(false);
  const [speed, setSpeed] = useState(DEFAULT_SETTINGS.speed);
  const [quizPromptInterval, setQuizPromptInterval] = useState(DEFAULT_SETTINGS.quizPromptInterval);
  const [showEquationOverlay, setShowEquationOverlay] = useState(
    DEFAULT_SETTINGS.showEquationOverlay
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(DEFAULT_SETTINGS);
  const [landingDraft, setLandingDraft] = useState({
    gridPreset: 'default',
    gridRows: DEFAULT_SETTINGS.gridRows,
    gridCols: DEFAULT_SETTINGS.gridCols,
    showEquationOverlay: DEFAULT_SETTINGS.showEquationOverlay,
    tutorialStep: 'setup',
  });
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isMazeGenerating, setIsMazeGenerating] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [simulationPhase, setSimulationPhase] = useState('idle');
  const [stats, setStats] = useState(null);
  const [runSummary, setRunSummary] = useState(null);
  const [isRunSummaryOpen, setIsRunSummaryOpen] = useState(false);
  const [runSummaryIsRaceMode, setRunSummaryIsRaceMode] = useState(false);
  const [exportRows, setExportRows] = useState([]);
  const [truthScannerContext, setTruthScannerContext] = useState({
    conceptId: null,
    returnToAnalysis: false,
  });
  const timeoutsRef = useRef([]);
  const obstacleDragModeRef = useRef(null);

  // -- responsive cell size --
  const responsiveCellSize = useResponsiveCellSize(
    gridConfig.rows,
    gridConfig.cols,
    isRaceMode,
    isSidePanelOpen
  );

  const [isQuizMode, setIsQuizMode] = useState(false);
  const [scorePopup, setScorePopup] = useState(null);
  const [quizState, setQuizState] = useState({
    active: false,
    candidates: [],
    message: '',
    awaitingContinue: false,
    continueFunc: null,
    feedbackType: 'question',
    difficulty: INITIAL_ADAPTIVE_PREDICTION_STATE.difficulty,
    adaptationReason: '',
  });
  const [scoreState, setScoreState] = useState(INITIAL_SCORE_STATE);
  const [formalTrace, setFormalTrace] = useState([]);
  const [activeTraceIndex, setActiveTraceIndex] = useState(-1);
  const [heuristicAuditLog, setHeuristicAuditLog] = useState([]);
  const [activeHeuristicAuditIndex, setActiveHeuristicAuditIndex] = useState(-1);
  const [traceNotice, setTraceNotice] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [pausedComparison, setPausedComparison] = useState(null);
  const [hoveredFrontierNode, setHoveredFrontierNode] = useState(null);
  const [rewindHoverTarget, setRewindHoverTarget] = useState(null);
  const isObstaclePainting = isObstacleMode && isMousePressed;
  const pausedPhaseRef = useRef('idle');

  const simulationPhaseDisplay = getSimulationPhaseDisplay(simulationPhase);

  const navigateTo = useCallback((path, options = {}) => {
    const normalizedPath =
      path === '/visualizer' || path === '/truth-scanner' ? path : '/';

    if (window.location.pathname !== normalizedPath) {
      window.history.pushState({}, '', normalizedPath);
    }
    if (!options.preserveTruthContext) {
      setTruthScannerContext({ conceptId: null, returnToAnalysis: false });
    }
    setCurrentRoute(normalizedPath);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const openFormalAnalysis = useCallback(() => {
    if (!runSummary) return;
    setIsRunSummaryOpen(true);
    navigateTo('/visualizer');
  }, [navigateTo, runSummary]);

  const openTruthScannerTerm = useCallback((conceptId) => {
    if (!conceptId) return;
    setTruthScannerContext({ conceptId, returnToAnalysis: true });
    navigateTo('/truth-scanner', { preserveTruthContext: true });
  }, [navigateTo]);

  const returnToFormalAnalysis = useCallback(() => {
    setTruthScannerContext({ conceptId: null, returnToAnalysis: false });
    openFormalAnalysis();
  }, [openFormalAnalysis]);

  const isPausedRef = useRef(false);
  const isQuizModeRef = useRef(false);
  const isRaceModeRef = useRef(false);
  const quizStateRef = useRef(quizState);
  const scoreStateRef = useRef(INITIAL_SCORE_STATE);
  const quizProgressRef = useRef({
    questionStartedAt: 0,
    attempts: 0,
    selectedKeys: new Set(),
    awarded: false,
    correctKey: null,
  });
  const adaptivePredictionRef = useRef(INITIAL_ADAPTIVE_PREDICTION_STATE);
  const formalTraceRef = useRef(formalTrace);
  const pausedComparisonRef = useRef(null);
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
  const raceRunStateRef = useRef({ bfs: null, astar: null });

  const applyObstacleState = useCallback((row, col, isWall) => {
    if (row === gridEndpoints.start.row && col === gridEndpoints.start.col) return;
    if (row === gridEndpoints.end.row && col === gridEndpoints.end.col) return;

    setGrid((prev) => {
      const currentNode = prev[row]?.[col];
      if (!currentNode || currentNode.isWall === isWall) return prev;

      const next = prev.map((r) => r.map((n) => ({ ...n })));
      next[row][col] = { ...next[row][col], isWall };
      return next;
    });
  }, [gridEndpoints]);

  const showGamifiedPopup = useCallback((row, col, text, type = 'positive') => {
    const ids = [`node-${row}-${col}`, `bfs-node-${row}-${col}`, `astar-node-${row}-${col}`];
    let el = null;
    for (const id of ids) {
      el = document.getElementById(id);
      if (el) break;
    }
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const floater = document.createElement('div');
    floater.className = `node-gamified-popup node-gamified-popup-${type}`;
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
    adaptivePredictionRef.current = INITIAL_ADAPTIVE_PREDICTION_STATE;
    quizProgressRef.current = {
      questionStartedAt: 0,
      attempts: 0,
      selectedKeys: new Set(),
      awarded: false,
      correctKey: null,
    };
  }, []);

  useEffect(() => {
    isQuizModeRef.current = isQuizMode;
  }, [isQuizMode]);

  useEffect(() => {
    isRaceModeRef.current = isRaceMode;
  }, [isRaceMode]);

  useEffect(() => {
    quizStateRef.current = quizState;
  }, [quizState]);

  useEffect(() => {
    scoreStateRef.current = scoreState;
  }, [scoreState]);

  useEffect(() => {
    formalTraceRef.current = formalTrace;
  }, [formalTrace]);

  useEffect(() => {
    pausedComparisonRef.current = pausedComparison;
  }, [pausedComparison]);

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      setCurrentRoute(path === '/visualizer' || path === '/truth-scanner' ? path : '/');
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  useEffect(() => {
    if (currentRoute !== '/visualizer') return;

    const syncRunDom = () => {
      if (isRaceModeRef.current) {
        const raceState = raceRunStateRef.current || {};
        const bfsRun = raceState.bfs;
        const astarRun = raceState.astar;

        if (bfsRun && (bfsRun.visited?.length || bfsRun.path?.length)) {
          redrawRunTimeline(bfsRun);
        }
        if (astarRun && (astarRun.visited?.length || astarRun.path?.length)) {
          redrawRunTimeline(astarRun);
        }
        return;
      }

      const run = runStateRef.current;
      const quiz = quizStateRef.current;
      const quizProgress = quizProgressRef.current;
      const prefix = run?.prefix || '';

      if (quiz?.active && quizProgress?.selectedKeys?.size) {
        const correctKey = quizProgress.correctKey;
        quizProgress.selectedKeys.forEach((key) => {
          const [row, col] = key.split('-').map(Number);
          if (!Number.isFinite(row) || !Number.isFinite(col)) return;
          const el = document.getElementById(`${prefix}node-${row}-${col}`);
          if (!el) return;
          if (key === correctKey) {
            el.classList.add('node-prediction-correct');
          } else {
            el.classList.add('node-prediction-wrong');
          }
        });
      }

      if (run?.visited?.length || run?.path?.length) {
        redrawRunTimeline(run);
      }

      if (quiz?.active) {
        (quiz.candidates || []).forEach((candidate) => {
          const el = document.getElementById(`${prefix}node-${candidate.row}-${candidate.col}`);
          if (!el) return;
          if (el.classList.contains('node-visited') || el.classList.contains('node-wall')) return;
          el.classList.add('node-prediction-candidate');
        });
      }

      const pausedComparison = pausedComparisonRef.current;
      if (isPausedRef.current && pausedComparison) {
        applyFrontierHoverHighlight(pausedComparison.frontierNodes || []);
        applyNextChoiceHighlight(pausedComparison.candidateNodes || []);
      }
    };

    const frameId = window.requestAnimationFrame(syncRunDom);
    return () => window.cancelAnimationFrame(frameId);
  }, [currentRoute]);

  const clearRewindHoverTarget = useCallback(() => {
    document.querySelectorAll('.node-rewind-target').forEach((el) => {
      el.classList.remove('node-rewind-target');
    });
    setRewindHoverTarget(null);
  }, []);

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

  const clearRunSummary = useCallback(() => {
    setRunSummary(null);
    setIsRunSummaryOpen(false);
    setRunSummaryIsRaceMode(false);
  }, []);

  // DOM highlight helpers
  const clearAllTimeouts = useCallback(() => {
    clearTimeoutQueue(timeoutsRef);
  }, []);

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
    raceRunStateRef.current = { bfs: null, astar: null };
  }, [quizPromptInterval]);

  const clearRuntimeArtifacts = useCallback(() => {
    clearAllTimeouts();
    clearVisualizerDomClasses();
    clearNextChoiceHighlight();
    clearFrontierHoverHighlight();
    clearPreviewPathHighlight();
    resetRunState();
    clearRunSummary();
  }, [clearAllTimeouts, clearRunSummary, resetRunState]);

  const resetVisualizationState = useCallback(({ resetScore = true } = {}) => {
    setStats(null);
    setIsVisualizing(false);
    setIsPaused(false);
    isPausedRef.current = false;
    if (resetScore) resetGamification();
    setFormalTrace([]);
    setActiveTraceIndex(-1);
    setHeuristicAuditLog([]);
    setActiveHeuristicAuditIndex(-1);
    setPausedComparison(null);
    setHoveredFrontierNode(null);
    clearRewindHoverTarget();
    setTraceNotice('');
    setSimulationPhase('idle');
    pausedPhaseRef.current = 'idle';
  }, [clearRewindHoverTarget, resetGamification]);

  const rebuildGrid = useCallback(
    (nextConfig) => {
      clearRuntimeArtifacts();

      const rows = Math.max(
        GRID_LIMITS.minRows,
        Math.min(GRID_LIMITS.maxRows, Number(nextConfig.rows) || DEFAULT_GRID_CONFIG.rows)
      );
      const cols = Math.max(
        GRID_LIMITS.minCols,
        Math.min(GRID_LIMITS.maxCols, Number(nextConfig.cols) || DEFAULT_GRID_CONFIG.cols)
      );
      const endpoints = getGridEndpoints(rows, cols);

      setGridConfig({ rows, cols });
      setGridEndpoints(endpoints);
      setGrid(createGrid({ rows, cols, ...endpoints }));
      resetVisualizationState();
    },
    [
      clearRuntimeArtifacts,
      resetVisualizationState,
    ]
  );

  const appendExportRows = useCallback((mode, runResults) => {
    setExportRows((prev) => {
      const lastTurn = prev.reduce((max, row) => Math.max(max, Number(row.Turn) || 0), 0);
      return [
        ...prev,
        ...buildExportRows({
          turn: lastTurn + 1,
          mode,
          runResults,
        }),
      ];
    });
  }, []);

  const openSettings = useCallback(() => {
    setIsLegendOpen(false);
    setSettingsDraft({
      speed,
      quizPromptInterval,
      showEquationOverlay,
      gridRows: gridConfig.rows,
      gridCols: gridConfig.cols,
    });
    setIsSettingsOpen(true);
  }, [speed, quizPromptInterval, showEquationOverlay, gridConfig]);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
    setSettingsDraft({
      speed,
      quizPromptInterval,
      showEquationOverlay,
      gridRows: gridConfig.rows,
      gridCols: gridConfig.cols,
    });
  }, [speed, quizPromptInterval, showEquationOverlay, gridConfig]);

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
    setShowEquationOverlay(settingsDraft.showEquationOverlay);
    runStateRef.current.pauseInterval = settingsDraft.quizPromptInterval;
    if (
      settingsDraft.gridRows !== gridConfig.rows ||
      settingsDraft.gridCols !== gridConfig.cols
    ) {
      rebuildGrid({ rows: settingsDraft.gridRows, cols: settingsDraft.gridCols });
    }
    setIsSettingsOpen(false);
  }, [settingsDraft, gridConfig, rebuildGrid]);

  const resetSettingsToDefaults = useCallback(() => {
    setSettingsDraft(DEFAULT_SETTINGS);
  }, []);

  const getTraversedNodeIndex = useCallback(
    (row, col) => {
      if (isRaceMode || isObstacleMode || quizStateRef.current.active) return -1;

      const run = runStateRef.current;
      if (!run?.visited?.length) return -1;
      if (run.phase === 'idle') return -1;

      const traversedLimit =
        run.phase === 'path' || run.phase === 'done'
          ? run.visited.length
          : Math.max(0, run.visitedIndex);

      return run.visited
        .slice(0, traversedLimit)
        .findIndex((node) => node.row === row && node.col === col);
    },
    [isObstacleMode, isRaceMode]
  );

  const rewindToTraversedNode = useCallback(
    (row, col) => {
      const index = getTraversedNodeIndex(row, col);
      if (index < 0) return false;

      const run = runStateRef.current;
      clearAllTimeouts();
      clearNextChoiceHighlight();
      clearFrontierHoverHighlight();
      clearPreviewPathHighlight();

      run.phase = 'visited';
      run.visitedIndex = index + 1;
      run.pathIndex = 0;
      redrawRunTimeline(run);

      setActiveTraceIndex(formalTraceRef.current.length > 0 ? index : -1);
      setActiveHeuristicAuditIndex(heuristicAuditLog.length > 0 ? index : -1);
      setPausedComparison(null);
      setHoveredFrontierNode(null);

      if (isVisualizing) {
        setIsPaused(true);
        isPausedRef.current = true;
        pausedPhaseRef.current = 'visited';
        setSimulationPhase('paused');
      } else {
        setSimulationPhase('done');
      }

      showGamifiedPopup(row, col, `Step ${index + 1}`, 'positive');
      return true;
    },
    [
      clearAllTimeouts,
      getTraversedNodeIndex,
      heuristicAuditLog.length,
      isVisualizing,
      showGamifiedPopup,
    ]
  );

  // Wall drawing / quiz clicks
  const handleMouseDown = useCallback(
    (row, col, event) => {
      if (event?.button !== undefined && event.button !== 0) return;

      if (rewindToTraversedNode(row, col)) {
        event?.preventDefault?.();
        return;
      }

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
        const clickedFrontierNode = quizState.frontierByKey?.[key];
        const heuristicMistake =
          !isCorrect &&
          quizState.ruleMeta?.algorithm === 'astar' &&
          clickedFrontierNode &&
          clickedFrontierNode.h === quizState.ruleMeta.minHOverall &&
          clickedFrontierNode.f !== quizState.ruleMeta.minF;
        
        if (isCorrect) {
          adaptivePredictionRef.current = recordAdaptivePredictionResult(
            adaptivePredictionRef.current,
            { correct: true, heuristicMistake: false }
          );
          const responseTimeMs =
            quizProgressRef.current.questionStartedAt > 0
              ? performance.now() - quizProgressRef.current.questionStartedAt
              : 0;
          const attemptsUsed = quizProgressRef.current.attempts;
          const nextPerfectStreak =
            attemptsUsed === 1 ? (scoreStateRef.current.currentStreak || 0) + 1 : 0;
          const scoring = calculateQuestionScore(attemptsUsed, responseTimeMs, {
            frontierSize: quizState.candidates?.length || 0,
            streak: nextPerfectStreak,
            timeLimitSeconds: quizState.timeLimitSeconds,
          });
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
            totalSpeedBonus: prev.totalSpeedBonus + scoring.speedBonus,
            totalFrontierBonus: prev.totalFrontierBonus + scoring.frontierBonus,
            currentStreak: nextPerfectStreak,
            bestStreak: Math.max(prev.bestStreak, nextPerfectStreak),
            comboMultiplier: scoring.comboMultiplier,
            perfectAnswers: prev.perfectAnswers + (attemptsUsed === 1 ? 1 : 0),
            questionHistory: [
              ...prev.questionHistory,
              {
                accuracy: scoring.accuracy,
                attempts: attemptsUsed,
                responseSeconds: scoring.responseSeconds,
                questionScore: scoring.questionScore,
                speedBonus: scoring.speedBonus,
                frontierBonus: scoring.frontierBonus,
                comboMultiplier: scoring.comboMultiplier,
                streak: nextPerfectStreak,
                rank: scoring.rank,
              },
            ],
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
            message: detailedMessage,
            attemptCount: attemptsUsed,
            lastScoring: scoring,
            streak: nextPerfectStreak,
          }));

          setScorePopup(scoring);
          setTimeout(() => setScorePopup(null), 3000);

          const el = document.getElementById(`node-${row}-${col}`) || document.getElementById(`bfs-node-${row}-${col}`) || document.getElementById(`astar-node-${row}-${col}`);
          if (el) el.classList.add('node-prediction-correct');

          showGamifiedPopup(row, col, `${scoring.rank} +${scoring.questionScore}`, 'positive');
        } else {
          adaptivePredictionRef.current = recordAdaptivePredictionResult(
            adaptivePredictionRef.current,
            { correct: false, heuristicMistake }
          );
          // Wrong answer
          const el = document.getElementById(`node-${row}-${col}`) || document.getElementById(`bfs-node-${row}-${col}`) || document.getElementById(`astar-node-${row}-${col}`);
          if (el) el.classList.add('node-prediction-wrong');

          setScoreState((prev) => (
            prev.currentStreak > 0
              ? { ...prev, currentStreak: 0, comboMultiplier: 1 }
              : prev
          ));

          showGamifiedPopup(row, col, 'Read broken', 'negative');
          const detailedMessage = buildWrongPredictionMessage(row, col, quizState);
          setQuizState(prev => ({
            ...prev,
            feedbackType: 'incorrect',
            message: heuristicMistake
              ? `${detailedMessage} Adaptive note: this looks like an h(n)-only choice. A* must compare f(n)=g(n)+h(n).`
              : detailedMessage,
            attemptCount: quizProgressRef.current.attempts,
            streak: 0,
            // Keep Continue visible if the learner already selected a valid next node.
            awaitingContinue: prev.awaitingContinue,
          }));
        }
        return;
      }

      if (isVisualizing) return;
      if (!isObstacleMode) return;
      if (row === gridEndpoints.start.row && col === gridEndpoints.start.col) return;
      if (row === gridEndpoints.end.row && col === gridEndpoints.end.col) return;

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
      gridEndpoints,
      showGamifiedPopup,
      applyObstacleState,
      rewindToTraversedNode,
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

      const rewindIndex = getTraversedNodeIndex(row, col);
      if (rewindIndex >= 0) {
        document.querySelectorAll('.node-rewind-target').forEach((el) => {
          el.classList.remove('node-rewind-target');
        });
        const el = document.getElementById(`node-${row}-${col}`);
        if (el) el.classList.add('node-rewind-target');
        setRewindHoverTarget({ row, col, index: rewindIndex });
      } else if (rewindHoverTarget) {
        clearRewindHoverTarget();
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
      rewindHoverTarget,
      isRaceMode,
      quizState,
      isObstacleMode,
      applyObstacleState,
      clearRewindHoverTarget,
      getTraversedNodeIndex,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsMousePressed(false);
    obstacleDragModeRef.current = null;
  }, []);


  const getNextComparison = useCallback(
    () =>
      getNextTraversalComparison({
        isRaceMode,
        run: runStateRef.current,
        formalTrace: formalTraceRef.current,
      }),
    [isRaceMode]
  );

  const pauseRun = useCallback(() => {
    clearAllTimeouts();
    pausedPhaseRef.current = runStateRef.current.phase;
    setSimulationPhase('paused');
    const comparison = getNextComparison();
    setPausedComparison(comparison);
    setHoveredFrontierNode(null);
    applyFrontierHoverHighlight(comparison?.frontierNodes || []);
    applyNextChoiceHighlight(comparison?.candidateNodes || []);
  }, [clearAllTimeouts, getNextComparison]);

  const resumeRun = useCallback(() => {
    clearNextChoiceHighlight();
    clearFrontierHoverHighlight();
    setPausedComparison(null);
    setHoveredFrontierNode(null);
    setSimulationPhase(pausedPhaseRef.current || runStateRef.current.phase || 'idle');

    const run = runStateRef.current;
    if (run.phase === 'idle' || run.phase === 'done') return;
    if (quizStateRef.current.active) return;

    const delay = run.phase === 'path' ? run.ms * 3 : run.ms;
    const t = setTimeout(() => {
      runStateRef.current.stepFunc?.();
    }, delay);
    timeoutsRef.current.push(t);
  }, []);

  const scheduleRunTick = useCallback(() => {
    const run = runStateRef.current;
    if (isPausedRef.current) return;
    if (run.phase === 'idle' || run.phase === 'done') return;
    if (quizStateRef.current.active) return;

    const delay = run.phase === 'path' ? run.ms * 3 : run.ms;
    const t = setTimeout(() => {
      runStateRef.current.stepFunc?.();
    }, delay);
    timeoutsRef.current.push(t);
  }, []);

  const jumpTimeline = useCallback(
    (direction) => {
      if (!isVisualizing || isRaceMode) return;

      const run = runStateRef.current;
      if (run.phase === 'idle' || run.phase === 'done') return;
      if (quizStateRef.current.active) return;

      clearAllTimeouts();
      clearNextChoiceHighlight();
      clearFrontierHoverHighlight();
      setPausedComparison(null);
      setHoveredFrontierNode(null);

      const maxPosition = run.visited.length + run.path.length;
      const currentPosition =
        run.phase === 'path'
          ? run.visited.length + run.pathIndex
          : run.visitedIndex;
      const delta = direction === 'forward' ? TIMELINE_JUMP_STEPS : -TIMELINE_JUMP_STEPS;
      const nextPosition = Math.max(0, Math.min(maxPosition, currentPosition + delta));

      if (nextPosition >= run.visited.length) {
        run.phase = 'path';
        run.visitedIndex = run.visited.length;
        run.pathIndex = nextPosition - run.visited.length;
      } else {
        run.phase = 'visited';
        run.visitedIndex = nextPosition;
        run.pathIndex = 0;
      }

      redrawRunTimeline(run);
      const nextTraceIndex = Math.max(0, Math.min(run.visitedIndex - 1, formalTraceRef.current.length - 1));
      setActiveTraceIndex(formalTraceRef.current.length > 0 ? nextTraceIndex : -1);
      setActiveHeuristicAuditIndex(nextTraceIndex);

      if (nextPosition >= maxPosition) {
        run.phase = 'done';
        setSimulationPhase('done');
        run.onDone?.();
        return;
      }

      setSimulationPhase(run.phase);

      if (isPausedRef.current) {
        pausedPhaseRef.current = run.phase;
        const comparison = getNextComparison();
        setPausedComparison(comparison);
        applyFrontierHoverHighlight(comparison?.frontierNodes || []);
        applyNextChoiceHighlight(comparison?.candidateNodes || []);
        return;
      }

      scheduleRunTick();
    },
    [
      clearAllTimeouts,
      getNextComparison,
      isRaceMode,
      isVisualizing,
      scheduleRunTick,
    ]
  );

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

  // Control-panel actions
  const handleGenerateMaze = useCallback(() => {
    if (isMazeGenerating) return;

    clearRuntimeArtifacts();

    setIsMazeGenerating(true);
    resetVisualizationState();

    const buildRequestedMaze = () => {
      const nextEndpoints = getRandomGridEndpoints(gridConfig.rows, gridConfig.cols);
      const nextMaze = generateMaze({
        rows: gridConfig.rows,
        cols: gridConfig.cols,
        start: nextEndpoints.start,
        end: nextEndpoints.end,
      });

      setGridEndpoints(nextEndpoints);
      setGrid(nextMaze);
      setIsMazeGenerating(false);
    };

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(buildRequestedMaze);
      });
    } else {
      setTimeout(buildRequestedMaze, 0);
    }
  }, [
    clearRuntimeArtifacts,
    resetVisualizationState,
    gridConfig,
    isMazeGenerating,
  ]);

  const handleClearBoard = useCallback(() => {
    clearRuntimeArtifacts();
    setGrid(
      createGrid({
        rows: gridConfig.rows,
        cols: gridConfig.cols,
        start: gridEndpoints.start,
        end: gridEndpoints.end,
      })
    );
    resetVisualizationState();
  }, [
    clearRuntimeArtifacts,
    resetVisualizationState,
    gridConfig,
    gridEndpoints,
  ]);

  const handleClearPath = useCallback(() => {
    clearRuntimeArtifacts();
    setGrid((prev) => clearPath(prev));
    resetVisualizationState();
  }, [clearRuntimeArtifacts, resetVisualizationState]);

  const handleRaceModeToggle = useCallback(() => {
    clearRuntimeArtifacts();

    setIsRaceMode((value) => !value);
    resetVisualizationState({ resetScore: false });
  }, [clearRuntimeArtifacts, resetVisualizationState]);

  const handleAlgorithmChange = useCallback((nextAlgorithm) => {
    if (isVisualizing) return;

    setAlgorithm(nextAlgorithm);
    setHeuristicAuditLog([]);
    setActiveHeuristicAuditIndex(-1);
  }, [isVisualizing]);

  // Animation engine
  const animateAlgorithm = useCallback((visited, path, prefix, ms, optionsByIndex, onDone, onStep) => {
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
          const adaptivePrompt = buildAdaptivePredictionPrompt(
            run.optionsByIndex[i],
            formalTraceRef.current[i],
            adaptivePredictionRef.current
          );
          const selectable = adaptivePrompt?.selectable || [];
          const correct = adaptivePrompt?.correct || [];
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
                attemptCount: 0,
                challengeIndex: 0,
                timeLimitSeconds: 0,
                deadlineAt: 0,
                lastScoring: null,
                difficulty: adaptivePredictionRef.current.difficulty,
                adaptationReason: '',
              });
              quizProgressRef.current = {
                questionStartedAt: 0,
                attempts: 0,
                selectedKeys: new Set(),
                awarded: false,
                correctKey: null,
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

            const timeLimitSeconds = getPredictionTimeLimitSeconds(selectable.length);
            const challengeIndex = (scoreStateRef.current.questionsAnswered || 0) + 1;

            setQuizState({
              active: true,
              candidates: selectable,
              correctNodes: correct,
              message: `Round ${challengeIndex}: predict the next expansion before the bonus drains. Click one glowing frontier node.`,
              awaitingContinue: false,
              continueFunc: continueAfterFeedback,
              feedbackType: 'question',
              attemptCount: 0,
              challengeIndex,
              timeLimitSeconds,
              deadlineAt: performance.now() + timeLimitSeconds * 1000,
              streak: scoreStateRef.current.currentStreak || 0,
              lastScoring: null,
              ruleMeta: (() => {
                const traceStep = formalTraceRef.current[i];
                const frontier = traceStep?.frontierBeforeExpansion || [];
                if (!traceStep || frontier.length === 0) return null;

                if (traceStep.algorithm === 'astar') {
                  const minF = Math.min(...frontier.map((n) => n.f));
                  const minHOverall = Math.min(...frontier.map((n) => n.h));
                  const minHAmongMinF = Math.min(
                    ...frontier.filter((n) => n.f === minF).map((n) => n.h)
                  );
                  const minInsertionOrderAmongTiedCandidates = Math.min(
                    ...frontier
                      .filter((n) => n.f === minF && n.h === minHAmongMinF)
                      .map((n) => n.insertionOrder)
                  );
                  return {
                    algorithm: 'astar',
                    minF,
                    minHAmongMinF,
                    minHOverall,
                    minInsertionOrderAmongTiedCandidates,
                  };
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
              difficulty: adaptivePrompt.difficulty,
              adaptationReason: adaptivePrompt.adaptationReason,
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
  }, [quizPromptInterval]);

  const animateAlgorithmRace = useCallback(
    (visited, path, prefix, ms, onDone, onPathStart, onStep, runState) => {
      if (runState) {
        runState.phase = visited.length > 0 ? 'visited' : 'done';
        runState.visited = visited;
        runState.path = path;
        runState.prefix = prefix;
        runState.visitedIndex = 0;
        runState.pathIndex = 0;
      }

      if (visited.length === 0) {
        onDone?.();
        return;
      }

      let visitedIndex = 0;

      const animateRacePath = () => {
        if (path.length === 0) {
          if (runState) {
            runState.phase = 'done';
            runState.pathIndex = 0;
          }
          onDone?.();
          return;
        }
        if (runState) {
          runState.phase = 'path';
          runState.pathIndex = 0;
        }
        onPathStart?.();

        let pathIndex = 0;
        const pathStep = () => {
          if (pathIndex >= path.length) {
            if (runState) {
              runState.phase = 'done';
              runState.pathIndex = path.length;
            }
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
          if (runState) {
            runState.pathIndex = pathIndex;
          }
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

        onStep?.(visitedIndex);
        visitedIndex += 1;
        if (runState) {
          runState.phase = 'visited';
          runState.visitedIndex = visitedIndex;
        }
        const t = setTimeout(visitStep, ms);
        timeoutsRef.current.push(t);
      };

      visitStep();
    },
    []
  );

  // Visualize (single or race)
  const handleVisualize = useCallback(() => {
    if (isVisualizing) return;

    clearRuntimeArtifacts();

    const cleanGrid = clearPath(grid);
    setGrid(cleanGrid);
    setIsVisualizing(true);
    setIsPaused(false);
    isPausedRef.current = false;
    resetGamification();
    setStats(null);
    setFormalTrace([]);
    setActiveTraceIndex(-1);
    setHeuristicAuditLog([]);
    setActiveHeuristicAuditIndex(-1);
    setPausedComparison(null);
    setHoveredFrontierNode(null);
    setTraceNotice('');

    const ms = SPEED_MS[speed];
    runStateRef.current.pauseInterval = quizPromptInterval;

    if (isRaceMode) {
      // Race: run both algorithms on independent copies.
      const gBfs = cloneGrid(cleanGrid);
      const gAstar = cloneGrid(cleanGrid);

      const bfsStart = performance.now();
      const bfsResult = bfs(
        gBfs,
        gBfs[gridEndpoints.start.row][gridEndpoints.start.col],
        gBfs[gridEndpoints.end.row][gridEndpoints.end.col],
        { withTrace: true }
      );
      const bfsVisited = bfsResult.visitedNodesInOrder;
      const bfsDurationMs = performance.now() - bfsStart;
      const bfsEnd = gBfs[gridEndpoints.end.row][gridEndpoints.end.col];
      const bfsPathNodes = bfsEnd.isVisited ? getNodesInShortestPathOrder(bfsEnd) : [];

      const astarStart = performance.now();
      const astarResult = astar(
        gAstar,
        gAstar[gridEndpoints.start.row][gridEndpoints.start.col],
        gAstar[gridEndpoints.end.row][gridEndpoints.end.col],
        { withTrace: true }
      );
      const astarVisited = astarResult.visitedNodesInOrder;
      const astarAudit = astarResult.heuristicAuditByIndex || [];
      const astarDurationMs = performance.now() - astarStart;
      const astarEnd = gAstar[gridEndpoints.end.row][gridEndpoints.end.col];
      const astarPathNodes = astarEnd.isVisited ? getNodesInShortestPathOrder(astarEnd) : [];

      const runResults = {
        bfs: {
          visited: bfsVisited.length,
          pathNodes: bfsPathNodes,
          formalTrace: bfsResult.formalTraceByIndex || [],
          durationMs: bfsDurationMs,
        },
        astar: {
          visited: astarVisited.length,
          pathNodes: astarPathNodes,
          formalTrace: astarResult.formalTraceByIndex || [],
          durationMs: astarDurationMs,
        },
      };

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
          setRunSummary(
            buildRunSummary({
              grid: cleanGrid,
              runResults,
              scoreState: scoreStateRef.current,
              isQuizMode,
              quizPromptInterval,
            })
          );
          setRunSummaryIsRaceMode(true);
          setStats({
            bfs: { visited: bfsVisited.length, path: bfsPathNodes.length },
            astar: { visited: astarVisited.length, path: astarPathNodes.length },
          });
          appendExportRows('Race', runResults);
        }
      };

      setTraceNotice('Detailed side-panel trace is disabled in Race Mode, but each algorithm still contributes formal trace data to the result summary.');
      setHeuristicAuditLog(astarAudit);
      setActiveHeuristicAuditIndex(astarAudit.length > 0 ? 0 : -1);

      raceRunStateRef.current = {
        bfs: {
          phase: bfsVisited.length > 0 ? 'visited' : 'done',
          visited: bfsVisited,
          path: bfsPathNodes,
          prefix: 'bfs-',
          visitedIndex: 0,
          pathIndex: 0,
        },
        astar: {
          phase: astarVisited.length > 0 ? 'visited' : 'done',
          visited: astarVisited,
          path: astarPathNodes,
          prefix: 'astar-',
          visitedIndex: 0,
          pathIndex: 0,
        },
      };

      // race mode: independent animation loops for both sides
      animateAlgorithmRace(
        bfsVisited,
        bfsPathNodes,
        'bfs-',
        ms,
        onDone,
        onPathStart,
        undefined,
        raceRunStateRef.current.bfs
      );
      animateAlgorithmRace(
        astarVisited,
        astarPathNodes,
        'astar-',
        ms,
        onDone,
        onPathStart,
        (stepIndex) => setActiveHeuristicAuditIndex(stepIndex),
        raceRunStateRef.current.astar
      );
    } else {
      // Single algorithm.
      const copy = cloneGrid(cleanGrid);
      const start = copy[gridEndpoints.start.row][gridEndpoints.start.col];
      const end = copy[gridEndpoints.end.row][gridEndpoints.end.col];

      const runStart = performance.now();
      const result =
        algorithm === 'bfs'
          ? bfs(copy, start, end, { withTrace: true })
          : astar(copy, start, end, { withTrace: true });
      const durationMs = performance.now() - runStart;

      const visited = result.visitedNodesInOrder;
      const predictionOptions = isQuizMode ? result.predictionOptionsByIndex : null;
      const traceByIndex = result.formalTraceByIndex || [];
      const auditByIndex = algorithm === 'astar' ? result.heuristicAuditByIndex || [] : [];
      setFormalTrace(traceByIndex);
      setActiveTraceIndex(traceByIndex.length > 0 ? 0 : -1);
      setHeuristicAuditLog(auditByIndex);
      setActiveHeuristicAuditIndex(auditByIndex.length > 0 ? 0 : -1);
      if (algorithm === 'astar') {
        setIsSidePanelOpen(true);
      }

      const pathNodes = end.isVisited
        ? getNodesInShortestPathOrder(end)
        : [];

      const runResults = {
        [algorithm]: {
          visited: visited.length,
          pathNodes,
          formalTrace: traceByIndex,
          durationMs,
        },
      };

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
          setRunSummary(
            buildRunSummary({
              grid: cleanGrid,
              runResults,
              scoreState: scoreStateRef.current,
              isQuizMode,
              quizPromptInterval,
            })
          );
          setRunSummaryIsRaceMode(false);
          setStats({
            [algorithm]: { visited: visited.length, path: pathNodes.length },
          });
          appendExportRows('Single', runResults);
        },
        (stepIndex) => {
          setActiveTraceIndex(stepIndex);
          setActiveHeuristicAuditIndex(algorithm === 'astar' ? stepIndex : -1);
        }
      );
    }
  }, [
    animateAlgorithm,
    animateAlgorithmRace,
    appendExportRows,
    clearRuntimeArtifacts,
    grid,
    algorithm,
    isRaceMode,
    speed,
    quizPromptInterval,
    isVisualizing,
    isQuizMode,
    resetGamification,
    gridEndpoints,
  ]);

  const currentTrace =
    activeTraceIndex >= 0 && activeTraceIndex < formalTrace.length
      ? formalTrace[activeTraceIndex]
      : null;

  const activeHoverComparison = useMemo(
    () => getActiveHoverComparison({ isRaceMode, isPaused, pausedComparison, quizState }),
    [isRaceMode, isPaused, pausedComparison, quizState]
  );

  const renderTraceEquation = useCallback((scores, options = {}) => {
    const animate = typeof options === 'object' && Boolean(options.animate);
    return <TraceEquation scores={scores} animate={animate} />;
  }, []);

  const hoveredNodeDecision = useMemo(
    () => getHoveredNodeDecision(hoveredFrontierNode, activeHoverComparison),
    [hoveredFrontierNode, activeHoverComparison]
  );

  const { hoveredForwardPreviewPath, hoveredBackwardPreviewPath } = useMemo(
    () =>
      getHoveredPreviewPaths({
        grid,
        hoveredFrontierNode,
        activeHoverComparison,
        start: gridEndpoints.start,
        end: gridEndpoints.end,
      }),
    [grid, hoveredFrontierNode, activeHoverComparison, gridEndpoints]
  );

  const { activeTraceForwardPreviewPath, activeTraceBackwardPreviewPath } = useMemo(() => {
    const shouldShowNodeScoreLabels = isPaused || quizState.active;

    if (!showEquationOverlay || !shouldShowNodeScoreLabels || !currentTrace?.expandedNode) {
      return {
        activeTraceForwardPreviewPath: [],
        activeTraceBackwardPreviewPath: [],
      };
    }

    const anchor = currentTrace.expandedNode;
    const backwardPath = buildPreviewPath(
      grid,
      { row: gridEndpoints.start.row, col: gridEndpoints.start.col },
      { row: anchor.row, col: anchor.col },
      'bfs'
    );
    const forwardPath =
      currentTrace.algorithm === 'astar'
        ? buildPreviewPath(
            grid,
            { row: anchor.row, col: anchor.col },
            { row: gridEndpoints.end.row, col: gridEndpoints.end.col },
            'astar'
          )
        : [];

    return {
      activeTraceForwardPreviewPath: forwardPath,
      activeTraceBackwardPreviewPath: backwardPath,
    };
  }, [grid, currentTrace, gridEndpoints, showEquationOverlay, isPaused, quizState.active]);

  useEffect(() => {
    clearPreviewPathHighlight();
    if (currentRoute !== '/visualizer') return undefined;

    const backwardPreview =
      hoveredBackwardPreviewPath.length > 0
        ? hoveredBackwardPreviewPath
        : activeTraceBackwardPreviewPath;
    const forwardPreview =
      hoveredForwardPreviewPath.length > 0
        ? hoveredForwardPreviewPath
        : activeTraceForwardPreviewPath;
    const forwardAlgorithm =
      hoveredForwardPreviewPath.length > 0
        ? activeHoverComparison?.algorithm
        : currentTrace?.algorithm;

    if (backwardPreview.length > 0) {
      applyPreviewPathHighlight(backwardPreview, {
        kind: 'backward',
        labelMode: 'index',
      });
    }

    if (forwardAlgorithm === 'astar' && forwardPreview.length > 0) {
      applyPreviewPathHighlight(forwardPreview, {
        kind: 'forward',
        labelMode: 'heuristic',
        goalRow: gridEndpoints.end.row,
        goalCol: gridEndpoints.end.col,
      });
    }
    return () => clearPreviewPathHighlight();
  }, [
    hoveredForwardPreviewPath,
    hoveredBackwardPreviewPath,
    activeTraceForwardPreviewPath,
    activeTraceBackwardPreviewPath,
    activeHoverComparison,
    currentTrace,
    gridEndpoints,
    currentRoute,
  ]);

  const { averageTryAccuracy, averageTriesPerQuestion } = getScoreAverages(scoreState);

  const raceResultComparison = useMemo(
    () => getRaceResultComparison({ isRaceMode, stats }),
    [isRaceMode, stats]
  );

  const handleLandingStart = useCallback(() => {
    const preset = GRID_PRESETS.find((option) => option.id === landingDraft.gridPreset);
    const draftRows = Number(landingDraft.gridRows);
    const draftCols = Number(landingDraft.gridCols);
    const selectedRows =
      landingDraft.gridPreset === 'custom'
        ? draftRows || DEFAULT_GRID_CONFIG.rows
        : preset?.rows ?? DEFAULT_GRID_CONFIG.rows;
    const selectedCols =
      landingDraft.gridPreset === 'custom'
        ? draftCols || DEFAULT_GRID_CONFIG.cols
        : preset?.cols ?? DEFAULT_GRID_CONFIG.cols;

    rebuildGrid({ rows: selectedRows, cols: selectedCols });
    setShowEquationOverlay(landingDraft.showEquationOverlay);
    setSettingsDraft((prev) => ({
      ...prev,
      showEquationOverlay: landingDraft.showEquationOverlay,
      gridRows: selectedRows,
      gridCols: selectedCols,
    }));
    navigateTo('/visualizer');
  }, [landingDraft, rebuildGrid, navigateTo]);

  // Render
  if (currentRoute === '/') {
    return (
      <LandingScreen
        gridPresets={GRID_PRESETS}
        gridLimits={GRID_LIMITS}
        landingDraft={landingDraft}
        setLandingDraft={setLandingDraft}
        onStart={handleLandingStart}
      />
    );
  }

  if (currentRoute === '/truth-scanner') {
    return (
      <TruthScannerPage
        hasRunSummary={Boolean(runSummary)}
        initialConceptId={truthScannerContext.conceptId}
        showReturnToAnalysis={truthScannerContext.returnToAnalysis}
        onNavigate={navigateTo}
        onOpenFormalAnalysis={openFormalAnalysis}
        onReturnToFormalAnalysis={returnToFormalAnalysis}
      />
    );
  }

  return (
    <div
      className={`app${isObstacleMode ? ' obstacle-mode' : ''}${isObstaclePainting ? ' obstacle-painting' : ''}`}
      onMouseLeave={handleMouseUp}
    >
      <AppChrome
        algorithm={algorithm}
        averageTriesPerQuestion={averageTriesPerQuestion}
        averageTryAccuracy={averageTryAccuracy}
        closeLegend={closeLegend}
        closeSettings={closeSettings}
        currentRoute={currentRoute}
        handleClearBoard={handleClearBoard}
        handleClearPath={handleClearPath}
        handleGenerateMaze={handleGenerateMaze}
        handleRaceModeToggle={handleRaceModeToggle}
        handleVisualize={handleVisualize}
        isLegendOpen={isLegendOpen}
        isMazeGenerating={isMazeGenerating}
        isObstacleMode={isObstacleMode}
        isPaused={isPaused}
        isQuizMode={isQuizMode}
        isRaceMode={isRaceMode}
        isRunSummaryOpen={isRunSummaryOpen}
        isSettingsOpen={isSettingsOpen}
        isVisualizing={isVisualizing}
        jumpTimeline={jumpTimeline}
        openLegend={openLegend}
        onNavigate={navigateTo}
        onOpenFormalAnalysis={openFormalAnalysis}
        onOpenTruthTerm={openTruthScannerTerm}
        openSettings={openSettings}
        quizState={quizState}
        resetSettingsToDefaults={resetSettingsToDefaults}
        runSummary={runSummary}
        runSummaryIsRaceMode={runSummaryIsRaceMode}
        exportRows={exportRows}
        saveSettings={saveSettings}
        scorePopup={scorePopup}
        scoreState={scoreState}
        setAlgorithm={handleAlgorithmChange}
        setIsObstacleMode={setIsObstacleMode}
        setIsQuizMode={setIsQuizMode}
        setIsRunSummaryOpen={setIsRunSummaryOpen}
        setSettingsDraft={setSettingsDraft}
        settingsDraft={settingsDraft}
        simulationPhase={simulationPhase}
        simulationPhaseDisplay={simulationPhaseDisplay}
      />

      <VisualizerWorkspace
        activeHoverComparison={activeHoverComparison}
        algorithm={algorithm}
        currentTrace={currentTrace}
        formalTrace={formalTrace}
        grid={grid}
        handleMouseDown={handleMouseDown}
        handleMouseEnter={handleMouseEnter}
        handleMouseUp={handleMouseUp}
        hoveredFrontierNode={hoveredFrontierNode}
        hoveredNodeDecision={hoveredNodeDecision}
        hasOpenModal={isSettingsOpen || isLegendOpen || isRunSummaryOpen}
        isPaused={isPaused}
        isSidePanelOpen={isSidePanelOpen}
        isMazeGenerating={isMazeGenerating}
        isRaceMode={isRaceMode}
        isVisualizing={isVisualizing}
        heuristicAuditSteps={heuristicAuditLog}
        heuristicAuditStepIndex={activeHeuristicAuditIndex}
        raceResultComparison={raceResultComparison}
        raceAStarAuditIndex={activeHeuristicAuditIndex}
        renderTraceEquation={renderTraceEquation}
        responsiveCellSize={responsiveCellSize}
        rewindHoverTarget={rewindHoverTarget}
        setIsSidePanelOpen={setIsSidePanelOpen}
        simulationPhase={simulationPhase}
        showEquationOverlay={showEquationOverlay}
        start={gridEndpoints.start}
        end={gridEndpoints.end}
        stats={stats}
        traceNotice={traceNotice}
      />
    </div>
  );
}

export default App;
