import 'echarts';

type OrganizationChartOrient = 'TB' | 'BT' | 'LR' | 'RL' | 'vertical' | 'horizontal';
type OrganizationChartPaddingOption = number | {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

interface OrganizationChartDataItem {
  id?: string | number;
  parentId?: string | number | null;
  parent?: string | number | null;
  managerId?: string | number | null;
  name?: string | number;
  label?: string | number | OrganizationChartLabelOption;
  children?: OrganizationChartDataItem[];
  itemStyle?: OrganizationChartItemStyleOption;
  labelStyle?: OrganizationChartTextStyleOption;
  [key: string]: unknown;
}

interface OrganizationChartLinkItem {
  source?: string | number;
  target?: string | number;
  from?: string | number;
  to?: string | number;
  [key: string]: unknown;
}

interface OrganizationChartItemStyleOption {
  color?: string;
  opacity?: number;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadowBlur?: number;
  shadowColor?: string;
}

interface OrganizationChartLineStyleOption {
  color?: string;
  stroke?: string;
  width?: number;
  lineWidth?: number;
  opacity?: number;
  type?: 'solid' | 'dashed' | 'dotted' | number[] | string;
  dashOffset?: number;
  lineDashOffset?: number;
}

interface OrganizationChartTextStyleOption {
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
}

interface OrganizationChartLabelParams {
  data: unknown;
  name: string;
  id: string;
  depth: number;
  childrenCount: number;
}

interface OrganizationChartLabelOption extends OrganizationChartTextStyleOption {
  show?: boolean;
  formatter?: string | ((params: OrganizationChartLabelParams) => unknown);
}

declare module 'echarts/types/dist/echarts' {
  export interface OrganizationChartSeriesOption {
    mainType?: 'series';
    type?: 'organizationChart';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    data?: OrganizationChartDataItem | OrganizationChartDataItem[];
    nodes?: OrganizationChartDataItem[];
    links?: OrganizationChartLinkItem[];
    edges?: OrganizationChartLinkItem[];
    orient?: OrganizationChartOrient;
    padding?: OrganizationChartPaddingOption;
    nodeWidth?: number;
    nodeHeight?: number;
    levelGap?: number;
    siblingGap?: number;
    subtreeGap?: number;
    idField?: string | number;
    parentIdField?: string | number;
    nameField?: string | number;
    childrenField?: string | number;

    itemStyle?: OrganizationChartItemStyleOption;
    lineStyle?: OrganizationChartLineStyleOption;
    label?: OrganizationChartLabelOption;
    emphasis?: {
      itemStyle?: OrganizationChartItemStyleOption;
    };
  }

  interface RegisteredSeriesOption {
    organizationChart: OrganizationChartSeriesOption;
  }
}
