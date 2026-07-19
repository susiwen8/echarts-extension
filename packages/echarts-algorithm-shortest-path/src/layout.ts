const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 460;
const DEFAULT_NODE_RADIUS = 18;
const DEFAULT_EDGE_WIDTH = 2;
const DEFAULT_MAX_NODES = 96;
const DEFAULT_MAX_EDGES = 240;
const DEFAULT_MAX_FRAMES = 8000;
const EPSILON = 1e-9;

export type ShortestPathAlgorithmKind = 'dijkstra' | 'bfs' | 'a-star' | 'bellman-ford';
export type ShortestPathFrameKind = 'initial' | 'visit' | 'inspect' | 'relax' | 'complete' | 'unreachable';
export type ShortestPathNodeState = 'default' | 'start' | 'target' | 'frontier' | 'visited' | 'current' | 'path';
export type ShortestPathEdgeState = 'default' | 'active' | 'relaxed' | 'path';
export type ShortestPathPaddingOption = number | Partial<ShortestPathPadding>;

export interface ShortestPathPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ShortestPathNodeData {
  id?: string | number;
  name?: string;
  label?: string | number;
  x?: unknown;
  y?: unknown;
  value?: unknown;
  itemStyle?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ShortestPathEdgeData {
  id?: string | number;
  source?: string | number;
  target?: string | number;
  from?: string | number;
  to?: string | number;
  weight?: unknown;
  value?: unknown;
  directed?: unknown;
  lineStyle?: Record<string, unknown>;
  label?: string | number;
  [key: string]: unknown;
}

export interface ShortestPathLayoutOptions {
  width?: number;
  height?: number;
  padding?: ShortestPathPaddingOption;
  algorithm?: ShortestPathAlgorithmKind;
  start?: string | number;
  target?: string | number;
  currentStep?: number;
  progress?: number;
  maxNodes?: number;
  maxEdges?: number;
  maxFrames?: number;
  nodeRadius?: number;
  edgeWidth?: number;
  directed?: boolean;
  [key: string]: unknown;
}

export interface ShortestPathLayoutOption extends ShortestPathLayoutOptions {
  nodes?: unknown[];
  edges?: unknown[];
  links?: unknown[];
  data?: unknown[];
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface ShortestPathGraphInput {
  nodes?: unknown[];
  edges?: unknown[];
  links?: unknown[];
  data?: unknown[];
}

export interface ShortestPathNode {
  id: string;
  name: string;
  x: number | null;
  y: number | null;
  value: number;
  dataIndex: number;
  raw: unknown;
}

export interface ShortestPathEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  directed: boolean;
  dataIndex: number;
  raw: unknown;
}

export interface ShortestPathFrame {
  step: number;
  kind: ShortestPathFrameKind;
  algorithm: ShortestPathAlgorithmKind;
  currentId: string | null;
  activeNodeIds: string[];
  activeEdgeIds: string[];
  relaxedEdgeIds: string[];
  frontierIds: string[];
  visitedIds: string[];
  path: string[];
  distances: Record<string, number>;
  previous: Record<string, string>;
  description: string;
}

export interface ShortestPathPlotRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface ShortestPathLayoutNode {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  value: number;
  dataIndex: number;
  state: ShortestPathNodeState;
  distance: number;
  distanceLabel: string;
  raw: unknown;
}

export interface ShortestPathLayoutEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  directed: boolean;
  dataIndex: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  labelX: number;
  labelY: number;
  state: ShortestPathEdgeState;
  raw: unknown;
}

export interface ShortestPathLayoutResult {
  width: number;
  height: number;
  padding: ShortestPathPadding;
  plot: ShortestPathPlotRect;
  algorithm: ShortestPathAlgorithmKind;
  start: string;
  target: string;
  nodes: ShortestPathLayoutNode[];
  edges: ShortestPathLayoutEdge[];
  graphNodes: ShortestPathNode[];
  graphEdges: ShortestPathEdge[];
  frames: ShortestPathFrame[];
  frame: ShortestPathFrame;
  currentStep: number;
  maxStep: number;
  truncated: boolean;
}

interface SearchContext {
  algorithm: ShortestPathAlgorithmKind;
  frames: ShortestPathFrame[];
  maxFrames: number;
}

interface AlgorithmOptions {
  algorithm?: ShortestPathAlgorithmKind;
  start?: string | number;
  target?: string | number;
  maxFrames?: number;
  directed?: boolean;
}

interface TraversalEdge {
  edge: ShortestPathEdge;
  from: string;
  to: string;
  weight: number;
}

export const SHORTEST_PATH_LABELS: Record<ShortestPathAlgorithmKind, string> = {
  dijkstra: 'Dijkstra',
  bfs: 'Breadth-first search',
  'a-star': 'A* search',
  'bellman-ford': 'Bellman-Ford'
};

export function resolveShortestPathLayout(option: ShortestPathLayoutOption = {}): ShortestPathLayoutResult {
  const layout = isPlainObject(option.layout) ? option.layout : {};
  const layoutOptions = isPlainObject(option.layoutOptions) ? option.layoutOptions : {};
  const merged: ShortestPathLayoutOptions = {
    ...layout,
    ...layoutOptions,
    width: finiteNumber(option.width, finiteNumber(layoutOptions.width, finiteNumber(layout.width, DEFAULT_WIDTH))),
    height: finiteNumber(option.height, finiteNumber(layoutOptions.height, finiteNumber(layout.height, DEFAULT_HEIGHT))),
    padding: readPaddingOption(option.padding ?? layoutOptions.padding ?? layout.padding),
    algorithm: normalizeAlgorithm(option.algorithm ?? layoutOptions.algorithm ?? layout.algorithm),
    start: readIdOption(option.start ?? layoutOptions.start ?? layout.start),
    target: readIdOption(option.target ?? layoutOptions.target ?? layout.target),
    currentStep: finiteNumber(option.currentStep, finiteNumber(layoutOptions.currentStep, finiteNumber(layout.currentStep, undefined))),
    progress: finiteNumber(option.progress, finiteNumber(layoutOptions.progress, finiteNumber(layout.progress, undefined))),
    maxNodes: finiteNumber(option.maxNodes, finiteNumber(layoutOptions.maxNodes, finiteNumber(layout.maxNodes, undefined))),
    maxEdges: finiteNumber(option.maxEdges, finiteNumber(layoutOptions.maxEdges, finiteNumber(layout.maxEdges, undefined))),
    maxFrames: finiteNumber(option.maxFrames, finiteNumber(layoutOptions.maxFrames, finiteNumber(layout.maxFrames, undefined))),
    nodeRadius: finiteNumber(option.nodeRadius, finiteNumber(layoutOptions.nodeRadius, finiteNumber(layout.nodeRadius, undefined))),
    edgeWidth: finiteNumber(option.edgeWidth, finiteNumber(layoutOptions.edgeWidth, finiteNumber(layout.edgeWidth, undefined))),
    directed: firstBoolean(option.directed, layoutOptions.directed, layout.directed)
  };

  return layoutShortestPath({
    nodes: Array.isArray(option.nodes) ? option.nodes : (Array.isArray(option.data) ? option.data : []),
    edges: Array.isArray(option.edges) ? option.edges : option.links
  }, merged);
}

export function layoutShortestPath(graph: ShortestPathGraphInput = {}, options: ShortestPathLayoutOptions = {}): ShortestPathLayoutResult {
  const width = Math.max(1, finiteNumber(options.width, DEFAULT_WIDTH));
  const height = Math.max(1, finiteNumber(options.height, DEFAULT_HEIGHT));
  const padding = normalizePadding(options.padding);
  const plot = createPlotRect(width, height, padding);
  const algorithm = normalizeAlgorithm(options.algorithm);
  const maxNodes = Math.max(2, Math.floor(finiteNumber(options.maxNodes, DEFAULT_MAX_NODES)));
  const maxEdges = Math.max(1, Math.floor(finiteNumber(options.maxEdges, DEFAULT_MAX_EDGES)));
  const graphNodes = normalizeNodes(graph.nodes || graph.data || []).slice(0, maxNodes);
  const graphEdges = normalizeEdges(graph.edges || graph.links || [], graphNodes, options).slice(0, maxEdges);
  const { start, target } = resolveEndpoints(graphNodes, options);
  const frames = createShortestPathFrames(graphNodes, graphEdges, {
    algorithm,
    start,
    target,
    directed: options.directed,
    maxFrames: options.maxFrames
  });
  const maxStep = Math.max(0, frames.length - 1);
  const progressStep = Number.isFinite(options.progress)
    ? Math.round(clamp(finiteNumber(options.progress, 0), 0, 1) * maxStep)
    : undefined;
  const currentStep = clamp(Math.round(finiteNumber(options.currentStep, finiteNumber(progressStep, 0))), 0, maxStep);
  const frame = frames[currentStep] || createInitialFrame(algorithm, start, target, graphNodes);
  const nodeRadius = Math.max(4, finiteNumber(options.nodeRadius, DEFAULT_NODE_RADIUS));
  const edgeWidth = Math.max(0.5, finiteNumber(options.edgeWidth, DEFAULT_EDGE_WIDTH));
  const nodePositions = layoutNodePositions(graphNodes, plot, nodeRadius);
  const nodes = graphNodes.map((node) => layoutNode(node, nodePositions.get(node.id), nodeRadius, frame, start, target));
  const edges = graphEdges.map((edge) => layoutEdge(edge, nodePositions, nodeRadius, edgeWidth, frame));

  return {
    width,
    height,
    padding,
    plot,
    algorithm,
    start,
    target,
    nodes,
    edges,
    graphNodes,
    graphEdges,
    frames,
    frame,
    currentStep,
    maxStep,
    truncated: normalizeNodes(graph.nodes || graph.data || []).length > graphNodes.length
      || normalizeEdges(graph.edges || graph.links || [], graphNodes, options).length > graphEdges.length
      || frames.length >= Math.max(2, Math.floor(finiteNumber(options.maxFrames, DEFAULT_MAX_FRAMES)))
  };
}

export function createShortestPathFrames(
  nodesInput: unknown[],
  edgesInput: unknown[],
  options: AlgorithmOptions = {}
): ShortestPathFrame[] {
  const nodes = normalizeNodes(nodesInput);
  const edges = normalizeEdges(edgesInput, nodes, options);
  const algorithm = normalizeAlgorithm(options.algorithm);
  const { start, target } = resolveEndpoints(nodes, options);
  const context: SearchContext = {
    algorithm,
    frames: [],
    maxFrames: Math.max(2, Math.floor(finiteNumber(options.maxFrames, DEFAULT_MAX_FRAMES)))
  };

  pushFrame(context, {
    kind: 'initial',
    distances: { [start]: 0 },
    frontierIds: [start],
    description: `${SHORTEST_PATH_LABELS[algorithm]} starts at ${start} and searches for ${target}.`
  });

  if (!nodes.length) return context.frames;
  if (algorithm === 'bfs') runBfs(nodes, edges, start, target, context);
  else if (algorithm === 'bellman-ford') runBellmanFord(nodes, edges, start, target, context);
  else runDijkstraLike(nodes, edges, start, target, context, algorithm === 'a-star');

  return context.frames;
}

export function createShortestPathDataSource(option: ShortestPathLayoutOption = {}): Array<Record<string, unknown>> {
  const nodes = Array.isArray(option.nodes) ? option.nodes : (Array.isArray(option.data) ? option.data : []);
  return normalizeNodes(nodes).map((node) => ({
    ...(isPlainObject(node.raw) ? node.raw : {}),
    name: node.name,
    value: node.value
  }));
}

function runDijkstraLike(
  nodes: ShortestPathNode[],
  edges: ShortestPathEdge[],
  start: string,
  target: string,
  context: SearchContext,
  useHeuristic: boolean
): void {
  const nodeIds = nodes.map((node) => node.id);
  const nodeLookup = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = createAdjacency(edges);
  const distances = new Map<string, number>(nodeIds.map((id) => [id, Number.POSITIVE_INFINITY]));
  const previous = new Map<string, string>();
  const visited = new Set<string>();
  distances.set(start, 0);

  while (visited.size < nodeIds.length) {
    const current = minCandidate(nodeIds, visited, (id) => {
      const heuristic = useHeuristic ? estimateDistance(nodeLookup.get(id), nodeLookup.get(target)) : 0;
      return finiteMapValue(distances, id) + heuristic;
    });
    if (!current || !Number.isFinite(finiteMapValue(distances, current))) break;

    pushFrame(context, {
      kind: 'visit',
      currentId: current,
      activeNodeIds: [current],
      visitedIds: Array.from(visited),
      frontierIds: frontierFromDistances(distances, visited),
      distances: recordFromNumberMap(distances),
      previous: recordFromStringMap(previous),
      description: `${current} has the smallest tentative distance.`
    });

    if (current === target) {
      visited.add(current);
      break;
    }

    for (const next of adjacency.get(current) || []) {
      if (visited.has(next.to)) continue;
      pushFrame(context, {
        kind: 'inspect',
        currentId: current,
        activeNodeIds: [current, next.to],
        activeEdgeIds: [next.edge.id],
        visitedIds: Array.from(visited),
        frontierIds: frontierFromDistances(distances, visited),
        distances: recordFromNumberMap(distances),
        previous: recordFromStringMap(previous),
        description: `Inspect edge ${current} -> ${next.to} with weight ${formatWeight(next.weight)}.`
      });

      const candidate = finiteMapValue(distances, current) + next.weight;
      if (candidate + EPSILON < finiteMapValue(distances, next.to)) {
        distances.set(next.to, cleanNumber(candidate));
        previous.set(next.to, current);
        pushFrame(context, {
          kind: 'relax',
          currentId: current,
          activeNodeIds: [current, next.to],
          activeEdgeIds: [next.edge.id],
          relaxedEdgeIds: [next.edge.id],
          visitedIds: Array.from(visited),
          frontierIds: frontierFromDistances(distances, visited),
          distances: recordFromNumberMap(distances),
          previous: recordFromStringMap(previous),
          description: `Relax ${next.to}: distance becomes ${formatWeight(candidate)}.`
        });
      }
    }

    visited.add(current);
  }

  pushCompletion(context, start, target, distances, previous, visited);
}

function runBfs(
  nodes: ShortestPathNode[],
  edges: ShortestPathEdge[],
  start: string,
  target: string,
  context: SearchContext
): void {
  const adjacency = createAdjacency(edges);
  const queue = [start];
  const distances = new Map<string, number>([[start, 0]]);
  const previous = new Map<string, string>();
  const visited = new Set<string>();

  while (queue.length) {
    const current = queue.shift() as string;
    if (visited.has(current)) continue;
    pushFrame(context, {
      kind: 'visit',
      currentId: current,
      activeNodeIds: [current],
      visitedIds: Array.from(visited),
      frontierIds: queue,
      distances: recordFromNumberMap(distances),
      previous: recordFromStringMap(previous),
      description: `Visit ${current} from the BFS queue.`
    });
    visited.add(current);
    if (current === target) break;

    for (const next of adjacency.get(current) || []) {
      if (visited.has(next.to) || distances.has(next.to)) continue;
      distances.set(next.to, finiteMapValue(distances, current) + 1);
      previous.set(next.to, current);
      queue.push(next.to);
      pushFrame(context, {
        kind: 'relax',
        currentId: current,
        activeNodeIds: [current, next.to],
        activeEdgeIds: [next.edge.id],
        relaxedEdgeIds: [next.edge.id],
        visitedIds: Array.from(visited),
        frontierIds: queue,
        distances: recordFromNumberMap(distances),
        previous: recordFromStringMap(previous),
        description: `Discover ${next.to} at ${finiteMapValue(distances, next.to)} hops.`
      });
    }
  }

  pushCompletion(context, start, target, distances, previous, visited);
}

function runBellmanFord(
  nodes: ShortestPathNode[],
  edges: ShortestPathEdge[],
  start: string,
  target: string,
  context: SearchContext
): void {
  const distances = new Map<string, number>(nodes.map((node) => [node.id, Number.POSITIVE_INFINITY]));
  const previous = new Map<string, string>();
  distances.set(start, 0);
  const traversalEdges = Array.from(createTraversalEdges(edges));

  for (let pass = 0; pass < Math.max(0, nodes.length - 1); pass += 1) {
    let changed = false;
    for (const next of traversalEdges) {
      pushFrame(context, {
        kind: 'inspect',
        currentId: next.from,
        activeNodeIds: [next.from, next.to],
        activeEdgeIds: [next.edge.id],
        visitedIds: [],
        frontierIds: frontierFromDistances(distances, new Set()),
        distances: recordFromNumberMap(distances),
        previous: recordFromStringMap(previous),
        description: `Pass ${pass + 1}: inspect ${next.from} -> ${next.to}.`
      });

      const candidate = finiteMapValue(distances, next.from) + next.weight;
      if (Number.isFinite(candidate) && candidate + EPSILON < finiteMapValue(distances, next.to)) {
        distances.set(next.to, cleanNumber(candidate));
        previous.set(next.to, next.from);
        changed = true;
        pushFrame(context, {
          kind: 'relax',
          currentId: next.from,
          activeNodeIds: [next.from, next.to],
          activeEdgeIds: [next.edge.id],
          relaxedEdgeIds: [next.edge.id],
          visitedIds: [],
          frontierIds: frontierFromDistances(distances, new Set()),
          distances: recordFromNumberMap(distances),
          previous: recordFromStringMap(previous),
          description: `Relax ${next.to}: distance becomes ${formatWeight(candidate)}.`
        });
      }
    }
    if (!changed) break;
  }

  const visited = new Set(nodes.filter((node) => Number.isFinite(finiteMapValue(distances, node.id))).map((node) => node.id));
  pushCompletion(context, start, target, distances, previous, visited);
}

function pushCompletion(
  context: SearchContext,
  start: string,
  target: string,
  distances: Map<string, number>,
  previous: Map<string, string>,
  visited: Set<string>
): void {
  const path = reconstructPath(start, target, previous, distances);
  const reachable = path.length > 0;
  pushFrame(context, {
    kind: reachable ? 'complete' : 'unreachable',
    currentId: reachable ? target : null,
    activeNodeIds: reachable ? path : [],
    visitedIds: Array.from(visited),
    frontierIds: [],
    path,
    distances: recordFromNumberMap(distances),
    previous: recordFromStringMap(previous),
    description: reachable
      ? `Shortest path: ${path.join(' -> ')}.`
      : `No path from ${start} to ${target}.`
  });
}

function createAdjacency(edges: ShortestPathEdge[]): Map<string, TraversalEdge[]> {
  const adjacency = new Map<string, TraversalEdge[]>();
  for (const next of createTraversalEdges(edges)) {
    const bucket = adjacency.get(next.from);
    if (bucket) bucket.push(next);
    else adjacency.set(next.from, [next]);
  }
  return adjacency;
}

function* createTraversalEdges(edges: ShortestPathEdge[]): Iterable<TraversalEdge> {
  for (const edge of edges) {
    yield { edge, from: edge.source, to: edge.target, weight: edge.weight };
    if (!edge.directed) yield { edge, from: edge.target, to: edge.source, weight: edge.weight };
  }
}

function pushFrame(
  context: SearchContext,
  patch: Partial<Omit<ShortestPathFrame, 'step' | 'algorithm'>>
): void {
  if (context.frames.length >= context.maxFrames) return;
  context.frames.push({
    step: context.frames.length,
    kind: patch.kind || 'inspect',
    algorithm: context.algorithm,
    currentId: patch.currentId ?? null,
    activeNodeIds: uniqueStrings(patch.activeNodeIds || []),
    activeEdgeIds: uniqueStrings(patch.activeEdgeIds || []),
    relaxedEdgeIds: uniqueStrings(patch.relaxedEdgeIds || []),
    frontierIds: uniqueStrings(patch.frontierIds || []),
    visitedIds: uniqueStrings(patch.visitedIds || []),
    path: uniqueOrderedPath(patch.path || []),
    distances: patch.distances || {},
    previous: patch.previous || {},
    description: patch.description || ''
  });
}

function createInitialFrame(
  algorithm: ShortestPathAlgorithmKind,
  start: string,
  target: string,
  nodes: ShortestPathNode[]
): ShortestPathFrame {
  return {
    step: 0,
    kind: 'initial',
    algorithm,
    currentId: start || null,
    activeNodeIds: start ? [start] : [],
    activeEdgeIds: [],
    relaxedEdgeIds: [],
    frontierIds: start ? [start] : [],
    visitedIds: [],
    path: [],
    distances: start ? { [start]: 0 } : {},
    previous: {},
    description: `${SHORTEST_PATH_LABELS[algorithm]} starts with ${nodes.length} nodes.`
  };
}

function normalizeNodes(data: unknown[]): ShortestPathNode[] {
  const nodes: ShortestPathNode[] = [];
  data.forEach((row, dataIndex) => {
    const record = isPlainObject(row) ? row : {};
    const id = stringifyId(record.id ?? record.name ?? record.label ?? dataIndex);
    if (!id) return;
    nodes.push({
      id,
      name: stringifyId(record.name ?? record.label ?? record.id ?? id),
      x: finiteOrNull(record.x),
      y: finiteOrNull(record.y),
      value: finiteNumber(record.value, 0),
      dataIndex,
      raw: row
    });
  });
  return dedupeNodes(nodes);
}

function normalizeEdges(data: unknown[], nodes: ShortestPathNode[], options: Pick<ShortestPathLayoutOptions, 'directed'> = {}): ShortestPathEdge[] {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: ShortestPathEdge[] = [];
  data.forEach((row, dataIndex) => {
    const record = isPlainObject(row) ? row : {};
    const source = stringifyId(record.source ?? record.from ?? (Array.isArray(row) ? row[0] : ''));
    const target = stringifyId(record.target ?? record.to ?? (Array.isArray(row) ? row[1] : ''));
    if (!source || !target || !nodeIds.has(source) || !nodeIds.has(target)) return;
    const weight = Math.max(0, finiteNumber(record.weight ?? record.value ?? (Array.isArray(row) ? row[2] : undefined), 1));
    edges.push({
      id: stringifyId(record.id ?? `${source}->${target}:${dataIndex}`),
      source,
      target,
      weight,
      directed: firstBoolean(record.directed, options.directed) === true,
      dataIndex,
      raw: row
    });
  });
  return edges;
}

function dedupeNodes(nodes: ShortestPathNode[]): ShortestPathNode[] {
  const seen = new Set<string>();
  return nodes.filter((node) => {
    if (seen.has(node.id)) return false;
    seen.add(node.id);
    return true;
  });
}

function resolveEndpoints(nodes: ShortestPathNode[], options: Pick<ShortestPathLayoutOptions, 'start' | 'target'>): { start: string; target: string } {
  const ids = nodes.map((node) => node.id);
  const idSet = new Set(ids);
  const requestedStart = stringifyId(options.start);
  const requestedTarget = stringifyId(options.target);
  const start = requestedStart && idSet.has(requestedStart) ? requestedStart : (ids[0] || '');
  const target = requestedTarget && idSet.has(requestedTarget) ? requestedTarget : (ids[ids.length - 1] || start);
  return { start, target };
}

function layoutNodePositions(
  nodes: ShortestPathNode[],
  plot: ShortestPathPlotRect,
  radius: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const count = Math.max(1, nodes.length);
  const centerX = plot.left + plot.width / 2;
  const centerY = plot.top + plot.height / 2;
  const rx = Math.max(radius * 2, plot.width / 2 - radius * 1.5);
  const ry = Math.max(radius * 2, plot.height / 2 - radius * 1.5);

  nodes.forEach((node, index) => {
    let x = node.x;
    let y = node.y;
    if (x == null || y == null) {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
      x = centerX + Math.cos(angle) * rx;
      y = centerY + Math.sin(angle) * ry;
    } else {
      x = projectCoordinate(x, plot.left + radius, plot.right - radius);
      y = projectCoordinate(y, plot.top + radius, plot.bottom - radius);
    }
    positions.set(node.id, {
      x: clamp(x, plot.left + radius, plot.right - radius),
      y: clamp(y, plot.top + radius, plot.bottom - radius)
    });
  });
  return positions;
}

function layoutNode(
  node: ShortestPathNode,
  position: { x: number; y: number } | undefined,
  radius: number,
  frame: ShortestPathFrame,
  start: string,
  target: string
): ShortestPathLayoutNode {
  const distance = finiteNumber(frame.distances[node.id], Number.POSITIVE_INFINITY);
  return {
    id: node.id,
    name: node.name,
    x: position?.x ?? 0,
    y: position?.y ?? 0,
    radius,
    value: node.value,
    dataIndex: node.dataIndex,
    state: nodeState(node.id, frame, start, target),
    distance,
    distanceLabel: Number.isFinite(distance) ? formatWeight(distance) : '∞',
    raw: node.raw
  };
}

function layoutEdge(
  edge: ShortestPathEdge,
  positions: Map<string, { x: number; y: number }>,
  radius: number,
  edgeWidth: number,
  frame: ShortestPathFrame
): ShortestPathLayoutEdge {
  const source = positions.get(edge.source) || { x: 0, y: 0 };
  const target = positions.get(edge.target) || { x: 0, y: 0 };
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.max(Math.hypot(dx, dy), EPSILON);
  const offsetX = (dx / length) * radius;
  const offsetY = (dy / length) * radius;

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    weight: edge.weight,
    directed: edge.directed,
    dataIndex: edge.dataIndex,
    x1: source.x + offsetX,
    y1: source.y + offsetY,
    x2: target.x - offsetX,
    y2: target.y - offsetY,
    labelX: (source.x + target.x) / 2,
    labelY: (source.y + target.y) / 2,
    state: edgeState(edge, frame),
    raw: edge.raw
  };
}

function nodeState(id: string, frame: ShortestPathFrame, start: string, target: string): ShortestPathNodeState {
  if (id === frame.currentId) return 'current';
  if (frame.path.includes(id) && id !== start && id !== target) return 'path';
  if (id === start) return 'start';
  if (id === target) return 'target';
  if (frame.activeNodeIds.includes(id)) return 'frontier';
  if (frame.frontierIds.includes(id)) return 'frontier';
  if (frame.visitedIds.includes(id)) return 'visited';
  return 'default';
}

function edgeState(edge: ShortestPathEdge, frame: ShortestPathFrame): ShortestPathEdgeState {
  if (edgeIsInPath(edge, frame.path)) return 'path';
  if (frame.relaxedEdgeIds.includes(edge.id)) return 'relaxed';
  if (frame.activeEdgeIds.includes(edge.id)) return 'active';
  return 'default';
}

function edgeIsInPath(edge: ShortestPathEdge, path: string[]): boolean {
  for (let index = 0; index < path.length - 1; index += 1) {
    const source = path[index];
    const target = path[index + 1];
    if (edge.source === source && edge.target === target) return true;
    if (!edge.directed && edge.source === target && edge.target === source) return true;
  }
  return false;
}

function minCandidate(ids: string[], visited: Set<string>, score: (id: string) => number): string | null {
  let best: string | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  ids.forEach((id) => {
    if (visited.has(id)) return;
    const candidate = score(id);
    if (candidate + EPSILON < bestScore) {
      best = id;
      bestScore = candidate;
    }
  });
  return best;
}

function frontierFromDistances(distances: Map<string, number>, visited: Set<string>): string[] {
  return Array.from(distances.entries())
    .filter(([id, distance]) => Number.isFinite(distance) && !visited.has(id))
    .map(([id]) => id);
}

function reconstructPath(
  start: string,
  target: string,
  previous: Map<string, string>,
  distances: Map<string, number>
): string[] {
  if (!start || !target || !Number.isFinite(finiteMapValue(distances, target))) return [];
  const path = [target];
  let current = target;
  const guard = previous.size + 2;
  while (current !== start && path.length <= guard) {
    const prev = previous.get(current);
    if (!prev) return current === start ? path.reverse() : [];
    path.push(prev);
    current = prev;
  }
  return path.reverse();
}

function estimateDistance(left: ShortestPathNode | undefined, right: ShortestPathNode | undefined): number {
  if (!left || !right || left.x == null || left.y == null || right.x == null || right.y == null) return 0;
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function recordFromNumberMap(map: Map<string, number>): Record<string, number> {
  const record: Record<string, number> = {};
  map.forEach((value, key) => {
    record[key] = Number.isFinite(value) ? cleanNumber(value) : Number.POSITIVE_INFINITY;
  });
  return record;
}

function recordFromStringMap(map: Map<string, string>): Record<string, string> {
  const record: Record<string, string> = {};
  map.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function finiteMapValue(map: Map<string, number>, key: string): number {
  const value = map.get(key);
  return typeof value === 'number' ? value : Number.POSITIVE_INFINITY;
}

function projectCoordinate(value: number, min: number, max: number): number {
  if (value >= 0 && value <= 1) return min + value * (max - min);
  return value;
}

function createPlotRect(width: number, height: number, padding: ShortestPathPadding): ShortestPathPlotRect {
  const left = clamp(padding.left, 0, Math.max(width - 1, 0));
  const top = clamp(padding.top, 0, Math.max(height - 1, 0));
  const right = Math.max(left + 1, width - clamp(padding.right, 0, width));
  const bottom = Math.max(top + 1, height - clamp(padding.bottom, 0, height));
  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(right - left, 1),
    height: Math.max(bottom - top, 1)
  };
}

function readPaddingOption(value: unknown): ShortestPathPaddingOption | undefined {
  if (typeof value === 'number') return value;
  if (isPlainObject(value)) return value;
  return undefined;
}

function normalizePadding(value: unknown): ShortestPathPadding {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalized = Math.max(0, value);
    return { top: normalized, right: normalized, bottom: normalized, left: normalized };
  }
  if (isPlainObject(value)) {
    return {
      top: Math.max(0, finiteNumber(value.top, 44)),
      right: Math.max(0, finiteNumber(value.right, 44)),
      bottom: Math.max(0, finiteNumber(value.bottom, 58)),
      left: Math.max(0, finiteNumber(value.left, 44))
    };
  }
  return { top: 44, right: 44, bottom: 58, left: 44 };
}

function normalizeAlgorithm(value: unknown): ShortestPathAlgorithmKind {
  return value === 'bfs' || value === 'a-star' || value === 'bellman-ford'
    ? value
    : 'dijkstra';
}

function readIdOption(value: unknown): string | undefined {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return undefined;
}

function firstBoolean(...values: unknown[]): boolean | undefined {
  return values.find((value): value is boolean => typeof value === 'boolean');
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => typeof value === 'string' && value.length > 0)));
}

function uniqueOrderedPath(values: string[]): string[] {
  return values.filter((value, index) => typeof value === 'string' && value.length > 0 && values.indexOf(value) === index);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cleanNumber(value: number): number {
  return Math.abs(value) < EPSILON ? 0 : Number(value.toFixed(12));
}

function formatWeight(value: number): string {
  if (!Number.isFinite(value)) return '∞';
  return Number.isInteger(value) ? String(value) : String(cleanNumber(value));
}

function stringifyId(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

function finiteOrNull(value: unknown): number | null {
  const number = finiteNumber(value, NaN);
  return Number.isFinite(number) ? number : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function finiteNumber(value: unknown, fallback: number | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return fallback as number;
}
