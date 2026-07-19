import 'echarts';

type ShortestPathAlgorithmKind = 'dijkstra' | 'bfs' | 'a-star' | 'bellman-ford';
type ShortestPathPaddingOption = number | {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

interface ShortestPathNodeDataItem {
  id?: string | number;
  name?: string;
  label?: string | number;
  x?: number;
  y?: number;
  value?: number;
  itemStyle?: ShortestPathItemStyleOption;
  [key: string]: unknown;
}

interface ShortestPathEdgeDataItem {
  id?: string | number;
  source?: string | number;
  target?: string | number;
  from?: string | number;
  to?: string | number;
  weight?: number;
  value?: number;
  directed?: boolean;
  lineStyle?: ShortestPathLineStyleOption;
  [key: string]: unknown;
}

interface ShortestPathItemStyleOption {
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
}

interface ShortestPathLineStyleOption {
  color?: string;
  stroke?: string;
  width?: number;
  lineWidth?: number;
  opacity?: number;
  type?: 'solid' | 'dashed' | 'dotted' | number[];
}

interface ShortestPathLabelParams {
  data: unknown;
  name: string;
  value: number;
  distance: number;
  state: 'default' | 'start' | 'target' | 'frontier' | 'visited' | 'current' | 'path';
}

interface ShortestPathLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  formatter?: string | ((params: ShortestPathLabelParams) => unknown);
}

interface ShortestPathTextOption {
  show?: boolean;
  color?: string;
  mutedColor?: string;
  fontSize?: number;
  fontWeight?: string | number;
}

interface ShortestPathStateStyleOption {
  start?: ShortestPathItemStyleOption;
  target?: ShortestPathItemStyleOption;
  frontier?: ShortestPathItemStyleOption;
  visited?: ShortestPathItemStyleOption;
  current?: ShortestPathItemStyleOption;
  path?: ShortestPathItemStyleOption;
  activeEdge?: ShortestPathItemStyleOption;
  relaxedEdge?: ShortestPathItemStyleOption;
  pathEdge?: ShortestPathItemStyleOption;
}

declare module 'echarts/types/dist/echarts' {
  export interface AlgorithmShortestPathSeriesOption {
    mainType?: 'series';
    type?: 'algorithmShortestPath';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: ShortestPathNodeDataItem[];
    nodes?: ShortestPathNodeDataItem[];
    edges?: ShortestPathEdgeDataItem[];
    links?: ShortestPathEdgeDataItem[];
    algorithm?: ShortestPathAlgorithmKind;
    start?: string | number;
    target?: string | number;
    currentStep?: number;
    progress?: number;
    maxNodes?: number;
    maxEdges?: number;
    maxFrames?: number;
    padding?: ShortestPathPaddingOption;
    nodeRadius?: number;
    edgeWidth?: number;
    directed?: boolean;

    edgeStyle?: ShortestPathLineStyleOption;
    nodeStyle?: ShortestPathItemStyleOption;
    stateStyle?: ShortestPathStateStyleOption;
    edgeLabel?: ShortestPathTextOption;
    label?: ShortestPathLabelOption;
    distanceLabel?: ShortestPathTextOption;
    stepLabel?: ShortestPathTextOption;
    emphasis?: {
      itemStyle?: ShortestPathItemStyleOption;
    };
  }

  interface RegisteredSeriesOption {
    algorithmShortestPath: AlgorithmShortestPathSeriesOption;
  }
}
