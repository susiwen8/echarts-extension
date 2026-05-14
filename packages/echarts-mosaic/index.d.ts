import 'echarts';

type MosaicSort = boolean | 'none' | 'value' | 'name';
type MosaicField = string | number;

interface MosaicDataItem {
  id?: string | number;
  name?: string;
  value?: number;
  x?: string | number;
  y?: string | number;
  category?: string | number;
  segment?: string | number;
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
    formatter?: string | ((params: MosaicLabelParams) => unknown);
  };
  [key: string]: unknown;
}

interface MosaicLabelParams {
  data: unknown;
  name: string;
  value: number;
  percent: number;
  columnPercent: number;
  xCategory: string;
  yCategory: string;
}

declare module 'echarts/types/dist/echarts' {
  export interface MosaicSeriesOption {
    mainType?: 'series';
    type?: 'mosaic';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: Array<MosaicDataItem | unknown[]>;
    dimensions?: string[];
    xField?: MosaicField;
    yField?: MosaicField;
    valueField?: MosaicField;
    xCategories?: Array<string | number>;
    yCategories?: Array<string | number>;
    padding?: number;
    gap?: number;
    sort?: MosaicSort;
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
      lineHeight?: number;
      formatter?: string | ((params: MosaicLabelParams) => unknown);
    };
    tooltip?: {
      trigger?: 'item';
      formatter?: string | ((params: unknown) => unknown);
      valueFormatter?: (value: unknown) => string;
    };
    emphasis?: {
      itemStyle?: {
        shadowBlur?: number;
        shadowColor?: string;
      };
    };
  }

  interface RegisteredSeriesOption {
    mosaic: MosaicSeriesOption;
  }
}
