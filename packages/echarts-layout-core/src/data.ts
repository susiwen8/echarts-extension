import type { GraphData, GraphInput, GraphNode, RawGraphEdge, RawGraphNode } from './types.js';

export function normalizeGraphData(input: GraphInput = {}): GraphData {
  const rawNodes = input.nodes || input.data || [];
  const nodes = rawNodes.map((node, index) => normalizeNode(node, index));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const rawEdges = input.edges || input.links || [];
  const edges = rawEdges
    .map((edge, index) => normalizeEdge(edge, index, nodes))
    .filter((edge) => edge.source && edge.target && nodeById.has(edge.source) && nodeById.has(edge.target));

  return { nodes, edges };
}

function normalizeNode(node: unknown, index: number): GraphNode {
  const raw: RawGraphNode = isPlainObject(node) ? node : { value: node };
  const id = raw.id ?? raw.name ?? index;
  return {
    ...raw,
    id: String(id),
    name: raw.name ?? String(id),
    __ecIndex: index,
    __raw: node
  };
}

function normalizeEdge(edge: unknown, index: number, nodes: GraphNode[]): RawGraphEdge & { id: string; source: string; target: string } {
  const raw: RawGraphEdge = isPlainObject(edge) ? edge : {};
  const source = resolveEndpoint(raw.source, nodes);
  const target = resolveEndpoint(raw.target, nodes);
  return {
    ...raw,
    id: String(raw.id ?? `${source}-${target}-${index}`),
    source,
    target
  };
}

function resolveEndpoint(endpoint: unknown, nodes: GraphNode[]): string {
  if (endpoint == null) return '';
  if (typeof endpoint === 'number' && nodes[endpoint]) {
    return nodes[endpoint].id;
  }
  return String(endpoint);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}
