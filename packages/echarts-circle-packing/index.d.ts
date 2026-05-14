import 'echarts';

type CirclePackingSort = boolean | 'none' | 'value' | 'name' | 'asc' | 'desc';

interface CirclePackingDataItem {
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

interface CirclePackingItemLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  lineHeight?: number;
  minRadius?: number;
  formatter?: string | ((params: CirclePackingLabelParams) => unknown);
}

interface CirclePackingLabelParams {
  data: unknown;
  name: string;
  value: number;
  percent: number;
  depth: number;
}

interface CirclePackingPadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

interface CirclePackingFocusAnimationOption {
  show?: boolean;
  enabled?: boolean;
  duration?: number;
  easing?: string;
}

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
