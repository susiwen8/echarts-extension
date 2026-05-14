import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import { DEFAULT_MOSAIC_COLORS, resolveMosaicLayout } from './layout.js';
import type { MosaicLayoutOption, MosaicLayoutResult, MosaicTile } from './layout.js';

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
  dataType?: unknown;
  initData(source: unknown[]): void;
  count(): number;
  getName(index: number): string;
  indexOfName(name: string): number;
  getItemModel(index: number): EChartsModel;
  getItemVisual(dataIndex: number, key: string): unknown;
  setItemLayout(dataIndex: number, layout: [number, number, number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface MosaicSeriesModel extends EChartsModel {
  option?: MosaicLayoutOption;
  seriesIndex?: number;
  legendVisualProvider?: unknown;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
  getRawData(): SeriesData;
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
}

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    createDimensions(source: unknown[], options: Record<string, unknown>): unknown;
    getECData(element: GraphicElement): {
      dataIndex?: number;
      dataType?: unknown;
      seriesIndex?: number;
      ssrType?: string;
    };
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: MosaicSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Rect: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}


interface MosaicChartView {
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

interface TooltipMarkupNameValue {
  type: 'nameValue';
  markerType: 'subItem';
  markerColor: string;
  name: string;
  value: unknown;
  dataIndex: number;
}

interface TooltipMarkupSection {
  type: 'section';
  header: string;
  noHeader: false;
  sortBlocks: false;
  blocks: TooltipMarkupNameValue[];
}

type AnimationTargetKey = 'shape' | 'style';

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'padding',
  'gap',
  'xField',
  'yField',
  'valueField',
  'dimensions',
  'xCategories',
  'yCategories',
  'colors',
  'sort'
] as const satisfies ReadonlyArray<Extract<keyof MosaicLayoutOption, string>>;

echartsHost.extendSeriesModel({
  type: 'series.mosaic',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: MosaicSeriesModel, option: MosaicLayoutOption) {
    const source = Array.isArray(option.data) ? option.data : [];
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    this.legendVisualProvider = createLegendVisualProvider(this);
    return list;
  },

  formatTooltip(this: MosaicSeriesModel, dataIndex: number) {
    return formatMosaicTooltip(this, dataIndex);
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '86%',
    height: '82%',
    padding: 12,
    gap: 2,
    xField: 'x',
    yField: 'y',
    valueField: 'value',
    xCategories: null,
    yCategories: null,
    colors: DEFAULT_MOSAIC_COLORS,
    sort: false,
    enterAnimation: true,
    itemStyle: {
      opacity: 0.92,
      borderColor: '#ffffff',
      borderWidth: 1
    },
    label: {
      show: true,
      color: '#111827',
      fontSize: 12,
      fontWeight: 600,
      lineHeight: null,
      formatter: null
    },
    tooltip: {
      trigger: 'item'
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 8,
        shadowColor: 'rgba(31, 41, 55, 0.2)'
      }
    }
  }
});

echartsHost.extendChartView({
  type: 'mosaic',

  render(this: MosaicChartView, seriesModel: MosaicSeriesModel, ecModel: unknown, api: EChartsApi) {
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
      const layout = resolveMosaicLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawMosaic(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
    } catch (error) {
      console.error('[mosaic] render failed', error);
    }
  },

  remove(this: MosaicChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: MosaicChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: MosaicSeriesModel, rect: ViewRect): MosaicLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: MosaicLayoutOption = {
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

function drawMosaic(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: MosaicSeriesModel,
  layout: MosaicLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const data = seriesModel.getData();
  const chartGroup = new echartsInstance.graphic.Group();
  const hoverItems: ElementHoverItem[] = [];
  const hoverItemsByDataIndex = new Map<number, ElementHoverItem>();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  layout.tiles.forEach((tile, index) => {
    const itemModel = tile.dataIndex >= 0 && tile.dataIndex < data.count() ? data.getItemModel(tile.dataIndex) : null;
    const rectEl = new echartsInstance.graphic.Rect({
      shape: {
        x: tile.x,
        y: tile.y,
        width: tile.width,
        height: tile.height
      },
      style: readTileStyle(data, seriesModel, itemModel, tile, index)
    });
    applyRectEnterAnimation(rectEl, tile, readEnterAnimation(seriesModel, index));

    if (itemModel && tile.dataIndex >= 0 && tile.dataIndex < data.count()) {
      data.setItemLayout(tile.dataIndex, [tile.x, tile.y, tile.width, tile.height]);
      data.setItemGraphicEl(tile.dataIndex, rectEl);
      bindTooltipData(echartsInstance, seriesModel, data, tile.dataIndex, rectEl);
      const hoverItem = createHoverItem(rectEl);
      hoverItems.push(hoverItem);
      hoverItemsByDataIndex.set(tile.dataIndex, hoverItem);
    }

    chartGroup.add(rectEl);
  });

  drawLabels(echartsInstance, chartGroup, seriesModel, data, layout.tiles, hoverItemsByDataIndex);
  group.add(chartGroup);
  return hoverItems;
}

function drawLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: MosaicSeriesModel,
  data: SeriesData,
  tiles: MosaicTile[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>
): void {
  const seriesLabelModel = seriesModel.getModel('label');
  if (!seriesLabelModel.get('show')) return;

  tiles.forEach((tile) => {
    const itemModel = tile.dataIndex >= 0 && tile.dataIndex < data.count() ? data.getItemModel(tile.dataIndex) : null;
    const itemLabelModel = itemModel?.getModel('label');
    const show = itemLabelModel?.get('show') ?? seriesLabelModel.get('show');
    if (!show) return;

    const baseFontSize = finiteNumber(itemLabelModel?.get('fontSize') ?? seriesLabelModel.get('fontSize'), 12);
    if (tile.width < Math.max(22, baseFontSize * 2) || tile.height < Math.max(14, baseFontSize * 1.2)) return;

    const fontSize = Math.min(baseFontSize, Math.max(8, Math.min(tile.height * 0.36, tile.width * 0.18)));
    const lineHeight = finiteNumber(itemLabelModel?.get('lineHeight') ?? seriesLabelModel.get('lineHeight'), fontSize + 3);
    const maxChars = Math.max(3, Math.floor(Math.max(tile.width - 8, 1) / Math.max(fontSize * 0.56, 1)));
    const text = formatLabel(itemLabelModel?.get('formatter') || seriesLabelModel.get('formatter'), tile);

    const labelEl = new echartsInstance.graphic.Text({
      style: {
        x: tile.x + tile.width / 2,
        y: tile.y + tile.height / 2,
        text: wrapText(String(text), maxChars, Math.max(1, Math.floor(tile.height / lineHeight))),
        fill: itemLabelModel?.get('color') || seriesLabelModel.get('color') || '#111827',
        fontSize,
        fontWeight: itemLabelModel?.get('fontWeight') || seriesLabelModel.get('fontWeight') || 600,
        lineHeight,
        align: 'center',
        verticalAlign: 'middle'
      },
      silent: true
    });
    bindTooltipData(echartsInstance, seriesModel, data, tile.dataIndex, labelEl);
    applyFadeEnterAnimation(labelEl, readEnterAnimation(seriesModel, tile.dataIndex));
    labelEl.silent = false;
    addHoverElement(hoverItemsByDataIndex.get(tile.dataIndex), labelEl);
    group.add(labelEl);
  });
}

function readTileStyle(
  data: SeriesData,
  seriesModel: MosaicSeriesModel,
  itemModel: EChartsModel | null,
  tile: MosaicTile,
  index: number
): Record<string, unknown> {
  const seriesStyle = asRecord(seriesModel.get('itemStyle'));
  const itemStyle = itemModel ? asRecord(itemModel.get('itemStyle')) : {};
  const visualStyle = tile.dataIndex >= 0 && tile.dataIndex < data.count()
    ? asRecord(data.getItemVisual(tile.dataIndex, 'style'))
    : {};

  return {
    fill: itemStyle.color || seriesStyle.color || visualStyle.fill || tile.color || DEFAULT_MOSAIC_COLORS[index % DEFAULT_MOSAIC_COLORS.length],
    stroke: itemStyle.borderColor || seriesStyle.borderColor || '#ffffff',
    lineWidth: finiteNumber(itemStyle.borderWidth ?? seriesStyle.borderWidth, 1),
    opacity: finiteNumber(itemStyle.opacity ?? seriesStyle.opacity, 0.92)
  };
}

function formatLabel(formatter: unknown, tile: MosaicTile): unknown {
  const params = {
    data: tile.raw,
    name: tile.name,
    value: tile.value,
    percent: tile.percent,
    columnPercent: tile.columnPercent,
    xCategory: tile.xCategory,
    yCategory: tile.yCategory
  };

  if (typeof formatter === 'function') {
    return (formatter as (input: typeof params) => unknown)(params);
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{b\}/g, tile.name)
      .replace(/\{c\}/g, String(tile.value))
      .replace(/\{d\}/g, String(Math.round(tile.percent * 100)))
      .replace(/\{x\}/g, tile.xCategory)
      .replace(/\{y\}/g, tile.yCategory);
  }
  return tile.name;
}

function bindTooltipData(
  echartsInstance: EChartsHost,
  seriesModel: MosaicSeriesModel,
  data: SeriesData,
  dataIndex: number,
  element: GraphicElement
): void {
  const ecData = echartsInstance.helper.getECData(element);
  ecData.dataIndex = dataIndex;
  ecData.dataType = data.dataType;
  ecData.seriesIndex = seriesModel.seriesIndex;
  ecData.ssrType = 'chart';
}

function formatMosaicTooltip(seriesModel: MosaicSeriesModel, dataIndex: number): TooltipMarkupSection {
  const tile = findTooltipTile(seriesModel, dataIndex);
  const valueName = tooltipValueName(seriesModel);
  const markerColor = tile?.color || DEFAULT_MOSAIC_COLORS[dataIndex % DEFAULT_MOSAIC_COLORS.length];
  const header = tile?.name || fallbackTooltipHeader(seriesModel, dataIndex);

  if (!tile) {
    return {
      type: 'section',
      header,
      noHeader: false,
      sortBlocks: false,
      blocks: []
    };
  }

  return {
    type: 'section',
    header,
    noHeader: false,
    sortBlocks: false,
    blocks: [
      createTooltipBlock(valueName, tile.value, markerColor, dataIndex),
      createTooltipBlock('Overall', formatPercent(tile.percent), markerColor, dataIndex),
      createTooltipBlock(`Within ${tile.xCategory}`, formatPercent(tile.columnPercent), markerColor, dataIndex)
    ]
  };
}

function findTooltipTile(seriesModel: MosaicSeriesModel, dataIndex: number): MosaicTile | undefined {
  const layout = resolveMosaicLayout(readTooltipLayoutOption(seriesModel));
  return layout.tiles.find((tile) => tile.dataIndex === dataIndex) || layout.tiles[dataIndex];
}

function readTooltipLayoutOption(seriesModel: MosaicSeriesModel): MosaicLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: MosaicLayoutOption = {
    data: Array.isArray(option.data) ? option.data : [],
    layout: seriesModel.get('layout'),
    layoutOptions: seriesModel.get('layoutOptions') || {}
  };

  optionKeys.forEach((key) => {
    const value = seriesModel.get(key);
    if (value !== undefined && value !== null) layoutOption[key as string] = value;
  });

  return layoutOption;
}

function createTooltipBlock(name: string, value: unknown, markerColor: string, dataIndex: number): TooltipMarkupNameValue {
  return {
    type: 'nameValue',
    markerType: 'subItem',
    markerColor,
    name,
    value,
    dataIndex
  };
}

function tooltipValueName(seriesModel: MosaicSeriesModel): string {
  const valueField = seriesModel.get('valueField');
  return typeof valueField === 'string' && valueField ? valueField : 'value';
}

function fallbackTooltipHeader(seriesModel: MosaicSeriesModel, dataIndex: number): string {
  return seriesModel.getData().getName(dataIndex) || `Item ${dataIndex + 1}`;
}

function formatPercent(value: number): string {
  const percent = value * 100;
  const rounded = Math.round(percent * 10) / 10;
  return `${Number.isInteger(rounded) ? Math.round(rounded) : rounded}%`;
}

function wrapText(value: string, maxChars: number, maxLines: number): string {
  if (maxLines <= 1) return value.length > maxChars ? `${value.slice(0, Math.max(1, maxChars - 1))}...` : value;
  if (value.length <= maxChars) return value;

  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  if (words.length <= 1) {
    for (let index = 0; index < value.length && lines.length < maxLines; index += maxChars) {
      lines.push(value.slice(index, index + maxChars));
    }
    return trimLines(lines, maxLines, maxChars);
  }

  words.forEach((word) => {
    if (lines.length >= maxLines) return;
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = word.length > maxChars ? word.slice(0, maxChars) : word;
  });
  if (current && lines.length < maxLines) lines.push(current);
  return trimLines(lines, maxLines, maxChars);
}

function trimLines(lines: string[], maxLines: number, maxChars: number): string {
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    const last = visible[visible.length - 1];
    visible[visible.length - 1] = `${last.slice(0, Math.max(1, maxChars - 1))}...`;
  }
  return visible.join('\n');
}

function createLegendVisualProvider(seriesModel: MosaicSeriesModel) {
  return {
    getAllNames() {
      return collectDataNames(seriesModel.getRawData());
    },

    containName(name: string) {
      return seriesModel.getRawData().indexOfName(name) >= 0;
    },

    indexOfName(name: string) {
      return collectDataNames(seriesModel.getData()).indexOf(name);
    },

    getItemVisual(dataIndex: number, key: string) {
      if (key === 'legendIcon') return null;
      if (key !== 'style') return seriesModel.getData().getItemVisual(dataIndex, key);

      const itemModel = seriesModel.getData().getItemModel(dataIndex);
      const itemStyle = asRecord(itemModel.get('itemStyle'));
      return {
        fill: itemStyle.color || DEFAULT_MOSAIC_COLORS[dataIndex % DEFAULT_MOSAIC_COLORS.length],
        stroke: itemStyle.borderColor || '#ffffff',
        opacity: finiteNumber(itemStyle.opacity, 0.9)
      };
    }
  };
}

function collectDataNames(data: SeriesData): string[] {
  const names: string[] = [];
  for (let index = 0; index < data.count(); index++) {
    names.push(data.getName(index));
  }
  return names;
}

function readEnterAnimation(
  seriesModel: MosaicSeriesModel,
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
    duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 560),
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

function applyRectEnterAnimation(element: GraphicElement, tile: MosaicTile, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const shape = animatable.shape || {};
  const style = animatable.style || {};
  const opacity = finiteNumber(style.opacity, 1);
  shape.width = 0;
  style.opacity = 0;
  animatable.shape = shape;
  animatable.style = style;
  animateGraphicProperty(animatable, 'shape', animation, { width: tile.width });
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

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
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

export const __test__ = {
  readLayoutOption,
  drawMosaic,
  drawLabels,
  readTileStyle,
  formatLabel,
  bindTooltipData,
  formatMosaicTooltip,
  findTooltipTile,
  readTooltipLayoutOption,
  createTooltipBlock,
  tooltipValueName,
  fallbackTooltipHeader,
  formatPercent,
  wrapText,
  trimLines,
  createLegendVisualProvider,
  collectDataNames,
  readEnterAnimation,
  disabledEnterAnimation,
  resolveAnimationNumber,
  resolveAnimationEasing,
  applyRectEnterAnimation,
  applyFadeEnterAnimation,
  animateGraphicProperty,
  finiteNumber,
  asRecord,
  createHoverItem,
  addHoverElement
};
