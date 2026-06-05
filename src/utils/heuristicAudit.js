/**
 * @typedef {Object} HeuristicAuditCandidate
 * @property {number} step
 * @property {number} row
 * @property {number} col
 * @property {string} nodeLabel
 * @property {number} g
 * @property {number} h
 * @property {number} f
 * @property {boolean} selected
 * @property {boolean} isMinimumF
 * @property {boolean} isTieBreakMinimum
 */

/**
 * @typedef {Object} HeuristicAuditStep
 * @property {number} step
 * @property {string} selectedNodeLabel
 * @property {number} selectedRow
 * @property {number} selectedCol
 * @property {number} minimumF
 * @property {number} minimumHAmongMinimumF
 * @property {boolean} decisionValid
 * @property {number} tieCount
 * @property {string} tieHandling
 * @property {string} heuristicType
 * @property {HeuristicAuditCandidate[]} candidates
 */

const firstFiniteNumber = (...values) => {
  const value = values.find((candidate) => Number.isFinite(candidate));
  return value ?? Infinity;
};

const getRow = (node) => node?.row ?? node?.y ?? 0;
const getCol = (node) => node?.col ?? node?.x ?? 0;

const getScores = (node) => {
  const g = firstFiniteNumber(node?.distance, node?.g, node?.gCost, node?.distanceFromStart);
  const h = firstFiniteNumber(node?.heuristic, node?.h, node?.hCost);
  const storedF = firstFiniteNumber(node?.totalDistance, node?.f, node?.fCost, node?.totalCost);
  const f = Number.isFinite(storedF) ? storedF : g + h;

  return { g, h, f };
};

/**
 * Audits one A* decision without mutating the frontier or selected node.
 *
 * @param {number} step
 * @param {Array<Object>} frontier
 * @param {Object} selectedNode
 * @returns {HeuristicAuditStep}
 */
export function auditAStarDecision(step, frontier, selectedNode) {
  const values = (frontier || []).map((node) => {
    const row = getRow(node);
    const col = getCol(node);
    const { g, h, f } = getScores(node);

    return { row, col, g, h, f };
  });

  const minimumF = values.length > 0 ? Math.min(...values.map((value) => value.f)) : Infinity;
  const minimumHAmongMinimumF =
    values.length > 0
      ? Math.min(...values.filter((value) => value.f === minimumF).map((value) => value.h))
      : Infinity;
  const selectedRow = getRow(selectedNode);
  const selectedCol = getCol(selectedNode);
  const selectedKey = `${selectedRow},${selectedCol}`;

  const candidates = values.map((value) => {
    const key = `${value.row},${value.col}`;

    return {
      step,
      row: value.row,
      col: value.col,
      nodeLabel: `(${value.row}, ${value.col})`,
      g: value.g,
      h: value.h,
      f: value.f,
      selected: key === selectedKey,
      isMinimumF: value.f === minimumF,
      isTieBreakMinimum: value.f === minimumF && value.h === minimumHAmongMinimumF,
    };
  });

  const selectedCandidate = candidates.find((candidate) => candidate.selected);
  const tieCount = candidates.filter((candidate) => candidate.isMinimumF).length;

  return {
    step,
    heuristicType: 'manhattan',
    selectedNodeLabel: `(${selectedRow}, ${selectedCol})`,
    selectedRow,
    selectedCol,
    minimumF,
    minimumHAmongMinimumF,
    decisionValid: Boolean(selectedCandidate && selectedCandidate.isTieBreakMinimum),
    tieCount,
    tieHandling:
      tieCount > 1
        ? 'Tie on f(n); selected node must have the lowest Manhattan h(n) among minimum-f candidates.'
        : 'No f(n) tie; selected node only needs the minimum f(n).',
    candidates,
  };
}
