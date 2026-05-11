import 'echarts';

type FractalType = 'mandelbrot' | 'julia' | 'burningShip';
type FractalPoint = [number, number];
type FractalColorStop = [number, string] | {
  offset?: number;
  color?: string;
};

interface FractalViewportOption {
  center?: FractalPoint;
  viewWidth?: number;
  scale?: number;
  zoom?: number;
}

declare module 'echarts/types/dist/echarts' {
  export interface FractalSeriesOption {
    mainType?: 'series';
    type?: 'fractal';
    name?: string;
    silent?: boolean;

    width?: number | string;
    height?: number | string;
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;

    fractalType?: FractalType;
    viewport?: FractalViewportOption;
    center?: FractalPoint;
    viewWidth?: number;
    scale?: number;
    zoom?: number;
    roam?: boolean;
    minZoom?: number;
    maxZoom?: number | null;
    zoomStep?: number;

    pixelRatio?: number | null;
    maxPixelCount?: number;
    fallbackMaxCells?: number;
    interactivePixelRatio?: number;
    interactiveMaxPixelCount?: number;
    interactiveIterationScale?: number;
    minInteractiveIterations?: number;
    refineDelay?: number;
    worker?: boolean;
    workerUrl?: string;
    baseIterations?: number;
    iterationBoost?: number;
    iterationLimit?: number;
    maxIterations?: number | null;
    escapeRadius?: number;
    juliaConstant?: FractalPoint;

    insideColor?: string;
    backgroundColor?: string;
    colorStops?: FractalColorStop[];
    tooltip?: {
      trigger?: string;
    };
  }

  interface RegisteredSeriesOption {
    fractal: FractalSeriesOption;
  }
}
