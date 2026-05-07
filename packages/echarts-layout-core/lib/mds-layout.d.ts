import type { GraphData, LayoutOptions, LayoutResult } from './types.js';
export declare function computeMDSLayout(input: GraphData, options?: LayoutOptions): LayoutResult;
export declare function runMDS(distances: number[][], dimension?: number, fallbackDistance?: number): number[][];
