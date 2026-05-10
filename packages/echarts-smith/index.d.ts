import 'echarts';

type SmithField = string | number;
type SmithDataType = 'impedance' | 'gamma';
type SmithPaddingOption = number | {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

interface SmithDataItem {
  id?: string | number;
  name?: string;
  r?: number;
  x?: number;
  resistance?: number;
  reactance?: number;
  gamma?: [number, number] | { real?: number; imag?: number };
  gammaReal?: number;
  gammaImag?: number;
  itemStyle?: SmithItemStyleOption;
  label?: SmithLabelOption;
  [key: string]: unknown;
}

interface SmithLineStyleOption {
  show?: boolean;
  color?: string;
  stroke?: string;
  width?: number;
  lineWidth?: number;
  opacity?: number;
  type?: 'solid' | 'dashed' | 'dotted' | number[];
}

interface SmithItemStyleOption {
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
}

interface SmithLabelParams {
  data: unknown;
  name: string;
  value: number;
  resistance: number;
  reactance: number;
  gamma: {
    real: number;
    imag: number;
    magnitude: number;
    angle: number;
  };
}

interface SmithAxisLabelParams {
  axis: 'resistance' | 'reactance';
  value: number;
  normalized: number;
  impedance: number;
  ohms: number;
  referenceImpedance: number;
}

interface SmithLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  formatter?: string | ((params: SmithLabelParams) => unknown);
}

interface SmithGridLineOption {
  show?: boolean;
  lineStyle?: SmithLineStyleOption;
}

interface SmithGridOption {
  show?: boolean;
  unitCircle?: SmithGridLineOption;
  axisLine?: SmithGridLineOption;
  resistanceLine?: SmithGridLineOption;
  reactanceLine?: SmithGridLineOption;
  label?: {
    show?: boolean;
    color?: string;
    fontSize?: number;
    formatter?: string | ((value: number, params: SmithAxisLabelParams) => unknown);
    resistanceFormatter?: string | ((value: number, params: SmithAxisLabelParams) => unknown);
    reactanceFormatter?: string | ((value: number, params: SmithAxisLabelParams) => unknown);
  };
}

interface SmithCursorTooltipOption {
  show?: boolean;
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  lineHeight?: number;
  padding?: number | [number, number] | [number, number, number, number];
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  fontFamily?: string;
}

interface SmithCursorOption {
  show?: boolean;
  lineStyle?: SmithLineStyleOption;
  circleStyle?: SmithLineStyleOption;
  curveStyle?: SmithLineStyleOption;
  tooltip?: SmithCursorTooltipOption;
}

declare module 'echarts/types/dist/echarts' {
  export interface SmithSeriesOption {
    mainType?: 'series';
    type?: 'smith';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: Array<SmithDataItem | unknown[]>;
    dataType?: SmithDataType;
    referenceImpedance?: number;
    dimensions?: string[];
    nameField?: SmithField;
    resistanceField?: SmithField;
    reactanceField?: SmithField;
    gammaField?: SmithField;
    gammaRealField?: SmithField;
    gammaImagField?: SmithField;
    resistanceValues?: number[];
    reactanceValues?: number[];
    padding?: SmithPaddingOption;
    showSwrCircle?: boolean;
    swrMagnitude?: number;
    swrIndex?: number;
    symbolSize?: number;

    grid?: SmithGridOption;
    swrStyle?: SmithLineStyleOption;
    lineStyle?: SmithLineStyleOption;
    itemStyle?: SmithItemStyleOption;
    label?: SmithLabelOption;
    cursor?: SmithCursorOption;
    emphasis?: {
      itemStyle?: {
        borderWidth?: number;
        shadowBlur?: number;
        shadowColor?: string;
      };
    };
  }

  interface RegisteredSeriesOption {
    smith: SmithSeriesOption;
  }
}
