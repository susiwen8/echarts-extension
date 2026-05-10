import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive, setAliveRenderKey } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import { gammaToImpedance, impedanceToGamma, resolveSmithChartLayout } from './layout.js';
import type { SmithChartLayoutOption, SmithChartLayoutResult, SmithGamma, SmithNormalizedImpedance, SmithPoint, SmithReactanceArc } from './layout.js';

interface ViewRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EChartsApi {
  getWidth(): number;
  getHeight(): number;
  getZr?(): SmithZRender | null | undefined;
}

interface EChartsModel {
  get(path: string | string[]): unknown;
  getModel(path: string | string[]): EChartsModel;
}

interface SeriesData {
  initData(source: unknown[]): void;
  count(): number;
  getItemModel(index: number): EChartsModel;
  getItemVisual(dataIndex: number, key: string): unknown;
  getItemLayout(dataIndex: number): unknown;
  setItemLayout(dataIndex: number, layout: [number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface SmithSeriesModel extends EChartsModel {
  option?: SmithChartLayoutOption;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
}

interface GraphicElement {
  [key: string]: unknown;
  silent?: boolean;
  invisible?: boolean;
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  attr?: (keyOrObj: unknown, value?: unknown) => void;
  dirty?: () => void;
}

interface AnimatableGraphicElement extends GraphicElement {
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  animate?: (key: AnimationTargetKey, loop?: boolean) => GraphicAnimator | null | undefined;
}

interface GraphicAnimator {
  when(duration: number, target: Record<string, unknown>): GraphicAnimator;
  delay?: (duration: number) => GraphicAnimator;
  start(easing?: string): void;
}

interface GraphicGroup extends GraphicElement {
  x?: number;
  y?: number;
  add(element: GraphicElement): void;
  removeAll(): void;
  transformCoordToLocal?: (x: number, y: number) => number[] | { x?: number; y?: number };
}

interface GraphicElementOptions {
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  silent?: boolean;
  invisible?: boolean;
  z2?: number;
  rotation?: number;
  originX?: number;
  originY?: number;
}

interface SmithAxisLabelParams {
  axis: 'resistance' | 'reactance';
  value: number;
  normalized: number;
  impedance: number;
  ohms: number;
  referenceImpedance: number;
}

interface SmithCursorController {
  dispose(): void;
}

interface SmithCursorState {
  x: number;
  y: number;
  gamma: SmithGamma;
  normalized: SmithNormalizedImpedance;
  impedance: ComplexValue;
  admittance: ComplexValue;
  vswr: number;
  q: number;
  resistanceCircle: {
    cx: number;
    cy: number;
    r: number;
  };
  reactancePoints: number[][];
}

interface ComplexValue {
  real: number;
  imag: number;
}

interface SmithCursorElements {
  group: GraphicGroup;
  resistanceCircle: GraphicElement;
  reactanceCurve: GraphicElement;
  tooltipBackground: GraphicElement;
  tooltipText: GraphicElement;
}

interface SmithCursorEvent {
  offsetX?: number;
  offsetY?: number;
  zrX?: number;
  zrY?: number;
  event?: {
    offsetX?: number;
    offsetY?: number;
  };
}

type SmithZRender = ElementHoverOptions['zrender'];

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    createDimensions(source: unknown[], options: Record<string, unknown>): unknown;
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: SmithSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Polyline: new (options: GraphicElementOptions) => GraphicElement;
    Rect: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}

interface SmithChartView {
  group: GraphicGroup;
  __renderToken?: object | null;
  __hoverController?: ElementHoverController;
  __cursorController?: SmithCursorController;
  __aliveRenderState?: AliveRenderState;
}

interface EnterAnimationConfig {
  enabled: boolean;
  duration: number;
  delay: number;
  easing: string;
}

type AnimationTargetKey = 'shape' | 'style';

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'padding',
  'dataType',
  'referenceImpedance',
  'dimensions',
  'nameField',
  'resistanceField',
  'reactanceField',
  'gammaField',
  'gammaRealField',
  'gammaImagField',
  'resistanceValues',
  'reactanceValues',
  'showSwrCircle',
  'swrMagnitude',
  'swrIndex'
] as const satisfies ReadonlyArray<Extract<keyof SmithChartLayoutOption, string>>;
const layerZ = {
  swr: -2,
  grid: 0,
  line: 4,
  hit: 7,
  symbol: 8,
  label: 9,
  cursor: 18,
  cursorTooltip: 19
} as const;
const reactanceArcSampleCount = 80;
const cursorReactanceSampleCount = 80;
const cursorTooltipOffset = 14;

echartsHost.extendSeriesModel({
  type: 'series.smith',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: SmithSeriesModel, option: SmithChartLayoutOption) {
    const source = Array.isArray(option.data) ? option.data : [];
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  getTooltipPosition(this: SmithSeriesModel, dataIndex: number) {
    const layout = this.getData().getItemLayout(dataIndex);
    return Array.isArray(layout) ? layout : undefined;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '92%',
    height: '92%',
    padding: 30,
    dataType: 'impedance',
    referenceImpedance: 1,
    dimensions: null,
    nameField: 'name',
    resistanceField: 'r',
    reactanceField: 'x',
    gammaField: 'gamma',
    gammaRealField: 'gammaReal',
    gammaImagField: 'gammaImag',
    resistanceValues: [0, 0.2, 0.5, 1, 2, 4, 10],
    reactanceValues: [-10, -4, -2, -1, -0.5, -0.2, 0.2, 0.5, 1, 2, 4, 10],
    showSwrCircle: false,
    swrMagnitude: null,
    swrIndex: 0,
    symbolSize: 7,
    enterAnimation: true,
    grid: {
      show: true,
      unitCircle: {
        lineStyle: {
          color: '#334155',
          width: 1.4,
          opacity: 1
        }
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#94a3b8',
          width: 1,
          opacity: 0.9
        }
      },
      resistanceLine: {
        show: true,
        lineStyle: {
          color: '#cbd5e1',
          width: 1,
          opacity: 0.88
        }
      },
      reactanceLine: {
        show: true,
        lineStyle: {
          color: '#cbd5e1',
          width: 1,
          opacity: 0.88
        }
      },
      label: {
        show: true,
        color: '#64748b',
        fontSize: 11,
        formatter: '{value}'
      }
    },
    swrStyle: {
      color: '#f97316',
      width: 1.2,
      opacity: 0.9,
      type: 'dashed'
    },
    lineStyle: {
      show: true,
      color: '#2563eb',
      width: 2,
      opacity: 1,
      type: 'solid'
    },
    itemStyle: {
      color: '#2563eb',
      borderColor: '#ffffff',
      borderWidth: 1.5,
      opacity: 1
    },
    label: {
      show: false,
      color: '#0f172a',
      fontSize: 12,
      fontWeight: 600,
      formatter: '{b}'
    },
    cursor: {
      show: true,
      lineStyle: {
        color: '#111111',
        width: 1.2,
        opacity: 1,
        type: 'dashed'
      },
      circleStyle: null,
      curveStyle: null,
      tooltip: {
        show: true,
        backgroundColor: '#000000',
        color: '#ffffff',
        fontSize: 14,
        lineHeight: 22,
        padding: [10, 12],
        borderRadius: 4
      }
    },
    tooltip: {
      trigger: 'item'
    },
    emphasis: {
      itemStyle: {
        borderWidth: 2,
        shadowBlur: 7,
        shadowColor: 'rgba(37, 99, 235, 0.32)'
      }
    }
  }
});

echartsHost.extendChartView({
  type: 'smith',

  render(this: SmithChartView, seriesModel: SmithSeriesModel, ecModel: unknown, api: EChartsApi) {
    const group = this.group;
    const renderToken = {};
    this.__renderToken = renderToken;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    this.__cursorController?.dispose();
    this.__cursorController = undefined;

    try {
      const rect = echartsHost.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
        width: api.getWidth(),
        height: api.getHeight()
      });
      const layout = resolveSmithChartLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const aliveRender = renderAlive<SmithSeriesModel, { chartGroup: GraphicGroup }>(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawSmithChart(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(aliveRender.hoverItems, {
        zrender: api.getZr?.()
      });
      const chartGroup = aliveRender.mapElement(aliveRender.payload!.chartGroup);
      this.__cursorController = installSmithCursor(echartsHost, chartGroup, seriesModel, layout, rect, api.getZr?.());
    } catch (error) {
      console.error('[smith] render failed', error);
    }
  },

  remove(this: SmithChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    this.__cursorController?.dispose();
    this.__cursorController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: SmithChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    this.__cursorController?.dispose();
    this.__cursorController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: SmithSeriesModel, rect: ViewRect): SmithChartLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: SmithChartLayoutOption = {
    data: Array.isArray(option.data) ? option.data : [],
    layout: seriesModel.get('layout'),
    layoutOptions: seriesModel.get('layoutOptions') || {},
    width: rect.width,
    height: rect.height
  };

  optionKeys.forEach((key) => {
    const value = seriesModel.get(key);
    if (value !== undefined && value !== null) layoutOption[key as string] = value;
  });

  return layoutOption;
}

function drawSmithChart(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SmithSeriesModel,
  layout: SmithChartLayoutResult,
  rect: ViewRect
): { hoverItems: ElementHoverItem[]; payload: { chartGroup: GraphicGroup } } {
  const chartGroup = new echartsInstance.graphic.Group();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  drawGrid(echartsInstance, chartGroup, seriesModel, layout);
  drawSwrCircle(echartsInstance, chartGroup, seriesModel, layout);
  const line = drawSeriesLine(echartsInstance, chartGroup, seriesModel, layout);
  const hoverItems = drawPoints(echartsInstance, chartGroup, seriesModel, layout, rect, line);

  group.add(chartGroup);
  return {
    hoverItems,
    payload: { chartGroup }
  };
}

function drawGrid(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SmithSeriesModel,
  layout: SmithChartLayoutResult
): void {
  const gridModel = seriesModel.getModel('grid');
  if (gridModel.get('show') === false) return;

  const unitStyle = readLineStyle(gridModel.getModel(['unitCircle', 'lineStyle']), {
    stroke: '#334155',
    lineWidth: 1.4,
    opacity: 1
  });
  group.add(new echartsInstance.graphic.Circle({
    shape: {
      cx: layout.unitCircle.cx,
      cy: layout.unitCircle.cy,
      r: layout.unitCircle.r
    },
    style: {
      ...unitStyle,
      fill: null
    },
    silent: true,
    z2: layerZ.grid
  }));

  const axisModel = gridModel.getModel('axisLine');
  if (axisModel.get('show') !== false) {
    group.add(new echartsInstance.graphic.Line({
      shape: layout.reactanceAxis,
      style: readLineStyle(axisModel.getModel('lineStyle'), {
        stroke: '#94a3b8',
        lineWidth: 1,
        opacity: 0.9
      }),
      silent: true,
      z2: layerZ.grid
    }));
  }

  const resistanceModel = gridModel.getModel('resistanceLine');
  if (resistanceModel.get('show') !== false) {
    const style = readLineStyle(resistanceModel.getModel('lineStyle'), {
      stroke: '#cbd5e1',
      lineWidth: 1,
      opacity: 0.88
    });
    layout.resistanceCircles
      .filter((circle) => circle.value > 0)
      .forEach((circle) => {
        group.add(new echartsInstance.graphic.Circle({
          shape: {
            cx: circle.cx,
            cy: circle.cy,
            r: circle.r
          },
          style: {
            ...style,
            fill: null
          },
          silent: true,
          z2: layerZ.grid
        }));
      });
  }

  const reactanceModel = gridModel.getModel('reactanceLine');
  if (reactanceModel.get('show') !== false) {
    const style = readLineStyle(reactanceModel.getModel('lineStyle'), {
      stroke: '#cbd5e1',
      lineWidth: 1,
      opacity: 0.88
    });
    layout.reactanceArcs.forEach((arc) => {
      group.add(createArcElement(echartsInstance, arc, style));
    });
  }

  drawGridLabels(echartsInstance, group, gridModel, layout);
}

function drawGridLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  gridModel: EChartsModel,
  layout: SmithChartLayoutResult
): void {
  const labelModel = gridModel.getModel('label');
  if (labelModel.get('show') === false) return;
  const fontSize = finiteNumber(labelModel.get('fontSize'), 11);
  const fill = labelModel.get('color') || '#64748b';
  const formatter = labelModel.get('formatter');

  layout.resistanceCircles
    .forEach((circle) => {
      const params = createAxisLabelParams('resistance', circle.value, layout.referenceImpedance);
      const text = new echartsInstance.graphic.Text({
        style: {
          x: circle.labelX,
          y: circle.labelY,
          text: formatAxisLabel(labelModel.get('resistanceFormatter') || formatter, params),
          fill,
          fontSize,
          align: circle.value <= 0 ? 'left' : 'center',
          verticalAlign: 'bottom'
        },
        silent: true,
        z2: layerZ.label
      });
      setAliveRenderKey(text, `smith-r-label:${circle.value}`);
      group.add(text);
    });

  layout.reactanceArcs.forEach((arc) => {
    const params = createAxisLabelParams('reactance', arc.value, layout.referenceImpedance);
    const text = new echartsInstance.graphic.Text({
      style: {
        x: arc.labelX,
        y: arc.labelY,
        text: formatAxisLabel(labelModel.get('reactanceFormatter') || formatter, params),
        fill,
        fontSize,
        align: arc.value > 0 ? 'left' : 'right',
        verticalAlign: arc.value > 0 ? 'bottom' : 'top'
      },
      silent: true,
      z2: layerZ.label
    });
    setAliveRenderKey(text, `smith-x-label:${arc.value}`);
    group.add(text);
  });
}

function createArcElement(echartsInstance: EChartsHost, arc: SmithReactanceArc, style: Record<string, unknown>): GraphicElement {
  return new echartsInstance.graphic.Polyline({
    shape: {
      points: sampleArcPoints(arc)
    },
    style,
    silent: true,
    z2: layerZ.grid
  });
}

function sampleArcPoints(arc: SmithReactanceArc): number[][] {
  const chartRadius = Math.max(1, Math.abs(arc.r * arc.value));
  const centerX = arc.cx - chartRadius;
  const centerY = arc.cy + chartRadius / arc.value;
  return Array.from({ length: reactanceArcSampleCount }, (_, index) => {
    const t = index / (reactanceArcSampleCount - 1);
    if (t >= 1) return [centerX + chartRadius, centerY];
    const resistance = t / Math.max(1 - t, 1e-6);
    const gamma = impedanceToGamma(resistance, arc.value);
    return [
      centerX + gamma.real * chartRadius,
      centerY - gamma.imag * chartRadius
    ];
  });
}

function drawSwrCircle(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SmithSeriesModel,
  layout: SmithChartLayoutResult
): void {
  if (!layout.swrCircle || layout.swrCircle.r <= 0) return;
  const swr = new echartsInstance.graphic.Circle({
    shape: {
      cx: layout.swrCircle.cx,
      cy: layout.swrCircle.cy,
      r: layout.swrCircle.r
    },
    style: {
      ...readLineStyle(seriesModel.getModel('swrStyle'), {
        stroke: '#f97316',
        lineWidth: 1.2,
        opacity: 0.9,
        lineDash: [5, 6]
      }),
      fill: null
    },
    silent: true,
    z2: layerZ.swr
  });
  applyFadeEnterAnimation(swr, readEnterAnimation(seriesModel, 0));
  setAliveRenderKey(swr, 'smith-swr-circle');
  group.add(swr);
}

function drawSeriesLine(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SmithSeriesModel,
  layout: SmithChartLayoutResult
): GraphicElement | null {
  const lineModel = seriesModel.getModel('lineStyle');
  if (lineModel.get('show') === false || layout.points.length < 2) return null;
  const style = readLineStyle(lineModel, {
    stroke: '#2563eb',
    lineWidth: 2,
    opacity: 1
  });
  if (!style.stroke || finiteNumber(style.lineWidth, 1) <= 0 || finiteNumber(style.opacity, 1) <= 0) return null;

  const line = new echartsInstance.graphic.Polyline({
    shape: {
      points: layout.points.map((point) => [point.x, point.y])
    },
    style,
    silent: seriesModel.get('silent') === true,
    z2: layerZ.line
  });
  applyFadeEnterAnimation(line, readEnterAnimation(seriesModel, 0));
  setAliveRenderKey(line, 'smith-series-line');
  group.add(line);
  return line;
}

function drawPoints(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SmithSeriesModel,
  layout: SmithChartLayoutResult,
  rect: ViewRect,
  line: GraphicElement | null
): ElementHoverItem[] {
  const data = seriesModel.getData();
  const symbolSize = Math.max(0, finiteNumber(seriesModel.get('symbolSize'), 7));
  const silent = seriesModel.get('silent') === true;
  const hoverItems: ElementHoverItem[] = [];
  const hoverItemsByDataIndex = new Map<number, ElementHoverItem>();

  layout.points.forEach((point, pointIndex) => {
    if (point.dataIndex < 0 || point.dataIndex >= data.count()) return;
    const itemModel = data.getItemModel(point.dataIndex);
    data.setItemLayout(point.dataIndex, [point.x + rect.x, point.y + rect.y]);

    let symbol: GraphicElement | null = null;
    if (symbolSize > 0) {
      symbol = new echartsInstance.graphic.Circle({
        shape: {
          cx: point.x,
          cy: point.y,
          r: symbolSize / 2
        },
        style: readPointStyle(data, seriesModel, itemModel, point),
        z2: layerZ.symbol
      });
      applyCircleEnterAnimation(symbol, symbolSize / 2, readEnterAnimation(seriesModel, pointIndex));
      symbol.silent = silent;
      setAliveRenderKey(symbol, `smith-symbol:${smithPointKey(point)}`);
      group.add(symbol);
    }

    if (silent) {
      if (symbol) data.setItemGraphicEl(point.dataIndex, symbol);
      return;
    }

    const hitCircle = new echartsInstance.graphic.Circle({
      shape: {
        cx: point.x,
        cy: point.y,
        r: Math.max(symbolSize / 2, 8)
      },
      style: {
        fill: 'rgba(0,0,0,0)',
        stroke: 'rgba(0,0,0,0)',
        opacity: 0
      },
      z2: layerZ.hit
    });
    data.setItemGraphicEl(point.dataIndex, hitCircle);
    setAliveRenderKey(hitCircle, `smith-hit:${smithPointKey(point)}`);
    group.add(hitCircle);

    const hoverItem = {
      elements: [line, symbol].filter(Boolean) as GraphicElement[],
      triggerElements: [hitCircle, symbol].filter(Boolean) as GraphicElement[]
    };
    hoverItems.push(hoverItem);
    hoverItemsByDataIndex.set(point.dataIndex, hoverItem);
  });

  drawPointLabels(echartsInstance, group, seriesModel, layout.points, hoverItemsByDataIndex);
  return hoverItems;
}

function drawPointLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SmithSeriesModel,
  points: SmithPoint[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>
): void {
  const seriesLabelModel = seriesModel.getModel('label');
  if (seriesLabelModel.get('show') !== true) return;

  points.forEach((point) => {
    const itemModel = seriesModel.getData().getItemModel(point.dataIndex);
    const itemLabelModel = itemModel.getModel('label');
    const show = itemLabelModel.get('show') ?? seriesLabelModel.get('show');
    if (show === false) return;

    const label = new echartsInstance.graphic.Text({
      style: {
        x: point.x + 8,
        y: point.y - 8,
        text: String(formatLabel(itemLabelModel.get('formatter') || seriesLabelModel.get('formatter'), point)),
        fill: itemLabelModel.get('color') || seriesLabelModel.get('color') || '#0f172a',
        fontSize: finiteNumber(itemLabelModel.get('fontSize'), finiteNumber(seriesLabelModel.get('fontSize'), 12)),
        fontWeight: itemLabelModel.get('fontWeight') || seriesLabelModel.get('fontWeight') || 600,
        align: 'left',
        verticalAlign: 'bottom'
      },
      silent: true,
      z2: layerZ.label
    });
    applyFadeEnterAnimation(label, readEnterAnimation(seriesModel, point.dataIndex));
    setAliveRenderKey(label, `smith-label:${smithPointKey(point)}`);
    addHoverElement(hoverItemsByDataIndex.get(point.dataIndex), label);
    group.add(label);
  });
}

function installSmithCursor(
  echartsInstance: EChartsHost,
  chartGroup: GraphicGroup,
  seriesModel: SmithSeriesModel,
  layout: SmithChartLayoutResult,
  rect: ViewRect,
  zrender: SmithZRender | null | undefined
): SmithCursorController | undefined {
  const cursorModel = seriesModel.getModel('cursor');
  if (!zrender || seriesModel.get('silent') === true || cursorModel.get('show') === false) return undefined;

  const elements = createSmithCursorElements(echartsInstance, chartGroup, seriesModel);
  hideSmithCursor(elements);

  const handleMove = (event: unknown) => {
    const eventPoint = readCursorEventPoint(event, rect, chartGroup);
    const state = eventPoint ? resolveSmithCursorState(eventPoint.x, eventPoint.y, layout) : null;
    if (!state) {
      hideSmithCursor(elements);
      return;
    }
    updateSmithCursorElements(elements, seriesModel, layout, state);
  };
  const handleLeave = () => hideSmithCursor(elements);

  zrender.on('mousemove', handleMove);
  zrender.on('globalout', handleLeave);

  return {
    dispose() {
      zrender.off('mousemove', handleMove);
      zrender.off('globalout', handleLeave);
      hideSmithCursor(elements);
    }
  };
}

function createSmithCursorElements(
  echartsInstance: EChartsHost,
  chartGroup: GraphicGroup,
  seriesModel: SmithSeriesModel
): SmithCursorElements {
  const cursorModel = seriesModel.getModel('cursor');
  const lineStyle = readLineStyle(cursorModel.getModel('lineStyle'), {
    stroke: '#111111',
    lineWidth: 1.2,
    opacity: 1,
    type: 'dashed'
  });
  const group = new echartsInstance.graphic.Group();
  group.silent = true;
  group.z2 = layerZ.cursor;

  const resistanceCircle = new echartsInstance.graphic.Circle({
    shape: { cx: 0, cy: 0, r: 0 },
    style: {
      ...resolveCursorLineStyle(cursorModel.getModel('circleStyle'), lineStyle),
      fill: null
    },
    silent: true,
    z2: layerZ.cursor
  });
  const reactanceCurve = new echartsInstance.graphic.Polyline({
    shape: { points: [] },
    style: {
      ...resolveCursorLineStyle(cursorModel.getModel('curveStyle'), lineStyle),
      fill: null
    },
    silent: true,
    z2: layerZ.cursor
  });
  const tooltipModel = cursorModel.getModel('tooltip');
  const tooltipBackground = new echartsInstance.graphic.Rect({
    shape: { x: 0, y: 0, width: 0, height: 0, r: finiteNumber(tooltipModel.get('borderRadius'), 4) },
    style: {
      fill: tooltipModel.get('backgroundColor') || '#000000',
      stroke: tooltipModel.get('borderColor') || null,
      lineWidth: finiteNumber(tooltipModel.get('borderWidth'), 0),
      opacity: finiteNumber(tooltipModel.get('opacity'), 1)
    },
    silent: true,
    z2: layerZ.cursorTooltip
  });
  const tooltipText = new echartsInstance.graphic.Text({
    style: {
      x: 0,
      y: 0,
      text: '',
      fill: tooltipModel.get('color') || '#ffffff',
      fontSize: finiteNumber(tooltipModel.get('fontSize'), 14),
      lineHeight: finiteNumber(tooltipModel.get('lineHeight'), 22),
      fontFamily: tooltipModel.get('fontFamily') || 'sans-serif',
      align: 'left',
      verticalAlign: 'top'
    },
    silent: true,
    z2: layerZ.cursorTooltip
  });

  group.add(resistanceCircle);
  group.add(reactanceCurve);
  group.add(tooltipBackground);
  group.add(tooltipText);
  chartGroup.add(group);

  return { group, resistanceCircle, reactanceCurve, tooltipBackground, tooltipText };
}

function updateSmithCursorElements(
  elements: SmithCursorElements,
  seriesModel: SmithSeriesModel,
  layout: SmithChartLayoutResult,
  state: SmithCursorState
): void {
  const cursorModel = seriesModel.getModel('cursor');
  const tooltipModel = cursorModel.getModel('tooltip');
  const fontSize = finiteNumber(tooltipModel.get('fontSize'), 14);
  const lineHeight = finiteNumber(tooltipModel.get('lineHeight'), 22);
  const padding = normalizeTooltipPadding(tooltipModel.get('padding'));
  const text = formatSmithCursorTooltip(state);
  const lines = text.split('\n');
  const tooltipWidth = estimateTooltipWidth(lines, fontSize) + padding[1] + padding[3];
  const tooltipHeight = lines.length * lineHeight + padding[0] + padding[2];
  const tooltipPosition = placeTooltip(state.x, state.y, tooltipWidth, tooltipHeight, layout);
  const tooltipVisible = tooltipModel.get('show') !== false;

  setElementInvisible(elements.group, false);
  setElementInvisible(elements.resistanceCircle, false);
  setElementInvisible(elements.reactanceCurve, false);
  updateElement(elements.resistanceCircle, {
    shape: {
      cx: state.resistanceCircle.cx,
      cy: state.resistanceCircle.cy,
      r: state.resistanceCircle.r
    }
  });
  updateElement(elements.reactanceCurve, {
    shape: {
      points: state.reactancePoints
    }
  });
  setElementInvisible(elements.tooltipBackground, !tooltipVisible);
  setElementInvisible(elements.tooltipText, !tooltipVisible);
  if (tooltipVisible) {
    updateElement(elements.tooltipBackground, {
      shape: {
        x: tooltipPosition.x,
        y: tooltipPosition.y,
        width: tooltipWidth,
        height: tooltipHeight,
        r: finiteNumber(tooltipModel.get('borderRadius'), 4)
      }
    });
    updateElement(elements.tooltipText, {
      style: {
        x: tooltipPosition.x + padding[3],
        y: tooltipPosition.y + padding[0],
        text,
        fill: tooltipModel.get('color') || '#ffffff',
        fontSize,
        lineHeight,
        fontFamily: tooltipModel.get('fontFamily') || 'sans-serif'
      }
    });
  }
}

function hideSmithCursor(elements: SmithCursorElements): void {
  setElementInvisible(elements.group, true);
  setElementInvisible(elements.resistanceCircle, true);
  setElementInvisible(elements.reactanceCurve, true);
  setElementInvisible(elements.tooltipBackground, true);
  setElementInvisible(elements.tooltipText, true);
}

function resolveSmithCursorState(x: number, y: number, layout: SmithChartLayoutResult): SmithCursorState | null {
  const dx = x - layout.centerX;
  const dy = layout.centerY - y;
  const magnitude = Math.hypot(dx, dy) / layout.radius;
  if (magnitude > 1) return null;

  const gamma = {
    real: cleanCursorNumber(dx / layout.radius),
    imag: cleanCursorNumber(dy / layout.radius),
    magnitude: cleanCursorNumber(magnitude),
    angle: Math.atan2(dy, dx)
  };
  const normalized = gammaToImpedance(gamma.real, gamma.imag);
  const impedance = {
    real: cleanCursorNumber(normalized.r * layout.referenceImpedance),
    imag: cleanCursorNumber(normalized.x * layout.referenceImpedance)
  };
  const admittance = invertComplex(impedance);
  const vswr = magnitude >= 1 ? Infinity : cleanCursorNumber((1 + magnitude) / (1 - magnitude));
  const q = Math.abs(normalized.r) <= 1e-9 ? Infinity : cleanCursorNumber(Math.abs(normalized.x / normalized.r));

  return {
    x,
    y,
    gamma,
    normalized,
    impedance,
    admittance,
    vswr,
    q,
    resistanceCircle: createResistanceCursorCircle(layout, normalized.r),
    reactancePoints: sampleReactanceCursorPoints(layout, normalized.x, normalized.r)
  };
}

function createResistanceCursorCircle(
  layout: SmithChartLayoutResult,
  normalizedResistance: number
): { cx: number; cy: number; r: number } {
  const resistance = Math.max(0, normalizedResistance);
  if (!Number.isFinite(resistance)) {
    return {
      cx: layout.centerX + layout.radius,
      cy: layout.centerY,
      r: 0
    };
  }
  const denominator = 1 + resistance;
  return {
    cx: cleanCursorNumber(layout.centerX + layout.radius * resistance / denominator),
    cy: layout.centerY,
    r: cleanCursorNumber(layout.radius / denominator)
  };
}

function sampleReactanceCursorPoints(
  layout: SmithChartLayoutResult,
  reactance: number,
  cursorResistance?: number
): number[][] {
  if (Math.abs(reactance) <= 1e-9 || !Number.isFinite(reactance)) {
    return [
      [layout.centerX - layout.radius, layout.centerY],
      [layout.centerX + layout.radius, layout.centerY]
    ];
  }

  const resistanceValues = Array.from({ length: cursorReactanceSampleCount }, (_, index) => {
    const t = index / (cursorReactanceSampleCount - 1);
    return t >= 1 ? Infinity : t / Math.max(1 - t, 1e-6);
  });
  if (Number.isFinite(cursorResistance) && cursorResistance != null && cursorResistance >= 0) {
    resistanceValues.push(cursorResistance);
  }

  return resistanceValues
    .sort((left, right) => left - right)
    .map((resistance) => {
      const gamma = impedanceToGamma(resistance, reactance);
      return [
        layout.centerX + gamma.real * layout.radius,
        layout.centerY - gamma.imag * layout.radius
      ];
    });
}

function readCursorEventPoint(
  event: unknown,
  rect: ViewRect,
  chartGroup?: Pick<GraphicGroup, 'transformCoordToLocal'> | null
): { x: number; y: number } | null {
  const cursorEvent = asRecord(event) as SmithCursorEvent;
  const nativeEvent = asRecord(cursorEvent.event);
  const x = finiteNumber(cursorEvent.offsetX, finiteNumber(cursorEvent.zrX, finiteNumber(nativeEvent.offsetX, NaN)));
  const y = finiteNumber(cursorEvent.offsetY, finiteNumber(cursorEvent.zrY, finiteNumber(nativeEvent.offsetY, NaN)));
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const transformed = chartGroup?.transformCoordToLocal?.(x, y);
  if (Array.isArray(transformed)) {
    const localX = finiteNumber(transformed[0], NaN);
    const localY = finiteNumber(transformed[1], NaN);
    if (Number.isFinite(localX) && Number.isFinite(localY)) return { x: localX, y: localY };
  } else if (isRecordLike(transformed)) {
    const localX = finiteNumber(transformed.x, NaN);
    const localY = finiteNumber(transformed.y, NaN);
    if (Number.isFinite(localX) && Number.isFinite(localY)) return { x: localX, y: localY };
  }
  return {
    x: x - rect.x,
    y: y - rect.y
  };
}

function formatSmithCursorTooltip(state: SmithCursorState): string {
  return [
    `阻抗 = ${formatComplexValue(state.impedance)}  (${formatMagnitudeAngle(state.impedance)})`,
    `导纳 = ${formatComplexValue(state.admittance)}`,
    `反射系数 = ${formatComplexValue(state.gamma)}  (${formatMagnitudeAngle(state.gamma)})`,
    `VSWR = ${formatScalar(state.vswr)}`,
    `Q 值 = ${formatScalar(state.q)}`
  ].join('\n');
}

function formatComplexValue(value: ComplexValue): string {
  return `${formatScalar(value.real)} ${value.imag < 0 ? '-' : '+'} ${formatScalar(Math.abs(value.imag))}j`;
}

function formatMagnitudeAngle(value: ComplexValue): string {
  const magnitude = Math.hypot(value.real, value.imag);
  const angle = Math.atan2(value.imag, value.real) * 180 / Math.PI;
  return `${formatScalar(magnitude)} ∠ ${formatSignedNumber(angle)}°`;
}

function formatSignedNumber(value: number): string {
  return formatScalar(value);
}

function formatScalar(value: number): string {
  if (!Number.isFinite(value)) return '∞';
  const rounded = Math.round(value * 1000) / 1000;
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  return Number.isInteger(normalized) ? String(normalized) : normalized.toFixed(3).replace(/0+$/u, '').replace(/\.$/u, '');
}

function invertComplex(value: ComplexValue): ComplexValue {
  const denominator = value.real ** 2 + value.imag ** 2;
  if (denominator <= 1e-12) return { real: Infinity, imag: Infinity };
  return {
    real: cleanCursorNumber(value.real / denominator),
    imag: cleanCursorNumber(-value.imag / denominator)
  };
}

function normalizeTooltipPadding(value: unknown): [number, number, number, number] {
  if (typeof value === 'number' && Number.isFinite(value)) return [value, value, value, value];
  if (Array.isArray(value) && value.length === 2) {
    const vertical = finiteNumber(value[0], 10);
    const horizontal = finiteNumber(value[1], 12);
    return [vertical, horizontal, vertical, horizontal];
  }
  if (Array.isArray(value) && value.length >= 4) {
    return [
      finiteNumber(value[0], 10),
      finiteNumber(value[1], 12),
      finiteNumber(value[2], 10),
      finiteNumber(value[3], 12)
    ];
  }
  return [10, 12, 10, 12];
}

function estimateTooltipWidth(lines: string[], fontSize: number): number {
  return Math.ceil(Math.max(...lines.map((line) => Array.from(line).reduce((total, char) => (
    total + (char.charCodeAt(0) > 127 ? 1 : 0.58)
  ), 0))) * fontSize);
}

function placeTooltip(
  x: number,
  y: number,
  width: number,
  height: number,
  layout: SmithChartLayoutResult
): { x: number; y: number } {
  const maxX = Math.max(4, layout.width - width - 4);
  const maxY = Math.max(4, layout.height - height - 4);
  const preferredX = x + cursorTooltipOffset + width <= layout.width - 4 ? x + cursorTooltipOffset : x - width - cursorTooltipOffset;
  const preferredY = y + cursorTooltipOffset + height <= layout.height - 4 ? y + cursorTooltipOffset : y - height - cursorTooltipOffset;
  return {
    x: clampNumber(preferredX, 4, maxX),
    y: clampNumber(preferredY, 4, maxY)
  };
}

function setElementInvisible(element: GraphicElement, invisible: boolean): void {
  updateElement(element, { invisible });
}

function updateElement(element: GraphicElement, attrs: Record<string, unknown>): void {
  if (typeof element.attr === 'function') {
    element.attr(attrs);
    return;
  }
  if (isRecordLike(attrs.shape)) element.shape = { ...(element.shape || {}), ...attrs.shape };
  if (isRecordLike(attrs.style)) element.style = { ...(element.style || {}), ...attrs.style };
  if (typeof attrs.invisible === 'boolean') element.invisible = attrs.invisible;
  element.dirty?.();
}

function cleanCursorNumber(value: number): number {
  return Math.abs(value) < 1e-12 ? 0 : value;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function readPointStyle(
  data: SeriesData,
  seriesModel: SmithSeriesModel,
  itemModel: EChartsModel,
  point: SmithPoint
): Record<string, unknown> {
  const itemStyleModel = itemModel.getModel('itemStyle');
  const seriesItemStyleModel = seriesModel.getModel('itemStyle');
  const visualStyle = asRecord(data.getItemVisual(point.dataIndex, 'style'));
  const fill = itemStyleModel.get('color') || visualStyle.fill || seriesItemStyleModel.get('color') || '#2563eb';
  return {
    fill,
    stroke: itemStyleModel.get('borderColor') || seriesItemStyleModel.get('borderColor') || '#ffffff',
    lineWidth: finiteNumber(itemStyleModel.get('borderWidth'), finiteNumber(seriesItemStyleModel.get('borderWidth'), 1.5)),
    opacity: finiteNumber(itemStyleModel.get('opacity'), finiteNumber(seriesItemStyleModel.get('opacity'), 1))
  };
}

function readLineStyle(model: EChartsModel, defaults: Record<string, unknown>): Record<string, unknown> {
  const color = model.get('color') || model.get('stroke') || defaults.stroke || defaults.color;
  const lineType = model.get('type') || defaults.type;
  return {
    stroke: color,
    lineWidth: finiteNumber(model.get('width'), finiteNumber(model.get('lineWidth'), finiteNumber(defaults.lineWidth, 1))),
    opacity: finiteNumber(model.get('opacity'), finiteNumber(defaults.opacity, 1)),
    lineDash: readLineDash(lineType)
  };
}

function resolveCursorLineStyle(model: EChartsModel, baseStyle: Record<string, unknown>): Record<string, unknown> {
  const style = readLineStyle(model, baseStyle);
  return {
    ...baseStyle,
    ...style,
    lineDash: style.lineDash || (model.get('type') == null ? baseStyle.lineDash : null)
  };
}

function readLineDash(type: unknown): number[] | null {
  if (Array.isArray(type)) return type.filter((item): item is number => typeof item === 'number');
  if (type === 'dashed') return [5, 6];
  if (type === 'dotted') return [1.5, 5];
  return null;
}

function createAxisLabelParams(axis: SmithAxisLabelParams['axis'], value: number, referenceImpedance: number): SmithAxisLabelParams {
  const normalized = round(value);
  const impedance = round(value * referenceImpedance);
  return {
    axis,
    value: normalized,
    normalized,
    impedance,
    ohms: impedance,
    referenceImpedance: round(referenceImpedance)
  };
}

function formatAxisLabel(formatter: unknown, value: unknown): string {
  const params = normalizeAxisLabelParams(value);
  if (typeof formatter === 'function') {
    return String((formatter as (value: number, params: SmithAxisLabelParams) => unknown)(params.value, params));
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{value\}/g, formatAxisNumber(params.value))
      .replace(/\{normalized\}/g, formatAxisNumber(params.normalized))
      .replace(/\{impedance\}/g, formatAxisNumber(params.impedance))
      .replace(/\{ohms\}/g, formatAxisNumber(params.ohms))
      .replace(/\{referenceImpedance\}/g, formatAxisNumber(params.referenceImpedance))
      .replace(/\{axis\}/g, params.axis);
  }
  return formatAxisNumber(params.value);
}

function normalizeAxisLabelParams(value: unknown): SmithAxisLabelParams {
  if (isAxisLabelParams(value)) return value;
  const numericValue = finiteNumber(value, 0);
  return createAxisLabelParams('resistance', numericValue, 1);
}

function isAxisLabelParams(value: unknown): value is SmithAxisLabelParams {
  return isPlainAxisLabelRecord(value)
    && (value.axis === 'resistance' || value.axis === 'reactance')
    && typeof value.value === 'number'
    && typeof value.normalized === 'number'
    && typeof value.impedance === 'number'
    && typeof value.ohms === 'number'
    && typeof value.referenceImpedance === 'number';
}

function isPlainAxisLabelRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function formatAxisNumber(value: number): string {
  const rounded = round(value);
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function formatLabel(formatter: unknown, point: SmithPoint): unknown {
  const params = {
    data: point.raw,
    name: point.name,
    value: point.normalized.r,
    resistance: point.normalized.r,
    reactance: point.normalized.x,
    gamma: point.gamma
  };

  if (typeof formatter === 'function') {
    return (formatter as (input: typeof params) => unknown)(params);
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{b\}/g, point.name)
      .replace(/\{c\}/g, formatImpedance(point))
      .replace(/\{r\}/g, String(point.normalized.r))
      .replace(/\{x\}/g, String(point.normalized.x))
      .replace(/\{gamma\}/g, `${round(point.gamma.real)},${round(point.gamma.imag)}`);
  }
  return point.name;
}

function formatImpedance(point: SmithPoint): string {
  const sign = point.normalized.x >= 0 ? '+' : '-';
  return `${round(point.normalized.r)}${sign}j${round(Math.abs(point.normalized.x))}`;
}

function smithPointKey(point: SmithPoint): string {
  return point.id || point.name || `item-${point.dataIndex}`;
}

function readEnterAnimation(
  seriesModel: SmithSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 24);
  return {
    enabled: true,
    duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 520),
    delay: baseDelay + itemIndex * stagger,
    easing: resolveAnimationEasing(option.easing ?? seriesModel.get('animationEasing'))
  };
}

function disabledEnterAnimation(): EnterAnimationConfig {
  return {
    enabled: false,
    duration: 0,
    delay: 0,
    easing: 'cubicOut'
  };
}

function resolveAnimationNumber(value: unknown, item: unknown, itemIndex: number, fallback: number): number {
  const resolved = typeof value === 'function'
    ? (value as (item: unknown, itemIndex: number) => unknown)(item, itemIndex)
    : value;
  return finiteNumber(resolved, fallback);
}

function resolveAnimationEasing(value: unknown): string {
  return typeof value === 'string' && value ? value : 'cubicOut';
}

function applyCircleEnterAnimation(element: GraphicElement, radius: number, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const shape = animatable.shape || {};
  shape.r = 0;
  animatable.shape = shape;
  animateGraphicProperty(animatable, 'shape', animation, { r: radius });
}

function applyFadeEnterAnimation(element: GraphicElement, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const style = animatable.style || {};
  const opacity = finiteNumber(style.opacity, 1);
  style.opacity = 0;
  animatable.style = style;
  animateGraphicProperty(animatable, 'style', animation, { opacity });
}

function animateGraphicProperty(
  element: AnimatableGraphicElement,
  targetKey: AnimationTargetKey,
  animation: EnterAnimationConfig,
  target: Record<string, unknown>
): void {
  const animator = element.animate?.(targetKey);
  if (!animator) {
    Object.assign(element[targetKey] || {}, target);
    return;
  }

  const chain = animator.when(animation.duration, target);
  if (animation.delay > 0) chain.delay?.(animation.delay);
  chain.start(animation.easing);
}

function addHoverElement(item: ElementHoverItem | undefined, element: GraphicElement): void {
  if (!item) return;
  item.elements.push(element);
  if (!item.triggerElements) item.triggerElements = [];
  item.triggerElements.push(element);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export const __test__ = {
  readLayoutOption,
  drawSmithChart,
  drawGrid,
  drawGridLabels,
  createArcElement,
  sampleArcPoints,
  drawSwrCircle,
  drawSeriesLine,
  drawPoints,
  drawPointLabels,
  installSmithCursor,
  createSmithCursorElements,
  updateSmithCursorElements,
  hideSmithCursor,
  resolveSmithCursorState,
  createResistanceCursorCircle,
  sampleReactanceCursorPoints,
  readCursorEventPoint,
  formatSmithCursorTooltip,
  formatComplexValue,
  formatMagnitudeAngle,
  formatSignedNumber,
  formatScalar,
  invertComplex,
  normalizeTooltipPadding,
  estimateTooltipWidth,
  placeTooltip,
  setElementInvisible,
  updateElement,
  cleanCursorNumber,
  clampNumber,
  readPointStyle,
  readLineStyle,
  resolveCursorLineStyle,
  readLineDash,
  createAxisLabelParams,
  formatAxisLabel,
  normalizeAxisLabelParams,
  formatAxisNumber,
  formatLabel,
  formatImpedance,
  smithPointKey,
  readEnterAnimation,
  disabledEnterAnimation,
  resolveAnimationNumber,
  resolveAnimationEasing,
  applyCircleEnterAnimation,
  applyFadeEnterAnimation,
  animateGraphicProperty,
  addHoverElement,
  round,
  finiteNumber,
  asRecord,
  isRecordLike
};
