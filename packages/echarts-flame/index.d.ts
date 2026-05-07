import 'echarts';

type FlameOrient = 'up' | 'down';
type FlameSort = boolean | 'none' | 'value' | 'name';

interface FlameDataItem {
  id?: string | number;
  name?: string;
  value?: number;
  children?: FlameDataItem[];
  itemStyle?: {
    color?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
  };
  label?: string | number | FlameItemLabelOption;
  [key: string]: unknown;
}

interface FlameItemLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  formatter?: string | ((params: FlameLabelParams) => unknown);
}

interface FlameLabelParams {
  data: unknown;
  name: string;
  value: number;
  percent: number;
  depth: number;
}

declare module 'echarts/types/dist/echarts' {
  export interface FlameSeriesOption {
    mainType?: 'series';
    type?: 'flame';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: FlameDataItem | FlameDataItem[];
    rootName?: string;
    rootVisible?: boolean;
    orient?: FlameOrient;
    padding?: number;
    gap?: number;
    sort?: FlameSort;
    colors?: string[];

    itemStyle?: {
      color?: string;
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    label?: {
      show?: boolean;
      color?: string;
      fontSize?: number;
      fontWeight?: string | number;
      formatter?: string | ((params: FlameLabelParams) => unknown);
    };
    emphasis?: {
      itemStyle?: {
        shadowBlur?: number;
        shadowColor?: string;
      };
    };
  }

  interface RegisteredSeriesOption {
    flame: FlameSeriesOption;
  }
}
