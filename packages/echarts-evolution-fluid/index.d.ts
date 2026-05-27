import 'echarts';

type EvolutionFluidEventType = 'found' | 'acquire' | 'merge' | 'split' | 'spinOff' | 'rename' | 'close' | string;

interface EvolutionFluidEntityLabelParams {
  data: unknown;
  name: string;
  value: number;
  entity: unknown;
}

interface EvolutionFluidEntityItem {
  id?: string | number;
  name?: string | number;
  value?: number | string;
  industry?: string | number;
  category?: string | number;
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
    formatter?: string | ((params: EvolutionFluidEntityLabelParams) => unknown);
  };
  [key: string]: unknown;
}

interface EvolutionFluidEventItem {
  id?: string | number;
  time?: string | number | Date;
  type?: EvolutionFluidEventType;
  sources?: Array<string | number>;
  targets?: Array<string | number>;
  value?: number | string;
  [key: string]: unknown;
}

export interface EvolutionFluidSimulationOption {
  enabled?: boolean;
  mode?: 'implicit' | 'physical';
  quality?: 'fast' | 'balanced' | 'smooth';
  substeps?: number;
  surfaceThreshold?: number;
  stickDistance?: number;
  breakDistance?: number;
  damping?: number;
  surfaceTension?: number;
  areaConservation?: boolean;
}

declare module 'echarts/types/dist/echarts' {
  export interface EvolutionFluidSeriesOption {
    mainType?: 'series';
    type?: 'evolutionFluid';
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    entities?: EvolutionFluidEntityItem[];
    data?: EvolutionFluidEntityItem[];
    events?: EvolutionFluidEventItem[];
    timeField?: string;
    entityIdField?: string;
    valueField?: string;
    categoryField?: string;
    currentTime?: string | number | Date | null;
    autoplay?: boolean;
    playSpeed?: number;
    fluidSimulation?: EvolutionFluidSimulationOption;
    layout?: {
      clustering?: 'category' | 'none' | string;
      center?: [number | string, number | string];
      categoryGap?: number;
      collisionPadding?: number;
    };
    dropletStyle?: {
      minRadius?: number;
      maxRadius?: number;
      opacity?: number;
      bridgeOpacity?: number;
      bridgeThreshold?: number;
      bridgeColor?: string;
      color?: string;
      mode?: 'surface' | string;
    };
    surface?: {
      enabled?: boolean;
      seed?: number;
      bridgeLength?: number;
      color?: string;
      opacity?: number;
      activeStart?: { x?: number; y?: number; r?: number; radius?: number };
      targets?: Array<{ x?: number; y?: number; r?: number; radius?: number }>;
    };
    timeline?: {
      show?: boolean;
      bottom?: number;
      height?: number;
    };
    label?: {
      show?: boolean;
      color?: string;
      fontSize?: number;
      fontWeight?: string | number;
      formatter?: string | ((params: EvolutionFluidEntityLabelParams) => unknown);
    };
    bookmark?: {
      show?: boolean;
      data?: Array<{ time: string | number | Date; name?: string }>;
    };
    emphasis?: {
      itemStyle?: {
        shadowBlur?: number;
        shadowColor?: string;
        borderColor?: string;
        borderWidth?: number;
      };
    };
  }

  interface RegisteredSeriesOption {
    evolutionFluid: EvolutionFluidSeriesOption;
  }
}
