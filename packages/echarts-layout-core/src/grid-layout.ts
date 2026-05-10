import {
  buildLayoutGraph,
  createSorter,
  degreeMap,
  finiteNumber,
  getNodeSize,
  toPublicResult
} from './graph-utils.js';
import type { GraphData, LayoutNode, LayoutOptions, LayoutResult, Point } from './types.js';

interface GridDimensions {
  rows: number;
  cols: number;
}

interface GridCell {
  row: number;
  col: number;
}

export function computeGridLayout(input: GraphData, options: LayoutOptions = {}): LayoutResult {
  const graph = buildLayoutGraph(input);
  const nodeCount = graph.nodes.length;
  if (!nodeCount) return toPublicResult(graph);

  const viewport = normalizeGridViewport(options);
  const pinned = readPinnedPositions(graph.nodes, options);
  const dimensions = resolveGridDimensions(nodeCount, options, viewport.width, viewport.height, pinned);
  const cellSize = resolveGridCellSize(graph.nodes, dimensions, viewport.width, viewport.height, options);
  const begin = resolveGridBegin(options, viewport.center, dimensions, cellSize);
  const assignments = assignGridCells(graph.nodes, graph, dimensions, pinned, options);

  graph.nodes.forEach((node) => {
    const cell = assignments.get(node.id);
    applyGridCell(node, cell, begin, cellSize);
  });

  return toPublicResult(graph);
}

function applyGridCell(
  node: LayoutNode,
  cell: GridCell | undefined,
  begin: Point,
  cellSize: { width: number; height: number }
): void {
  if (!cell) return;
  node.x = begin[0] + (cell.col + 0.5) * cellSize.width;
  node.y = begin[1] + (cell.row + 0.5) * cellSize.height;
}

function normalizeGridViewport(options: LayoutOptions): { width: number; height: number; center: Point } {
  const width = Math.max(0, finiteNumber(options.width, 300));
  const height = Math.max(0, finiteNumber(options.height, 300));
  const center = Array.isArray(options.center)
    ? [finiteNumber(options.center[0], width / 2), finiteNumber(options.center[1], height / 2)]
    : [width / 2, height / 2];

  return {
    width,
    height,
    center: center as Point
  };
}

function resolveGridDimensions(
  nodeCount: number,
  options: LayoutOptions,
  width: number,
  height: number,
  pinned: Map<string, GridCell>
): GridDimensions {
  const requestedRows = positiveInteger(options.rows);
  const requestedCols = positiveInteger(options.cols);
  let rows = requestedRows ?? 0;
  let cols = requestedCols ?? 0;

  if (rows && cols) {
    if (rows * cols < nodeCount) {
      rows = Math.ceil(nodeCount / cols);
    }
  } else if (cols) {
    rows = Math.ceil(nodeCount / cols);
  } else if (rows) {
    cols = Math.ceil(nodeCount / rows);
  } else {
    const aspect = width > 0 && height > 0 ? width / height : 1;
    cols = Math.max(1, Math.ceil(Math.sqrt(nodeCount * aspect)));
    rows = Math.ceil(nodeCount / cols);
  }

  pinned.forEach((cell) => {
    rows = Math.max(rows, cell.row + 1);
    cols = Math.max(cols, cell.col + 1);
  });

  return {
    rows: Math.max(1, rows),
    cols: Math.max(1, cols)
  };
}

function resolveGridCellSize(
  nodes: LayoutNode[],
  dimensions: GridDimensions,
  width: number,
  height: number,
  options: LayoutOptions
): { width: number; height: number } {
  const condense = options.condense === true;
  const baseWidth = condense ? 0 : width / dimensions.cols;
  const baseHeight = condense ? 0 : height / dimensions.rows;
  const overlapPadding = options.preventOverlap ? finiteNumber(options.preventOverlapPadding, 10) : 0;
  const minCellSize = Math.max(
    1,
    ...nodes.map((node) => getNodeSize(node, options, { nodeSize: 20 }) + overlapPadding)
  );

  return {
    width: Math.max(1, baseWidth, minCellSize),
    height: Math.max(1, baseHeight, minCellSize)
  };
}

function resolveGridBegin(
  options: LayoutOptions,
  center: Point,
  dimensions: GridDimensions,
  cellSize: { width: number; height: number }
): Point {
  if (Array.isArray(options.begin)) {
    return [
      finiteNumber(options.begin[0], 0),
      finiteNumber(options.begin[1], 0)
    ];
  }

  return [
    center[0] - (dimensions.cols * cellSize.width) / 2,
    center[1] - (dimensions.rows * cellSize.height) / 2
  ];
}

function assignGridCells(
  nodes: LayoutNode[],
  graph: GraphData,
  dimensions: GridDimensions,
  pinned: Map<string, GridCell>,
  options: LayoutOptions
): Map<string, GridCell> {
  const assignments = new Map<string, GridCell>();
  const occupied = new Set<string>();

  nodes.forEach((node) => {
    const cell = pinned.get(node.id);
    if (!cell) return;
    const key = cellKey(cell);
    if (occupied.has(key)) return;
    assignments.set(node.id, cell);
    occupied.add(key);
  });

  const freeCells = createCenterFirstCells(dimensions)
    .filter((cell) => !occupied.has(cellKey(cell)));
  const sorter = createSorter(options.sortBy, degreeMap(graph));
  const sortedNodes = nodes
    .filter((node) => !assignments.has(node.id))
    .sort((left, right) => sorter(right) - sorter(left) || left.__index - right.__index);

  sortedNodes.forEach((node, index) => {
    const cell = freeCells[index];
    if (cell) assignments.set(node.id, cell);
  });

  return assignments;
}

function createCenterFirstCells(dimensions: GridDimensions): GridCell[] {
  const centerRow = (dimensions.rows - 1) / 2;
  const centerCol = (dimensions.cols - 1) / 2;
  const cells: GridCell[] = [];

  for (let row = 0; row < dimensions.rows; row += 1) {
    for (let col = 0; col < dimensions.cols; col += 1) {
      cells.push({ row, col });
    }
  }

  return cells.sort((left, right) => compareCenterFirstCells(left, right, centerRow, centerCol));
}

function compareCenterFirstCells(left: GridCell, right: GridCell, centerRow: number, centerCol: number): number {
  const leftDistance = squaredDistance(left, centerRow, centerCol);
  const rightDistance = squaredDistance(right, centerRow, centerCol);
  if (leftDistance !== rightDistance) return leftDistance - rightDistance;

  const leftAngle = Math.atan2(left.row - centerRow, left.col - centerCol);
  const rightAngle = Math.atan2(right.row - centerRow, right.col - centerCol);
  if (leftAngle !== rightAngle) return leftAngle - rightAngle;

  return left.row - right.row || left.col - right.col;
}

function readPinnedPositions(nodes: LayoutNode[], options: LayoutOptions): Map<string, GridCell> {
  const position = typeof options.position === 'function' ? options.position : null;
  const pinned = new Map<string, GridCell>();
  if (!position) return pinned;

  nodes.forEach((node) => {
    const value = position(node);
    const row = positiveInteger(value?.row, true);
    const col = positiveInteger(value?.col, true);
    if (row == null || col == null) return;
    pinned.set(node.id, { row, col });
  });

  return pinned;
}

function positiveInteger(value: unknown, allowZero = false): number | null {
  if (!Number.isFinite(value)) return null;
  const integer = Math.floor(value as number);
  if (integer < (allowZero ? 0 : 1)) return null;
  return integer;
}

function squaredDistance(cell: GridCell, centerRow: number, centerCol: number): number {
  return (cell.row - centerRow) ** 2 + (cell.col - centerCol) ** 2;
}

function cellKey(cell: GridCell): string {
  return `${cell.row}:${cell.col}`;
}

export const __test__ = {
  normalizeGridViewport,
  resolveGridDimensions,
  resolveGridCellSize,
  resolveGridBegin,
  applyGridCell,
  assignGridCells,
  createCenterFirstCells,
  compareCenterFirstCells,
  readPinnedPositions,
  positiveInteger,
  squaredDistance,
  cellKey
};
