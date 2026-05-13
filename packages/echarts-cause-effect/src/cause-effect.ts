import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive, setAliveRenderKey } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import {
  collectCauseEffectData,
  resolveCauseEffectLayout
} from './layout.js';
import type {
  CauseEffectCategoryLayout,
  CauseEffectCauseLayout,
  CauseEffectLayoutOption,
  CauseEffectLayoutResult,
  CauseEffectSourceItem
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
  option?: unknown;
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

interface CauseEffectSeriesModel extends EChartsModel {
  option?: CauseEffectLayoutOption;
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
  z2?: number;
}

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    createDimensions(source: unknown[], options: Record<string, unknown>): unknown;
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: CauseEffectSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Polygon?: new (options: GraphicElementOptions) => GraphicElement;
    Rect: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}

interface CauseEffectChartView {
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
type LabelKind = 'effect' | 'category' | 'cause';

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'padding',
  'effectWidth',
  'effectHeight',
  'effectGap',
  'categoryGap',
  'categoryLength',
  'categoryAngle',
  'causeGap',
  'causeLength',
  'maxCauseDepth',
  'spineArrowSize'
] as const satisfies ReadonlyArray<Extract<keyof CauseEffectLayoutOption, string>>;

const layerZ = {
  spine: 1,
  branch: 3,
  cause: 4,
  arrow: 5,
  effect: 6,
  label: 8
} as const;

echartsHost.extendSeriesModel({
  type: 'series.causeEffect',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'stroke',

  getInitialData(this: CauseEffectSeriesModel, option: CauseEffectLayoutOption) {
    const source = collectCauseEffectData(option);
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  getTooltipPosition(this: CauseEffectSeriesModel, dataIndex: number) {
    const layout = this.getData().getItemLayout(dataIndex);
    return Array.isArray(layout) ? layout : undefined;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '94%',
    height: '84%',
    padding: 42,
    effectWidth: 138,
    effectHeight: 58,
    effectGap: 0,
    categoryGap: 118,
    categoryLength: 170,
    categoryAngle: 48,
    causeGap: 28,
    causeLength: 76,
    maxCauseDepth: 3,
    spineArrowSize: 0,
    enterAnimation: true,
    lineStyle: {
      color: '#334155',
      width: 2,
      opacity: 1
    },
    categoryLineStyle: {
      color: '#475569',
      width: 1.6,
      opacity: 0.96
    },
    causeLineStyle: {
      color: '#64748b',
      width: 1.1,
      opacity: 0.92
    },
    effectStyle: {
      color: '#f8fafc',
      borderColor: '#334155',
      borderWidth: 1.2,
      borderRadius: 4,
      opacity: 1
    },
    label: {
      show: true,
      color: '#0f172a',
      fontSize: 12,
      fontWeight: 600,
      formatter: '{b}'
    },
    effectLabel: {
      show: true,
      color: '#0f172a',
      fontSize: 13,
      fontWeight: 700,
      formatter: '{b}'
    },
    categoryLabel: {
      show: true,
      color: '#0f172a',
      fontSize: 12,
      fontWeight: 700,
      formatter: '{b}'
    },
    causeLabel: {
      show: true,
      color: '#334155',
      fontSize: 11,
      fontWeight: 500,
      formatter: '{b}'
    },
    emphasis: {
      itemStyle: {
        opacity: 1,
        shadowBlur: 8,
        shadowColor: 'rgba(14, 165, 233, 0.22)'
      }
    },
    tooltip: {
      trigger: 'item'
    }
  }
});

echartsHost.extendChartView({
  type: 'causeEffect',

  render(this: CauseEffectChartView, seriesModel: CauseEffectSeriesModel, ecModel: unknown, api: EChartsApi) {
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
      const layout = resolveCauseEffectLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawCauseEffect(echartsHost, targetGroup, targetSeriesModel, layout, rect, targetSeriesModel)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
    } catch (error) {
      console.error('[causeEffect] render failed', error);
    }
  },

  remove(this: CauseEffectChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: CauseEffectChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: CauseEffectSeriesModel, rect: ViewRect): CauseEffectLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: CauseEffectLayoutOption = {
    width: rect.width,
    height: rect.height,
    layout: seriesModel.get('layout'),
    layoutOptions: seriesModel.get('layoutOptions') || {}
  };

  if (option.effect !== undefined) layoutOption.effect = option.effect;
  if (option.problem !== undefined) layoutOption.problem = option.problem;
  if (option.outcome !== undefined) layoutOption.outcome = option.outcome;
  if (Array.isArray(option.categories)) layoutOption.categories = option.categories;
  if (Array.isArray(option.causes)) layoutOption.causes = option.causes;
  if (Array.isArray(option.data)) layoutOption.data = option.data;

  optionKeys.forEach((key) => {
    const value = seriesModel.get(key);
    if (value !== undefined && value !== null) layoutOption[key as string] = value;
  });

  return layoutOption;
}

function drawCauseEffect(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: CauseEffectSeriesModel,
  layout: CauseEffectLayoutResult,
  rect: ViewRect,
  animationSeriesModel: CauseEffectSeriesModel = seriesModel
): ElementHoverItem[] {
  const chartGroup = new echartsInstance.graphic.Group();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;
  const hoverItems: ElementHoverItem[] = [];
  const data = seriesModel.getData();

  const spine = createLine(echartsInstance, layout.spine, readLineStyle(seriesModel.getModel('lineStyle'), {
    stroke: '#334155',
    lineWidth: 2,
    opacity: 1
  }), 'cause-effect-spine', readEnterAnimation(animationSeriesModel, 0));
  chartGroup.add(spine);

  const arrow = createArrow(echartsInstance, seriesModel, layout);
  if (arrow) chartGroup.add(arrow);

  const effectElements = drawEffect(echartsInstance, chartGroup, seriesModel, layout, animationSeriesModel);
  bindData(data, layout.effect.dataIndex, [layout.effect.label.x + rect.x, layout.effect.label.y + rect.y], effectElements[0]);
  hoverItems.push({ elements: effectElements });

  layout.categories.forEach((category, categoryIndex) => {
    const categoryElements = drawCategory(echartsInstance, chartGroup, seriesModel, category, categoryIndex, animationSeriesModel);
    bindData(data, category.dataIndex, [category.end.x + rect.x, category.end.y + rect.y], categoryElements[0]);
    const hoverItem: ElementHoverItem = { elements: categoryElements };
    hoverItems.push(hoverItem);
    drawCauses(echartsInstance, chartGroup, seriesModel, category.causes, rect, hoverItems, animationSeriesModel);
  });

  group.add(chartGroup);
  return hoverItems;
}

function drawEffect(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: CauseEffectSeriesModel,
  layout: CauseEffectLayoutResult,
  animationSeriesModel: CauseEffectSeriesModel
): GraphicElement[] {
  const style = readBoxStyle(seriesModel, layout.effect.raw);
  const rect = new echartsInstance.graphic.Rect({
    shape: {
      x: layout.effect.x,
      y: layout.effect.y,
      width: layout.effect.width,
      height: layout.effect.height,
      r: finiteNumber(style.borderRadius, 4)
    },
    style: {
      fill: style.color || style.fill || '#f8fafc',
      stroke: style.borderColor || style.stroke || '#334155',
      lineWidth: finiteNumber(style.borderWidth, finiteNumber(style.lineWidth, 1.2)),
      opacity: finiteNumber(style.opacity, 1)
    },
    z2: layerZ.effect
  });
  setAliveRenderKey(rect, `cause-effect-effect:${layout.effect.id}`);
  applyFadeEnterAnimation(rect, readEnterAnimation(animationSeriesModel, layout.effect.dataIndex));
  group.add(rect);

  const label = createLabel(echartsInstance, seriesModel, 'effect', layout.effect, layout.effect.raw);
  const elements = [rect];
  if (label) {
    setAliveRenderKey(label, `cause-effect-effect-label:${layout.effect.id}`);
    applyFadeEnterAnimation(label, readEnterAnimation(animationSeriesModel, layout.effect.dataIndex));
    group.add(label);
    elements.push(label);
  }
  return elements;
}

function drawCategory(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: CauseEffectSeriesModel,
  category: CauseEffectCategoryLayout,
  categoryIndex: number,
  animationSeriesModel: CauseEffectSeriesModel
): GraphicElement[] {
  const style = readLineStyle(seriesModel.getModel('categoryLineStyle'), {
    stroke: '#475569',
    lineWidth: 1.6,
    opacity: 0.96
  }, asRecord(asRecord(category.raw).lineStyle));
  const line = createLine(echartsInstance, {
    x1: category.anchor.x,
    y1: category.anchor.y,
    x2: category.end.x,
    y2: category.end.y
  }, style, `cause-effect-category:${category.id}`, readEnterAnimation(animationSeriesModel, categoryIndex + 1));
  group.add(line);

  const label = createLabel(echartsInstance, seriesModel, 'category', category, category.raw);
  const elements = [line];
  if (label) {
    setAliveRenderKey(label, `cause-effect-category-label:${category.id}`);
    applyFadeEnterAnimation(label, readEnterAnimation(animationSeriesModel, categoryIndex + 1));
    group.add(label);
    elements.push(label);
  }
  return elements;
}

function drawCauses(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: CauseEffectSeriesModel,
  causes: CauseEffectCauseLayout[],
  rect: ViewRect,
  hoverItems: ElementHoverItem[],
  animationSeriesModel: CauseEffectSeriesModel
): void {
  causes.forEach((cause) => {
    const elements = drawCause(echartsInstance, group, seriesModel, cause, animationSeriesModel);
    bindData(seriesModel.getData(), cause.dataIndex, [cause.x + rect.x, cause.y + rect.y], elements[0]);
    hoverItems.push({ elements });
    drawCauses(echartsInstance, group, seriesModel, cause.children, rect, hoverItems, animationSeriesModel);
  });
}

function drawCause(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: CauseEffectSeriesModel,
  cause: CauseEffectCauseLayout,
  animationSeriesModel: CauseEffectSeriesModel
): GraphicElement[] {
  const style = readLineStyle(seriesModel.getModel('causeLineStyle'), {
    stroke: '#64748b',
    lineWidth: 1.1,
    opacity: 0.92
  }, asRecord(asRecord(cause.raw).lineStyle));
  const line = createLine(echartsInstance, cause.line, style, `cause-effect-cause:${cause.id}`, readEnterAnimation(animationSeriesModel, cause.dataIndex));
  group.add(line);

  const label = createLabel(echartsInstance, seriesModel, 'cause', cause, cause.raw);
  const elements = [line];
  if (label) {
    setAliveRenderKey(label, `cause-effect-cause-label:${cause.id}`);
    applyFadeEnterAnimation(label, readEnterAnimation(animationSeriesModel, cause.dataIndex));
    group.add(label);
    elements.push(label);
  }
  return elements;
}

function createLine(
  echartsInstance: EChartsHost,
  shape: { x1: number; y1: number; x2: number; y2: number },
  style: Record<string, unknown>,
  aliveKey: string,
  animation: EnterAnimationConfig
): GraphicElement {
  const line = new echartsInstance.graphic.Line({
    shape,
    style,
    z2: aliveKey.includes('spine') ? layerZ.spine : layerZ.branch
  });
  setAliveRenderKey(line, aliveKey);
  applyLineEnterAnimation(line, shape, animation);
  return line;
}

function createArrow(
  echartsInstance: EChartsHost,
  seriesModel: CauseEffectSeriesModel,
  layout: CauseEffectLayoutResult
): GraphicElement | null {
  const style = readLineStyle(seriesModel.getModel('lineStyle'), {
    stroke: '#334155',
    lineWidth: 2,
    opacity: 1
  });
  if (!echartsInstance.graphic.Polygon) return null;
  const arrow = new echartsInstance.graphic.Polygon({
    shape: {
      points: layout.arrow.map((point) => [point.x, point.y])
    },
    style: {
      fill: style.stroke,
      opacity: style.opacity
    },
    silent: true,
    z2: layerZ.arrow
  });
  setAliveRenderKey(arrow, 'cause-effect-spine-arrow');
  return arrow;
}

function createLabel(
  echartsInstance: EChartsHost,
  seriesModel: CauseEffectSeriesModel,
  kind: LabelKind,
  layout: {
    id: string;
    name: string;
    dataIndex: number;
    raw: unknown;
    label: {
      x: number;
      y: number;
      align?: string;
      verticalAlign?: string;
    };
    side?: string;
    depth?: number;
  },
  raw: unknown
): GraphicElement | null {
  const labelModel = readLabelModel(seriesModel, kind, raw);
  if (labelModel.get('show') === false) return null;

  return new echartsInstance.graphic.Text({
    style: {
      x: layout.label.x,
      y: layout.label.y,
      text: formatLabel(labelModel.get('formatter'), {
        id: layout.id,
        name: layout.name,
        kind,
        dataIndex: layout.dataIndex,
        data: raw,
        side: layout.side,
        depth: layout.depth
      }),
      fill: labelModel.get('color') || '#0f172a',
      fontSize: finiteNumber(labelModel.get('fontSize'), kind === 'cause' ? 11 : 12),
      fontWeight: labelModel.get('fontWeight') || (kind === 'cause' ? 500 : 700),
      align: layout.label.align || 'center',
      verticalAlign: layout.label.verticalAlign || 'middle'
    },
    silent: true,
    z2: layerZ.label
  });
}

function readLabelModel(seriesModel: CauseEffectSeriesModel, kind: LabelKind, raw: unknown): EChartsModel {
  const specificKey = kind === 'effect' ? 'effectLabel' : kind === 'category' ? 'categoryLabel' : 'causeLabel';
  const rawLabel = asRecord(raw).labelStyle || asRecord(raw).label;
  if (isPlainObject(rawLabel)) {
    return createMergedModel(seriesModel.getModel('label'), seriesModel.getModel(specificKey), rawLabel);
  }
  return createMergedModel(seriesModel.getModel('label'), seriesModel.getModel(specificKey));
}

function createMergedModel(...modelsOrRecords: Array<EChartsModel | Record<string, unknown>>): EChartsModel {
  const merged = Object.assign({}, ...modelsOrRecords.map((item) => 'get' in item ? asRecord((item as EChartsModel).option) : item));
  return {
    get(path: string | string[]) {
      return getPath(merged, path);
    },
    getModel(path: string | string[]) {
      return createMergedModel(asRecord(getPath(merged, path)));
    }
  };
}

function bindData(data: SeriesData, dataIndex: number, point: [number, number], element: GraphicElement | undefined): void {
  if (dataIndex < 0 || dataIndex >= data.count()) return;
  data.setItemLayout(dataIndex, point);
  if (element) data.setItemGraphicEl(dataIndex, element);
}

function readBoxStyle(seriesModel: CauseEffectSeriesModel, raw: unknown): Record<string, unknown> {
  return {
    color: '#f8fafc',
    borderColor: '#334155',
    borderWidth: 1.2,
    borderRadius: 4,
    opacity: 1,
    ...asRecord(seriesModel.get('effectStyle')),
    ...asRecord(asRecord(raw).itemStyle)
  };
}

function readLineStyle(
  model: EChartsModel,
  defaults: Record<string, unknown>,
  rawOverrides: Record<string, unknown> = {}
): Record<string, unknown> {
  const color = rawOverrides.color || rawOverrides.stroke || model.get('color') || model.get('stroke') || defaults.stroke || defaults.color;
  const lineType = rawOverrides.type || model.get('type') || defaults.type;
  return {
    stroke: color,
    lineWidth: finiteNumber(rawOverrides.width, finiteNumber(rawOverrides.lineWidth, finiteNumber(model.get('width'), finiteNumber(model.get('lineWidth'), finiteNumber(defaults.lineWidth, 1))))),
    opacity: finiteNumber(rawOverrides.opacity, finiteNumber(model.get('opacity'), finiteNumber(defaults.opacity, 1))),
    lineDash: readLineDash(lineType),
    lineDashOffset: finiteNumber(rawOverrides.dashOffset, finiteNumber(rawOverrides.lineDashOffset, finiteNumber(model.get('dashOffset'), finiteNumber(model.get('lineDashOffset'), 0))))
  };
}

function readLineDash(type: unknown): number[] | null {
  if (Array.isArray(type)) return type.filter((item): item is number => typeof item === 'number');
  if (type === 'dashed') return [6, 6];
  if (type === 'dotted') return [1.5, 5];
  return null;
}

function formatLabel(
  formatter: unknown,
  params: {
    id: string;
    name: string;
    kind: LabelKind;
    dataIndex: number;
    data: unknown;
    side?: string;
    depth?: number;
  }
): string {
  if (typeof formatter === 'function') {
    return String((formatter as (input: typeof params) => unknown)(params));
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{b\}/g, params.name)
      .replace(/\{name\}/g, params.name)
      .replace(/\{kind\}/g, params.kind)
      .replace(/\{id\}/g, params.id);
  }
  return params.name;
}

function readEnterAnimation(
  seriesModel: CauseEffectSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 28);
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

function applyLineEnterAnimation(
  element: GraphicElement,
  targetShape: { x1: number; y1: number; x2: number; y2: number },
  animation: EnterAnimationConfig
): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  animatable.shape = {
    ...(animatable.shape || {}),
    x2: targetShape.x1,
    y2: targetShape.y1
  };
  animateGraphicProperty(animatable, 'shape', animation, {
    x2: targetShape.x2,
    y2: targetShape.y2
  });
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
  key: AnimationTargetKey,
  animation: EnterAnimationConfig,
  target: Record<string, unknown>
): void {
  const animator = element.animate?.(key, false);
  if (!animator) return;
  animator.when(Math.max(0, animation.duration), target);
  animator.delay?.(Math.max(0, animation.delay));
  animator.start(animation.easing);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getPath(source: Record<string, unknown>, path: string | string[]): unknown {
  const parts = Array.isArray(path) ? path : [path];
  let current: unknown = source;
  for (const part of parts) {
    if (!isPlainObject(current)) return undefined;
    current = current[part];
  }
  return current;
}

function finiteNumber(value: unknown, fallback: number): number {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : fallback;
}

export const __test__ = {
  readLayoutOption,
  drawCauseEffect,
  createArrow,
  createLabel,
  readLabelModel,
  createMergedModel,
  bindData,
  readBoxStyle,
  readLineStyle,
  readLineDash,
  readEnterAnimation,
  disabledEnterAnimation,
  resolveAnimationNumber,
  resolveAnimationEasing,
  applyLineEnterAnimation,
  applyFadeEnterAnimation,
  animateGraphicProperty,
  formatLabel,
  collectCauseEffectData,
  asRecord,
  finiteNumber
};
