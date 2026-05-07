import type { GraphData, LayoutGraph, LayoutNode, LayoutOptions, LayoutResult, Point, SortByOption } from './types.js';
export declare function buildLayoutGraph(graph: GraphData): LayoutGraph;
export declare function normalizeViewport(options?: LayoutOptions): {
    width: number;
    height: number;
    center: Point;
};
export declare function applySingleNodeLayout(graph: LayoutGraph, center: Point): LayoutResult;
export declare function degreeMap(graph: GraphData): Map<string, number>;
export declare function allPairsShortestPaths(graph: LayoutGraph): number[][];
export declare function replaceInfinity(distances: number[][], fallbackStep?: number): number[][];
export declare function getNodeSize(node: LayoutNode, options?: Pick<LayoutOptions, 'nodeSize' | 'nodeSpacing'>, defaults?: Pick<LayoutOptions, 'nodeSize' | 'nodeSpacing'>): number;
export declare function createSorter(sortBy: SortByOption | undefined, degrees: Map<string, number>): (node: LayoutNode) => number;
export declare function toPublicResult(graph: LayoutGraph): LayoutResult;
export declare function finiteNumber<T extends number | undefined>(value: unknown, fallback: T): number | T;
