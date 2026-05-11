import 'echarts';

type CauseEffectPaddingOption = number | {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

interface CauseEffectLineStyleOption {
  color?: string;
  stroke?: string;
  width?: number;
  lineWidth?: number;
  opacity?: number;
  type?: 'solid' | 'dashed' | 'dotted' | number[] | string;
  dashOffset?: number;
  lineDashOffset?: number;
}

interface CauseEffectBoxStyleOption {
  color?: string;
  fill?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
}

interface CauseEffectLabelParams {
  id: string;
  name: string;
  kind: 'effect' | 'category' | 'cause';
  dataIndex: number;
  data: unknown;
  side?: 'top' | 'bottom';
  depth?: number;
}

interface CauseEffectLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  formatter?: string | ((params: CauseEffectLabelParams) => unknown);
}

interface CauseEffectCauseItem {
  id?: string | number;
  name?: string;
  label?: string;
  text?: string;
  value?: unknown;
  children?: CauseEffectCauseInput[];
  causes?: CauseEffectCauseInput[];
  items?: CauseEffectCauseInput[];
  itemStyle?: CauseEffectBoxStyleOption;
  lineStyle?: CauseEffectLineStyleOption;
  labelStyle?: CauseEffectLabelOption;
  label?: CauseEffectLabelOption | string;
  [key: string]: unknown;
}

type CauseEffectCauseRow = [name: string | number, ...children: CauseEffectCauseInput[]];
type CauseEffectCauseInput = CauseEffectCauseItem | CauseEffectCauseRow | string | number;

interface CauseEffectCategoryItem {
  id?: string | number;
  name?: string;
  category?: string | number;
  label?: string;
  text?: string;
  causes?: CauseEffectCauseInput[];
  items?: CauseEffectCauseInput[];
  children?: CauseEffectCauseInput[];
  itemStyle?: CauseEffectBoxStyleOption;
  lineStyle?: CauseEffectLineStyleOption;
  labelStyle?: CauseEffectLabelOption;
  [key: string]: unknown;
}

type CauseEffectCategoryRow = [category: string | number, ...causes: CauseEffectCauseInput[]];
type CauseEffectCategoryInput = CauseEffectCategoryItem | CauseEffectCategoryRow | string | number;

declare module 'echarts/types/dist/echarts' {
  export interface CauseEffectSeriesOption {
    mainType?: 'series';
    type?: 'causeEffect';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    effect?: string | number | CauseEffectCauseItem;
    problem?: string | number | CauseEffectCauseItem;
    outcome?: string | number | CauseEffectCauseItem;
    categories?: CauseEffectCategoryInput[];
    causes?: CauseEffectCategoryInput[];
    data?: CauseEffectCategoryInput[];

    padding?: CauseEffectPaddingOption;
    effectWidth?: number;
    effectHeight?: number;
    effectGap?: number;
    categoryGap?: number;
    categoryLength?: number;
    categoryAngle?: number;
    causeGap?: number;
    causeLength?: number;
    maxCauseDepth?: number;
    spineArrowSize?: number;

    lineStyle?: CauseEffectLineStyleOption;
    categoryLineStyle?: CauseEffectLineStyleOption;
    causeLineStyle?: CauseEffectLineStyleOption;
    effectStyle?: CauseEffectBoxStyleOption;
    label?: CauseEffectLabelOption;
    effectLabel?: CauseEffectLabelOption;
    categoryLabel?: CauseEffectLabelOption;
    causeLabel?: CauseEffectLabelOption;
    emphasis?: {
      itemStyle?: {
        opacity?: number;
        shadowBlur?: number;
        shadowColor?: string;
      };
    };
  }

  interface RegisteredSeriesOption {
    causeEffect: CauseEffectSeriesOption;
  }
}
