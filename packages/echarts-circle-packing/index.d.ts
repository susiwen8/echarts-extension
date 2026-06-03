import 'echarts';

export type CirclePackingSort = boolean | 'none' | 'value' | 'name' | 'asc' | 'desc';
export type CirclePackingFluidEventType =
  | 'merge'
  | 'acquire'
  | 'split'
  | 'spinOff'
  | 'move'
  | 'relocate'
  | 'transfer'
  | 'checkpoint'
  | string;
export type CirclePackingFluidRenderMode = 'circlePacking' | 'evolutionFluid';

export interface CirclePackingDataItem {
  id?: string | number;
  name?: string;
  label?: string | number | CirclePackingItemLabelOption;
  value?: number;
  children?: CirclePackingDataItem[];
  items?: CirclePackingDataItem[];
  itemStyle?: {
    color?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
  };
  [key: string]: unknown;
}

export interface CirclePackingItemLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  lineHeight?: number;
  minRadius?: number;
  formatter?: string | ((params: CirclePackingLabelParams) => unknown);
}

export interface CirclePackingLabelParams {
  data: unknown;
  name: string;
  value: number;
  percent: number;
  depth: number;
}

export interface CirclePackingPadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface CirclePackingFocusAnimationOption {
  show?: boolean;
  enabled?: boolean;
  duration?: number;
  easing?: string;
}

export interface CirclePackingFluidEventInput {
  id?: string | number;
  time?: string | number | Date;
  type?: CirclePackingFluidEventType;
  sources?: Array<string | number>;
  source?: string | number | Array<string | number>;
  from?: string | number | Array<string | number>;
  targets?: Array<string | number>;
  target?: string | number | Array<string | number>;
  to?: string | number | Array<string | number>;
  value?: number | string;
  duration?: number;
  span?: number;
  bridge?: boolean;
  showBridge?: boolean;
  drawBridge?: boolean;
  [key: string]: unknown;
}

export interface CirclePackingFluidOption {
  enabled?: boolean;
  renderMode?: CirclePackingFluidRenderMode;
  renderer?: CirclePackingFluidRenderMode;
  currentTime?: string | number | Date | null;
  events?: CirclePackingFluidEventInput[];
  bridgeOpacity?: number;
  bridgeThreshold?: number;
  bridgeColor?: string;
  dropletStyle?: {
    bridgeOpacity?: number;
    bridgeThreshold?: number;
    bridgeColor?: string;
  };
}

export interface CirclePackingLayoutOptions {
  width?: number;
  height?: number;
  padding?: number | CirclePackingPadding;
  nodePadding?: number;
  siblingGap?: number;
  center?: [number | string, number | string];
  radius?: number | string;
  rootName?: string;
  rootVisible?: boolean;
  valueField?: string;
  nameField?: string;
  childrenField?: string;
  sort?: CirclePackingSort;
  colors?: string[];
  fluid?: CirclePackingFluidOption;
  [key: string]: unknown;
}

export interface CirclePackingLayoutOption extends CirclePackingLayoutOptions {
  data?: unknown;
  layout?: unknown;
  layoutOptions?: unknown;
}

export interface CirclePackingNode {
  id: string;
  name: string;
  value: number;
  depth: number;
  parentId: string | null;
  children: CirclePackingNode[];
  dataIndex: number;
  x: number;
  y: number;
  r: number;
  color: string;
  percent: number;
  synthetic: boolean;
  raw: unknown;
  fluidActiveTarget?: boolean;
}

export interface CirclePackingLayoutResult {
  width: number;
  height: number;
  center: {
    x: number;
    y: number;
  };
  radius: number;
  rootVisible: boolean;
  root: CirclePackingNode;
  nodes: CirclePackingNode[];
  fluid?: CirclePackingFluidLayoutState;
}

export interface CirclePackingFluidBridge {
  id: string;
  kind: 'absorb' | 'split';
  sourceId: string;
  targetId: string;
  sourceIds: string[];
  targetIds: string[];
  path: string;
  opacity: number;
  color: string;
  gradient?: CirclePackingFluidBridgeGradient;
  surfaceShape?: unknown;
  hiddenIds?: string[];
  opaqueIds?: string[];
  elevatedIds?: string[];
  renderPath?: boolean;
}

export interface CirclePackingFluidBridgeGradient {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  colorStops: Array<{ offset: number; color: string }>;
}

export interface CirclePackingFluidLayoutState {
  progress: number;
  bridges: CirclePackingFluidBridge[];
}

export function flattenCirclePackingData(data: unknown, options?: CirclePackingLayoutOptions): CirclePackingDataItem[];
export function layoutCirclePacking(data: unknown, options?: CirclePackingLayoutOptions): CirclePackingLayoutResult;
export function resolveCirclePackingLayout(option?: CirclePackingLayoutOption): CirclePackingLayoutResult;
export const __circlePackingInternals: Record<string, unknown>;

declare module 'echarts/types/dist/echarts' {
  export interface CirclePackingSeriesOption {
    mainType?: 'series';
    type?: 'circlePacking';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: CirclePackingDataItem | CirclePackingDataItem[];
    rootName?: string;
    rootVisible?: boolean;
    padding?: number | CirclePackingPadding;
    nodePadding?: number;
    siblingGap?: number;
    center?: [number | string, number | string];
    radius?: number | string;
    valueField?: string;
    nameField?: string;
    childrenField?: string;
    sort?: CirclePackingSort;
    colors?: string[];
    fluid?: CirclePackingFluidOption;

    layout?: {
      rootName?: string;
      rootVisible?: boolean;
      padding?: number | CirclePackingPadding;
      nodePadding?: number;
      siblingGap?: number;
      center?: [number | string, number | string];
      radius?: number | string;
      valueField?: string;
      nameField?: string;
      childrenField?: string;
      sort?: CirclePackingSort;
      fluid?: CirclePackingFluidOption;
    };
    layoutOptions?: CirclePackingSeriesOption['layout'];

    enterAnimation?: boolean | {
      show?: boolean;
      enabled?: boolean;
      duration?: number;
      delay?: number;
      stagger?: number;
      easing?: string;
    };
    focusAnimation?: boolean | CirclePackingFocusAnimationOption;
    itemStyle?: {
      color?: string;
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    label?: CirclePackingItemLabelOption;
    emphasis?: {
      itemStyle?: {
        shadowBlur?: number;
        shadowColor?: string;
        borderColor?: string;
        borderWidth?: number;
      };
    };
  }

  interface RegisteredSeriesOption {
    circlePacking: CirclePackingSeriesOption;
  }
}
