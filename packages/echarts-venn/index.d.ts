import 'echarts';

type VennLayoutType = 'hollow' | 'bubble';

interface VennDataItem {
  id?: string;
  name?: string;
  value?: number | number[];
  sets?: string[];
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
    formatter?: string | ((params: { name?: string; value?: number | number[]; data?: VennDataItem }) => string);
  };
}

declare module 'echarts/types/dist/echarts' {
  export interface VennSeriesOption {
    mainType?: 'series';
    type?: 'venn';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    layout?: VennLayoutType | { type?: VennLayoutType; [key: string]: unknown };
    layoutOptions?: {
      padding?: number;
      minRadius?: number;
      maxRadius?: number;
    };
    vennType?: VennLayoutType;
    mode?: VennLayoutType;
    padding?: number;
    minRadius?: number;
    maxRadius?: number;

    itemStyle?: {
      color?: string;
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    hollowStyle?: {
      color?: string;
      opacity?: number;
      borderWidth?: number;
    };
    label?: {
      show?: boolean;
      color?: string;
      fontSize?: number;
      fontWeight?: string | number;
      formatter?: string | ((params: { name?: string; value?: number | number[]; data?: VennDataItem }) => string);
    };
    emphasis?: {
      itemStyle?: {
        shadowBlur?: number;
        shadowColor?: string;
      };
    };

    data?: VennDataItem[];
  }

  interface RegisteredSeriesOption {
    venn: VennSeriesOption;
  }
}
