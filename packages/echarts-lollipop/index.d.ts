import 'echarts';

type LollipopField = string | number;
type LollipopPaddingOption = number | {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

interface LollipopDataItem {
  id?: string | number;
  name?: string;
  category?: string | number;
  value?: number;
  population?: number;
  amount?: number;
  count?: number;
  users?: number;
  itemStyle?: LollipopItemStyleOption;
  stemStyle?: LollipopLineStyleOption;
  label?: LollipopLabelOption;
  [key: string]: unknown;
}

interface LollipopLineStyleOption {
  color?: string;
  stroke?: string;
  width?: number;
  lineWidth?: number;
  opacity?: number;
  type?: 'solid' | 'dashed' | 'dotted' | number[];
}

interface LollipopItemStyleOption {
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
}

interface LollipopLabelParams {
  data: unknown;
  name: string;
  value: number;
  category: string;
}

interface LollipopLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  formatter?: string | ((params: LollipopLabelParams) => unknown);
}

interface LollipopAxisLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  rotate?: number;
  formatter?: string | ((value: unknown) => unknown);
}

interface LollipopAxisOption {
  show?: boolean;
  name?: string;
  label?: LollipopAxisLabelOption;
  splitLine?: {
    show?: boolean;
    lineStyle?: LollipopLineStyleOption;
  };
  axisLine?: {
    show?: boolean;
    lineStyle?: LollipopLineStyleOption;
  };
  nameTextStyle?: {
    color?: string;
    fontSize?: number;
    fontWeight?: string | number;
  };
}

declare module 'echarts/types/dist/echarts' {
  export interface LollipopSeriesOption {
    mainType?: 'series';
    type?: 'lollipop';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: Array<LollipopDataItem | unknown[]>;
    dimensions?: string[];
    categoryField?: LollipopField;
    valueField?: LollipopField;
    nameField?: LollipopField;
    categories?: Array<string | number>;
    padding?: LollipopPaddingOption;
    min?: number;
    max?: number;
    baseline?: number;
    tickCount?: number;
    nice?: boolean;
    large?: boolean;
    symbolSize?: number;

    grid?: {
      show?: boolean;
    };
    valueAxis?: LollipopAxisOption;
    categoryAxis?: LollipopAxisOption;
    stemStyle?: LollipopLineStyleOption;
    itemStyle?: LollipopItemStyleOption;
    label?: LollipopLabelOption;
    emphasis?: {
      itemStyle?: {
        borderWidth?: number;
        shadowBlur?: number;
        shadowColor?: string;
      };
    };
  }

  interface RegisteredSeriesOption {
    lollipop: LollipopSeriesOption;
  }
}
