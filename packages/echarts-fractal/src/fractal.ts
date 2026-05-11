import * as echarts from 'echarts/lib/echarts';

import {
  applyFractalRenderProfile,
  buildFractalRaster,
  panFractalViewport,
  resolveFractalViewportImageTransform,
  resolveFractalRenderPlan,
  zoomFractalViewport
} from './layout.js';
import type {
  FractalRaster,
  FractalRenderOption,
  FractalRenderPlan,
  ResolvedFractalViewport
} from './layout.js';

interface ViewRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EChartsApi {
  getWidth(): number;
  getHeight(): number;
  getDevicePixelRatio?(): number;
  getZr?(): FractalZRender | null | undefined;
}

interface EChartsModel {
  get(path: string | string[]): unknown;
}

interface SeriesData {
  initData(source: unknown[]): void;
  count(): number;
  setItemLayout(dataIndex: number, layout: [number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface FractalSeriesModel extends EChartsModel {
  option?: FractalSeriesOption;
  seriesIndex?: number;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
}

interface FractalSeriesOption extends FractalRenderOption {
  data?: unknown;
  name?: string;
  roam?: boolean;
  minZoom?: number;
  maxZoom?: number | null;
  zoomStep?: number;
  fallbackMaxCells?: number;
  backgroundColor?: string;
  interactivePixelRatio?: number;
  interactiveMaxPixelCount?: number;
  interactiveIterationScale?: number;
  minInteractiveIterations?: number;
  refineDelay?: number;
  worker?: boolean;
  workerUrl?: string;
}

interface GraphicElement {
  [key: string]: unknown;
  style?: Record<string, unknown>;
  attr?: (keyOrObj: unknown, value?: unknown) => void;
  dirty?: () => void;
}

interface GraphicGroup extends GraphicElement {
  x?: number;
  y?: number;
  add(element: GraphicElement): void;
  removeAll(): void;
}

interface GraphicElementOptions {
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  silent?: boolean;
  z2?: number;
}

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    createDimensions(source: unknown[], options: Record<string, unknown>): unknown;
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: FractalSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Rect: new (options: GraphicElementOptions) => GraphicElement;
    Image?: new (options: GraphicElementOptions) => GraphicElement;
  };
}

interface FractalChartView {
  group: GraphicGroup;
  __fractalViewport?: ResolvedFractalViewport;
  __fractalViewportKey?: string;
  __fractalRenderToken?: object | null;
  __fractalImageElement?: GraphicElement;
  __fractalImageViewport?: ResolvedFractalViewport;
  __fractalPreviewFrame?: ReturnType<typeof setTimeout>;
  __fractalRefineTimer?: ReturnType<typeof setTimeout>;
  __fractalWorker?: Worker;
  __fractalWorkerObjectUrl?: string;
  __fractalWorkerRequestId?: number;
  __roamController?: FractalRoamController;
}

interface FractalRoamController {
  dispose(): void;
}

interface FractalRenderProfile {
  interactive: boolean;
  interactivePixelRatio: number;
  interactiveMaxPixelCount: number;
  interactiveIterationScale: number;
  minInteractiveIterations: number;
}

interface FractalRenderRequest {
  interactive?: boolean;
}

interface FractalDrawResult {
  imageElement?: GraphicElement;
}

interface FractalWorkerHandle {
  worker: Worker;
  objectUrl?: string;
}

interface FractalWorkerRequestMessage {
  requestId: number;
  plan: FractalRenderPlan;
}

interface FractalWorkerResultMessage {
  requestId: number;
  width?: number;
  height?: number;
  data?: Uint8ClampedArray;
  error?: string;
}

interface FractalZRender {
  on(eventName: string, handler: (event: FractalZRenderEvent) => void): void;
  off(eventName: string, handler: (event: FractalZRenderEvent) => void): void;
  refresh?: () => void;
}

interface FractalZRenderEvent {
  offsetX?: number;
  offsetY?: number;
  zrX?: number;
  zrY?: number;
  deltaY?: number;
  wheelDelta?: number;
  button?: number;
  event?: {
    offsetX?: number;
    offsetY?: number;
    deltaY?: number;
    wheelDelta?: number;
    button?: number;
    preventDefault?: () => void;
  };
}

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'fractalType',
  'viewport',
  'center',
  'viewWidth',
  'scale',
  'zoom',
  'pixelRatio',
  'maxPixelCount',
  'baseIterations',
  'iterationBoost',
  'iterationLimit',
  'maxIterations',
  'escapeRadius',
  'juliaConstant',
  'colorStops',
  'insideColor'
] as const satisfies ReadonlyArray<Extract<keyof FractalSeriesOption, string>>;

/* v8 ignore start */
const FRACTAL_WORKER_SOURCE = `
self.onmessage = function(event) {
  var request = event.data || {};
  try {
    var raster = buildFractalRaster(request.plan);
    self.postMessage({
      requestId: request.requestId,
      width: raster.width,
      height: raster.height,
      data: raster.data
    }, [raster.data.buffer]);
  } catch (error) {
    self.postMessage({
      requestId: request.requestId,
      error: error && error.message ? error.message : String(error)
    });
  }
};

function buildFractalRaster(plan) {
  if (!plan || !plan.viewport) throw new Error('Missing fractal render plan');
  var data = new Uint8ClampedArray(plan.pixelWidth * plan.pixelHeight * 4);
  var offset = 0;

  for (var pixelY = 0; pixelY < plan.pixelHeight; pixelY += 1) {
    var y = plan.viewport.maxY - (pixelY + 0.5) * plan.pixelStepY;
    for (var pixelX = 0; pixelX < plan.pixelWidth; pixelX += 1) {
      var x = plan.viewport.minX + (pixelX + 0.5) * plan.pixelStepX;
      var sample = iterateFractalPoint(x, y, plan);
      var color = colorForSample(sample, plan);
      data[offset] = color.r;
      data[offset + 1] = color.g;
      data[offset + 2] = color.b;
      data[offset + 3] = color.a;
      offset += 4;
    }
  }

  return {
    width: plan.pixelWidth,
    height: plan.pixelHeight,
    data: data
  };
}

function iterateFractalPoint(x, y, plan) {
  var fractalType = plan.fractalType === 'julia' || plan.fractalType === 'burningShip' ? plan.fractalType : 'mandelbrot';
  var maxIterations = Math.max(1, Math.floor(plan.iterations || 1));
  var escapeRadius = Math.max(1.01, Number.isFinite(plan.escapeRadius) ? plan.escapeRadius : 2);
  var escapeRadiusSquared = escapeRadius * escapeRadius;
  var juliaConstant = Array.isArray(plan.juliaConstant) ? plan.juliaConstant : [-0.8, 0.156];
  var zr = fractalType === 'mandelbrot' || fractalType === 'burningShip' ? 0 : x;
  var zi = fractalType === 'mandelbrot' || fractalType === 'burningShip' ? 0 : y;
  var cr = fractalType === 'julia' ? juliaConstant[0] : x;
  var ci = fractalType === 'julia' ? juliaConstant[1] : y;
  var magnitudeSquared = zr * zr + zi * zi;

  for (var iteration = 0; iteration < maxIterations; iteration += 1) {
    if (magnitudeSquared > escapeRadiusSquared) {
      return escapedResult(iteration, magnitudeSquared, maxIterations);
    }

    var nextInputR = fractalType === 'burningShip' ? Math.abs(zr) : zr;
    var nextInputI = fractalType === 'burningShip' ? Math.abs(zi) : zi;
    var nextR = nextInputR * nextInputR - nextInputI * nextInputI + cr;
    var nextI = 2 * nextInputR * nextInputI + ci;
    zr = nextR;
    zi = nextI;
    magnitudeSquared = zr * zr + zi * zi;
  }

  return {
    escaped: false,
    iterations: maxIterations,
    smoothIteration: maxIterations,
    magnitude: Math.sqrt(magnitudeSquared)
  };
}

function escapedResult(iterations, magnitudeSquared, maxIterations) {
  var magnitude = Math.sqrt(magnitudeSquared);
  var logMagnitude = Math.log(Math.max(magnitude, Number.EPSILON));
  var smoothOffset = logMagnitude > 0
    ? Math.log(logMagnitude / Math.LN2) / Math.LN2
    : 0;

  return {
    escaped: true,
    iterations: iterations,
    smoothIteration: clamp(iterations + 1 - smoothOffset, 0, maxIterations),
    magnitude: magnitude
  };
}

function colorForSample(sample, plan) {
  if (!sample.escaped) return plan.insideColor;
  return interpolateColor(plan.colorStops, clamp(sample.smoothIteration / Math.max(1, plan.iterations), 0, 1));
}

function interpolateColor(stops, offset) {
  var rightIndex = -1;
  for (var index = 0; index < stops.length; index += 1) {
    if (stops[index].offset >= offset) {
      rightIndex = index;
      break;
    }
  }
  if (rightIndex < 0) rightIndex = stops.length - 1;
  var right = stops[rightIndex];
  var left = stops[Math.max(0, rightIndex - 1)];
  var span = Math.max(Number.EPSILON, right.offset - left.offset);
  var amount = clamp((offset - left.offset) / span, 0, 1);

  return {
    r: Math.round(lerp(left.color.r, right.color.r, amount)),
    g: Math.round(lerp(left.color.g, right.color.g, amount)),
    b: Math.round(lerp(left.color.b, right.color.b, amount)),
    a: Math.round(lerp(left.color.a, right.color.a, amount))
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(left, right, amount) {
  return left + (right - left) * amount;
}
`;
/* v8 ignore stop */

const fractalSeriesModelDefinition = {
  type: 'series.fractal',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: FractalSeriesModel, option: FractalSeriesOption) {
    const source = Array.isArray(option.data) ? option.data : [{ name: option.name || 'Fractal', value: 1 }];
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  getTooltipPosition(this: FractalSeriesModel) {
    const layout = this.getData().count() > 0 ? [0, 0] : undefined;
    return layout;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '100%',
    height: '100%',
    fractalType: 'mandelbrot',
    viewport: null,
    center: null,
    viewWidth: null,
    scale: 1,
    zoom: null,
    pixelRatio: null,
    maxPixelCount: 380_000,
    fallbackMaxCells: 3600,
    baseIterations: 180,
    iterationBoost: 42,
    iterationLimit: 2400,
    maxIterations: null,
    escapeRadius: 2,
    juliaConstant: [-0.8, 0.156],
    insideColor: '#050609',
    colorStops: [
      [0, '#07111f'],
      [0.18, '#2454a6'],
      [0.4, '#16a3a3'],
      [0.68, '#e6a13d'],
      [1, '#fff7d6']
    ],
    backgroundColor: '#050609',
    roam: true,
    minZoom: 0.05,
    maxZoom: null,
    zoomStep: 1.22,
    interactivePixelRatio: 0.58,
    interactiveMaxPixelCount: 65_000,
    interactiveIterationScale: 0.34,
    minInteractiveIterations: 56,
    refineDelay: 200,
    worker: true,
    workerUrl: null,
    tooltip: {
      trigger: 'item'
    }
  }
};
echartsHost.extendSeriesModel(fractalSeriesModelDefinition);

const fractalChartViewDefinition = {
  type: 'fractal',

  render(this: FractalChartView, seriesModel: FractalSeriesModel, ecModel: unknown, api: EChartsApi) {
    const renderToken = {};
    this.__fractalRenderToken = renderToken;
    clearScheduledFractalRender(this);
    cancelFractalWorker(this);
    this.__roamController?.dispose();
    this.__roamController = undefined;

    try {
      const rect = echartsHost.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
        width: api.getWidth(),
        height: api.getHeight()
      });
      const canvasAvailable = canUseRasterCanvas();
      const renderNow = (request: FractalRenderRequest = {}) => {
        if (this.__fractalRenderToken !== renderToken) return;
        const renderOption = readActiveRenderOption(seriesModel, rect, api, canvasAvailable, this.__fractalViewport);
        const profiledOption = request.interactive
          ? applyFractalRenderProfile(renderOption, readInteractiveRenderProfile(seriesModel))
          : renderOption;
        const plan = resolveFractalRenderPlan(profiledOption);
        this.__fractalViewport = plan.viewport;

        if (request.interactive) {
          cancelFractalWorker(this);
          rememberDrawResult(this, drawFractal(echartsHost, this.group, seriesModel, plan, rect, canvasAvailable), plan);
          api.getZr?.()?.refresh?.();
          return;
        }

        if (requestFractalWorkerRender(this, echartsHost, seriesModel, plan, rect, canvasAvailable, renderToken, api)) {
          return;
        }

        cancelFractalWorker(this);
        rememberDrawResult(this, drawFractal(echartsHost, this.group, seriesModel, plan, rect, canvasAvailable), plan);
        api.getZr?.()?.refresh?.();
      };
      const scheduleRender = (request: FractalRenderRequest = {}) => {
        scheduleFractalRender(this, seriesModel, api, rect, renderNow, request);
      };
      const initialOption = readRenderOption(seriesModel, rect, api, canvasAvailable);
      const viewportKey = createViewportKey(initialOption);

      if (!this.__fractalViewport || this.__fractalViewportKey !== viewportKey) {
        this.__fractalViewport = resolveFractalRenderPlan(initialOption).viewport;
        this.__fractalViewportKey = viewportKey;
      }

      renderNow({ interactive: true });
      renderNow({ interactive: false });
      this.__roamController = installFractalRoam(this, seriesModel, api, rect, scheduleRender);
    } catch (error) {
      console.error('[fractal] render failed', error);
    }
  },

  remove(this: FractalChartView) {
    this.__fractalRenderToken = null;
    clearScheduledFractalRender(this);
    cancelFractalWorker(this);
    this.__roamController?.dispose();
    this.__roamController = undefined;
    this.__fractalViewport = undefined;
    this.__fractalViewportKey = undefined;
    this.__fractalImageElement = undefined;
    this.__fractalImageViewport = undefined;
    this.group.removeAll();
  },

  dispose(this: FractalChartView) {
    this.__fractalRenderToken = null;
    clearScheduledFractalRender(this);
    cancelFractalWorker(this);
    this.__roamController?.dispose();
    this.__roamController = undefined;
    this.__fractalViewport = undefined;
    this.__fractalViewportKey = undefined;
    this.__fractalImageElement = undefined;
    this.__fractalImageViewport = undefined;
    this.group.removeAll();
  }
};
echartsHost.extendChartView(fractalChartViewDefinition);

function readRenderOption(
  seriesModel: FractalSeriesModel,
  rect: ViewRect,
  api: EChartsApi,
  canvasAvailable: boolean
): FractalRenderOption {
  const layoutOption: FractalRenderOption = {
    width: rect.width,
    height: rect.height,
    pixelRatio: canvasAvailable ? readDevicePixelRatio(seriesModel, api) : 1
  };

  optionKeys.forEach((key) => {
    const value = seriesModel.get(key);
    if (value !== undefined && value !== null) layoutOption[key] = value as never;
  });

  if (!canvasAvailable) {
    const fallbackMaxCells = Math.max(1, Math.floor(finiteNumber(seriesModel.get('fallbackMaxCells'), 3600)));
    layoutOption.maxPixelCount = Math.min(
      Math.max(1, Math.floor(finiteNumber(layoutOption.maxPixelCount, fallbackMaxCells))),
      fallbackMaxCells
    );
  }

  return layoutOption;
}

function readActiveRenderOption(
  seriesModel: FractalSeriesModel,
  rect: ViewRect,
  api: EChartsApi,
  canvasAvailable: boolean,
  viewport?: ResolvedFractalViewport
): FractalRenderOption {
  const renderOption = readRenderOption(seriesModel, rect, api, canvasAvailable);
  if (viewport) renderOption.viewport = viewport;
  return renderOption;
}

function scheduleFractalRender(
  view: FractalChartView,
  seriesModel: FractalSeriesModel,
  api: EChartsApi,
  rect: ViewRect,
  renderNow: (request?: FractalRenderRequest) => void,
  request: FractalRenderRequest = {}
): void {
  if (!request.interactive) {
    clearScheduledFractalRender(view);
    renderNow(request);
    return;
  }

  cancelFractalWorker(view);
  if (view.__fractalViewport && applyFractalImageTransform(view, view.__fractalViewport, rect)) {
    api.getZr?.()?.refresh?.();
  }

  if (!view.__fractalPreviewFrame) {
    view.__fractalPreviewFrame = requestFractalFrame(() => {
      view.__fractalPreviewFrame = undefined;
      renderNow({ interactive: true });
    });
  }
  clearTimeout(view.__fractalRefineTimer);
  view.__fractalRefineTimer = setTimeout(() => {
    view.__fractalRefineTimer = undefined;
    renderNow({ interactive: false });
  }, readRefineDelay(seriesModel));
}

function drawFractal(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: FractalSeriesModel,
  plan: FractalRenderPlan,
  rect: ViewRect,
  canvasAvailable: boolean,
  raster: FractalRaster = buildFractalRaster(plan)
): FractalDrawResult {
  group.removeAll();

  const chartGroup = new echartsInstance.graphic.Group();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;
  const background = readBackgroundColor(seriesModel);
  const backgroundRect = new echartsInstance.graphic.Rect({
    shape: {
      x: 0,
      y: 0,
      width: rect.width,
      height: rect.height
    },
    style: {
      fill: background
    },
    silent: true,
    z2: 0
  });
  chartGroup.add(backgroundRect);

  const imageSource = canvasAvailable ? createRasterSource(raster) : null;
  const imageElement = imageSource && echartsInstance.graphic.Image
    ? new echartsInstance.graphic.Image({
      style: {
        image: imageSource,
        x: 0,
        y: 0,
        width: rect.width,
        height: rect.height
      },
      silent: false,
      z2: 1
    })
    : null;

  if (imageElement) {
    chartGroup.add(imageElement);
  } else {
    drawRasterCells(echartsInstance, chartGroup, raster, rect);
  }

  const data = seriesModel.getData();
  if (data.count() > 0) {
    data.setItemLayout(0, [rect.x + rect.width / 2, rect.y + rect.height / 2]);
    data.setItemGraphicEl(0, imageElement || chartGroup);
  }

  group.add(chartGroup);
  return {
    imageElement: imageElement || undefined
  };
}

function rememberDrawResult(view: FractalChartView, result: FractalDrawResult, plan: FractalRenderPlan): void {
  view.__fractalImageElement = result.imageElement;
  view.__fractalImageViewport = result.imageElement ? plan.viewport : undefined;
}

function applyFractalImageTransform(
  view: FractalChartView,
  targetViewport: ResolvedFractalViewport,
  rect: ViewRect
): boolean {
  if (!view.__fractalImageElement || !view.__fractalImageViewport) return false;

  const transform = resolveFractalViewportImageTransform(
    view.__fractalImageViewport,
    targetViewport,
    rect.width,
    rect.height
  );
  const values = [transform.x, transform.y, transform.width, transform.height];
  if (!values.every(Number.isFinite) || transform.width <= 0 || transform.height <= 0) return false;

  setImageElementStyle(view.__fractalImageElement, {
    x: transform.x,
    y: transform.y,
    width: transform.width,
    height: transform.height
  });
  return true;
}

function setImageElementStyle(imageElement: GraphicElement, nextStyle: Record<string, unknown>): void {
  const currentStyle = imageElement.style && typeof imageElement.style === 'object' ? imageElement.style : {};
  const style = {
    ...currentStyle,
    ...nextStyle
  };

  imageElement.style = style;
  if (imageElement.attr) imageElement.attr('style', style);
  imageElement.dirty?.();
}

function requestFractalWorkerRender(
  view: FractalChartView,
  echartsInstance: EChartsHost,
  seriesModel: FractalSeriesModel,
  plan: FractalRenderPlan,
  rect: ViewRect,
  canvasAvailable: boolean,
  renderToken: object,
  api: EChartsApi
): boolean {
  if (!readWorkerRenderEnabled(seriesModel, canvasAvailable)) return false;

  cancelFractalWorker(view);
  const handle = createFractalWorker(seriesModel);
  if (!handle) return false;

  const requestId = (view.__fractalWorkerRequestId ?? 0) + 1;
  view.__fractalWorker = handle.worker;
  view.__fractalWorkerObjectUrl = handle.objectUrl;
  view.__fractalWorkerRequestId = requestId;

  handle.worker.onmessage = (event: MessageEvent<FractalWorkerResultMessage>) => {
    const message = event.data;
    if (!isLatestFractalWorkerResult(view, renderToken, message?.requestId)) return;
    cancelFractalWorker(view);

    if (message.error || !message.data || !message.width || !message.height) {
      console.error('[fractal] worker render failed', message.error || 'empty worker response');
      drawFractalOnMainThread(view, echartsInstance, seriesModel, plan, rect, canvasAvailable, renderToken, api);
      return;
    }

    rememberDrawResult(
      view,
      drawFractal(echartsInstance, view.group, seriesModel, plan, rect, canvasAvailable, {
        width: message.width,
        height: message.height,
        data: message.data
      }),
      plan
    );
    api.getZr?.()?.refresh?.();
  };
  handle.worker.onerror = (event: ErrorEvent) => {
    if (!isLatestFractalWorkerResult(view, renderToken, requestId)) return;
    cancelFractalWorker(view);
    console.error('[fractal] worker render failed', event.message || event);
    drawFractalOnMainThread(view, echartsInstance, seriesModel, plan, rect, canvasAvailable, renderToken, api);
  };
  handle.worker.postMessage({ requestId, plan } satisfies FractalWorkerRequestMessage);
  return true;
}

function drawFractalOnMainThread(
  view: FractalChartView,
  echartsInstance: EChartsHost,
  seriesModel: FractalSeriesModel,
  plan: FractalRenderPlan,
  rect: ViewRect,
  canvasAvailable: boolean,
  renderToken: object,
  api: EChartsApi
): void {
  if (view.__fractalRenderToken !== renderToken) return;
  rememberDrawResult(view, drawFractal(echartsInstance, view.group, seriesModel, plan, rect, canvasAvailable), plan);
  api.getZr?.()?.refresh?.();
}

function readWorkerRenderEnabled(seriesModel: EChartsModel, canvasAvailable: boolean): boolean {
  return canvasAvailable && seriesModel.get('worker') !== false;
}

function isLatestFractalWorkerResult(
  view: Pick<FractalChartView, '__fractalRenderToken' | '__fractalWorkerRequestId'>,
  renderToken: object,
  requestId: unknown
): boolean {
  return view.__fractalRenderToken === renderToken
    && typeof requestId === 'number'
    && view.__fractalWorkerRequestId === requestId;
}

function createFractalWorker(seriesModel: FractalSeriesModel): FractalWorkerHandle | null {
  if (typeof Worker === 'undefined') return null;

  const configuredUrl = readWorkerUrl(seriesModel);
  const objectUrl = configuredUrl ? undefined : createInlineFractalWorkerUrl();
  const workerUrl = configuredUrl || objectUrl;
  if (!workerUrl) return null;

  try {
    return {
      worker: new Worker(workerUrl),
      objectUrl: objectUrl || undefined
    };
  } catch (error) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    console.error('[fractal] worker creation failed', error);
    return null;
  }
}

function readWorkerUrl(seriesModel: EChartsModel): string | null {
  const workerUrl = seriesModel.get('workerUrl');
  return typeof workerUrl === 'string' && workerUrl.trim() ? workerUrl : null;
}

function createInlineFractalWorkerUrl(): string | null {
  if (typeof Blob === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return null;
  }

  return URL.createObjectURL(new Blob([FRACTAL_WORKER_SOURCE], { type: 'text/javascript' }));
}

function cancelFractalWorker(view: FractalChartView): void {
  if (view.__fractalWorker) {
    view.__fractalWorker.terminate();
    view.__fractalWorker = undefined;
  }
  if (view.__fractalWorkerObjectUrl) {
    URL.revokeObjectURL(view.__fractalWorkerObjectUrl);
    view.__fractalWorkerObjectUrl = undefined;
  }
}

function drawRasterCells(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  raster: FractalRaster,
  rect: ViewRect
): void {
  const cellWidth = rect.width / raster.width;
  const cellHeight = rect.height / raster.height;
  let offset = 0;

  for (let y = 0; y < raster.height; y += 1) {
    for (let x = 0; x < raster.width; x += 1) {
      const fill = formatRgba(
        raster.data[offset],
        raster.data[offset + 1],
        raster.data[offset + 2],
        raster.data[offset + 3]
      );
      group.add(new echartsInstance.graphic.Rect({
        shape: {
          x: x * cellWidth,
          y: y * cellHeight,
          width: cellWidth + 0.25,
          height: cellHeight + 0.25
        },
        style: {
          fill
        },
        silent: false,
        z2: 1
      }));
      offset += 4;
    }
  }
}

function installFractalRoam(
  view: FractalChartView,
  seriesModel: FractalSeriesModel,
  api: EChartsApi,
  rect: ViewRect,
  redraw: (request?: FractalRenderRequest) => void
): FractalRoamController | undefined {
  if (seriesModel.get('roam') === false) return undefined;
  const zrender = api.getZr?.();
  if (!zrender) return undefined;

  const zoomStep = Math.max(1.01, finiteNumber(seriesModel.get('zoomStep'), 1.22));
  const minZoom = Math.max(Number.EPSILON, finiteNumber(seriesModel.get('minZoom'), 0.05));
  const rawMaxZoom = seriesModel.get('maxZoom');
  const maxZoom = rawMaxZoom == null ? null : Math.max(minZoom, finiteNumber(rawMaxZoom, Number.POSITIVE_INFINITY));
  let dragging = false;
  let lastPoint: [number, number] | null = null;

  const wheel = (event: FractalZRenderEvent) => {
    event.event?.preventDefault?.();
    const point = eventPoint(event);
    const direction = readWheelDirection(event);
    view.__fractalViewport = zoomFractalViewport(view.__fractalViewport || {}, {
      width: rect.width,
      height: rect.height,
      localX: clamp(point[0] - rect.x, 0, rect.width),
      localY: clamp(point[1] - rect.y, 0, rect.height),
      zoomFactor: direction > 0 ? zoomStep : 1 / zoomStep,
      minZoom,
      maxZoom
    });
    redraw({ interactive: true });
  };
  const mouseDown = (event: FractalZRenderEvent) => {
    const button = event.event?.button ?? event.button ?? 0;
    if (button !== 0) return;
    const point = eventPoint(event);
    if (!containsPoint(rect, point)) return;
    dragging = true;
    lastPoint = point;
  };
  const mouseMove = (event: FractalZRenderEvent) => {
    if (!dragging || !lastPoint) return;
    const point = eventPoint(event);
    const deltaX = point[0] - lastPoint[0];
    const deltaY = point[1] - lastPoint[1];
    lastPoint = point;
    view.__fractalViewport = panFractalViewport(view.__fractalViewport || {}, {
      width: rect.width,
      height: rect.height,
      deltaX,
      deltaY
    });
    redraw({ interactive: true });
  };
  const mouseUp = () => {
    dragging = false;
    lastPoint = null;
  };

  zrender.on('mousewheel', wheel);
  zrender.on('mousedown', mouseDown);
  zrender.on('mousemove', mouseMove);
  zrender.on('mouseup', mouseUp);
  zrender.on('globalout', mouseUp);

  return {
    dispose() {
      zrender.off('mousewheel', wheel);
      zrender.off('mousedown', mouseDown);
      zrender.off('mousemove', mouseMove);
      zrender.off('mouseup', mouseUp);
      zrender.off('globalout', mouseUp);
    }
  };
}

function readInteractiveRenderProfile(seriesModel: FractalSeriesModel): FractalRenderProfile {
  return {
    interactive: true,
    interactivePixelRatio: Math.max(0.05, finiteNumber(seriesModel.get('interactivePixelRatio'), 0.58)),
    interactiveMaxPixelCount: Math.max(1, Math.floor(finiteNumber(seriesModel.get('interactiveMaxPixelCount'), 65_000))),
    interactiveIterationScale: clamp(finiteNumber(seriesModel.get('interactiveIterationScale'), 0.34), 0.05, 1),
    minInteractiveIterations: Math.max(1, Math.floor(finiteNumber(seriesModel.get('minInteractiveIterations'), 56)))
  };
}

function readRefineDelay(seriesModel: FractalSeriesModel): number {
  return Math.max(0, finiteNumber(seriesModel.get('refineDelay'), 180));
}

function clearScheduledFractalRender(view: FractalChartView): void {
  clearTimeout(view.__fractalPreviewFrame);
  clearTimeout(view.__fractalRefineTimer);
  view.__fractalPreviewFrame = undefined;
  view.__fractalRefineTimer = undefined;
}

function requestFractalFrame(callback: () => void): ReturnType<typeof setTimeout> {
  return setTimeout(callback, 16);
}

function createRasterSource(raster: FractalRaster): unknown {
  const canvas = createCanvas(raster.width, raster.height);
  if (!canvas) return null;
  const context = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  if (!context) return null;
  const imageData = context.createImageData(raster.width, raster.height);
  imageData.data.set(raster.data);
  context.putImageData(imageData, 0, 0);
  return canvas;
}

function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas | null {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  return null;
}

function canUseRasterCanvas(): boolean {
  return createCanvas(1, 1) !== null;
}

function readDevicePixelRatio(seriesModel: FractalSeriesModel, api: EChartsApi): number {
  const configured = finiteNumber(seriesModel.get('pixelRatio'), NaN);
  if (Number.isFinite(configured)) return configured;
  const apiRatio = finiteNumber(api.getDevicePixelRatio?.(), NaN);
  if (Number.isFinite(apiRatio)) return apiRatio;
  if (typeof window !== 'undefined') return finiteNumber(window.devicePixelRatio, 1);
  return 1;
}

function createViewportKey(option: FractalRenderOption): string {
  return JSON.stringify({
    fractalType: option.fractalType,
    viewport: option.viewport,
    center: option.center,
    viewWidth: option.viewWidth,
    scale: option.scale,
    zoom: option.zoom,
    width: option.width,
    height: option.height
  });
}

function readBackgroundColor(seriesModel: FractalSeriesModel): string {
  const background = seriesModel.get('backgroundColor');
  return typeof background === 'string' ? background : '#050609';
}

function eventPoint(event: FractalZRenderEvent): [number, number] {
  const source = event.event || event;
  return [
    finiteNumber(source.offsetX, finiteNumber(event.zrX, finiteNumber(event.offsetX, 0))),
    finiteNumber(source.offsetY, finiteNumber(event.zrY, finiteNumber(event.offsetY, 0)))
  ];
}

function containsPoint(rect: ViewRect, point: [number, number]): boolean {
  return point[0] >= rect.x
    && point[0] <= rect.x + rect.width
    && point[1] >= rect.y
    && point[1] <= rect.y + rect.height;
}

function readWheelDirection(event: FractalZRenderEvent): number {
  const source = event.event || event;
  const deltaY = finiteNumber(source.deltaY, NaN);
  if (Number.isFinite(deltaY)) return deltaY <= 0 ? 1 : -1;
  const wheelDelta = finiteNumber(source.wheelDelta, NaN);
  if (Number.isFinite(wheelDelta)) return wheelDelta >= 0 ? 1 : -1;
  return 1;
}

function formatRgba(r: number, g: number, b: number, a: number): string {
  if (a >= 255) return `rgb(${r},${g},${b})`;
  return `rgba(${r},${g},${b},${Math.round(a / 2.55) / 100})`;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const __test__ = {
  fractalSeriesModelDefinition,
  fractalChartViewDefinition,
  readRenderOption,
  readActiveRenderOption,
  scheduleFractalRender,
  drawFractal,
  drawRasterCells,
  installFractalRoam,
  readInteractiveRenderProfile,
  readRefineDelay,
  clearScheduledFractalRender,
  requestFractalFrame,
  rememberDrawResult,
  applyFractalImageTransform,
  setImageElementStyle,
  requestFractalWorkerRender,
  drawFractalOnMainThread,
  readWorkerRenderEnabled,
  isLatestFractalWorkerResult,
  createFractalWorker,
  readWorkerUrl,
  createInlineFractalWorkerUrl,
  cancelFractalWorker,
  createRasterSource,
  createCanvas,
  canUseRasterCanvas,
  readDevicePixelRatio,
  createViewportKey,
  readBackgroundColor,
  eventPoint,
  containsPoint,
  readWheelDirection,
  formatRgba,
  finiteNumber,
  clamp
};
