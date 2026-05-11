import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive, setAliveRenderKey } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import { resolveSunriseSunsetLayout } from './layout.js';
import type {
  SunriseSunsetEventLayout,
  SunriseSunsetLayoutOption,
  SunriseSunsetLayoutResult,
  SunriseSunsetPoint
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
  setItemLayout(dataIndex: number, layout: [number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface SunriseSunsetSeriesModel extends EChartsModel {
  option?: SunriseSunsetLayoutOption;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
}

interface GraphicElement {
  [key: string]: unknown;
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  setClipPath?: (clipPath: GraphicElement) => void;
  getClipPath?: () => GraphicElement | null | undefined;
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
  z2?: number;
}

interface GraphicRect {
  [key: string]: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    createDimensions(source: unknown[], options: Record<string, unknown>): unknown;
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: SunriseSunsetSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Polygon: new (options: GraphicElementOptions) => GraphicElement;
    Polyline: new (options: GraphicElementOptions) => GraphicElement;
    Rect: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
    makeImage?: (imageUrl: string, rect: GraphicRect, layout?: 'center' | 'cover') => GraphicElement;
    makePath?: (
      path: string,
      options: GraphicElementOptions,
      rect?: GraphicRect,
      layout?: 'center' | 'cover'
    ) => GraphicElement;
  };
}


interface SunriseSunsetChartView {
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

interface IconMotionConfig {
  animation: EnterAnimationConfig;
  motionPoints: SunriseSunsetPoint[];
  yOffset: number;
  forceGroup?: boolean;
  key?: string;
}

interface ResolvedCustomIcon {
  type: 'path' | 'image';
  source: string;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  style: Record<string, unknown>;
}

type AnimationTargetKey = '' | 'shape' | 'style';

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'sunrise',
  'sunset',
  'moonrise',
  'moonset',
  'currentTime',
  'updatedAt',
  'title',
  'remainingText',
  'updatedText',
  'padding',
  'baselineY',
  'dayArcHeight',
  'moonArcHeight',
  'moonStartRatio',
  'moonEndRatio'
] as const satisfies ReadonlyArray<Extract<keyof SunriseSunsetLayoutOption, string>>;

echartsHost.extendSeriesModel({
  type: 'series.sunriseSunset',

  visualDrawType: 'fill',

  getInitialData(this: SunriseSunsetSeriesModel, option: SunriseSunsetLayoutOption) {
    const source = readSource(option);
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '100%',
    height: '100%',
    padding: 72,
    baselineY: null,
    dayArcHeight: null,
    moonArcHeight: null,
    moonStartRatio: 0.28,
    moonEndRatio: 0.72,
    sunrise: '05:12',
    sunset: '18:39',
    moonrise: '22:08',
    moonset: '07:59',
    currentTime: null,
    updatedAt: null,
    title: null,
    remainingText: null,
    updatedText: null,
    enterAnimation: true,
    sunIcon: null,
    moonIcon: null,
    backgroundStyle: {
      color: '#202124',
      opacity: 1
    },
    baselineStyle: {
      color: '#3f4245',
      width: 1.2,
      opacity: 1
    },
    dayLineStyle: {
      color: '#ffa72b',
      width: 5,
      opacity: 1
    },
    moonLineStyle: {
      color: '#5a91f2',
      width: 4,
      opacity: 0.72
    },
    dayAreaStyle: {
      color: 'rgba(255, 167, 43, 0.2)',
      opacity: 1
    },
    moonAreaStyle: {
      color: 'rgba(90, 145, 242, 0.16)',
      opacity: 1
    },
    titleLabel: {
      show: true,
      color: '#f5f6f7',
      fontSize: 46,
      fontWeight: 650
    },
    remainingLabel: {
      show: true,
      color: '#ffffff',
      fontSize: 76,
      fontWeight: 300
    },
    updatedLabel: {
      show: true,
      color: '#aeb0b5',
      fontSize: 34,
      fontWeight: 500
    },
    eventLabel: {
      show: true,
      color: '#eef0f2',
      fontSize: 36,
      fontWeight: 420
    },
    tooltip: {
      trigger: 'item'
    }
  }
});

echartsHost.extendChartView({
  type: 'sunriseSunset',

  render(this: SunriseSunsetChartView, seriesModel: SunriseSunsetSeriesModel, ecModel: unknown, api: EChartsApi) {
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
      const layout = resolveSunriseSunsetLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawSunriseSunset(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
    } catch (error) {
      console.error('[sunriseSunset] render failed', error);
    }
  },

  remove(this: SunriseSunsetChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: SunriseSunsetChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: SunriseSunsetSeriesModel, rect: ViewRect): SunriseSunsetLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: SunriseSunsetLayoutOption = {
    data: option.data,
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

function readSource(option: SunriseSunsetLayoutOption): unknown[] {
  if (Array.isArray(option.data)) return option.data;
  if (isPlainObject(option.data)) return [option.data];
  return [{
    name: 'sunrise-sunset',
    value: 0,
    sunrise: option.sunrise,
    sunset: option.sunset,
    moonrise: option.moonrise,
    moonset: option.moonset
  }];
}

function drawSunriseSunset(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SunriseSunsetSeriesModel,
  layout: SunriseSunsetLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const chartGroup = new echartsInstance.graphic.Group();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  const backgroundColor = String(readStyleValue(seriesModel, 'backgroundStyle', 'color', '#202124'));
  drawBackground(echartsInstance, chartGroup, seriesModel, layout);
  drawHeader(echartsInstance, chartGroup, seriesModel, layout);
  drawSky(echartsInstance, chartGroup, seriesModel, layout, backgroundColor);
  const hoverItems = drawEvents(echartsInstance, chartGroup, seriesModel, layout, backgroundColor);

  const data = seriesModel.getData();
  if (data.count() > 0) {
    data.setItemLayout(0, [layout.day.current.x, layout.day.current.y]);
    data.setItemGraphicEl(0, chartGroup);
  }

  group.add(chartGroup);
  return hoverItems;
}

function drawBackground(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SunriseSunsetSeriesModel,
  layout: SunriseSunsetLayoutResult
): void {
  const backgroundStyle = asRecord(seriesModel.get('backgroundStyle'));
  const color = backgroundStyle.color ?? '#202124';
  const opacity = finiteNumber(backgroundStyle.opacity, 1);
  if (!color || opacity <= 0) return;

  group.add(new echartsInstance.graphic.Rect({
    shape: {
      x: 0,
      y: 0,
      width: layout.width,
      height: layout.height
    },
    style: {
      fill: color,
      opacity
    },
    silent: true,
    z2: -10
  }));
}

function drawHeader(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SunriseSunsetSeriesModel,
  layout: SunriseSunsetLayoutResult
): void {
  const centerX = layout.width / 2;
  const titleModel = seriesModel.getModel('titleLabel');
  const remainingModel = seriesModel.getModel('remainingLabel');
  const updatedModel = seriesModel.getModel('updatedLabel');
  const top = Math.max(26, layout.height * 0.06);

  if (titleModel.get('show')) {
    group.add(createText(echartsInstance, {
      x: centerX,
      y: top,
      text: formatHeaderText(titleModel.get('formatter'), layout.title, layout),
      fill: titleModel.get('color') || '#f5f6f7',
      fontSize: finiteNumber(titleModel.get('fontSize'), 46),
      fontWeight: titleModel.get('fontWeight') || 650,
      align: 'center',
      verticalAlign: 'top'
    }));
  }

  if (remainingModel.get('show')) {
    group.add(createText(echartsInstance, {
      x: centerX,
      y: top + layout.height * 0.094,
      text: formatHeaderText(remainingModel.get('formatter'), layout.remainingText, layout),
      fill: remainingModel.get('color') || '#ffffff',
      fontSize: finiteNumber(remainingModel.get('fontSize'), 76),
      fontWeight: remainingModel.get('fontWeight') || 300,
      align: 'center',
      verticalAlign: 'top'
    }));
  }

  if (updatedModel.get('show') && layout.updatedText) {
    group.add(createText(echartsInstance, {
      x: centerX,
      y: top + layout.height * 0.22,
      text: formatHeaderText(updatedModel.get('formatter'), layout.updatedText, layout),
      fill: updatedModel.get('color') || '#aeb0b5',
      fontSize: finiteNumber(updatedModel.get('fontSize'), 34),
      fontWeight: updatedModel.get('fontWeight') || 500,
      align: 'center',
      verticalAlign: 'top'
    }));
  }
}

function drawSky(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SunriseSunsetSeriesModel,
  layout: SunriseSunsetLayoutResult,
  backgroundColor: string
): void {
  const dayLineStyle = readLineStyle(seriesModel, 'dayLineStyle', '#ffa72b', 5, 1);
  const moonLineStyle = readLineStyle(seriesModel, 'moonLineStyle', '#5a91f2', 4, 0.72);
  const baselineStyle = readLineStyle(seriesModel, 'baselineStyle', '#3f4245', 1.2, 1);
  const dayAreaStyle = asRecord(seriesModel.get('dayAreaStyle'));
  const moonAreaStyle = asRecord(seriesModel.get('moonAreaStyle'));
  const sunIcon = seriesModel.get('sunIcon');
  const moonIcon = seriesModel.get('moonIcon');
  const dayAreaAnimation = readEnterAnimation(seriesModel, 0);
  const dayFutureAnimation = readEnterAnimation(seriesModel, 1);
  const daySolidAnimation = readEnterAnimation(seriesModel, 2);
  const moonFullAnimation = readEnterAnimation(seriesModel, 3);
  const moonSolidAnimation = readEnterAnimation(seriesModel, 4);
  const baselineAnimation = readEnterAnimation(seriesModel, 5);
  const forceMotionGroup = isAliveRenderUpdate(seriesModel);

  if (layout.moon.visible && layout.moon.progress > 0 && layout.moon.areaPoints.length >= 3) {
    addPolygon(echartsInstance, group, layout.moon.areaPoints, {
      fill: moonAreaStyle.color || 'rgba(90, 145, 242, 0.16)',
      stroke: null,
      opacity: finiteNumber(moonAreaStyle.opacity, 1)
    }, true, -3, moonFullAnimation, 'sky:moon-area', createArcProgressClip(layout.moon.start, layout.moon.end, layout.height, layout.moon.progress, 0), moonSolidAnimation);
  }

  const dayAreaPoints = createStackedAreaPoints(layout.day.fullPoints, layout.moon.fullPoints, layout.baselineY);
  if (layout.day.visible && layout.day.progress > 0 && dayAreaPoints.length >= 3) {
    addPolygon(echartsInstance, group, dayAreaPoints, {
      fill: dayAreaStyle.color || 'rgba(255, 167, 43, 0.2)',
      stroke: null,
      opacity: finiteNumber(dayAreaStyle.opacity, 1)
    }, true, -2, dayAreaAnimation, 'sky:day-area', createArcProgressClip(layout.day.start, layout.day.end, layout.height, layout.day.progress, 0), daySolidAnimation);
  }

  if (layout.day.visible && layout.day.progress < 1) {
    const dayFutureClip = createArcFutureClip(
      layout.day.start,
      layout.day.end,
      layout.height,
      layout.day.progress,
      dayLineStyle.lineWidth
    );
    const dayFutureEnterClip = createArcFutureClip(
      layout.day.start,
      layout.day.end,
      layout.height,
      0,
      dayLineStyle.lineWidth
    );
    addPolyline(echartsInstance, group, layout.day.fullPoints, {
      fill: null,
      stroke: dayLineStyle.stroke,
      lineWidth: dayLineStyle.lineWidth,
      opacity: Math.max(dayLineStyle.opacity * 0.42, 0.12),
      lineDash: [7, 8],
      lineCap: 'round',
      lineJoin: 'round'
    }, true, 1, dayFutureAnimation, 'sky:day-future', 1, dayFutureClip, daySolidAnimation, dayFutureEnterClip);
  }

  if (!layout.day.visible) {
    addPolyline(echartsInstance, group, layout.day.fullPoints, {
      fill: null,
      stroke: dayLineStyle.stroke,
      lineWidth: dayLineStyle.lineWidth,
      opacity: Math.max(dayLineStyle.opacity * 0.22, 0.08),
      lineDash: [7, 8],
      lineCap: 'round',
      lineJoin: 'round'
    }, true, 1, dayFutureAnimation, 'sky:day-future');
  }

  if (layout.day.visible && layout.day.progress > 0 && layout.day.solidPoints.length >= 2) {
    addPolyline(echartsInstance, group, layout.day.solidPoints, {
      fill: null,
      stroke: dayLineStyle.stroke,
      lineWidth: dayLineStyle.lineWidth,
      opacity: dayLineStyle.opacity,
      lineCap: 'round',
      lineJoin: 'round'
    }, false, 3, daySolidAnimation, 'sky:day-solid', 1, createArcProgressClip(layout.day.start, layout.day.end, layout.height, layout.day.progress, dayLineStyle.lineWidth), daySolidAnimation);
  }

  addPolyline(echartsInstance, group, layout.moon.fullPoints, {
    fill: null,
    stroke: moonLineStyle.stroke,
    lineWidth: moonLineStyle.lineWidth,
    opacity: moonLineStyle.opacity,
    lineDash: [6, 7],
    lineCap: 'round',
    lineJoin: 'round'
  }, true, 0, moonFullAnimation, 'sky:moon-full', 1);

  if (layout.moon.visible && layout.moon.progress > 0 && layout.moon.solidPoints.length >= 2) {
    addPolyline(echartsInstance, group, layout.moon.solidPoints, {
      fill: null,
      stroke: moonLineStyle.stroke,
      lineWidth: moonLineStyle.lineWidth,
      opacity: Math.min(moonLineStyle.opacity + 0.2, 1),
      lineCap: 'round',
      lineJoin: 'round'
    }, false, 2, moonSolidAnimation, 'sky:moon-solid', 1, createArcProgressClip(layout.moon.start, layout.moon.end, layout.height, layout.moon.progress, moonLineStyle.lineWidth), moonSolidAnimation);
  }

  const baseline = new echartsInstance.graphic.Line({
    shape: {
      x1: layout.padding * 0.08,
      y1: layout.baselineY,
      x2: layout.width - layout.padding * 0.08,
      y2: layout.baselineY
    },
    style: {
      fill: null,
      stroke: baselineStyle.stroke,
      lineWidth: baselineStyle.lineWidth,
      opacity: baselineStyle.opacity
    },
    silent: true,
    z2: -1
  });
  applyPathEnterAnimation(baseline, 'shape', 'percent', baselineAnimation);
  setAliveRenderKey(baseline, 'sky:baseline');
  group.add(baseline);

  if (layout.day.visible) {
    drawSunIcon(echartsInstance, group, layout.day.current.x, layout.day.current.y, 18, String(dayLineStyle.stroke), 1, 8, {
      animation: daySolidAnimation,
      motionPoints: layout.day.motionPoints,
      yOffset: 0,
      forceGroup: forceMotionGroup,
      key: 'sky:sun-icon'
    }, sunIcon);
  }

  if (layout.moon.visible) {
    drawMoonIcon(
      echartsInstance,
      group,
      layout.moon.current.x,
      layout.moon.current.y - 1,
      19,
      String(moonLineStyle.stroke),
      backgroundColor,
      1,
      8,
      {
        animation: moonSolidAnimation,
        motionPoints: layout.moon.motionPoints,
        yOffset: -1,
        forceGroup: forceMotionGroup,
        key: 'sky:moon-icon'
      },
      moonIcon
    );
  }
}

function createArcProgressClip(
  start: SunriseSunsetPoint,
  end: SunriseSunsetPoint,
  height: number,
  progress: number,
  padding: number
): GraphicRect {
  const safeProgress = clampPercent(progress);
  const startX = start.x;
  const endX = end.x;
  return {
    x: startX - padding,
    y: 0,
    width: Math.max(0, (endX - startX) * safeProgress + padding * 2),
    height
  };
}

function createArcFutureClip(
  start: SunriseSunsetPoint,
  end: SunriseSunsetPoint,
  height: number,
  progress: number,
  padding: number
): GraphicRect {
  const safeProgress = clampPercent(progress);
  const startX = start.x;
  const endX = end.x;
  const currentX = startX + (endX - startX) * safeProgress;
  return {
    x: currentX - padding,
    y: 0,
    width: Math.max(0, endX - currentX + padding * 2),
    height
  };
}

function createStackedAreaPoints(
  upperPoints: SunriseSunsetPoint[],
  lowerArcPoints: SunriseSunsetPoint[],
  baselineY: number
): SunriseSunsetPoint[] {
  if (upperPoints.length < 2) return [];
  const lowerPoints = upperPoints.map((point) => ({
    x: point.x,
    y: interpolateLowerBoundary(point.x, lowerArcPoints, baselineY)
  }));
  return [
    ...upperPoints,
    ...lowerPoints.reverse()
  ];
}

function interpolateLowerBoundary(x: number, points: SunriseSunsetPoint[], fallbackY: number): number {
  if (points.length < 2) return fallbackY;
  const first = points[0];
  const last = points[points.length - 1];
  if (x < first.x || x > last.x) return fallbackY;

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const next = points[index];
    const previousX = finiteNumber(previous.x, NaN);
    const nextX = finiteNumber(next.x, NaN);
    if (!Number.isFinite(previousX) || !Number.isFinite(nextX)) continue;
    if (x < previousX || x > nextX) continue;
    const span = nextX - previousX;
    if (span <= 0) return previous.y;
    const ratio = (x - previousX) / span;
    return previous.y + (next.y - previous.y) * ratio;
  }

  return fallbackY;
}

function drawEvents(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SunriseSunsetSeriesModel,
  layout: SunriseSunsetLayoutResult,
  backgroundColor: string
): ElementHoverItem[] {
  const labelModel = seriesModel.getModel('eventLabel');
  if (!labelModel.get('show')) return [];

  const fontSize = finiteNumber(labelModel.get('fontSize'), 36);
  const fontWeight = labelModel.get('fontWeight') || 420;
  const color = labelModel.get('color') || '#eef0f2';
  const iconY = Math.min(layout.height - 28, layout.baselineY + fontSize * 0.86);
  const textY = iconY - fontSize * 0.46;
  const sunColor = String(readStyleValue(seriesModel, 'dayLineStyle', 'color', '#ffa72b'));
  const moonColor = String(readStyleValue(seriesModel, 'moonLineStyle', 'color', '#5a91f2'));
  const sunIcon = seriesModel.get('sunIcon');
  const moonIcon = seriesModel.get('moonIcon');
  const hoverItems: ElementHoverItem[] = [];

  hoverItems.push(drawEvent(echartsInstance, group, layout.events.sunrise, 'rise', 'sun', {
    color,
    fontSize,
    fontWeight,
    iconY,
    textY,
    iconColor: sunColor,
    backgroundColor,
    icon: sunIcon
  }));
  hoverItems.push(drawEvent(echartsInstance, group, layout.events.moonrise, 'rise', 'moon', {
    color,
    fontSize,
    fontWeight,
    iconY,
    textY,
    iconColor: moonColor,
    backgroundColor,
    icon: moonIcon
  }));
  hoverItems.push(drawEvent(echartsInstance, group, layout.events.moonset, 'set', 'moon', {
    color,
    fontSize,
    fontWeight,
    iconY,
    textY,
    iconColor: moonColor,
    backgroundColor,
    icon: moonIcon
  }));
  hoverItems.push(drawEvent(echartsInstance, group, layout.events.sunset, 'set', 'sun', {
    color,
    fontSize,
    fontWeight,
    iconY,
    textY,
    iconColor: sunColor,
    backgroundColor,
    icon: sunIcon
  }));

  return hoverItems;
}

function drawEvent(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  event: SunriseSunsetEventLayout,
  direction: 'rise' | 'set',
  body: 'sun' | 'moon',
  style: {
    color: unknown;
    fontSize: number;
    fontWeight: unknown;
    iconY: number;
    textY: number;
    iconColor: string;
    backgroundColor: string;
    icon?: unknown;
  }
): ElementHoverItem {
  const isRise = direction === 'rise';
  const isSun = body === 'sun';
  const iconOffset = isSun ? style.fontSize * 2.65 : style.fontSize * 0.5;
  const iconX = isRise ? event.x - iconOffset : event.x + iconOffset;
  const textGap = isSun ? style.fontSize * 1.15 : style.fontSize * 0.92;
  const textX = isRise ? iconX + textGap : iconX - textGap;
  const arrowY = style.iconY - style.fontSize * 0.78;
  const arrow = isRise ? '↑' : '↓';
  const elements: GraphicElement[] = [];

  const arrowElement = createText(echartsInstance, {
    x: iconX,
    y: arrowY,
    text: arrow,
    fill: style.iconColor,
    fontSize: Math.max(18, style.fontSize * 0.58),
    fontWeight: 800,
    align: 'center',
    verticalAlign: 'middle'
  });
  setAliveRenderKey(arrowElement, `event:${event.key}:arrow`);
  elements.push(arrowElement);
  group.add(arrowElement);

  if (body === 'sun') {
    const iconElements = drawSunIcon(echartsInstance, group, iconX, style.iconY, Math.max(8, style.fontSize * 0.27), style.iconColor, 1, 5, undefined, style.icon);
    iconElements.forEach((element, index) => setAliveRenderKey(element, `event:${event.key}:icon:${index}`));
    elements.push(...iconElements);
  } else {
    const iconElements = drawMoonIcon(echartsInstance, group, iconX, style.iconY, Math.max(8, style.fontSize * 0.3), style.iconColor, style.backgroundColor, 1, 5, undefined, style.icon);
    iconElements.forEach((element, index) => setAliveRenderKey(element, `event:${event.key}:icon:${index}`));
    elements.push(...iconElements);
  }

  const labelElement = createText(echartsInstance, {
    x: textX,
    y: style.textY,
    text: event.label,
    fill: style.color,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    align: isRise ? 'left' : 'right',
    verticalAlign: 'top'
  });
  setAliveRenderKey(labelElement, `event:${event.key}:label`);
  elements.push(labelElement);
  group.add(labelElement);

  return {
    elements,
    triggerElements: elements
  };
}

function drawSunIcon(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  x: number,
  y: number,
  radius: number,
  color: string,
  opacity: number,
  z2: number,
  motion?: IconMotionConfig,
  customIcon?: unknown
): GraphicElement[] {
  const shouldUseMotionGroup = hasIconMotion(motion) || shouldForceIconGroup(motion);
  const iconGroup = shouldUseMotionGroup ? new echartsInstance.graphic.Group() : null;
  const targetGroup = iconGroup || group;
  const centerX = shouldUseMotionGroup ? 0 : x;
  const centerY = shouldUseMotionGroup ? 0 : y;
  const elements: GraphicElement[] = [];

  if (iconGroup) {
    iconGroup.x = x;
    iconGroup.y = y;
  }

  const customElements = addCustomIcon(echartsInstance, targetGroup, centerX, centerY, radius * 2.35, color, opacity, z2 + 1, customIcon);
  if (customElements) {
    finishIconGroup(group, iconGroup, motion);
    return customElements;
  }

  const rayCount = 10;
  for (let index = 0; index < rayCount; index += 1) {
    const angle = (Math.PI * 2 * index) / rayCount;
    const inner = radius * 1.3;
    const outer = radius * 1.72;
    const ray = new echartsInstance.graphic.Line({
      shape: {
        x1: centerX + Math.cos(angle) * inner,
        y1: centerY + Math.sin(angle) * inner,
        x2: centerX + Math.cos(angle) * outer,
        y2: centerY + Math.sin(angle) * outer
      },
      style: {
        fill: null,
        stroke: color,
        lineWidth: Math.max(2, radius * 0.2),
        opacity,
        lineCap: 'round'
      },
      silent: true,
      z2
    });
    elements.push(ray);
    targetGroup.add(ray);
  }

  const core = new echartsInstance.graphic.Circle({
    shape: {
      cx: centerX,
      cy: centerY,
      r: radius
    },
    style: {
      fill: color,
      opacity
    },
    silent: true,
    z2: z2 + 1
  });
  elements.push(core);
  targetGroup.add(core);

  finishIconGroup(group, iconGroup, motion);
  return elements;
}

function drawMoonIcon(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  x: number,
  y: number,
  radius: number,
  color: string,
  backgroundColor: string,
  opacity: number,
  z2: number,
  motion?: IconMotionConfig,
  customIcon?: unknown
): GraphicElement[] {
  const shouldUseMotionGroup = hasIconMotion(motion) || shouldForceIconGroup(motion);
  const iconGroup = shouldUseMotionGroup ? new echartsInstance.graphic.Group() : null;
  const targetGroup = iconGroup || group;
  const centerX = shouldUseMotionGroup ? 0 : x;
  const centerY = shouldUseMotionGroup ? 0 : y;
  const elements: GraphicElement[] = [];

  if (iconGroup) {
    iconGroup.x = x;
    iconGroup.y = y;
  }

  const customElements = addCustomIcon(echartsInstance, targetGroup, centerX, centerY, radius * 2.1, color, opacity, z2 + 1, customIcon);
  if (customElements) {
    finishIconGroup(group, iconGroup, motion);
    return customElements;
  }

  const bodyElement = new echartsInstance.graphic.Circle({
    shape: {
      cx: centerX,
      cy: centerY,
      r: radius
    },
    style: {
      fill: color,
      opacity
    },
    silent: true,
    z2
  });
  elements.push(bodyElement);
  targetGroup.add(bodyElement);
  const cutoutElement = new echartsInstance.graphic.Circle({
    shape: {
      cx: centerX + radius * 0.45,
      cy: centerY - radius * 0.08,
      r: radius * 0.92
    },
    style: {
      fill: backgroundColor,
      opacity: 1
    },
    silent: true,
    z2: z2 + 1
  });
  elements.push(cutoutElement);
  targetGroup.add(cutoutElement);

  finishIconGroup(group, iconGroup, motion);
  return elements;
}

function finishIconGroup(group: GraphicGroup, iconGroup: GraphicGroup | null, motion: IconMotionConfig | undefined): void {
  if (!iconGroup) return;
  if (motion?.key) setAliveRenderKey(iconGroup, motion.key);
  applyIconMotion(iconGroup, motion);
  group.add(iconGroup);
}

function addCustomIcon(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  centerX: number,
  centerY: number,
  fallbackSize: number,
  color: string,
  opacity: number,
  z2: number,
  option: unknown
): GraphicElement[] | null {
  if (option === false) return [];

  const icon = resolveCustomIcon(option, fallbackSize, color, opacity);
  if (!icon) return null;

  const rect = {
    x: centerX - icon.width / 2 + icon.offsetX,
    y: centerY - icon.height / 2 + icon.offsetY,
    width: icon.width,
    height: icon.height
  };

  if (icon.type === 'image') {
    if (!echartsInstance.graphic.makeImage) return null;
    const image = echartsInstance.graphic.makeImage(icon.source, rect, 'center') as AnimatableGraphicElement;
    image.silent = true;
    image.z2 = z2;
    image.style = {
      ...(image.style || {}),
      ...icon.style
    };
    group.add(image);
    return [image];
  }

  if (!echartsInstance.graphic.makePath) return null;
  const pathElement = echartsInstance.graphic.makePath(icon.source, {
    style: icon.style,
    silent: true,
    z2
  }, rect, 'center');
  group.add(pathElement);
  return [pathElement];
}

function resolveCustomIcon(
  option: unknown,
  fallbackSize: number,
  color: string,
  opacity: number
): ResolvedCustomIcon | undefined {
  const raw = normalizeIconSource(option);
  if (!raw) return undefined;

  const config = asRecord(option);
  const size = resolveIconSize(config, fallbackSize);
  const offset = resolveIconOffset(config);
  const styleOption = asRecord(config.style);
  const defaultStyle = raw.type === 'path'
    ? { fill: color, stroke: null, opacity }
    : { opacity };

  return {
    type: raw.type,
    source: raw.source,
    width: size.width,
    height: size.height,
    offsetX: offset.x,
    offsetY: offset.y,
    style: {
      ...defaultStyle,
      ...styleOption
    }
  };
}

function normalizeIconSource(option: unknown): { type: 'path' | 'image'; source: string } | undefined {
  if (typeof option === 'string') {
    const source = option.trim();
    if (!source) return undefined;
    if (source.startsWith('image://')) {
      return {
        type: 'image',
        source: source.slice('image://'.length)
      };
    }
    return {
      type: 'path',
      source: source.startsWith('path://') ? source.slice('path://'.length) : source
    };
  }

  const config = asRecord(option);
  if (typeof config.image === 'string') {
    const source = config.image.trim();
    if (!source) return undefined;
    return {
      type: 'image',
      source: source.startsWith('image://') ? source.slice('image://'.length) : source
    };
  }

  if (typeof config.path === 'string') {
    const source = config.path.trim();
    if (!source) return undefined;
    return {
      type: 'path',
      source: source.startsWith('path://') ? source.slice('path://'.length) : source
    };
  }

  return undefined;
}

function resolveIconSize(config: Record<string, unknown>, fallbackSize: number): { width: number; height: number } {
  const size = config.size;
  if (Array.isArray(size)) {
    const width = finiteNumber(size[0], fallbackSize);
    const height = finiteNumber(size[1], width);
    return {
      width: Math.max(1, width),
      height: Math.max(1, height)
    };
  }

  const squareSize = Math.max(1, finiteNumber(size, fallbackSize));
  return {
    width: Math.max(1, finiteNumber(config.width, squareSize)),
    height: Math.max(1, finiteNumber(config.height, squareSize))
  };
}

function resolveIconOffset(config: Record<string, unknown>): { x: number; y: number } {
  const offset = config.offset;
  if (!Array.isArray(offset)) {
    return {
      x: finiteNumber(config.offsetX, 0),
      y: finiteNumber(config.offsetY, 0)
    };
  }

  return {
    x: finiteNumber(offset[0], 0),
    y: finiteNumber(offset[1], 0)
  };
}

function createText(echartsInstance: EChartsHost, style: Record<string, unknown>): GraphicElement {
  return new echartsInstance.graphic.Text({
    style: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      ...style
    },
    silent: true,
    z2: 10
  });
}

function addPolygon(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  points: SunriseSunsetPoint[],
  style: Record<string, unknown>,
  silent: boolean,
  z2: number,
  animation: EnterAnimationConfig,
  key: string,
  clipRect?: GraphicRect,
  clipAnimation?: EnterAnimationConfig,
  clipEnterRect?: GraphicRect
): void {
  if (points.length < 3) return;
  const polygon = new echartsInstance.graphic.Polygon({
    shape: {
      points: pointsToTuples(points)
    },
    style,
    silent,
    z2
  });
  setAliveRenderKey(polygon, key);
  setClipRect(echartsInstance, polygon, clipRect, key, clipAnimation, clipEnterRect);
  if (!clipAnimation) applyFadeEnterAnimation(polygon, animation);
  group.add(polygon);
}

function addPolyline(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  points: SunriseSunsetPoint[],
  style: Record<string, unknown>,
  silent: boolean,
  z2: number,
  animation: EnterAnimationConfig,
  key: string,
  percent = 1,
  clipRect?: GraphicRect,
  clipAnimation?: EnterAnimationConfig,
  clipEnterRect?: GraphicRect
): void {
  if (points.length < 2) return;
  const polyline = new echartsInstance.graphic.Polyline({
    shape: {
      points: pointsToTuples(points),
      percent: clampPercent(percent)
    },
    style: {
      ...style,
      fill: null
    },
    silent,
    z2
  });
  setAliveRenderKey(polyline, key);
  setClipRect(echartsInstance, polyline, clipRect, key, clipAnimation, clipEnterRect);
  if (!clipAnimation) applyPathEnterAnimation(polyline, 'shape', 'percent', animation, clampPercent(percent));
  group.add(polyline);
}

function pointsToTuples(points: SunriseSunsetPoint[]): Array<[number, number]> {
  return points.map((point) => [point.x, point.y]);
}

function setClipRect(
  echartsInstance: EChartsHost,
  element: GraphicElement,
  rect: GraphicRect | undefined,
  key: string,
  animation?: EnterAnimationConfig,
  enterRect?: GraphicRect
): void {
  if (!rect || typeof element.setClipPath !== 'function') return;
  const clipPath = new echartsInstance.graphic.Rect({
    shape: rect,
    silent: true
  });
  setAliveRenderKey(clipPath, `${key}:clip`);
  applyClipRectEnterAnimation(clipPath, animation, enterRect);
  element.setClipPath(clipPath);
}

function readLineStyle(
  seriesModel: SunriseSunsetSeriesModel,
  path: string,
  fallbackColor: string,
  fallbackWidth: number,
  fallbackOpacity: number
): { stroke: unknown; lineWidth: number; opacity: number } {
  const style = asRecord(seriesModel.get(path));
  return {
    stroke: style.color || fallbackColor,
    lineWidth: finiteNumber(style.width, fallbackWidth),
    opacity: finiteNumber(style.opacity, fallbackOpacity)
  };
}

function readStyleValue(
  seriesModel: SunriseSunsetSeriesModel,
  path: string,
  key: string,
  fallback: unknown
): unknown {
  const style = asRecord(seriesModel.get(path));
  return style[key] ?? fallback;
}

function readEnterAnimation(
  seriesModel: SunriseSunsetSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 80);
  return {
    enabled: true,
    duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 760),
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
  animation: EnterAnimationConfig,
  targetValue = 1
): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const target = resolveAnimationTarget(animatable, targetKey);
  target[propertyName] = 0;
  animateGraphicProperty(animatable, targetKey, animation, { [propertyName]: clampPercent(targetValue) });
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

function applyClipRectEnterAnimation(
  element: GraphicElement,
  animation: EnterAnimationConfig | undefined,
  enterRect?: GraphicRect
): void {
  if (!animation?.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const shape = resolveAnimationTarget(animatable, 'shape');
  const target: Record<string, unknown> = {};

  if (enterRect) {
    (['x', 'y', 'width', 'height'] as const).forEach((key) => {
      const targetValue = finiteNumber(shape[key], enterRect[key]);
      shape[key] = enterRect[key];
      if (enterRect[key] !== targetValue) target[key] = targetValue;
    });
  } else {
    const width = finiteNumber(shape.width, 0);
    shape.width = 0;
    target.width = width;
  }

  if (Object.keys(target).length) {
    animateGraphicProperty(animatable, 'shape', animation, target);
  }
}

function animateGraphicProperty(
  element: AnimatableGraphicElement,
  targetKey: AnimationTargetKey,
  animation: EnterAnimationConfig,
  target: Record<string, unknown>
): void {
  const animator = element.animate?.(targetKey);
  if (!animator) {
    Object.assign(resolveAnimationTarget(element, targetKey), target);
    return;
  }

  const chain = animator.when(animation.duration, target);
  if (animation.delay > 0) chain.delay?.(animation.delay);
  chain.start(animation.easing);
}

function applyIconMotion(iconGroup: GraphicGroup, motion: IconMotionConfig | undefined): void {
  if (!hasIconMotion(motion)) return;

  const animatable = iconGroup as GraphicGroup & AnimatableGraphicElement;
  const first = motion.motionPoints[0];
  const final = motion.motionPoints[motion.motionPoints.length - 1];
  animatable.x = first.x;
  animatable.y = first.y + motion.yOffset;

  const animator = animatable.animate?.('');
  if (!animator) {
    animatable.x = final.x;
    animatable.y = final.y + motion.yOffset;
    return;
  }

  const maxIndex = motion.motionPoints.length - 1;
  motion.motionPoints.forEach((point, index) => {
    const time = index === maxIndex
      ? motion.animation.duration
      : (motion.animation.duration * index) / maxIndex;
    animator.when(time, {
      x: point.x,
      y: point.y + motion.yOffset
    });
  });
  if (motion.animation.delay > 0) animator.delay?.(motion.animation.delay);
  animator.start(motion.animation.easing);
}

function hasIconMotion(motion: IconMotionConfig | undefined): motion is IconMotionConfig {
  return !!motion?.animation.enabled && motion.motionPoints.length >= 2;
}

function shouldForceIconGroup(motion: IconMotionConfig | undefined): motion is IconMotionConfig {
  return motion?.forceGroup === true && motion.motionPoints.length >= 2;
}

function isAliveRenderUpdate(seriesModel: SunriseSunsetSeriesModel): boolean {
  return (seriesModel as SunriseSunsetSeriesModel & { __aliveRenderUpdating?: unknown }).__aliveRenderUpdating === true;
}

function resolveAnimationTarget(element: AnimatableGraphicElement, targetKey: AnimationTargetKey): Record<string, unknown> {
  if (!targetKey) return element;
  const target = element[targetKey] || {};
  element[targetKey] = target;
  return target;
}

function formatHeaderText(formatter: unknown, fallback: string, layout: SunriseSunsetLayoutResult): string {
  if (typeof formatter === 'function') {
    const value = formatter({
      data: layout,
      title: layout.title,
      remainingText: layout.remainingText,
      updatedText: layout.updatedText
    });
    return value == null ? '' : String(value);
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{title\}/g, layout.title)
      .replace(/\{remaining\}/g, layout.remainingText)
      .replace(/\{updated\}/g, layout.updatedText);
  }
  return fallback;
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clampPercent(value: unknown): number {
  return Math.max(0, Math.min(1, finiteNumber(value, 1)));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

export const __test__ = {
  readLayoutOption,
  readSource,
  drawSunriseSunset,
  drawBackground,
  drawHeader,
  drawSky,
  createArcProgressClip,
  createArcFutureClip,
  drawEvents,
  drawEvent,
  drawSunIcon,
  drawMoonIcon,
  createStackedAreaPoints,
  interpolateLowerBoundary,
  finishIconGroup,
  addCustomIcon,
  resolveCustomIcon,
  normalizeIconSource,
  resolveIconSize,
  resolveIconOffset,
  createText,
  addPolygon,
  addPolyline,
  pointsToTuples,
  setClipRect,
  readLineStyle,
  readStyleValue,
  readEnterAnimation,
  disabledEnterAnimation,
  resolveAnimationNumber,
  resolveAnimationEasing,
  applyPathEnterAnimation,
  applyFadeEnterAnimation,
  applyClipRectEnterAnimation,
  animateGraphicProperty,
  applyIconMotion,
  hasIconMotion,
  shouldForceIconGroup,
  isAliveRenderUpdate,
  resolveAnimationTarget,
  formatHeaderText,
  finiteNumber,
  clampPercent,
  asRecord,
  isPlainObject
};
