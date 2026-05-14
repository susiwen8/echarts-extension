import 'echarts';

type RadialAreaAngleType = 'category' | 'time' | 'value';
type RadialAreaField = string | number;

interface RadialAreaDataItem {
  id?: string | number;
  name?: string;
  value?: number;
  min?: number;
  max?: number;
  low?: number;
  high?: number;
  time?: string | number | Date;
  date?: string | number | Date;
  category?: string | number;
  itemStyle?: {
    color?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
  };
  [key: string]: unknown;
}

interface RadialAreaAxisLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  formatter?: string | ((value: unknown) => unknown);
}

interface RadialAreaSplitLineOption {
  show?: boolean;
  lineStyle?: {
    color?: string;
    width?: number;
    opacity?: number;
    type?: 'solid' | 'dashed' | 'dotted' | number[];
  };
}

interface RadialAreaAxisOption {
  show?: boolean;
  label?: RadialAreaAxisLabelOption;
  splitLine?: RadialAreaSplitLineOption;
}

interface RadialAreaHoverIndicatorOption {
  show?: boolean;
  triggerWidth?: number;
  lineStyle?: {
    color?: string;
    width?: number;
    opacity?: number;
    type?: 'solid' | 'dashed' | 'dotted' | number[];
  };
}

declare module 'echarts/types/dist/echarts' {
  export interface RadialAreaSeriesOption {
    mainType?: 'series';
    type?: 'radialArea';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: Array<RadialAreaDataItem | unknown[]>;
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
    closed?: boolean;
    angleType?: RadialAreaAngleType;
    angleField?: RadialAreaField;
    valueField?: RadialAreaField;
    minField?: RadialAreaField;
    maxField?: RadialAreaField;
    nameField?: RadialAreaField;
    categories?: Array<string | number>;
    min?: number;
    max?: number;
    tickCount?: number;
    nice?: boolean;

    grid?: {
      show?: boolean;
    };
    radialAxis?: RadialAreaAxisOption;
    angleAxis?: RadialAreaAxisOption;
    rangeAreaStyle?: {
      show?: boolean;
      color?: string;
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    areaStyle?: {
      show?: boolean;
      color?: string;
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    lineStyle?: {
      color?: string;
      width?: number;
      opacity?: number;
      type?: 'solid' | 'dashed' | 'dotted' | number[];
    };
    itemStyle?: {
      color?: string;
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    showSymbol?: boolean;
    symbolSize?: number;
    hoverIndicator?: RadialAreaHoverIndicatorOption;
    emphasis?: {
      itemStyle?: {
        borderWidth?: number;
        shadowBlur?: number;
        shadowColor?: string;
      };
    };
  }

  interface RegisteredSeriesOption {
    radialArea: RadialAreaSeriesOption;
  }
}
