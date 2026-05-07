import 'echarts';

type SpiralField = string | number;
type SpiralSortOption = boolean | 'none' | 'asc' | 'desc';

interface SpiralDataItem {
  id?: string | number;
  name?: string;
  value?: number;
  amount?: number;
  count?: number;
  score?: number;
  users?: number;
  total?: number;
  itemStyle?: SpiralItemStyleOption;
  label?: SpiralLabelOption;
  [key: string]: unknown;
}

interface SpiralItemStyleOption {
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  shadowBlur?: number;
  shadowColor?: string;
}

interface SpiralLabelParams {
  data: unknown;
  name: string;
  value: number;
  dataIndex: number;
}

interface SpiralLabelOption {
  show?: boolean;
  position?: 'outside' | 'inside';
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  formatter?: string | ((params: SpiralLabelParams) => unknown);
}

interface SpiralEnterAnimationOption {
  show?: boolean;
  enabled?: boolean;
  duration?: number;
  delay?: number | ((dataIndex: number) => number);
  stagger?: number;
  easing?: string;
}

declare module 'echarts/types/dist/echarts' {
  export interface SpiralSeriesOption {
    mainType?: 'series';
    type?: 'spiral';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: Array<SpiralDataItem | unknown[]>;
    dimensions?: string[];
    nameField?: SpiralField;
    valueField?: SpiralField;
    center?: [number | string, number | string];
    padding?: number;
    innerRadius?: number | string;
    outerRadius?: number | string;
    turns?: number;
    segmentsPerTurn?: number;
    startAngle?: number;
    clockwise?: boolean;
    sort?: SpiralSortOption;
    gapAngle?: number;
    radialGap?: number;
    bandWidth?: number;
    min?: number;
    max?: number;
    minOpacity?: number;
    maxOpacity?: number;
    enterAnimation?: boolean | SpiralEnterAnimationOption;

    itemStyle?: SpiralItemStyleOption;
    label?: SpiralLabelOption;
    emphasis?: {
      focus?: string;
      blurScope?: string;
      itemStyle?: SpiralItemStyleOption;
    };
  }

  interface RegisteredSeriesOption {
    spiral: SpiralSeriesOption;
  }
}
