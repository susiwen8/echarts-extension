import 'echarts';

type AlgorithmSortKind = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick' | 'heap';
type AlgorithmSortOrder = 'ascending' | 'descending';
type AlgorithmSortField = string | number;
type AlgorithmSortPaddingOption = number | {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

interface AlgorithmSortDataItem {
  id?: string | number;
  name?: string;
  value?: number;
  itemStyle?: AlgorithmSortItemStyleOption;
  label?: string | number | AlgorithmSortLabelOption;
  [key: string]: unknown;
}

interface AlgorithmSortItemStyleOption {
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
}

interface AlgorithmSortLabelParams {
  data: unknown;
  name: string;
  value: number;
  position: number;
  state: 'default' | 'compare' | 'swap' | 'write' | 'pivot' | 'sorted';
}

interface AlgorithmSortLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  formatter?: string | ((params: AlgorithmSortLabelParams) => unknown);
}

interface AlgorithmSortAxisLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  rotate?: number;
  formatter?: string | ((value: unknown) => unknown);
}

interface AlgorithmSortLineStyleOption {
  color?: string;
  stroke?: string;
  width?: number;
  lineWidth?: number;
  opacity?: number;
  type?: 'solid' | 'dashed' | 'dotted' | number[];
}

interface AlgorithmSortAxisOption {
  show?: boolean;
  label?: AlgorithmSortAxisLabelOption;
  splitLine?: {
    show?: boolean;
    lineStyle?: AlgorithmSortLineStyleOption;
  };
  axisLine?: {
    show?: boolean;
    lineStyle?: AlgorithmSortLineStyleOption;
  };
}

interface AlgorithmSortStateStyleOption {
  compare?: AlgorithmSortItemStyleOption;
  swap?: AlgorithmSortItemStyleOption;
  write?: AlgorithmSortItemStyleOption;
  pivot?: AlgorithmSortItemStyleOption;
  sorted?: AlgorithmSortItemStyleOption;
}

interface AlgorithmSortStepLabelOption {
  show?: boolean;
  color?: string;
  mutedColor?: string;
  fontSize?: number;
  fontWeight?: string | number;
}

declare module 'echarts/types/dist/echarts' {
  export interface AlgorithmSortSeriesOption {
    mainType?: 'series';
    type?: 'algorithmSort';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: Array<AlgorithmSortDataItem | number | unknown[]>;
    values?: Array<number | AlgorithmSortDataItem | unknown[]>;
    dimensions?: string[];
    valueField?: AlgorithmSortField;
    nameField?: AlgorithmSortField;
    algorithm?: AlgorithmSortKind;
    order?: AlgorithmSortOrder;
    currentStep?: number;
    progress?: number;
    maxItems?: number;
    maxFrames?: number;
    padding?: AlgorithmSortPaddingOption;
    min?: number;
    max?: number;
    nice?: boolean;
    tickCount?: number;
    barWidth?: number;

    grid?: {
      show?: boolean;
    };
    valueAxis?: AlgorithmSortAxisOption;
    categoryAxis?: AlgorithmSortAxisOption;
    itemStyle?: AlgorithmSortItemStyleOption;
    stateStyle?: AlgorithmSortStateStyleOption;
    rangeStyle?: {
      color?: string;
      opacity?: number;
    };
    label?: AlgorithmSortLabelOption;
    stepLabel?: AlgorithmSortStepLabelOption;
    emphasis?: {
      itemStyle?: AlgorithmSortItemStyleOption;
    };
  }

  interface RegisteredSeriesOption {
    algorithmSort: AlgorithmSortSeriesOption;
  }
}
