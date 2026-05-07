export type Point = [number, number];
export type NodeSizeOption = number | number[] | ((node: LayoutNode) => number);
export type NodeSpacingOption = number | ((node: LayoutNode) => number);
export type SortByOption = string | ((node: LayoutNode) => unknown);
export type GridPositionOption = (node: LayoutNode) => {
    row?: unknown;
    col?: unknown;
} | null | undefined;
export interface RawGraphNode {
    id?: string | number;
    name?: string;
    value?: unknown;
    x?: number;
    y?: number;
    size?: NodeSizeOption;
    symbolSize?: NodeSizeOption;
    [key: string]: unknown;
}
export interface GraphNode extends RawGraphNode {
    id: string;
    name: string;
    __ecIndex: number;
    __raw: unknown;
}
export interface LayoutNode extends GraphNode {
    x: number;
    y: number;
    __index: number;
}
export interface RawGraphEdge {
    id?: string | number;
    source?: string | number;
    target?: string | number;
    lineStyle?: Record<string, unknown>;
    [key: string]: unknown;
}
export interface GraphEdge extends RawGraphEdge {
    id: string;
    source: string;
    target: string;
}
export interface GraphInput {
    nodes?: unknown[];
    data?: unknown[];
    edges?: unknown[];
    links?: unknown[];
}
export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}
export interface LayoutGraph {
    nodes: LayoutNode[];
    edges: GraphEdge[];
    nodeById: Map<string, LayoutNode>;
    indexById: Map<string, number>;
}
export interface LayoutOptions {
    width?: number;
    height?: number;
    center?: Array<number | string>;
    begin?: Array<number | string>;
    nodeSep?: number;
    nodeSize?: NodeSizeOption;
    nodeSpacing?: NodeSpacingOption;
    linkDistance?: number;
    unitRadius?: number;
    focusNode?: string | number;
    preventOverlap?: boolean;
    preventOverlapPadding?: number;
    strictRadial?: boolean;
    maxIteration?: number;
    maxPreventOverlapIteration?: number;
    sortBy?: SortByOption;
    sortStrength?: number;
    maxLevelDiff?: number;
    sweep?: number;
    equidistant?: boolean;
    startAngle?: number;
    clockwise?: boolean;
    rows?: number;
    cols?: number;
    condense?: boolean;
    position?: GridPositionOption;
    [key: string]: unknown;
}
export interface LayoutResult {
    nodes: PublicLayoutNode[];
    edges: GraphEdge[];
}
export type PublicLayoutNode = Omit<LayoutNode, '__index' | '__raw'> & {
    id: string;
    name: string;
    x: number;
    y: number;
};
export interface ConcentricLevel {
    nodes: LayoutNode[];
    nodeSizes: number[];
    maxNodeSize: number;
    dTheta: number;
    r: number;
}
