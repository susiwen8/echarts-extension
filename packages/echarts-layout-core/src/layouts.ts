import { computeArcLayout } from './arc.js';
import { computeConcentricLayout } from './concentric-layout.js';
import { computeGridLayout } from './grid-layout.js';
import { normalizeGraphData } from './data.js';
import { computeMDSLayout } from './mds-layout.js';
import { computeRadialLayout } from './radial-layout.js';
import type { GraphInput, LayoutOptions, LayoutResult } from './types.js';

export function computeGraphLayout(type: string, input: GraphInput, options: LayoutOptions = {}): LayoutResult {
  const graph = normalizeGraphData(input);
  if (type === 'arc') return computeArcLayout(graph, options);
  if (type === 'concentric') return computeConcentricLayout(graph, options);
  if (type === 'grid') return computeGridLayout(graph, options);
  if (type === 'mds') return computeMDSLayout(graph, options);
  if (type === 'radial') return computeRadialLayout(graph, options);
  throw new Error(`Unsupported graph layout: ${type}`);
}
