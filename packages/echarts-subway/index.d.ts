import 'echarts';

type SubwayLabelPosition = 'top' | 'bottom' | 'left' | 'right';

interface SubwayStationItem {
  id?: string | number;
  name?: string;
  coord?: [number, number] | number[];
  value?: [number, number] | unknown;
  x?: number;
  y?: number;
  labelPosition?: SubwayLabelPosition;
  interchange?: boolean;
  itemStyle?: {
    color?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
  };
  label?: {
    show?: boolean;
    color?: string;
    fontSize?: number;
    fontWeight?: string | number;
    formatter?: string | ((params: SubwayStationLabelParams) => unknown);
  };
  [key: string]: unknown;
}

type SubwayStationRow =
  | [id: string | number, name: string, x: number, y: number, labelPosition?: SubwayLabelPosition, interchange?: boolean]
  | [x: number, y: number, name?: string, id?: string | number, labelPosition?: SubwayLabelPosition, interchange?: boolean];

type SubwayWaypoint =
  | [x: number, y: number]
  | [stationId: string | number, x: number, y: number]
  | {
      id?: string | number;
      stationId?: string | number;
      coord?: [number, number] | number[];
      x?: number;
      y?: number;
    };

interface SubwayRouteItem {
  id?: string | number;
  name?: string;
  color?: string;
  stations?: Array<SubwayStationItem | SubwayStationRow>;
  waypoints?: SubwayWaypoint[];
  cornerRadius?: number;
  lineStyle?: {
    color?: string;
    width?: number;
    opacity?: number;
    cornerRadius?: number;
    cap?: 'round' | 'butt' | 'square';
    join?: 'round' | 'bevel' | 'miter';
  };
  label?: Record<string, unknown>;
  [key: string]: unknown;
}

interface SubwayStationLabelParams {
  data: unknown;
  name: string;
  lines: string[];
  interchange: boolean;
}

interface SubwayRouteLabelParams {
  data: unknown;
  name: string;
  color: string;
}

declare module 'echarts/types/dist/echarts' {
  export interface SubwaySeriesOption {
    mainType?: 'series';
    type?: 'subway';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: SubwayRouteItem[];
    routes?: SubwayRouteItem[];
    padding?: number;
    stationRadius?: number;
    interchangeRadius?: number;
    lineWidth?: number;
    cornerRadius?: number;
    preserveAspectRatio?: boolean;
    colors?: string[];

    lineStyle?: {
      width?: number;
      opacity?: number;
      cornerRadius?: number;
      cap?: 'round' | 'butt' | 'square';
      join?: 'round' | 'bevel' | 'miter';
    };
    stationStyle?: {
      color?: string;
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    interchangeStyle?: {
      color?: string;
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
    };
    label?: {
      show?: boolean;
      color?: string;
      fontSize?: number;
      fontWeight?: string | number;
      formatter?: string | ((params: SubwayStationLabelParams) => unknown);
    };
    routeLabel?: {
      show?: boolean;
      position?: 'start' | 'end';
      color?: string;
      fontSize?: number;
      fontWeight?: string | number;
      formatter?: string | ((params: SubwayRouteLabelParams) => unknown);
    };
    emphasis?: {
      itemStyle?: {
        shadowBlur?: number;
        shadowColor?: string;
      };
    };
  }

  interface RegisteredSeriesOption {
    subway: SubwaySeriesOption;
  }
}
