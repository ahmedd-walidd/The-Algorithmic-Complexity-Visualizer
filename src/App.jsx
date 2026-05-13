import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import AppChrome from './components/layout/AppChrome';
import VisualizerWorkspace from './components/layout/VisualizerWorkspace';
import TraceEquation from './components/panels/TraceEquation';
import LandingScreen from './components/layout/LandingScreen';
import {
  createGrid,
  clearPath,
  cloneGrid,
  getNodesInShortestPathOrder,
  getGridEndpoints,
  DEFAULT_GRID_CONFIG,
} from './utils/gridHelpers';
import { generateMaze } from './utils/mazeGenerator';
import { bfs } from './algorithms/bfs';
import { astar } from './algorithms/astar';
import { buildKnowledgeSpaceSnapshot } from './framework/knowledgeSpace';
import { buildRunSummary } from './framework/runAnalysis';
import { buildCsv, buildExportRows } from './utils/exportHelpers';
import {
  buildCorrectPredictionMessage,
  buildWrongPredictionMessage,
  calculateQuestionScore,
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
  showEquationOverlay: true,
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
  questionHistory: [],
  lastQuestionScore: 0,
  lastAccuracy: 0,
  lastResponseTime: 0,
  lastAttempts: 0,
};

function App() {
  // -- state --
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
  const [isLandingOpen, setIsLandingOpen] = useState(true);
  const [landingDraft, setLandingDraft] = useState({
    gridPreset: 'default',
    gridRows: DEFAULT_SETTINGS.gridRows,
    gridCols: DEFAULT_SETTINGS.gridCols,
    showEquationOverlay: DEFAULT_SETTINGS.showEquationOverlay,
  });
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [sidePanelTab, setSidePanelTab] = useState('manifesto');
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isMazeGenerating, setIsMazeGenerating] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [simulationPhase, setSimulationPhase] = useState('idle');
  const [stats, setStats] = useState(null);
  const [runSummary, setRunSummary] = useState(null);
  const [isRunSummaryOpen, setIsRunSummaryOpen] = useState(false);
  const [runSummaryIsRaceMode, setRunSummaryIsRaceMode] = useState(false);
  const [exportRows, setExportRows] = useState([]);
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
  });
  const [scoreState, setScoreState] = useState(INITIAL_SCORE_STATE);
  const [formalTrace, setFormalTrace] = useState([]);
  const [activeTraceIndex, setActiveTraceIndex] = useState(-1);
  const [traceNotice, setTraceNotice] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [pausedComparison, setPausedComparison] = useState(null);
  const [hoveredFrontierNode, setHoveredFrontierNode] = useState(null);
  const isObstaclePainting = isObstacleMode && isMousePressed;
  const pausedPhaseRef = useRef('idle');

  const simulationPhaseDisplay = getSimulationPhaseDisplay(simulationPhase);

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
  }, [quizPromptInterval]);

  const resetVisualizationState = useCallback(({ resetScore = true } = {}) => {
    setStats(null);
    setIsVisualizing(false);
    setIsPaused(false);
    isPausedRef.current = false;
    if (resetScore) resetGamification();
    setFormalTrace([]);
    setActiveTraceIndex(-1);
    setPausedComparison(null);
    setHoveredFrontierNode(null);
    setTraceNotice('');
    setSimulationPhase('idle');
    pausedPhaseRef.current = 'idle';
  }, [resetGamification]);

  const rebuildGrid = useCallback(
    (nextConfig) => {
      clearAllTimeouts();
      clearVisualizerDomClasses();
      clearNextChoiceHighlight();
      clearFrontierHoverHighlight();
      clearPreviewPathHighlight();
      resetRunState();
      clearRunSummary();

      const rows = Math.max(8, Math.min(60, Number(nextConfig.rows) || DEFAULT_GRID_CONFIG.rows));
      const cols = Math.max(12, Math.min(90, Number(nextConfig.cols) || DEFAULT_GRID_CONFIG.cols));
      const endpoints = getGridEndpoints(rows, cols);

      setGridConfig({ rows, cols });
      setGridEndpoints(endpoints);
      setGrid(createGrid({ rows, cols, ...endpoints }));
      resetVisualizationState();
    },
    [
      clearRunSummary,
      resetRunState,
      resetVisualizationState,
      clearAllTimeouts,
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

  const handleExportData = useCallback(() => {
    if (exportRows.length === 0) return;

    const csv = buildCsv(exportRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    link.href = url;
    link.download = `algorithm-run-data-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [exportRows]);

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

  // Wall drawing / quiz clicks
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
            questionHistory: [
              ...prev.questionHistory,
              {
                accuracy: scoring.accuracy,
                attempts: attemptsUsed,
                responseSeconds: scoring.responseSeconds,
                questionScore: scoring.questionScore,
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
          }));

          setScorePopup(scoring);
          setTimeout(() => setScorePopup(null), 3000);

          const el = document.getElementById(`node-${row}-${col}`) || document.getElementById(`bfs-node-${row}-${col}`) || document.getElementById(`astar-node-${row}-${col}`);
          if (el) el.classList.add('node-prediction-correct');

          showGamifiedPopup(row, col, `+${scoring.questionScore}`, 'positive');
        } else {
            // Wrong answer
            const el = document.getElementById(`node-${row}-${col}`) || document.getElementById(`bfs-node-${row}-${col}`) || document.getElementById(`astar-node-${row}-${col}`);
            if (el) el.classList.add('node-prediction-wrong');

          showGamifiedPopup(row, col, 'Miss!', 'negative');
          const detailedMessage = buildWrongPredictionMessage(row, col, quizState);
          setQuizState(prev => ({
            ...prev,
            feedbackType: 'incorrect',
            message: detailedMessage,
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

    clearAllTimeouts();
    clearVisualizerDomClasses();
    clearNextChoiceHighlight();
    resetRunState();
    clearRunSummary();

    setIsMazeGenerating(true);
    resetVisualizationState();

    const buildRequestedMaze = () => {
      const nextMaze = generateMaze({
        rows: gridConfig.rows,
        cols: gridConfig.cols,
        start: gridEndpoints.start,
        end: gridEndpoints.end,
      });

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
    clearAllTimeouts,
    clearRunSummary,
    resetRunState,
    resetVisualizationState,
    gridConfig,
    gridEndpoints,
    isMazeGenerating,
  ]);

  const handleClearBoard = useCallback(() => {
    clearAllTimeouts();
    clearVisualizerDomClasses();
    clearNextChoiceHighlight();
    resetRunState();
    clearRunSummary();
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
    clearAllTimeouts,
    clearRunSummary,
    resetRunState,
    resetVisualizationState,
    gridConfig,
    gridEndpoints,
  ]);

  const handleClearPath = useCallback(() => {
    clearAllTimeouts();
    clearVisualizerDomClasses();
    clearNextChoiceHighlight();
    resetRunState();
    clearRunSummary();
    setGrid((prev) => clearPath(prev));
    resetVisualizationState();
  }, [clearAllTimeouts, clearRunSummary, resetRunState, resetVisualizationState]);

  const handleRaceModeToggle = useCallback(() => {
    clearAllTimeouts();
    clearVisualizerDomClasses();
    clearNextChoiceHighlight();
    clearFrontierHoverHighlight();
    clearPreviewPathHighlight();
    resetRunState();
    clearRunSummary();

    setIsRaceMode((value) => !value);
    resetVisualizationState({ resetScore: false });
  }, [
    clearAllTimeouts,
    clearRunSummary,
    resetRunState,
    resetVisualizationState,
  ]);

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
  }, [quizPromptInterval]);

  const animateAlgorithmRace = useCallback((visited, path, prefix, ms, onDone, onPathStart) => {
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
  }, []);

  // Visualize (single or race)
  const handleVisualize = useCallback(() => {
    if (isVisualizing) return;

    clearAllTimeouts();
    clearVisualizerDomClasses();
    clearNextChoiceHighlight();
    resetRunState();
    clearRunSummary();

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
      // Race: run both algorithms on independent copies.
      const gBfs = cloneGrid(cleanGrid);
      const gAstar = cloneGrid(cleanGrid);

      const bfsStart = performance.now();
      const bfsVisited = bfs(
        gBfs,
        gBfs[gridEndpoints.start.row][gridEndpoints.start.col],
        gBfs[gridEndpoints.end.row][gridEndpoints.end.col]
      );
      const bfsDurationMs = performance.now() - bfsStart;
      const bfsEnd = gBfs[gridEndpoints.end.row][gridEndpoints.end.col];
      const bfsPathNodes = bfsEnd.isVisited ? getNodesInShortestPathOrder(bfsEnd) : [];

      const astarStart = performance.now();
      const astarVisited = astar(
        gAstar,
        gAstar[gridEndpoints.start.row][gridEndpoints.start.col],
        gAstar[gridEndpoints.end.row][gridEndpoints.end.col]
      );
      const astarDurationMs = performance.now() - astarStart;
      const astarEnd = gAstar[gridEndpoints.end.row][gridEndpoints.end.col];
      const astarPathNodes = astarEnd.isVisited ? getNodesInShortestPathOrder(astarEnd) : [];

      const runResults = {
        bfs: {
          visited: bfsVisited.length,
          pathNodes: bfsPathNodes,
          formalTrace: [],
          durationMs: bfsDurationMs,
        },
        astar: {
          visited: astarVisited.length,
          pathNodes: astarPathNodes,
          formalTrace: [],
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
              scoreState,
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

      setTraceNotice('Detailed formal trace is disabled in Race Mode to avoid mixed proof streams.');

      // race mode: independent animation loops for both sides
      animateAlgorithmRace(bfsVisited, bfsPathNodes, 'bfs-', ms, onDone, onPathStart);
      animateAlgorithmRace(astarVisited, astarPathNodes, 'astar-', ms, onDone, onPathStart);
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
      setFormalTrace(traceByIndex);
      setActiveTraceIndex(traceByIndex.length > 0 ? 0 : -1);

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
              scoreState,
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
        }
      );
    }
  }, [
    animateAlgorithm,
    animateAlgorithmRace,
    appendExportRows,
    clearAllTimeouts,
    grid,
    algorithm,
    isRaceMode,
    speed,
    quizPromptInterval,
    isVisualizing,
    isQuizMode,
    scoreState,
    clearRunSummary,
    resetGamification,
    resetRunState,
    gridEndpoints,
  ]);

  const currentTrace =
    activeTraceIndex >= 0 && activeTraceIndex < formalTrace.length
      ? formalTrace[activeTraceIndex]
      : null;

  const knowledgeSpaceSnapshot = useMemo(
    () =>
      buildKnowledgeSpaceSnapshot({
        grid,
        algorithm,
        currentTrace,
        formalTrace,
        stats,
        isRaceMode,
      }),
    [grid, algorithm, currentTrace, formalTrace, stats, isRaceMode]
  );

  const activeHoverComparison = useMemo(
    () => getActiveHoverComparison({ isRaceMode, isPaused, pausedComparison, quizState }),
    [isRaceMode, isPaused, pausedComparison, quizState]
  );

  const renderTraceEquation = useCallback((scores) => {
    return <TraceEquation scores={scores} />;
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
    if (!showEquationOverlay || !currentTrace?.expandedNode) {
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
  }, [grid, currentTrace, gridEndpoints, showEquationOverlay]);

  useEffect(() => {
    clearPreviewPathHighlight();
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
    setIsLandingOpen(false);
  }, [landingDraft, rebuildGrid]);

  // Render
  if (isLandingOpen) {
    return (
      <LandingScreen
        gridPresets={GRID_PRESETS}
        landingDraft={landingDraft}
        setLandingDraft={setLandingDraft}
        onStart={handleLandingStart}
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
        exportRows={exportRows}
        handleClearBoard={handleClearBoard}
        handleClearPath={handleClearPath}
        handleExportData={handleExportData}
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
        openSettings={openSettings}
        quizState={quizState}
        resetSettingsToDefaults={resetSettingsToDefaults}
        runSummary={runSummary}
        runSummaryIsRaceMode={runSummaryIsRaceMode}
        saveSettings={saveSettings}
        scorePopup={scorePopup}
        scoreState={scoreState}
        setAlgorithm={setAlgorithm}
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
        currentTrace={currentTrace}
        formalTrace={formalTrace}
        grid={grid}
        handleMouseDown={handleMouseDown}
        handleMouseEnter={handleMouseEnter}
        handleMouseUp={handleMouseUp}
        hoveredFrontierNode={hoveredFrontierNode}
        hoveredNodeDecision={hoveredNodeDecision}
        isPaused={isPaused}
        isSidePanelOpen={isSidePanelOpen}
        isMazeGenerating={isMazeGenerating}
        isRaceMode={isRaceMode}
        isVisualizing={isVisualizing}
        knowledgeSpaceSnapshot={knowledgeSpaceSnapshot}
        raceResultComparison={raceResultComparison}
        renderTraceEquation={renderTraceEquation}
        responsiveCellSize={responsiveCellSize}
        setIsSidePanelOpen={setIsSidePanelOpen}
        setSidePanelTab={setSidePanelTab}
        sidePanelTab={sidePanelTab}
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
