import 'echarts';

type PackBubbleSort = boolean | 'asc' | 'desc' | 'none';

interface PackBubbleDataItem {
  id?: string | number;
  name?: string;
  value?: number | number[];
  category?: string;
  group?: string;
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
    lineHeight?: number;
    minRadius?: number;
    formatter?: string | ((params: { name?: string; value?: number | number[]; data?: PackBubbleDataItem }) => string);
  };
  [key: string]: unknown;
}

interface PackBubblePadding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

declare module 'echarts/types/dist/echarts' {
  export interface PackBubbleSeriesOption {
    mainType?: 'series';
    type?: 'packBubble';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    layout?: {
      padding?: number | PackBubblePadding;
      gap?: number;
      fast?: boolean;
      fastThreshold?: number;
      minRadius?: number;
      maxRadius?: number;
      fillRatio?: number;
      center?: [number | string, number | string];
      sort?: PackBubbleSort;
    };
    layoutOptions?: {
      padding?: number | PackBubblePadding;
      gap?: number;
      fast?: boolean;
      fastThreshold?: number;
      minRadius?: number;
      maxRadius?: number;
      fillRatio?: number;
      center?: [number | string, number | string];
      sort?: PackBubbleSort;
    };
    padding?: number | PackBubblePadding;
    gap?: number;
    minRadius?: number;
    maxRadius?: number;
    fillRatio?: number;
    center?: [number | string, number | string];
    valueField?: string;
    nameField?: string;
    categoryField?: string;
    sort?: PackBubbleSort;
    colors?: string[];

    enterAnimation?: boolean | {
      show?: boolean;
      enabled?: boolean;
      duration?: number;
      delay?: number;
      stagger?: number;
      easing?: string;
    };
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
      lineHeight?: number;
      minRadius?: number;
      formatter?: string | ((params: { name?: string; value?: number | number[]; data?: PackBubbleDataItem }) => string);
    };
    emphasis?: {
      itemStyle?: {
        shadowBlur?: number;
        shadowColor?: string;
        borderColor?: string;
        borderWidth?: number;
      };
    };

    data?: PackBubbleDataItem[];
  }

  interface RegisteredSeriesOption {
    packBubble: PackBubbleSeriesOption;
  }
}
