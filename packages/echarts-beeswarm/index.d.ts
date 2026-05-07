import 'echarts';

type BeeswarmOrient = 'horizontal' | 'vertical';
type BeeswarmField = string | number;
type BeeswarmPaddingOption = number | {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

interface BeeswarmDataItem {
  id?: string | number;
  name?: string;
  category?: string | number;
  group?: string | number;
  value?: number;
  score?: number;
  amount?: number;
  count?: number;
  itemStyle?: BeeswarmItemStyleOption;
  label?: BeeswarmLabelOption;
  [key: string]: unknown;
}

interface BeeswarmItemStyleOption {
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  shadowBlur?: number;
  shadowColor?: string;
}

interface BeeswarmLabelParams {
  data: unknown;
  name: string;
  value: number;
  category: string;
}

interface BeeswarmLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  formatter?: string | ((params: BeeswarmLabelParams) => unknown);
}

interface BeeswarmAxisLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  rotate?: number;
  formatter?: string | ((value: unknown) => unknown);
}

interface BeeswarmLineStyleOption {
  color?: string;
  stroke?: string;
  width?: number;
  lineWidth?: number;
  opacity?: number;
  type?: 'solid' | 'dashed' | 'dotted' | number[];
}

interface BeeswarmAxisOption {
  show?: boolean;
  name?: string;
  label?: BeeswarmAxisLabelOption;
  splitLine?: {
    show?: boolean;
    lineStyle?: BeeswarmLineStyleOption;
  };
  axisLine?: {
    show?: boolean;
    lineStyle?: BeeswarmLineStyleOption;
  };
  nameTextStyle?: {
    color?: string;
    fontSize?: number;
    fontWeight?: string | number;
  };
}

declare module 'echarts/types/dist/echarts' {
  export interface BeeswarmSeriesOption {
    mainType?: 'series';
    type?: 'beeswarm';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: Array<BeeswarmDataItem | unknown[]>;
    dimensions?: string[];
    categoryField?: BeeswarmField;
    valueField?: BeeswarmField;
    nameField?: BeeswarmField;
    categories?: Array<string | number>;
    orient?: BeeswarmOrient;
    padding?: BeeswarmPaddingOption;
    min?: number;
    max?: number;
    tickCount?: number;
    nice?: boolean;
    symbolSize?: number;
    collisionPadding?: number;
    swarmRadius?: number;

    grid?: {
      show?: boolean;
    };
    valueAxis?: BeeswarmAxisOption;
    categoryAxis?: BeeswarmAxisOption;
    itemStyle?: BeeswarmItemStyleOption;
    label?: BeeswarmLabelOption;
    emphasis?: {
      itemStyle?: BeeswarmItemStyleOption;
    };
  }

  interface RegisteredSeriesOption {
    beeswarm: BeeswarmSeriesOption;
  }
}
