import 'echarts';

type VoronoiTreemapSort = boolean | 'none' | 'value' | 'name';
type VoronoiTreemapField = string | number;

interface VoronoiTreemapDataItem {
  id?: string | number;
  name?: string;
  label?: string | number | {
    show?: boolean;
    showInternal?: boolean;
    color?: string;
    fontSize?: number;
    fontWeight?: string | number;
    lineHeight?: number;
    minArea?: number;
    formatter?: string | ((params: VoronoiTreemapLabelParams) => unknown);
  };
  value?: number;
  children?: VoronoiTreemapDataItem[];
  itemStyle?: {
    color?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
  };
  [key: string]: unknown;
}

interface VoronoiTreemapLabelParams {
  data: unknown;
  name: string;
  value: number;
  percent: number;
  depth: number;
  isLeaf: boolean;
  parentId: string | null;
}

declare module 'echarts/types/dist/echarts' {
  export interface VoronoiTreemapSeriesOption {
    mainType?: 'series';
    type?: 'voronoiTreemap';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: VoronoiTreemapDataItem | VoronoiTreemapDataItem[] | unknown[];
    dimensions?: string[];
    nameField?: VoronoiTreemapField;
    valueField?: VoronoiTreemapField;
    childrenField?: string;
    padding?: number;
    gap?: number;
    rootName?: string;
    rootVisible?: boolean;
    sort?: VoronoiTreemapSort;
    maxIteration?: number;
    colors?: string[];

    itemStyle?: {
      color?: string;
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    label?: {
      show?: boolean;
      showInternal?: boolean;
      color?: string;
      fontSize?: number;
      fontWeight?: string | number;
      lineHeight?: number;
      minArea?: number;
      formatter?: string | ((params: VoronoiTreemapLabelParams) => unknown);
    };
    emphasis?: {
      itemStyle?: {
        shadowBlur?: number;
        shadowColor?: string;
      };
    };
  }

  interface RegisteredSeriesOption {
    voronoiTreemap: VoronoiTreemapSeriesOption;
  }
}
