export function clearTimeoutQueue(timeoutsRef) {
  timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
  timeoutsRef.current = [];
}

export function clearNextChoiceHighlight() {
  document.querySelectorAll('.node-next-choice').forEach((el) => {
    el.classList.remove('node-next-choice');
  });
}

export function clearFrontierHoverHighlight() {
  document.querySelectorAll('.node-frontier-hoverable').forEach((el) => {
    el.classList.remove('node-frontier-hoverable');
  });
}

export function clearPreviewPathHighlight() {
  document.querySelectorAll('.node-hover-preview-path').forEach((el) => {
    el.classList.remove(
      'node-hover-preview-path',
      'node-hover-preview-path-source',
      'node-hover-preview-path-goal',
      'node-hover-preview-forward',
      'node-hover-preview-backward'
    );
    delete el.dataset.forwardLabel;
    delete el.dataset.forwardCompactLabel;
    delete el.dataset.backwardLabel;
    delete el.dataset.backwardCompactLabel;
  });
}

function setPreviewScoreLabel(el, kind, labelValue) {
  const numericLabel = String(labelValue);

  if (kind === 'forward') {
    el.dataset.forwardLabel = numericLabel;
    el.dataset.forwardCompactLabel = numericLabel;
  } else {
    el.dataset.backwardLabel = numericLabel;
    el.dataset.backwardCompactLabel = numericLabel;
  }
}

export function applyNextChoiceHighlight(nodes, prefix = '') {
  clearNextChoiceHighlight();
  (nodes || []).forEach((node) => {
    const el = document.getElementById(`${prefix}node-${node.row}-${node.col}`);
    if (!el) return;
    if (el.classList.contains('node-wall')) return;
    el.classList.add('node-next-choice');
  });
}

export function applyFrontierHoverHighlight(nodes, prefix = '') {
  clearFrontierHoverHighlight();
  (nodes || []).forEach((node) => {
    const el = document.getElementById(`${prefix}node-${node.row}-${node.col}`);
    if (!el) return;
    if (el.classList.contains('node-wall')) return;
    el.classList.add('node-frontier-hoverable');
  });
}

export function applyPreviewPathHighlight(nodes, options = {}) {
  const {
    prefix = '',
    kind = 'forward',
    labelMode = 'remaining',
    goalRow = 0,
    goalCol = 0,
    clearBefore = false,
  } = options;

  if (clearBefore) clearPreviewPathHighlight();

  const isForward = kind === 'forward';
  const totalSteps = Math.max((nodes || []).length - 1, 0);

  (nodes || []).forEach((node, index) => {
    const el = document.getElementById(`${prefix}node-${node.row}-${node.col}`);
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
        return Math.abs(node.row - goalRow) + Math.abs(node.col - goalCol);
      }
      if (labelMode === 'remaining') {
        return totalSteps - index;
      }
      return index;
    })();

    if (isForward) {
      setPreviewScoreLabel(el, 'forward', labelValue);
    } else {
      setPreviewScoreLabel(el, 'backward', labelValue);
    }
  });
}

export function clearVisualizerDomClasses() {
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
          'node-next-choice',
          'node-rewind-target'
        )
      );
  });
}

export function redrawRunTimeline(run) {
  if (!run) return;

  document
    .querySelectorAll(`[id^="${run.prefix}node-"]`)
    .forEach((el) => {
      el.classList.remove('node-visited', 'node-shortest-path');
    });

  run.visited.slice(0, run.visitedIndex).forEach((node) => {
    const el = document.getElementById(`${run.prefix}node-${node.row}-${node.col}`);
    if (el && !node.isStart && !node.isEnd && !el.classList.contains('node-prediction-wrong')) {
      el.classList.add('node-visited');
    }
  });

  run.path.slice(0, run.pathIndex).forEach((node) => {
    const el = document.getElementById(`${run.prefix}node-${node.row}-${node.col}`);
    if (el && !node.isStart && !node.isEnd && !el.classList.contains('node-prediction-wrong')) {
      el.classList.remove('node-visited');
      el.classList.add('node-shortest-path');
    }
  });
}
