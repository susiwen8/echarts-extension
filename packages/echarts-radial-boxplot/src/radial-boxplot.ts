import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive, setAliveRenderKey } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import { resolveRadialBoxplotLayout } from './layout.js';
import type { RadialBoxplotBox, RadialBoxplotField, RadialBoxplotLayoutOption, RadialBoxplotLayoutResult } from './layout.js';

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
  getName?: (index: number) => string;
  getItemModel(index: number): EChartsModel;
  getItemLayout(dataIndex: number): unknown;
  getItemVisual(dataIndex: number, key: string): unknown;
  setItemLayout(dataIndex: number, layout: [number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface RadialBoxplotSeriesModel extends EChartsModel {
  option?: RadialBoxplotLayoutOption;
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
  rotation?: number;
  originX?: number;
  originY?: number;
}

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    createDimensions(source: unknown[], options: Record<string, unknown>): unknown;
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: RadialBoxplotSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Arc?: new (options: GraphicElementOptions) => GraphicElement;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Sector?: new (options: GraphicElementOptions) => GraphicElement;
    Polygon: new (options: GraphicElementOptions) => GraphicElement;
    Polyline: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
    makePath?: (pathData: string, options: GraphicElementOptions) => GraphicElement;
  };
}


interface RadialBoxplotChartView {
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

type TooltipMarkupNameValueBlock = {
  type: 'nameValue';
  markerType?: string;
  markerColor?: string;
  name?: string;
  value?: unknown;
  noValue?: boolean;
  dataIndex?: number;
};

type TooltipMarkupSection = {
  type: 'section';
  header?: unknown;
  noHeader?: boolean;
  sortBlocks?: boolean;
  blocks?: TooltipMarkupNameValueBlock[];
};

type TooltipSummaryField = {
  name: 'min' | 'q1' | 'q2' | 'q3' | 'max';
  optionKey: 'minField' | 'q1Field' | 'medianField' | 'q3Field' | 'maxField';
  defaultField: RadialBoxplotField;
  fallbackIndex: number;
  fallbackNames: string[];
};

const echartsHost = echarts as unknown as EChartsHost;
const tooltipSummaryFields: TooltipSummaryField[] = [
  { name: 'min', optionKey: 'minField', defaultField: 'min', fallbackIndex: 1, fallbackNames: ['low', 'lower', 'minimum'] },
  { name: 'q1', optionKey: 'q1Field', defaultField: 'q1', fallbackIndex: 2, fallbackNames: ['quartile1', 'lowerQuartile'] },
  { name: 'q2', optionKey: 'medianField', defaultField: 'median', fallbackIndex: 3, fallbackNames: ['med', 'value'] },
  { name: 'q3', optionKey: 'q3Field', defaultField: 'q3', fallbackIndex: 4, fallbackNames: ['quartile3', 'upperQuartile'] },
  { name: 'max', optionKey: 'maxField', defaultField: 'max', fallbackIndex: 5, fallbackNames: ['high', 'upper', 'maximum'] }
];
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
  'categoryField',
  'nameField',
  'minField',
  'q1Field',
  'medianField',
  'q3Field',
  'maxField',
  'dimensions',
  'categories',
  'min',
  'max',
  'tickCount',
  'nice',
  'boxWidth',
  'capWidth',
  'labelRadius'
] as const satisfies ReadonlyArray<Extract<keyof RadialBoxplotLayoutOption, string>>;
const layerZ = {
  axis: 0,
  box: 3,
  whisker: 4,
  median: 5,
  hit: 8
} as const;

echartsHost.extendSeriesModel({
  type: 'series.radialBoxplot',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: RadialBoxplotSeriesModel, option: RadialBoxplotLayoutOption) {
    const source = Array.isArray(option.data) ? option.data : [];
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  getTooltipPosition(this: RadialBoxplotSeriesModel, dataIndex: number) {
    const layout = this.getData().getItemLayout(dataIndex);
    return Array.isArray(layout) ? layout : undefined;
  },

  formatTooltip(this: RadialBoxplotSeriesModel, dataIndex: number) {
    return formatRadialBoxplotTooltip(this, dataIndex);
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '96%',
    height: '96%',
    padding: 36,
    center: null,
    radius: null,
    innerRadius: '18%',
    outerRadius: '82%',
    labelRadius: null,
    startAngle: 90,
    angleSpan: 360,
    clockwise: true,
    categoryField: 'name',
    nameField: null,
    minField: 'min',
    q1Field: 'q1',
    medianField: 'median',
    q3Field: 'q3',
    maxField: 'max',
    dimensions: null,
    categories: null,
    min: null,
    max: null,
    tickCount: 7,
    nice: true,
    boxWidth: 0.58,
    capWidth: 0.34,
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
          opacity: 0.62
        }
      }
    },
    angleAxis: {
      show: true,
      label: {
        show: true,
        color: '#8d949e',
        fontSize: 14,
        formatter: '{value}',
        rotate: 'tangential'
      },
      splitLine: {
        show: false,
        lineStyle: {
          color: '#d8dee8',
          width: 1,
          type: 'dashed',
          opacity: 0.5
        }
      }
    },
    itemStyle: {
      color: '#2f83ed',
      borderColor: '#111111',
      borderWidth: 1.2,
      opacity: 0.96
    },
    whiskerLineStyle: {
      color: '#111111',
      width: 1.2,
      opacity: 1,
      type: 'solid'
    },
    medianLineStyle: {
      color: '#111111',
      width: 1.2,
      opacity: 1,
      type: 'solid'
    },
    capLineStyle: {
      color: '#111111',
      width: 1.2,
      opacity: 1,
      type: 'solid'
    },
    tooltip: {
      trigger: 'item'
    },
    emphasis: {
      itemStyle: {
        borderWidth: 2,
        shadowBlur: 7,
        shadowColor: 'rgba(17, 24, 39, 0.24)'
      }
    }
  }
});

echartsHost.extendChartView({
  type: 'radialBoxplot',

  render(this: RadialBoxplotChartView, seriesModel: RadialBoxplotSeriesModel, ecModel: unknown, api: EChartsApi) {
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
      const layout = resolveRadialBoxplotLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel, isUpdate) => (
        drawRadialBoxplot(echartsHost, targetGroup, targetSeriesModel, layout, rect, isUpdate)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
    } catch (error) {
      console.error('[radialBoxplot] render failed', error);
    }
  },

  remove(this: RadialBoxplotChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: RadialBoxplotChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: RadialBoxplotSeriesModel, rect: ViewRect): RadialBoxplotLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: RadialBoxplotLayoutOption = {
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

function drawRadialBoxplot(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: RadialBoxplotSeriesModel,
  layout: RadialBoxplotLayoutResult,
  rect: ViewRect,
  isUpdate: boolean
): ElementHoverItem[] {
  const chartGroup = new echartsInstance.graphic.Group();
  const hoverItems: ElementHoverItem[] = [];
  const hoverItemsByDataIndex = new Map<number, ElementHoverItem>();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  drawGrid(echartsInstance, chartGroup, seriesModel, layout);
  drawBoxes(echartsInstance, chartGroup, seriesModel, layout, hoverItems, hoverItemsByDataIndex);
  drawWhiskers(echartsInstance, chartGroup, seriesModel, layout, hoverItemsByDataIndex, isUpdate);
  drawHitAreas(echartsInstance, chartGroup, seriesModel, layout, rect, hoverItemsByDataIndex);

  group.add(chartGroup);
  return hoverItems;
}

function drawGrid(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: RadialBoxplotSeriesModel,
  layout: RadialBoxplotLayoutResult
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
  const angleSplitLineVisible = nestedOptionValue(angleAxisOption, 'splitLine', 'show') === true || angleSplitLineModel.get('show') === true;
  const radialLabelVisible = nestedOptionValue(radialAxisOption, 'label', 'show') !== false && radialLabelModel.get('show') !== false;
  const angleLabelVisible = nestedOptionValue(angleAxisOption, 'label', 'show') !== false && angleLabelModel.get('show') !== false;

  if (radialAxisVisible && radialSplitLineVisible) {
    const style = readLineStyle(radialSplitLineModel.getModel('lineStyle'), {
      stroke: '#d8dee8',
      lineWidth: 1,
      opacity: 0.62,
      lineDash: [5, 7]
    });

    layout.radialTicks.forEach((tick) => {
      const circle = new echartsInstance.graphic.Circle({
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
      });
      setAliveRenderKey(circle, `radial-boxplot-radial-tick:${tick.value}`);
      group.add(circle);
    });
  }

  if (angleAxisVisible && angleSplitLineVisible) {
    const style = readLineStyle(angleSplitLineModel.getModel('lineStyle'), {
      stroke: '#d8dee8',
      lineWidth: 1,
      opacity: 0.5,
      lineDash: [5, 7]
    });

    layout.angleLabels.forEach((label) => {
      const inner = polarPoint(layout.centerX, layout.centerY, Math.max(layout.innerRadius - 2, 0), label.angle);
      const outer = polarPoint(layout.centerX, layout.centerY, layout.outerRadius, label.angle);
      const line = new echartsInstance.graphic.Line({
        shape: {
          x1: inner.x,
          y1: inner.y,
          x2: outer.x,
          y2: outer.y
        },
        style,
        silent: true,
        z2: layerZ.axis
      });
      setAliveRenderKey(line, `radial-boxplot-angle-line:${label.value}`);
      group.add(line);
    });
  }

  if (radialAxisVisible && radialLabelVisible) {
    layout.radialTicks.forEach((tick) => {
      const point = polarPoint(layout.centerX, layout.centerY, tick.radius, layout.startAngle);
      const label = new echartsInstance.graphic.Text({
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
      });
      setAliveRenderKey(label, `radial-boxplot-radial-label:${tick.value}`);
      group.add(label);
    });
  }

  if (angleAxisVisible && angleLabelVisible) {
    layout.angleLabels.forEach((label) => {
      const rotate = angleLabelModel.get('rotate');
      const shouldRotate = rotate === true || rotate === 'tangential';
      const text = new echartsInstance.graphic.Text({
        style: {
          x: label.x,
          y: label.y,
          text: formatAxisLabel(angleLabelModel.get('formatter'), label.name),
          fill: angleLabelModel.get('color') || '#8d949e',
          fontSize: finiteNumber(angleLabelModel.get('fontSize'), 14),
          fontWeight: angleLabelModel.get('fontWeight') || 400,
          align: shouldRotate ? 'center' : label.align,
          verticalAlign: shouldRotate ? 'middle' : label.verticalAlign
        },
        rotation: shouldRotate ? label.rotation : 0,
        originX: label.x,
        originY: label.y,
        silent: true,
        z2: layerZ.axis
      });
      setAliveRenderKey(text, `radial-boxplot-angle-label:${label.value}`);
      group.add(text);
    });
  }
}

function drawBoxes(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: RadialBoxplotSeriesModel,
  layout: RadialBoxplotLayoutResult,
  hoverItems: ElementHoverItem[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>
): void {
  const data = seriesModel.getData();
  layout.boxes.forEach((box, index) => {
    const itemModel = data.getItemModel(box.dataIndex);
    const style = readBoxStyle(data, seriesModel, itemModel, box);
    const boxElement = createSectorOrPolygon(echartsInstance, layout, box, {
      fill: style.fill,
      stroke: style.stroke,
      lineWidth: style.lineWidth,
      opacity: style.opacity
    }, true, layerZ.box);
    setAliveRenderKey(boxElement, `radial-boxplot-box:${radialBoxplotBoxKey(box)}`);
    const hoverItem = createHoverItem(boxElement);
    hoverItems.push(hoverItem);
    hoverItemsByDataIndex.set(box.dataIndex, hoverItem);
    group.add(boxElement);
  });
}

function drawWhiskers(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: RadialBoxplotSeriesModel,
  layout: RadialBoxplotLayoutResult,
  hoverItemsByDataIndex: Map<number, ElementHoverItem>,
  isUpdate: boolean
): void {
  const whiskerStyle = readLineStyle(seriesModel.getModel('whiskerLineStyle'), {
    stroke: '#111111',
    lineWidth: 1.2,
    opacity: 1
  });
  const medianStyle = readLineStyle(seriesModel.getModel('medianLineStyle'), {
    stroke: '#111111',
    lineWidth: 1.2,
    opacity: 1
  });
  const capStyle = readLineStyle(seriesModel.getModel('capLineStyle'), whiskerStyle);

  layout.boxes.forEach((box, index) => {
    const animation = isUpdate ? disabledEnterAnimation() : readEnterAnimation(seriesModel, index);
    const boxKey = radialBoxplotBoxKey(box);
    const whiskerLines: Array<[string, RadialBoxplotBox['lowerWhisker']]> = [
      ['lower', box.lowerWhisker],
      ['upper', box.upperWhisker]
    ];
    whiskerLines.forEach(([kind, lineShape]) => {
      const line = new echartsInstance.graphic.Line({
        shape: { ...lineShape },
        style: whiskerStyle,
        silent: true,
        z2: layerZ.whisker
      });
      applyLineEnterAnimation(line, animation);
      setAliveRenderKey(line, `radial-boxplot-whisker:${boxKey}:${kind}`);
      addHoverElement(hoverItemsByDataIndex.get(box.dataIndex), line);
      group.add(line);
    });

    const caps: Array<[string, number]> = [
      ['min', box.minRadius],
      ['max', box.maxRadius]
    ];
    caps.forEach(([kind, radius]) => {
      const cap = createArcOrPolyline(echartsInstance, layout, box.capStartAngle, box.capEndAngle, radius, capStyle, true, layerZ.whisker);
      applyPathEnterAnimation(cap, 'style', 'strokePercent', animation);
      setAliveRenderKey(cap, `radial-boxplot-cap:${boxKey}:${kind}`);
      addHoverElement(hoverItemsByDataIndex.get(box.dataIndex), cap);
      group.add(cap);
    });

    const median = createArcOrPolyline(echartsInstance, layout, box.capStartAngle, box.capEndAngle, box.medianRadius, medianStyle, true, layerZ.median);
    applyPathEnterAnimation(median, 'style', 'strokePercent', animation);
    setAliveRenderKey(median, `radial-boxplot-median:${boxKey}`);
    addHoverElement(hoverItemsByDataIndex.get(box.dataIndex), median);
    group.add(median);
  });
}

function drawHitAreas(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: RadialBoxplotSeriesModel,
  layout: RadialBoxplotLayoutResult,
  rect: ViewRect,
  hoverItemsByDataIndex: Map<number, ElementHoverItem>
): void {
  const data = seriesModel.getData();
  layout.boxes.forEach((box) => {
    if (box.dataIndex < 0 || box.dataIndex >= data.count()) return;

    data.setItemLayout(box.dataIndex, [box.medianX + rect.x, box.medianY + rect.y]);
    const hitArea = createSectorOrPolygon(echartsInstance, layout, box, {
      fill: 'rgba(0,0,0,0)',
      stroke: 'rgba(0,0,0,0)',
      opacity: 0
    }, false, layerZ.hit);
    data.setItemGraphicEl(box.dataIndex, hitArea);
    setAliveRenderKey(hitArea, `radial-boxplot-hit:${radialBoxplotBoxKey(box)}`);
    addHoverElement(hoverItemsByDataIndex.get(box.dataIndex), hitArea);
    group.add(hitArea);
  });
}

function radialBoxplotBoxKey(box: RadialBoxplotBox): string {
  return String(box.id || box.categoryValue || box.name || box.dataIndex);
}

function createSectorOrPolygon(
  echartsInstance: EChartsHost,
  layout: RadialBoxplotLayoutResult,
  box: RadialBoxplotBox,
  style: Record<string, unknown>,
  silent: boolean,
  z2: number
): GraphicElement {
  if (echartsInstance.graphic.Sector) {
    return new echartsInstance.graphic.Sector({
      shape: {
        cx: layout.centerX,
        cy: layout.centerY,
        r0: box.q1Radius,
        r: box.q3Radius,
        startAngle: toZrenderAngle(box.startAngle),
        endAngle: toZrenderAngle(box.endAngle),
        clockwise: layout.clockwise
      },
      style,
      silent,
      z2
    });
  }

  return new echartsInstance.graphic.Polygon({
    shape: {
      points: box.boxPoints
    },
    style,
    silent,
    z2
  });
}

function createArcOrPolyline(
  echartsInstance: EChartsHost,
  layout: RadialBoxplotLayoutResult,
  startAngle: number,
  endAngle: number,
  radius: number,
  style: Record<string, unknown>,
  silent: boolean,
  z2: number
): GraphicElement {
  if (echartsInstance.graphic.Arc) {
    return new echartsInstance.graphic.Arc({
      shape: {
        cx: layout.centerX,
        cy: layout.centerY,
        r: radius,
        startAngle: toZrenderAngle(startAngle),
        endAngle: toZrenderAngle(endAngle),
        clockwise: layout.clockwise
      },
      style: {
        ...style,
        fill: null
      },
      silent,
      z2
    });
  }

  return new echartsInstance.graphic.Polyline({
    shape: {
      points: arcPointsForFallback(layout.centerX, layout.centerY, radius, startAngle, endAngle, layout.clockwise)
    },
    style: {
      ...style,
      fill: null
    },
    silent,
    z2
  });
}

function toZrenderAngle(angle: number): number {
  return -angle * Math.PI / 180;
}

function arcPointsForFallback(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  clockwise: boolean
): Array<[number, number]> {
  let sweep = endAngle - startAngle;
  if (clockwise) {
    while (sweep > 0) sweep -= 360;
  } else {
    while (sweep < 0) sweep += 360;
  }
  const steps = Math.max(4, Math.ceil(Math.abs(sweep) / 10));
  return Array.from({ length: steps + 1 }, (_, index) => {
    const angle = (startAngle + sweep * index / steps) * Math.PI / 180;
    return [
      centerX + Math.cos(angle) * radius,
      centerY - Math.sin(angle) * radius
    ];
  });
}

function readBoxStyle(
  data: SeriesData,
  seriesModel: RadialBoxplotSeriesModel,
  itemModel: EChartsModel,
  box: RadialBoxplotBox
): Record<string, unknown> {
  const itemStyleModel = itemModel.getModel('itemStyle');
  const seriesItemStyleModel = seriesModel.getModel('itemStyle');
  const visualStyle = asRecord(data.getItemVisual(box.dataIndex, 'style'));
  return {
    fill: itemStyleModel.get('color') || visualStyle.fill || seriesItemStyleModel.get('color') || '#2f83ed',
    stroke: itemStyleModel.get('borderColor') || seriesItemStyleModel.get('borderColor') || '#111111',
    lineWidth: finiteNumber(itemStyleModel.get('borderWidth'), finiteNumber(seriesItemStyleModel.get('borderWidth'), 1.2)),
    opacity: finiteNumber(itemStyleModel.get('opacity'), finiteNumber(seriesItemStyleModel.get('opacity'), 0.96))
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

function formatRadialBoxplotTooltip(seriesModel: RadialBoxplotSeriesModel, dataIndex: number): TooltipMarkupSection {
  const option = seriesModel.option || {};
  const source = Array.isArray(option.data) ? option.data : [];
  const raw = source[dataIndex];
  const dimensions = normalizeTooltipDimensions(option.dimensions);
  const markerColor = readTooltipMarkerColor(seriesModel, dataIndex);

  return {
    type: 'section',
    header: readTooltipHeader(seriesModel, raw, dimensions, dataIndex),
    noHeader: false,
    sortBlocks: false,
    blocks: tooltipSummaryFields.map((field) => {
      const value = readTooltipSummaryValue(option, raw, dimensions, field);
      return {
        type: 'nameValue',
        markerType: 'subItem',
        markerColor,
        name: field.name,
        value,
        noValue: isEmptyTooltipValue(value),
        dataIndex
      };
    })
  };
}

function readTooltipSummaryValue(
  option: RadialBoxplotLayoutOption,
  raw: unknown,
  dimensions: string[] | undefined,
  field: TooltipSummaryField
): unknown {
  return readRawField(
    raw,
    readTooltipField(option[field.optionKey], field.defaultField),
    dimensions,
    field.fallbackIndex,
    field.fallbackNames
  );
}

function readTooltipHeader(
  seriesModel: RadialBoxplotSeriesModel,
  raw: unknown,
  dimensions: string[] | undefined,
  dataIndex: number
): unknown {
  const option = seriesModel.option || {};
  const nameField = readOptionalTooltipField(option.nameField);
  const categoryField = readTooltipField(option.categoryField, 'name');
  const header = nameField == null
    ? undefined
    : readRawField(raw, nameField, dimensions, 0, ['name', 'category', 'region', 'group']);
  return header
    ?? readRawField(raw, categoryField, dimensions, 0, ['name', 'category', 'region', 'group'])
    ?? seriesModel.getData().getName?.(dataIndex)
    ?? '';
}

function readTooltipMarkerColor(seriesModel: RadialBoxplotSeriesModel, dataIndex: number): string {
  const data = seriesModel.getData();
  const itemModel = data.getItemModel(dataIndex);
  const itemStyleModel = itemModel.getModel('itemStyle');
  const seriesItemStyleModel = seriesModel.getModel('itemStyle');
  const visualStyle = asRecord(data.getItemVisual(dataIndex, 'style'));
  const color = itemStyleModel.get('color')
    || visualStyle.fill
    || visualStyle.stroke
    || seriesItemStyleModel.get('color')
    || '#2f83ed';
  return typeof color === 'string' ? color : '#2f83ed';
}

function normalizeTooltipDimensions(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined;
}

function readRawField(
  raw: unknown,
  field: RadialBoxplotField,
  dimensions: string[] | undefined,
  fallbackIndex: number,
  fallbackNames: string[]
): unknown {
  if (Array.isArray(raw)) {
    const dimensionIndex = typeof field === 'string' ? dimensions?.indexOf(field) : undefined;
    const index = typeof field === 'number'
      ? field
      : dimensionIndex != null && dimensionIndex >= 0
        ? dimensionIndex
        : fallbackIndex;
    return index >= 0 ? raw[index] : undefined;
  }

  const record = asRecord(raw);
  if (!Object.keys(record).length) return undefined;
  if (typeof field === 'string' && record[field] != null) return record[field];
  for (const fallbackName of fallbackNames) {
    if (record[fallbackName] != null) return record[fallbackName];
  }
  return undefined;
}

function readTooltipField(value: unknown, fallback: RadialBoxplotField): RadialBoxplotField {
  return typeof value === 'string' || typeof value === 'number' ? value : fallback;
}

function readOptionalTooltipField(value: unknown): RadialBoxplotField | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function isEmptyTooltipValue(value: unknown): boolean {
  return value == null || value === '' || (typeof value === 'number' && Number.isNaN(value));
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
  seriesModel: RadialBoxplotSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 34);
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

function applyLineEnterAnimation(element: GraphicElement, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const shape = animatable.shape || {};
  shape.percent = 0;
  animatable.shape = shape;
  animateGraphicProperty(animatable, 'shape', animation, { percent: 1 });
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

export const __test__ = {
  readLayoutOption,
  drawRadialBoxplot,
  drawGrid,
  drawBoxes,
  drawWhiskers,
  drawHitAreas,
  radialBoxplotBoxKey,
  createSectorOrPolygon,
  createArcOrPolyline,
  toZrenderAngle,
  arcPointsForFallback,
  readBoxStyle,
  readLineStyle,
  readLineDash,
  formatRadialBoxplotTooltip,
  readTooltipSummaryValue,
  readTooltipHeader,
  readTooltipMarkerColor,
  normalizeTooltipDimensions,
  readRawField,
  readTooltipField,
  readOptionalTooltipField,
  isEmptyTooltipValue,
  formatAxisLabel,
  polarPoint,
  readEnterAnimation,
  disabledEnterAnimation,
  resolveAnimationNumber,
  resolveAnimationEasing,
  applyPathEnterAnimation,
  applyLineEnterAnimation,
  animateGraphicProperty,
  asRecord,
  nestedOptionValue,
  finiteNumber,
  createHoverItem,
  addHoverElement
};
