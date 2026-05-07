import type { GraphData, LayoutOptions, LayoutResult, Point } from './types.js';
type ArcPathSegment = Array<string | number>;
export declare function computeArcLayout(input: GraphData, options?: LayoutOptions): LayoutResult;
export declare function createArcPath(sourcePoint: Point, targetPoint: Point): ArcPathSegment[];
export declare function createArcBezierShape(sourcePoint: Point, targetPoint: Point): {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    cpx1: number;
    cpy1: number;
    cpx2: number;
    cpy2: number;
};
export declare function pathToString(path: ArcPathSegment[]): string;
export {};
