import 'echarts';

type ErrorChartVariant = 'column' | 'bar' | 'line' | 'scatter' | 'marker' | 'dot' | 'point';
type ErrorChartField = string | number;
type ErrorChartPaddingOption = number | {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

interface ErrorChartDataItem {
  id?: string | number;
  name?: string;
  category?: string | number;
  value?: number;
  low?: number;
  high?: number;
  lower?: number;
  upper?: number;
  lowerError?: number;
  upperError?: number;
  x?: number;
  y?: number;
  xLow?: number;
  xHigh?: number;
  yLow?: number;
  yHigh?: number;
  xMinus?: number;
  xPlus?: number;
  yMinus?: number;
  yPlus?: number;
  itemStyle?: ErrorChartItemStyleOption;
  errorBarStyle?: ErrorChartLineStyleOption;
  label?: ErrorChartLabelOption;
  [key: string]: unknown;
}

interface ErrorChartLineStyleOption {
  color?: string;
  stroke?: string;
  width?: number;
  lineWidth?: number;
  opacity?: number;
  type?: 'solid' | 'dashed' | 'dotted' | number[];
}

interface ErrorChartItemStyleOption {
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
}

interface ErrorChartLabelParams {
  data: unknown;
  name: string;
  value: number;
  category: string;
  lower: number;
  upper: number;
  x: number;
}

interface ErrorChartLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  formatter?: string | ((params: ErrorChartLabelParams) => unknown);
}

interface ErrorChartAxisLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  rotate?: number;
  formatter?: string | ((value: unknown) => unknown);
}

interface ErrorChartAxisOption {
  show?: boolean;
  name?: string;
  label?: ErrorChartAxisLabelOption;
  splitLine?: {
    show?: boolean;
    lineStyle?: ErrorChartLineStyleOption;
  };
  axisLine?: {
    show?: boolean;
    lineStyle?: ErrorChartLineStyleOption;
  };
  nameTextStyle?: {
    color?: string;
    fontSize?: number;
    fontWeight?: string | number;
  };
}

declare module 'echarts/types/dist/echarts' {
  export interface ErrorChartSeriesOption {
    mainType?: 'series';
    type?: 'errorChart';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: Array<ErrorChartDataItem | unknown[]>;
    variant?: ErrorChartVariant;
    orient?: 'vertical' | 'horizontal' | 'cartesian';
    orientation?: 'vertical' | 'horizontal' | 'cartesian';
    dimensions?: string[];
    categoryField?: ErrorChartField;
    valueField?: ErrorChartField;
    lowField?: ErrorChartField;
    highField?: ErrorChartField;
    lowerErrorField?: ErrorChartField;
    upperErrorField?: ErrorChartField;
    xField?: ErrorChartField;
    yField?: ErrorChartField;
    xLowField?: ErrorChartField;
    xHighField?: ErrorChartField;
    xMinusField?: ErrorChartField;
    xPlusField?: ErrorChartField;
    yLowField?: ErrorChartField;
    yHighField?: ErrorChartField;
    yMinusField?: ErrorChartField;
    yPlusField?: ErrorChartField;
    nameField?: ErrorChartField;
    categories?: Array<string | number>;
    padding?: ErrorChartPaddingOption;
    min?: number;
    max?: number;
    xMin?: number;
    xMax?: number;
    baseline?: number;
    tickCount?: number;
    nice?: boolean;
    barWidth?: number;
    capWidth?: number;
    symbolSize?: number;

    grid?: {
      show?: boolean;
    };
    valueAxis?: ErrorChartAxisOption;
    xAxis?: ErrorChartAxisOption;
    categoryAxis?: ErrorChartAxisOption;
    lineStyle?: ErrorChartLineStyleOption;
    errorBarStyle?: ErrorChartLineStyleOption;
    itemStyle?: ErrorChartItemStyleOption;
    label?: ErrorChartLabelOption;
    emphasis?: {
      itemStyle?: {
        borderWidth?: number;
        shadowBlur?: number;
        shadowColor?: string;
      };
    };
  }

  interface RegisteredSeriesOption {
    errorChart: ErrorChartSeriesOption;
  }
}
