import 'echarts';

type RadialBoxplotField = string | number;

interface RadialBoxplotDataItem {
  id?: string | number;
  name?: string;
  category?: string | number;
  min?: number;
  q1?: number;
  median?: number;
  q3?: number;
  max?: number;
  low?: number;
  high?: number;
  value?: number;
  itemStyle?: {
    color?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
  };
  [key: string]: unknown;
}

interface RadialBoxplotAxisLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  formatter?: string | ((value: unknown) => unknown);
  rotate?: boolean | 'tangential';
}

interface RadialBoxplotSplitLineOption {
  show?: boolean;
  lineStyle?: {
    color?: string;
    width?: number;
    opacity?: number;
    type?: 'solid' | 'dashed' | 'dotted' | number[];
  };
}

interface RadialBoxplotAxisOption {
  show?: boolean;
  label?: RadialBoxplotAxisLabelOption;
  splitLine?: RadialBoxplotSplitLineOption;
}

declare module 'echarts/types/dist/echarts' {
  export interface RadialBoxplotSeriesOption {
    mainType?: 'series';
    type?: 'radialBoxplot';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: Array<RadialBoxplotDataItem | unknown[]>;
    dimensions?: string[];
    center?: [number | string, number | string];
    radius?: [number | string, number | string];
    innerRadius?: number | string;
    outerRadius?: number | string;
    padding?: number;
    startAngle?: number;
    endAngle?: number;
    angleSpan?: number;
    clockwise?: boolean;
    categoryField?: RadialBoxplotField;
    nameField?: RadialBoxplotField;
    minField?: RadialBoxplotField;
    q1Field?: RadialBoxplotField;
    medianField?: RadialBoxplotField;
    q3Field?: RadialBoxplotField;
    maxField?: RadialBoxplotField;
    categories?: Array<string | number>;
    min?: number;
    max?: number;
    tickCount?: number;
    nice?: boolean;
    boxWidth?: number;
    capWidth?: number;
    labelRadius?: number | string;

    grid?: {
      show?: boolean;
    };
    radialAxis?: RadialBoxplotAxisOption;
    angleAxis?: RadialBoxplotAxisOption;
    itemStyle?: {
      color?: string;
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    whiskerLineStyle?: {
      color?: string;
      width?: number;
      opacity?: number;
      type?: 'solid' | 'dashed' | 'dotted' | number[];
    };
    medianLineStyle?: {
      color?: string;
      width?: number;
      opacity?: number;
      type?: 'solid' | 'dashed' | 'dotted' | number[];
    };
    capLineStyle?: {
      color?: string;
      width?: number;
      opacity?: number;
      type?: 'solid' | 'dashed' | 'dotted' | number[];
    };
    emphasis?: {
      itemStyle?: {
        borderWidth?: number;
        shadowBlur?: number;
        shadowColor?: string;
      };
    };
  }

  interface RegisteredSeriesOption {
    radialBoxplot: RadialBoxplotSeriesOption;
  }
}
