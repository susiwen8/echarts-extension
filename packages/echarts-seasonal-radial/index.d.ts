import './src/seasonal-radial.js';
import 'echarts';

type SeasonalRadialField = string | number;
type SeasonalRadialRadiusOption = number | string;
type SeasonalRadialPaddingOption = number | {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

interface SeasonalRadialDataItem {
  id?: string | number;
  name?: string;
  group?: string | number;
  country?: string | number;
  region?: string | number;
  year?: string | number;
  period?: string | number;
  month?: string | number;
  monthNo?: string | number;
  value?: number;
  amount?: number;
  count?: number;
  total?: number;
  generation?: number;
  itemStyle?: SeasonalRadialItemStyleOption;
  lineStyle?: SeasonalRadialLineStyleOption;
  [key: string]: unknown;
}

interface SeasonalRadialLineStyleOption {
  color?: string;
  stroke?: string;
  width?: number;
  lineWidth?: number;
  opacity?: number;
  type?: 'solid' | 'dashed' | 'dotted' | number[];
  lineDash?: number[];
}

interface SeasonalRadialItemStyleOption {
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
}

interface SeasonalRadialLabelParams {
  data: unknown;
  name: string;
  value: unknown;
}

interface SeasonalRadialLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  formatter?: string | ((params: SeasonalRadialLabelParams) => unknown) | ((value: unknown) => unknown);
}

interface SeasonalRadialAxisLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  formatter?: string | ((value: unknown) => unknown);
}

interface SeasonalRadialAxisOption {
  show?: boolean;
  label?: SeasonalRadialAxisLabelOption;
  splitLine?: {
    show?: boolean;
    lineStyle?: SeasonalRadialLineStyleOption;
  };
}

interface SeasonalRadialEnterAnimationOption {
  show?: boolean;
  enabled?: boolean;
  duration?: number | ((item: unknown, itemIndex: number) => number);
  delay?: number | ((item: unknown, itemIndex: number) => number);
  stagger?: number | ((item: unknown, itemIndex: number) => number);
  easing?: string;
}

declare module 'echarts/types/dist/echarts' {
  export interface SeasonalRadialSeriesOption {
    mainType?: 'series';
    type?: 'seasonalRadial';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: Array<SeasonalRadialDataItem | unknown[]>;
    dimensions?: string[];
    groupField?: SeasonalRadialField;
    yearField?: SeasonalRadialField;
    monthField?: SeasonalRadialField;
    valueField?: SeasonalRadialField;
    nameField?: SeasonalRadialField;
    groups?: Array<string | number>;
    months?: Array<string | number>;
    padding?: SeasonalRadialPaddingOption;
    panelGap?: number;
    center?: [SeasonalRadialRadiusOption, SeasonalRadialRadiusOption];
    radius?: [SeasonalRadialRadiusOption, SeasonalRadialRadiusOption];
    innerRadius?: SeasonalRadialRadiusOption;
    outerRadius?: SeasonalRadialRadiusOption;
    startAngle?: number;
    clockwise?: boolean;
    closed?: boolean;
    min?: number;
    max?: number;
    tickCount?: number;
    nice?: boolean;
    highlightYear?: string | number | 'latest' | null | false;
    enterAnimation?: boolean | SeasonalRadialEnterAnimationOption;
    showSymbol?: boolean;
    highlightSymbol?: boolean;
    symbolSize?: number;

    grid?: {
      show?: boolean;
    };
    radialAxis?: SeasonalRadialAxisOption;
    angleAxis?: SeasonalRadialAxisOption;
    lineStyle?: SeasonalRadialLineStyleOption;
    historyLineStyle?: SeasonalRadialLineStyleOption;
    highlightLineStyle?: SeasonalRadialLineStyleOption;
    itemStyle?: SeasonalRadialItemStyleOption;
    groupLabel?: SeasonalRadialLabelOption;
    yearLabel?: SeasonalRadialLabelOption;
  }

  interface RegisteredSeriesOption {
    seasonalRadial: SeasonalRadialSeriesOption;
  }
}
