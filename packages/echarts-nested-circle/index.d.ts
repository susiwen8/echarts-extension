import 'echarts';

interface NestedCircleChildItem {
  id?: string | number;
  name?: string;
  label?: string | {
    color?: string;
    fontSize?: number;
    fontWeight?: number | string;
    lineHeight?: number;
    formatter?: string | ((params: { name: string; value: unknown; data: unknown }) => unknown);
  };
  value?: number | string;
}

interface NestedCircleDataItem {
  id?: string | number;
  name?: string;
  label?: string;
  value?: number | string;
  children?: Array<NestedCircleChildItem | string | number>;
  items?: Array<NestedCircleChildItem | string | number>;
  itemStyle?: {
    color?: string;
    borderColor?: string;
    borderWidth?: number;
    opacity?: number;
  };
  titleLabel?: {
    show?: boolean;
    color?: string;
    fontSize?: number;
    fontWeight?: number | string;
    lineHeight?: number;
    formatter?: string | ((params: { name: string; value: unknown; data: unknown }) => unknown);
  };
}

declare module 'echarts/types/dist/echarts' {
  export interface NestedCircleSeriesOption {
    mainType?: 'series';
    type?: 'nestedCircle';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: NestedCircleDataItem[];
    padding?: number;
    center?: [number | string, number | string];
    radius?: number | string;
    centerRadiusRatio?: number;
    labelRadiusRatio?: number;
    titleRadiusRatio?: number;
    minRingThickness?: number;
    colors?: string[];
    ringStyle?: {
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    itemStyle?: {
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    titleLabel?: {
      show?: boolean;
      color?: string;
      fontSize?: number;
      fontWeight?: number | string;
      lineHeight?: number;
      formatter?: string | ((params: { name: string; value: unknown; data: unknown }) => unknown);
    };
    label?: {
      show?: boolean;
      color?: string;
      fontSize?: number;
      fontWeight?: number | string;
      lineHeight?: number;
      formatter?: string | ((params: { name: string; value: unknown; data: unknown }) => unknown);
    };
  }

  interface RegisteredSeriesOption {
    nestedCircle: NestedCircleSeriesOption;
  }
}
