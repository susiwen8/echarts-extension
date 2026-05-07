import 'echarts';

type SunriseSunsetTimeValue = string | number | Date;

interface SunriseSunsetDataItem {
  sunrise?: SunriseSunsetTimeValue;
  sunset?: SunriseSunsetTimeValue;
  moonrise?: SunriseSunsetTimeValue;
  moonset?: SunriseSunsetTimeValue;
  currentTime?: SunriseSunsetTimeValue;
  updatedAt?: SunriseSunsetTimeValue;
  title?: string;
  remainingText?: string;
  updatedText?: string;
  [key: string]: unknown;
}

interface SunriseSunsetLabelOption {
  show?: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  formatter?: string | ((params: SunriseSunsetLabelParams) => unknown);
}

interface SunriseSunsetLabelParams {
  data: unknown;
  title: string;
  remainingText: string;
  updatedText: string;
}

interface SunriseSunsetLineStyleOption {
  color?: string;
  width?: number;
  opacity?: number;
  type?: 'solid' | 'dashed' | 'dotted' | number[];
}

interface SunriseSunsetAreaStyleOption {
  color?: string;
  opacity?: number;
}

interface SunriseSunsetEnterAnimationOption {
  show?: boolean;
  enabled?: boolean;
  duration?: number | ((item: unknown, itemIndex: number) => number);
  delay?: number | ((item: unknown, itemIndex: number) => number);
  stagger?: number | ((item: unknown, itemIndex: number) => number);
  easing?: string;
}

type SunriseSunsetIconSizeOption = number | [number, number];
type SunriseSunsetIconOption = string | false | {
  path?: string;
  image?: string;
  size?: SunriseSunsetIconSizeOption;
  width?: number;
  height?: number;
  offset?: [number, number];
  offsetX?: number;
  offsetY?: number;
  style?: {
    fill?: string;
    stroke?: string;
    lineWidth?: number;
    opacity?: number;
    [key: string]: unknown;
  };
};

declare module 'echarts/types/dist/echarts' {
  export interface SunriseSunsetSeriesOption {
    mainType?: 'series';
    type?: 'sunriseSunset';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: SunriseSunsetDataItem | SunriseSunsetDataItem[];
    sunrise?: SunriseSunsetTimeValue;
    sunset?: SunriseSunsetTimeValue;
    moonrise?: SunriseSunsetTimeValue;
    moonset?: SunriseSunsetTimeValue;
    currentTime?: SunriseSunsetTimeValue;
    updatedAt?: SunriseSunsetTimeValue;
    title?: string;
    remainingText?: string;
    updatedText?: string;
    enterAnimation?: boolean | SunriseSunsetEnterAnimationOption;
    sunIcon?: SunriseSunsetIconOption;
    moonIcon?: SunriseSunsetIconOption;

    padding?: number;
    baselineY?: number;
    dayArcHeight?: number;
    moonArcHeight?: number;
    moonStartRatio?: number;
    moonEndRatio?: number;

    backgroundStyle?: {
      color?: string;
      opacity?: number;
    };
    baselineStyle?: SunriseSunsetLineStyleOption;
    dayLineStyle?: SunriseSunsetLineStyleOption;
    moonLineStyle?: SunriseSunsetLineStyleOption;
    dayAreaStyle?: SunriseSunsetAreaStyleOption;
    titleLabel?: SunriseSunsetLabelOption;
    remainingLabel?: SunriseSunsetLabelOption;
    updatedLabel?: SunriseSunsetLabelOption;
    eventLabel?: SunriseSunsetLabelOption;
  }

  interface RegisteredSeriesOption {
    sunriseSunset: SunriseSunsetSeriesOption;
  }
}
