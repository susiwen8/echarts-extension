import * as echarts from 'echarts/lib/echarts';

import {
  createSeriesDataSource,
  resolveSeasonalRadialLayout
} from './layout.js';
import type {
  SeasonalRadialLayoutOption,
  SeasonalRadialLayoutResult,
  SeasonalRadialPanel,
  SeasonalRadialPoint,
  SeasonalRadialTrack
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

interface SeasonalRadialSeriesModel extends EChartsModel {
  option?: SeasonalRadialLayoutOption;
  seriesIndex: number;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
}

interface GraphicElement {
  [key: string]: unknown;
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
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
    getECData?: (element: GraphicElement) => {
      dataIndex?: number;
      dataType?: unknown;
      seriesIndex?: number;
      ssrType?: string;
    };
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: SeasonalRadialSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Polyline: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}

interface SeasonalRadialChartView {
  group: GraphicGroup;
}

interface EnterAnimationConfig {
  enabled: boolean;
  duration: number;
  delay: number;
  easing: string;
}

type LineDash = number[] | null;
type AnimationTargetKey = 'shape' | 'style';

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'padding',
  'panelGap',
  'center',
  'radius',
  'innerRadius',
  'outerRadius',
  'startAngle',
  'clockwise',
  'closed',
  'groupField',
  'yearField',
  'monthField',
  'valueField',
  'nameField',
  'dimensions',
  'groups',
  'months',
  'min',
  'max',
  'tickCount',
  'nice',
  'highlightYear'
] as const satisfies ReadonlyArray<Extract<keyof SeasonalRadialLayoutOption, string>>;
const layerZ = {
  axis: 0,
  historyLine: 3,
  highlightLine: 5,
  hit: 7,
  symbol: 8,
  label: 9
} as const;

echartsHost.extendSeriesModel({
  type: 'series.seasonalRadial',

  visualStyleAccessPath: 'lineStyle',
  visualDrawType: 'stroke',

  getInitialData(this: SeasonalRadialSeriesModel, option: SeasonalRadialLayoutOption) {
    const source = createSeriesDataSource(option);
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  getTooltipPosition(this: SeasonalRadialSeriesModel, dataIndex: number) {
    const layout = this.getData().getItemLayout(dataIndex);
    /* v8 ignore next -- ECharts owns the missing-layout defensive path. */
    return Array.isArray(layout) ? layout : undefined;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '100%',
    height: '100%',
    padding: {
      top: 72,
      right: 48,
      bottom: 62,
      left: 48
    },
    panelGap: null,
    center: null,
    radius: null,
    innerRadius: 0,
    outerRadius: null,
    startAngle: 90,
    clockwise: true,
    closed: true,
    groupField: 'group',
    yearField: 'year',
    monthField: 'month',
    valueField: 'value',
    nameField: null,
    dimensions: null,
    groups: null,
    months: null,
    min: null,
    max: null,
    tickCount: 3,
    nice: true,
    highlightYear: 'latest',
    enterAnimation: true,
    showSymbol: false,
    highlightSymbol: true,
    symbolSize: 8,
    grid: {
      show: true
    },
    radialAxis: {
      show: true,
      label: {
        show: true,
        color: '#b5b5b5',
        fontSize: 14,
        fontWeight: 400,
        formatter: '{value}'
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#44484d',
          width: 1,
          opacity: 0.72,
          type: 'solid'
        }
      }
    },
    angleAxis: {
      show: true,
      label: {
        show: true,
        color: '#d7d7d7',
        fontSize: 14,
        fontWeight: 400,
        formatter: '{value}'
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#5d6268',
          width: 1,
          opacity: 0.62,
          type: 'dashed'
        }
      }
    },
    lineStyle: {
      color: '#c99a2d',
      width: 2,
      opacity: 0.82
    },
    historyLineStyle: {
      color: '#9f7620',
      width: 1.8,
      opacity: 0.68
    },
    highlightLineStyle: {
      color: '#e5c65a',
      width: 2.8,
      opacity: 1
    },
    itemStyle: {
      color: '#e5c65a',
      borderColor: '#000000',
      borderWidth: 2,
      opacity: 1
    },
    groupLabel: {
      show: true,
      color: '#f2f2f2',
      fontSize: 18,
      fontWeight: 700,
      formatter: '{value}'
    },
    yearLabel: {
      show: true,
      color: '#f2f2f2',
      fontSize: 16,
      fontWeight: 650,
      formatter: '{value}'
    },
    tooltip: {
      trigger: 'item'
    }
  }
});

echartsHost.extendChartView({
  type: 'seasonalRadial',

  render(this: SeasonalRadialChartView, seriesModel: SeasonalRadialSeriesModel, _ecModel: unknown, api: EChartsApi) {
    const group = this.group;
    group.removeAll();

    const rect = echartsHost.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
      width: api.getWidth(),
      height: api.getHeight()
    });
    group.x = rect.x;
    group.y = rect.y;

    const layout = resolveSeasonalRadialLayout(readLayoutOption(seriesModel, rect));
    drawGrid(echartsHost, group, seriesModel, layout);
    drawTracks(echartsHost, group, seriesModel, layout, rect);
  },

  /* v8 ignore start -- ECharts lifecycle hook, exercised indirectly by dispose. */
  remove(this: SeasonalRadialChartView) {
    this.group.removeAll();
  },
  /* v8 ignore stop */

  dispose(this: SeasonalRadialChartView) {
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: SeasonalRadialSeriesModel, rect: ViewRect): SeasonalRadialLayoutOption {
  const option: SeasonalRadialLayoutOption = {
    /* v8 ignore next -- defensive default for invalid series data. */
    data: Array.isArray(seriesModel.option?.data) ? seriesModel.option.data : [],
    width: rect.width,
    height: rect.height
  };

  optionKeys.forEach((key) => {
    const value = seriesModel.get(key);
    if (value !== undefined && value !== null) {
      (option as Record<string, unknown>)[key] = value;
    }
  });

  return option;
}

function drawGrid(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SeasonalRadialSeriesModel,
  layout: SeasonalRadialLayoutResult
): void {
  const gridModel = seriesModel.getModel('grid');
  const radialAxisModel = seriesModel.getModel('radialAxis');
  const angleAxisModel = seriesModel.getModel('angleAxis');
  const radialLabelModel = radialAxisModel.getModel('label');
  const radialSplitModel = radialAxisModel.getModel(['splitLine', 'lineStyle']);
  const angleLabelModel = angleAxisModel.getModel('label');
  const angleSplitModel = angleAxisModel.getModel(['splitLine', 'lineStyle']);
  const gridVisible = gridModel.get('show') !== false;
  const radialAxisVisible = radialAxisModel.get('show') !== false;
  const angleAxisVisible = angleAxisModel.get('show') !== false;

  layout.groups.forEach((panel) => {
    drawGroupLabel(echartsInstance, group, seriesModel, panel);

    if (gridVisible && radialAxisVisible && radialAxisModel.get(['splitLine', 'show']) !== false) {
      drawRadialRings(echartsInstance, group, panel, radialSplitModel);
    }
    if (gridVisible && angleAxisVisible && angleAxisModel.get(['splitLine', 'show']) !== false) {
      drawAngleSpokes(echartsInstance, group, panel, angleSplitModel);
    }
    if (radialAxisVisible && radialLabelModel.get('show') !== false) {
      drawRadialLabels(echartsInstance, group, panel, radialLabelModel);
    }
    if (angleAxisVisible && angleLabelModel.get('show') !== false) {
      drawMonthLabels(echartsInstance, group, panel, angleLabelModel);
    }
  });
}

function drawGroupLabel(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SeasonalRadialSeriesModel,
  panel: SeasonalRadialPanel
): void {
  const labelModel = seriesModel.getModel('groupLabel');
  if (labelModel.get('show') === false) return;
  const text = formatAxisLabel(labelModel.get('formatter'), panel.name);
  if (!text) return;

  group.add(new echartsInstance.graphic.Text({
    style: {
      x: panel.centerX,
      y: panel.centerY - panel.labelRadius - 34,
      text,
      fill: labelModel.get('color') || '#f2f2f2',
      fontSize: finiteNumber(labelModel.get('fontSize'), 18),
      fontWeight: labelModel.get('fontWeight') || 700,
      align: 'center',
      verticalAlign: 'middle'
    },
    silent: true,
    z2: layerZ.label
  }));
}

function drawRadialRings(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  panel: SeasonalRadialPanel,
  lineModel: EChartsModel
): void {
  const style = readLineStyle(lineModel, {
    stroke: '#44484d',
    lineWidth: 1,
    opacity: 0.72
  });
  if (!style.stroke || finiteNumber(style.lineWidth, 1) <= 0 || finiteNumber(style.opacity, 1) <= 0) return;

  panel.ticks.forEach((tick) => {
    if (tick.radius <= panel.innerRadius + 0.1) return;
    group.add(new echartsInstance.graphic.Circle({
      shape: {
        cx: panel.centerX,
        cy: panel.centerY,
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

function drawAngleSpokes(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  panel: SeasonalRadialPanel,
  lineModel: EChartsModel
): void {
  const style = readLineStyle(lineModel, {
    stroke: '#5d6268',
    lineWidth: 1,
    opacity: 0.62,
    lineDash: [6, 6]
  });
  if (!style.stroke || finiteNumber(style.lineWidth, 1) <= 0 || finiteNumber(style.opacity, 1) <= 0) return;

  panel.monthLabels.forEach((label) => {
    const inner = polarPoint(panel.centerX, panel.centerY, panel.innerRadius, label.angle);
    const outer = polarPoint(panel.centerX, panel.centerY, panel.labelRadius - 12, label.angle);
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

function drawRadialLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  panel: SeasonalRadialPanel,
  labelModel: EChartsModel
): void {
  panel.ticks.forEach((tick) => {
    if (tick.radius <= panel.innerRadius + 0.1) return;
    group.add(new echartsInstance.graphic.Text({
      style: {
        x: panel.centerX + 8,
        y: panel.centerY - tick.radius,
        text: formatAxisLabel(labelModel.get('formatter'), tick.value),
        fill: labelModel.get('color') || '#b5b5b5',
        fontSize: finiteNumber(labelModel.get('fontSize'), 14),
        fontWeight: labelModel.get('fontWeight') || 400,
        align: 'left',
        verticalAlign: 'middle'
      },
      silent: true,
      z2: layerZ.axis
    }));
  });
}

function drawMonthLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  panel: SeasonalRadialPanel,
  labelModel: EChartsModel
): void {
  panel.monthLabels.forEach((label) => {
    group.add(new echartsInstance.graphic.Text({
      style: {
        x: label.x,
        y: label.y,
        text: formatAxisLabel(labelModel.get('formatter'), label.name),
        fill: labelModel.get('color') || '#d7d7d7',
        fontSize: finiteNumber(labelModel.get('fontSize'), 14),
        fontWeight: labelModel.get('fontWeight') || 400,
        align: label.align,
        verticalAlign: label.verticalAlign
      },
      silent: true,
      z2: layerZ.axis
    }));
  });
}

function drawTracks(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SeasonalRadialSeriesModel,
  layout: SeasonalRadialLayoutResult,
  rect: ViewRect
): void {
  let enterIndex = 0;
  layout.groups.forEach((panel) => {
    panel.tracks.forEach((track) => {
      drawTrack(echartsInstance, group, seriesModel, track, enterIndex);
      drawTrackHitTargets(echartsInstance, group, seriesModel, track, rect);
      drawTrackSymbols(echartsInstance, group, seriesModel, track, enterIndex);
      drawYearLabel(echartsInstance, group, seriesModel, track, enterIndex);
      enterIndex += 1;
    });
  });
}

function drawTrack(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SeasonalRadialSeriesModel,
  track: SeasonalRadialTrack,
  enterIndex = trackEnterAnimationIndex(track)
): void {
  if (track.closedPoints.length < 2) return;
  const lineModel = track.highlighted
    ? seriesModel.getModel('highlightLineStyle')
    : seriesModel.getModel('historyLineStyle');
  const fallback = readLineStyle(seriesModel.getModel('lineStyle'), {
    stroke: '#c99a2d',
    lineWidth: 2,
    opacity: 0.82
  });
  const style = readLineStyle(lineModel, {
    /* v8 ignore next -- visual fallback branch is default style plumbing. */
    stroke: fallback.stroke || '#c99a2d',
    lineWidth: track.highlighted ? 2.8 : 1.8,
    opacity: track.highlighted ? 1 : 0.68,
    lineDash: fallback.lineDash
  });
  if (!style.stroke || finiteNumber(style.lineWidth, 1) <= 0 || finiteNumber(style.opacity, 1) <= 0) return;

  const line = new echartsInstance.graphic.Polyline({
    shape: {
      points: track.closedPoints.map((point) => [point.x, point.y])
    },
    style: {
      ...style,
      fill: null
    },
    silent: true,
    z2: track.highlighted ? layerZ.highlightLine : layerZ.historyLine
  });
  applyPathEnterAnimation(line, readEnterAnimation(seriesModel, enterIndex));
  group.add(line);
}

function drawTrackHitTargets(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SeasonalRadialSeriesModel,
  track: SeasonalRadialTrack,
  rect: ViewRect
): void {
  const data = seriesModel.getData();
  track.points.forEach((point) => {
    const hit = new echartsInstance.graphic.Circle({
      shape: {
        cx: point.x,
        cy: point.y,
        r: 9
      },
      style: {
        fill: '#000',
        opacity: 0
      },
      invisible: false,
      silent: seriesModel.get('silent') === true,
      z2: layerZ.hit
    });
    bindTooltipData(echartsInstance, seriesModel, hit, point);
    data.setItemLayout(point.dataIndex, [rect.x + point.x, rect.y + point.y]);
    data.setItemGraphicEl(point.dataIndex, hit);
    group.add(hit);
  });
}

function drawTrackSymbols(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SeasonalRadialSeriesModel,
  track: SeasonalRadialTrack,
  enterIndex = trackEnterAnimationIndex(track)
): void {
  const showSymbol = seriesModel.get('showSymbol') === true;
  const showHighlightSymbol = seriesModel.get('highlightSymbol') !== false;
  if (!showSymbol && (!track.highlighted || !showHighlightSymbol)) return;
  const symbolSize = Math.max(1, finiteNumber(seriesModel.get('symbolSize'), 8));
  const itemModel = seriesModel.getModel('itemStyle');
  const style = readItemStyle(itemModel, {
    fill: '#e5c65a',
    stroke: '#000000',
    lineWidth: 2,
    opacity: 1
  });
  /* v8 ignore next -- symbol source choice is covered through rendered highlight and all-symbol modes. */
  const points = showSymbol ? track.points : track.label ? [track.label.point] : [];

  points.forEach((point, pointIndex) => {
    const symbol = new echartsInstance.graphic.Circle({
      shape: {
        cx: point.x,
        cy: point.y,
        r: symbolSize / 2
      },
      style,
      silent: true,
      z2: layerZ.symbol
    });
    applyCircleEnterAnimation(symbol, symbolSize / 2, readEnterAnimation(seriesModel, enterIndex + pointIndex));
    group.add(symbol);
  });
}

function drawYearLabel(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SeasonalRadialSeriesModel,
  track: SeasonalRadialTrack,
  enterIndex = trackEnterAnimationIndex(track)
): void {
  const label = track.label;
  if (!label) return;
  const labelModel = seriesModel.getModel('yearLabel');
  if (labelModel.get('show') === false) return;
  const text = formatAxisLabel(labelModel.get('formatter'), label.text);
  if (!text) return;

  const textElement = new echartsInstance.graphic.Text({
    style: {
      x: label.x + 10,
      y: label.y,
      text,
      fill: labelModel.get('color') || '#f2f2f2',
      fontSize: finiteNumber(labelModel.get('fontSize'), 16),
      fontWeight: labelModel.get('fontWeight') || 650,
      align: 'left',
      verticalAlign: 'middle'
    },
    silent: true,
    z2: layerZ.label
  });
  applyFadeEnterAnimation(textElement, readEnterAnimation(seriesModel, enterIndex));
  group.add(textElement);
}

function bindTooltipData(
  echartsInstance: EChartsHost,
  seriesModel: SeasonalRadialSeriesModel,
  element: GraphicElement,
  point: SeasonalRadialPoint
): void {
  const data = echartsInstance.helper.getECData?.(element);
  if (!data) return;
  data.dataIndex = point.dataIndex;
  data.dataType = 'seasonalRadial';
  data.seriesIndex = seriesModel.seriesIndex;
  data.ssrType = 'chart';
}

function readLineStyle(model: EChartsModel, fallback: Record<string, unknown>): Record<string, unknown> {
  const color = model.get('color') || model.get('stroke') || fallback.stroke;
  const width = finiteNumber(model.get('width'), finiteNumber(model.get('lineWidth'), finiteNumber(fallback.lineWidth, 1)));
  const opacity = finiteNumber(model.get('opacity'), finiteNumber(fallback.opacity, 1));
  const dash = readLineDash(model.get('type')) ?? readLineDash(model.get('lineDash')) ?? readLineDash(fallback.lineDash);
  return {
    stroke: color,
    lineWidth: width,
    opacity,
    lineDash: dash
  };
}

function readItemStyle(model: EChartsModel, fallback: Record<string, unknown>): Record<string, unknown> {
  return {
    /* v8 ignore next -- visual fallback branch is default style plumbing. */
    fill: model.get('color') || fallback.fill,
    /* v8 ignore next -- visual fallback branch is default style plumbing. */
    stroke: model.get('borderColor') || fallback.stroke,
    lineWidth: finiteNumber(model.get('borderWidth'), finiteNumber(fallback.lineWidth, 0)),
    opacity: finiteNumber(model.get('opacity'), finiteNumber(fallback.opacity, 1))
  };
}

function readLineDash(value: unknown): LineDash {
  if (Array.isArray(value)) return value.filter((item): item is number => Number.isFinite(item));
  if (value === 'dashed') return [6, 6];
  if (value === 'dotted') return [1.5, 5];
  return null;
}

function formatAxisLabel(formatter: unknown, value: unknown): string {
  if (typeof formatter === 'function') {
    const result = (formatter as (value: unknown) => unknown)(value);
    return result == null ? '' : String(result);
  }
  if (typeof formatter === 'string') return formatter.replace(/\{value\}/g, String(value));
  return String(value);
}

function polarPoint(centerX: number, centerY: number, radius: number, angle: number): { x: number; y: number } {
  const radian = angle * Math.PI / 180;
  return {
    x: centerX + Math.cos(radian) * radius,
    y: centerY - Math.sin(radian) * radius
  };
}

function readEnterAnimation(
  seriesModel: SeasonalRadialSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 36);
  return {
    enabled: true,
    duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 720),
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

function applyPathEnterAnimation(element: GraphicElement, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const style = animatable.style || {};
  style.strokePercent = 0;
  animatable.style = style;
  animateGraphicProperty(animatable, 'style', animation, { strokePercent: 1 });
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

function trackEnterAnimationIndex(track: SeasonalRadialTrack): number {
  return track.points[0]?.dataIndex ?? 0;
}

function asRecord(value: unknown): Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]' ? value as Record<string, unknown> : {};
}

function finiteNumber(value: unknown, fallback: number): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

export const __test__ = {
  bindTooltipData,
  drawGrid,
  drawGroupLabel,
  drawRadialRings,
  drawAngleSpokes,
  drawRadialLabels,
  drawMonthLabels,
  drawTrack,
  drawTrackHitTargets,
  drawTrackSymbols,
  drawTracks,
  drawYearLabel,
  formatAxisLabel,
  polarPoint,
  readEnterAnimation,
  disabledEnterAnimation,
  resolveAnimationNumber,
  resolveAnimationEasing,
  applyPathEnterAnimation,
  applyCircleEnterAnimation,
  applyFadeEnterAnimation,
  animateGraphicProperty,
  trackEnterAnimationIndex,
  asRecord,
  readItemStyle,
  readLayoutOption,
  readLineDash,
  readLineStyle,
  finiteNumber
};
