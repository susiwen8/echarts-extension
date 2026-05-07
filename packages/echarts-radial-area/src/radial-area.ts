import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import { resolveRadialAreaLayout } from './layout.js';
import type { RadialAreaLayoutOption, RadialAreaLayoutResult, RadialAreaPoint, RadialAreaPolarPoint } from './layout.js';

interface ViewRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EChartsApi {
  getWidth(): number;
  getHeight(): number;
  getZr?(): ElementHoverOptions['zrender'];
}

interface EChartsModel {
  get(path: string | string[]): unknown;
  getModel(path: string | string[]): EChartsModel;
}

interface SeriesData {
  initData(source: unknown[]): void;
  count(): number;
  getItemModel(index: number): EChartsModel;
  getItemLayout(dataIndex: number): unknown;
  getItemVisual(dataIndex: number, key: string): unknown;
  setItemLayout(dataIndex: number, layout: [number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface RadialAreaSeriesModel extends EChartsModel {
  option?: RadialAreaLayoutOption;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
}

interface GraphicElement {
  [key: string]: unknown;
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
}

interface GraphicElementOptions {
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  silent?: boolean;
  invisible?: boolean;
  z2?: number;
}

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    createDimensions(source: unknown[], options: Record<string, unknown>): unknown;
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: RadialAreaSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Polygon: new (options: GraphicElementOptions) => GraphicElement;
    Polyline: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}


interface RadialAreaChartView {
  group: GraphicGroup;
  __renderToken?: object | null;
  __hoverController?: ElementHoverController;
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
  'center',
  'radius',
  'innerRadius',
  'outerRadius',
  'startAngle',
  'endAngle',
  'angleSpan',
  'clockwise',
  'closed',
  'angleType',
  'angleField',
  'valueField',
  'minField',
  'maxField',
  'nameField',
  'dimensions',
  'categories',
  'min',
  'max',
  'tickCount',
  'nice'
] as const satisfies ReadonlyArray<Extract<keyof RadialAreaLayoutOption, string>>;
const layerZ = {
  rangeArea: -4,
  valueArea: -3,
  axis: 0,
  line: 4,
  hitSymbol: 7,
  symbol: 8
} as const;

echartsHost.extendSeriesModel({
  type: 'series.radialArea',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: RadialAreaSeriesModel, option: RadialAreaLayoutOption) {
    const source = Array.isArray(option.data) ? option.data : [];
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  getTooltipPosition(this: RadialAreaSeriesModel, dataIndex: number) {
    const layout = this.getData().getItemLayout(dataIndex);
    return Array.isArray(layout) ? layout : undefined;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '96%',
    height: '96%',
    padding: 30,
    center: null,
    radius: null,
    innerRadius: '38%',
    outerRadius: '88%',
    startAngle: 90,
    angleSpan: 360,
    clockwise: true,
    closed: true,
    angleType: null,
    angleField: 'time',
    valueField: 'value',
    minField: 'min',
    maxField: 'max',
    nameField: null,
    dimensions: null,
    categories: null,
    min: null,
    max: null,
    tickCount: 5,
    nice: true,
    enterAnimation: true,
    grid: {
      show: true
    },
    radialAxis: {
      show: true,
      label: {
        show: true,
        color: '#9aa0a6',
        fontSize: 13,
        formatter: '{value}'
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#d8dee8',
          width: 1,
          type: 'dashed',
          opacity: 0.72
        }
      }
    },
    angleAxis: {
      show: true,
      label: {
        show: true,
        color: '#9aa0a6',
        fontSize: 13,
        formatter: '{value}'
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#d8dee8',
          width: 1,
          type: 'dashed',
          opacity: 0.72
        }
      }
    },
    rangeAreaStyle: {
      show: true,
      color: '#c8dbea',
      opacity: 0.82
    },
    areaStyle: {
      show: false,
      color: '#c8dbea',
      opacity: 0.28
    },
    lineStyle: {
      color: '#3f86bd',
      width: 2,
      opacity: 1,
      type: 'solid'
    },
    itemStyle: {
      color: '#3f86bd',
      borderColor: '#ffffff',
      borderWidth: 1.5,
      opacity: 1
    },
    showSymbol: false,
    symbolSize: 5,
    tooltip: {
      trigger: 'item'
    },
    emphasis: {
      itemStyle: {
        borderWidth: 2,
        shadowBlur: 6,
        shadowColor: 'rgba(63, 134, 189, 0.32)'
      }
    }
  }
});

echartsHost.extendChartView({
  type: 'radialArea',

  render(this: RadialAreaChartView, seriesModel: RadialAreaSeriesModel, ecModel: unknown, api: EChartsApi) {
    const group = this.group;
    const renderToken = {};
    this.__renderToken = renderToken;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;

    try {
      const rect = echartsHost.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
        width: api.getWidth(),
        height: api.getHeight()
      });
      const layout = resolveRadialAreaLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawRadialArea(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.error('[radialArea] render failed', error);
      }
    }
  },

  remove(this: RadialAreaChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: RadialAreaChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: RadialAreaSeriesModel, rect: ViewRect): RadialAreaLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: RadialAreaLayoutOption = {
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

function drawRadialArea(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: RadialAreaSeriesModel,
  layout: RadialAreaLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const chartGroup = new echartsInstance.graphic.Group();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  drawAreas(echartsInstance, chartGroup, seriesModel, layout);
  drawGrid(echartsInstance, chartGroup, seriesModel, layout);
  drawLine(echartsInstance, chartGroup, seriesModel, layout);
  const hoverItems = drawSymbols(echartsInstance, chartGroup, seriesModel, layout, rect);

  group.add(chartGroup);
  return hoverItems;
}

function drawGrid(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: RadialAreaSeriesModel,
  layout: RadialAreaLayoutResult
): void {
  const gridModel = seriesModel.getModel('grid');
  if (gridModel.get('show') === false) return;

  const radialAxisModel = seriesModel.getModel('radialAxis');
  const angleAxisModel = seriesModel.getModel('angleAxis');
  const radialSplitLineModel = radialAxisModel.getModel('splitLine');
  const angleSplitLineModel = angleAxisModel.getModel('splitLine');
  const radialLabelModel = radialAxisModel.getModel('label');
  const angleLabelModel = angleAxisModel.getModel('label');
  const option = seriesModel.option || {};
  const radialAxisOption = asRecord(option.radialAxis);
  const angleAxisOption = asRecord(option.angleAxis);
  const radialAxisVisible = radialAxisOption.show !== false && radialAxisModel.get('show') !== false;
  const angleAxisVisible = angleAxisOption.show !== false && angleAxisModel.get('show') !== false;
  const radialSplitLineVisible = nestedOptionValue(radialAxisOption, 'splitLine', 'show') !== false && radialSplitLineModel.get('show') !== false;
  const angleSplitLineVisible = nestedOptionValue(angleAxisOption, 'splitLine', 'show') !== false && angleSplitLineModel.get('show') !== false;
  const radialLabelVisible = nestedOptionValue(radialAxisOption, 'label', 'show') !== false && radialLabelModel.get('show') !== false;
  const angleLabelVisible = nestedOptionValue(angleAxisOption, 'label', 'show') !== false && angleLabelModel.get('show') !== false;

  if (radialAxisVisible && radialSplitLineVisible) {
    const style = readLineStyle(radialSplitLineModel.getModel('lineStyle'), {
      stroke: '#d8dee8',
      lineWidth: 1,
      opacity: 0.72,
      lineDash: [5, 6]
    });

    layout.radialTicks.forEach((tick) => {
      group.add(new echartsInstance.graphic.Circle({
        shape: {
          cx: layout.centerX,
          cy: layout.centerY,
          r: tick.radius
        },
        style: {
          ...style,
          fill: null
        },
        silent: true,
        z2: layerZ.axis
      }));
    });
  }

  if (angleAxisVisible && angleSplitLineVisible) {
    const style = readLineStyle(angleSplitLineModel.getModel('lineStyle'), {
      stroke: '#d8dee8',
      lineWidth: 1,
      opacity: 0.72,
      lineDash: [5, 6]
    });

    layout.angleLabels.forEach((label) => {
      const inner = polarPoint(layout.centerX, layout.centerY, Math.max(layout.innerRadius - 2, 0), label.angle);
      const outer = polarPoint(layout.centerX, layout.centerY, layout.outerRadius, label.angle);
      group.add(new echartsInstance.graphic.Line({
        shape: {
          x1: inner.x,
          y1: inner.y,
          x2: outer.x,
          y2: outer.y
        },
        style,
        silent: true,
        z2: layerZ.axis
      }));
    });
  }

  if (radialAxisVisible && radialLabelVisible) {
    layout.radialTicks.forEach((tick) => {
      const point = polarPoint(layout.centerX, layout.centerY, tick.radius, layout.startAngle);
      group.add(new echartsInstance.graphic.Text({
        style: {
          x: point.x + 8,
          y: point.y,
          text: formatAxisLabel(radialLabelModel.get('formatter'), tick.value),
          fill: radialLabelModel.get('color') || '#9aa0a6',
          fontSize: finiteNumber(radialLabelModel.get('fontSize'), 13),
          fontWeight: radialLabelModel.get('fontWeight') || 400,
          align: 'left',
          verticalAlign: 'middle'
        },
        silent: true,
        z2: layerZ.axis
      }));
    });
  }

  if (angleAxisVisible && angleLabelVisible) {
    layout.angleLabels.forEach((label) => {
      group.add(new echartsInstance.graphic.Text({
        style: {
          x: label.x,
          y: label.y,
          text: formatAxisLabel(angleLabelModel.get('formatter'), label.name),
          fill: angleLabelModel.get('color') || '#9aa0a6',
          fontSize: finiteNumber(angleLabelModel.get('fontSize'), 13),
          fontWeight: angleLabelModel.get('fontWeight') || 400,
          align: label.align,
          verticalAlign: label.verticalAlign
        },
        silent: true,
        z2: layerZ.axis
      }));
    });
  }
}

function drawAreas(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: RadialAreaSeriesModel,
  layout: RadialAreaLayoutResult
): void {
  const rangeAreaModel = seriesModel.getModel('rangeAreaStyle');
  if (rangeAreaModel.get('show') !== false && layout.rangePolygon.length >= 4) {
    const rangeArea = new echartsInstance.graphic.Polygon({
      shape: {
        points: pointsToTuples(layout.rangePolygon, layout.closed)
      },
      style: readAreaStyle(rangeAreaModel, {
        fill: '#c8dbea',
        opacity: 0.82
      }),
      silent: true,
      z2: layerZ.rangeArea
    });
    applyFadeEnterAnimation(rangeArea, readEnterAnimation(seriesModel, 0));
    group.add(rangeArea);
  }

  const areaModel = seriesModel.getModel('areaStyle');
  if (areaModel.get('show') === true && layout.valuePolygon.length >= 2) {
    const valueArea = new echartsInstance.graphic.Polygon({
      shape: {
        points: createValueAreaPoints(layout)
      },
      style: readAreaStyle(areaModel, {
        fill: '#c8dbea',
        opacity: 0.28
      }),
      silent: true,
      z2: layerZ.valueArea
    });
    applyFadeEnterAnimation(valueArea, readEnterAnimation(seriesModel, 1));
    group.add(valueArea);
  }
}

function drawLine(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: RadialAreaSeriesModel,
  layout: RadialAreaLayoutResult
): void {
  if (layout.valuePolygon.length < 2) return;
  const lineStyle = readLineStyle(seriesModel.getModel('lineStyle'), {
    stroke: '#3f86bd',
    lineWidth: 2,
    opacity: 1
  });
  if (!lineStyle.stroke || finiteNumber(lineStyle.lineWidth, 1) <= 0 || finiteNumber(lineStyle.opacity, 1) <= 0) return;

  const line = new echartsInstance.graphic.Polyline({
    shape: {
      points: pointsToTuples(layout.valuePolygon, layout.closed)
    },
    style: {
      ...lineStyle,
      fill: null
    },
    silent: true,
    z2: layerZ.line
  });
  applyPathEnterAnimation(line, 'shape', 'percent', readEnterAnimation(seriesModel, 2));
  group.add(line);
}

function drawSymbols(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: RadialAreaSeriesModel,
  layout: RadialAreaLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const data = seriesModel.getData();
  const showSymbol = seriesModel.get('showSymbol') === true;
  const symbolSize = Math.max(0, finiteNumber(seriesModel.get('symbolSize'), 5));
  const silent = seriesModel.get('silent') === true;
  const hoverItems: ElementHoverItem[] = [];

  layout.points.forEach((point) => {
    if (point.dataIndex < 0 || point.dataIndex >= data.count()) return;

    data.setItemLayout(point.dataIndex, [point.x + rect.x, point.y + rect.y]);
    if (silent) {
      if (showSymbol && symbolSize > 0) {
        const itemModel = data.getItemModel(point.dataIndex);
        const symbol = new echartsInstance.graphic.Circle({
          shape: {
            cx: point.x,
            cy: point.y,
            r: symbolSize / 2
          },
          style: readPointStyle(data, seriesModel, itemModel, point),
          silent: true,
          z2: layerZ.symbol
        });
        data.setItemGraphicEl(point.dataIndex, symbol);
        group.add(symbol);
      }
      return;
    }
    const itemModel = data.getItemModel(point.dataIndex);
    const hitCircle = new echartsInstance.graphic.Circle({
      shape: {
        cx: point.x,
        cy: point.y,
        r: Math.max(symbolSize / 2, 6)
      },
      style: {
        fill: 'rgba(0,0,0,0)',
        stroke: 'rgba(0,0,0,0)',
        opacity: 0
      },
      z2: layerZ.hitSymbol
    });
    data.setItemGraphicEl(point.dataIndex, hitCircle);
    const hoverItem = createHoverItem(hitCircle);
    hoverItems.push(hoverItem);
    group.add(hitCircle);

    if (!showSymbol || symbolSize <= 0) return;

    const symbol = new echartsInstance.graphic.Circle({
      shape: {
        cx: point.x,
        cy: point.y,
        r: symbolSize / 2
      },
      style: readPointStyle(data, seriesModel, itemModel, point),
      z2: layerZ.symbol
    });
    applyCircleEnterAnimation(symbol, symbolSize / 2, readEnterAnimation(seriesModel, point.dataIndex));
    addHoverElement(hoverItem, symbol);
    group.add(symbol);
  });

  return hoverItems;
}

function createValueAreaPoints(layout: RadialAreaLayoutResult): Array<[number, number]> {
  const upper = pointsToTuples(layout.valuePolygon, false);
  const lower = [...layout.points]
    .reverse()
    .map((point) => {
      const base = polarPoint(layout.centerX, layout.centerY, layout.innerRadius, point.angle);
      return [base.x, base.y] as [number, number];
    });

  if (layout.closed && upper.length > 2 && lower.length > 2) {
    const firstBase = polarPoint(layout.centerX, layout.centerY, layout.innerRadius, layout.points[0].angle);
    return upper.concat([upper[0], [firstBase.x, firstBase.y]], lower);
  }

  return upper.concat(lower);
}

function pointsToTuples(points: RadialAreaPolarPoint[], closed: boolean): Array<[number, number]> {
  const tuples = points.map((point) => [point.x, point.y] as [number, number]);
  if (closed && tuples.length > 2) tuples.push(tuples[0]);
  return tuples;
}

function readAreaStyle(model: EChartsModel, defaults: Record<string, unknown>): Record<string, unknown> {
  return {
    fill: model.get('color') || model.get('fill') || defaults.fill,
    opacity: finiteNumber(model.get('opacity'), finiteNumber(defaults.opacity, 1)),
    stroke: model.get('borderColor') || model.get('stroke') || defaults.stroke || null,
    lineWidth: finiteNumber(model.get('borderWidth'), finiteNumber(defaults.lineWidth, 0))
  };
}

function readLineStyle(model: EChartsModel, defaults: Record<string, unknown>): Record<string, unknown> {
  const lineType = model.get('type') || defaults.type;
  return {
    stroke: model.get('color') || model.get('stroke') || defaults.stroke,
    lineWidth: finiteNumber(model.get('width'), finiteNumber(model.get('lineWidth'), finiteNumber(defaults.lineWidth, 1))),
    opacity: finiteNumber(model.get('opacity'), finiteNumber(defaults.opacity, 1)),
    lineDash: readLineDash(lineType)
  };
}

function readLineDash(type: unknown): number[] | null {
  if (Array.isArray(type)) return type.filter((item): item is number => typeof item === 'number');
  if (type === 'dashed') return [5, 6];
  if (type === 'dotted') return [1.5, 5];
  return null;
}

function readPointStyle(
  data: SeriesData,
  seriesModel: RadialAreaSeriesModel,
  itemModel: EChartsModel,
  point: RadialAreaPoint
): Record<string, unknown> {
  const itemStyleModel = itemModel.getModel('itemStyle');
  const seriesItemStyleModel = seriesModel.getModel('itemStyle');
  const visualStyle = asRecord(data.getItemVisual(point.dataIndex, 'style'));
  return {
    fill: itemStyleModel.get('color') || visualStyle.fill || seriesItemStyleModel.get('color') || '#3f86bd',
    stroke: itemStyleModel.get('borderColor') || seriesItemStyleModel.get('borderColor') || '#ffffff',
    lineWidth: finiteNumber(itemStyleModel.get('borderWidth'), finiteNumber(seriesItemStyleModel.get('borderWidth'), 1.5)),
    opacity: finiteNumber(itemStyleModel.get('opacity'), finiteNumber(seriesItemStyleModel.get('opacity'), 1))
  };
}

function formatAxisLabel(formatter: unknown, value: unknown): string {
  if (typeof formatter === 'function') {
    return String(formatter(value));
  }
  if (typeof formatter === 'string') {
    return formatter.replace(/\{value\}/g, String(value));
  }
  return String(value);
}

function polarPoint(centerX: number, centerY: number, radius: number, angle: number): { x: number; y: number } {
  const radians = angle * Math.PI / 180;
  return {
    x: centerX + Math.cos(radians) * radius,
    y: centerY - Math.sin(radians) * radius
  };
}

function readEnterAnimation(
  seriesModel: RadialAreaSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 40);
  return {
    enabled: true,
    duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 680),
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

function applyPathEnterAnimation(
  element: GraphicElement,
  targetKey: AnimationTargetKey,
  propertyName: 'percent' | 'strokePercent',
  animation: EnterAnimationConfig
): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const target = animatable[targetKey] || {};
  target[propertyName] = 0;
  animatable[targetKey] = target;
  animateGraphicProperty(animatable, targetKey, animation, { [propertyName]: 1 });
}

function applyCircleEnterAnimation(element: GraphicElement, radius: number, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const shape = animatable.shape || {};
  const style = animatable.style || {};
  const opacity = finiteNumber(style.opacity, 1);
  shape.r = 0;
  style.opacity = 0;
  animatable.shape = shape;
  animatable.style = style;
  animateGraphicProperty(animatable, 'shape', animation, { r: radius });
  animateGraphicProperty(animatable, 'style', animation, { opacity });
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

function asRecord(value: unknown): Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]' ? value as Record<string, unknown> : {};
}

function nestedOptionValue(record: Record<string, unknown>, parentKey: string, childKey: string): unknown {
  return asRecord(record[parentKey])[childKey];
}

function finiteNumber(value: unknown, fallback: number): number {
  const numberValue = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : NaN;
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function createHoverItem(element: GraphicElement): ElementHoverItem {
  return {
    elements: [element],
    triggerElements: [element]
  };
}

function addHoverElement(item: ElementHoverItem | undefined, element: GraphicElement): void {
  if (!item) return;
  item.elements.push(element);
  if (!item.triggerElements) item.triggerElements = [];
  item.triggerElements.push(element);
}
