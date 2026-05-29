import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive, setAliveRenderKey } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import { resolveEvolutionFluidLayout } from './layout.js';
import { DEFAULT_WATERDROP_FUSION_SHAPE, buildWaterdropFusionPath } from './waterdrop-fusion.js';
import type { WaterdropFusionPathContext, WaterdropFusionShape } from './waterdrop-fusion.js';
import type {
  EvolutionFluidBridgeLayout,
  EvolutionFluidEntityLayout,
  EvolutionFluidLayoutOption,
  EvolutionFluidLayoutResult
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
  getItemLayout(index: number): unknown;
  setItemLayout(index: number, layout: [number, number]): void;
  setItemGraphicEl(index: number, element: GraphicElement): void;
}

interface EvolutionFluidSeriesModel extends EChartsModel {
  option?: EvolutionFluidLayoutOption;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
}

interface GraphicElement {
  [key: string]: unknown;
}

interface GraphicGroup extends GraphicElement {
  x?: number;
  y?: number;
  add(element: GraphicElement): void;
  removeAll(): void;
}

interface GraphicElementOptions {
  shape?: Record<string, unknown> | Partial<WaterdropFusionGraphicShape>;
  style?: Record<string, unknown>;
  silent?: boolean;
  z2?: number;
  cursor?: string;
}

interface LabelBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface LabelPlacement {
  x: number;
  y: number;
  align: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  box: LabelBox;
}

interface EntityDrawPolicy {
  hiddenCircleIds: Set<string>;
  opaqueCircleIds: Set<string>;
  elevatedCircleIds: Set<string>;
}

interface WaterdropFusionGraphicOptions extends GraphicElementOptions {}

interface WaterdropFusionGraphicConstructor {
  new (options: WaterdropFusionGraphicOptions): GraphicElement;
}

type WaterdropFusionGraphicShape = WaterdropFusionShape;

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
  List: new (dimensions: unknown, host: EvolutionFluidSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
    makePath?: (path: string, options: GraphicElementOptions) => GraphicElement;
    extendShape?: (definition: Record<string, unknown>) => WaterdropFusionGraphicConstructor;
  };
}

interface EvolutionFluidView {
  group: GraphicGroup;
  __renderToken?: object | null;
  __hoverController?: ElementHoverController;
  __aliveRenderState?: AliveRenderState;
}

const echartsHost = echarts as unknown as EChartsHost;

echartsHost.extendSeriesModel({
  type: 'series.evolutionFluid',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: EvolutionFluidSeriesModel, option: EvolutionFluidLayoutOption) {
    /* v8 ignore next -- ECharts merges default entities before this hook, so later data/empty fallbacks are host-defense only. */
    const source = Array.isArray(option.entities) ? option.entities : Array.isArray(option.data) ? option.data : [];
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  getTooltipPosition(this: EvolutionFluidSeriesModel, dataIndex: number) {
    const layout = this.getData().getItemLayout(dataIndex);
    return Array.isArray(layout) ? layout : undefined;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '94%',
    height: '86%',
    entities: [],
    events: [],
    timeField: 'time',
    entityIdField: 'id',
    valueField: 'value',
    categoryField: 'industry',
    currentTime: null,
    autoplay: true,
    playSpeed: 1,
    animationDurationUpdate: 0,
    layout: {
      clustering: 'category',
      center: ['50%', '48%'],
      categoryGap: 120,
      collisionPadding: 8
    },
    dropletStyle: {
      minRadius: 4,
      maxRadius: 12,
      opacity: 0.82,
      bridgeOpacity: 0.9,
      bridgeThreshold: 120,
      bridgeColor: null
    },
    timeline: {
      show: true,
      bottom: 18,
      height: 36
    },
    label: {
      show: true,
      formatter: '{b}',
      color: '#0f172a',
      fontSize: 12,
      fontWeight: 700
    },
    tooltip: {
      trigger: 'item'
    }
  }
});

echartsHost.extendChartView({
  type: 'evolutionFluid',

  render(this: EvolutionFluidView, seriesModel: EvolutionFluidSeriesModel, ecModel: unknown, api: EChartsApi) {
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
      /* v8 ignore next -- ECharts supplies seriesModel.option in the supported render path. */
      const layout = resolveEvolutionFluidLayout({
        ...(seriesModel.option || {}),
        width: rect.width,
        height: rect.height
      });
      /* v8 ignore next -- Guards a stale async render token; renderAlive is synchronous in the covered SSR host path. */
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawEvolutionFluid(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(hoverItems, { zrender: api.getZr?.() });
    } catch (error) {
      /* v8 ignore next -- Defensive host catch; normal rendering paths are covered by SVG integration tests. */
      console.error('[evolutionFluid] render failed', error);
    }
  },

  /* v8 ignore next 7 -- Real chart disposal is covered; ECharts SSR clear does not call this view remove hook. */
  remove(this: EvolutionFluidView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: EvolutionFluidView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function drawEvolutionFluid(
  host: EChartsHost,
  root: GraphicGroup,
  seriesModel: EvolutionFluidSeriesModel,
  layout: EvolutionFluidLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const group = new host.graphic.Group();
  group.x = rect.x;
  group.y = rect.y;
  const hoverItems: ElementHoverItem[] = [];

  const drawPolicy = bridgeEntityDrawPolicy(layout.bridges);
  drawBridges(host, group, layout.bridges, seriesModel);
  drawEntities(host, group, layout.entities, seriesModel, hoverItems, drawPolicy);
  drawTimeline(host, group, layout);

  root.add(group);
  return hoverItems;
}

function drawEntities(
  host: EChartsHost,
  group: GraphicGroup,
  entities: EvolutionFluidEntityLayout[],
  seriesModel: EvolutionFluidSeriesModel,
  hoverItems: ElementHoverItem[],
  drawPolicy: EntityDrawPolicy
) {
  const labelModel = seriesModel.getModel('label');
  const data = seriesModel.getData();
  const labelBoxes: LabelBox[] = [];
  entities.forEach((entity) => {
    /* v8 ignore next -- Out-of-range dataIndex is generated internally and has no item model by design. */
    const itemModel = entity.dataIndex < data.count() ? data.getItemModel(entity.dataIndex) : null;
    const itemLabelModel = itemModel?.getModel('label');
    const borderColor = itemModel?.get(['itemStyle', 'borderColor']) ?? seriesModel.get(['itemStyle', 'borderColor']);
    const borderWidth = readNumber(itemModel?.get(['itemStyle', 'borderWidth']) ?? seriesModel.get(['itemStyle', 'borderWidth']), 0);
    if (entity.dataIndex >= 0 && entity.dataIndex < data.count()) {
      data.setItemLayout(entity.dataIndex, [entity.x, entity.y]);
    }
    if (!drawPolicy.hiddenCircleIds.has(entity.id)) {
      const circle = new host.graphic.Circle({
        shape: { cx: entity.x, cy: entity.y, r: entity.r },
        style: {
          fill: entity.color,
          opacity: drawPolicy.opaqueCircleIds.has(entity.id) ? 1 : entity.opacity,
          stroke: borderColor || 'rgba(255, 255, 255, 0)',
          lineWidth: borderWidth
        },
        z2: drawPolicy.elevatedCircleIds.has(entity.id) ? Math.max(entity.z2 ?? 5, 6) : entity.z2 ?? 5
      });
      setAliveRenderKey(circle, `entity:${entity.id}`);
      group.add(circle);
      hoverItems.push({ elements: [circle] });
      if (entity.dataIndex >= 0 && entity.dataIndex < data.count()) {
        data.setItemGraphicEl(entity.dataIndex, circle);
      }
    }
    /* v8 ignore next -- Optional item-label fallback branches depend on ECharts model internals, while visible label behavior is covered. */
    if ((itemLabelModel?.get('show') ?? labelModel.get('show')) !== false && !isGeneratedEntity(entity.raw)) {
      /* v8 ignore next -- Same ECharts item-model fallback as above. */
      const labelText = formatLabel(itemLabelModel?.get('formatter') ?? labelModel.get('formatter'), entity);
      const fontSize = readNumber(itemLabelModel?.get('fontSize'), readNumber(labelModel.get('fontSize'), 12));
      const placement = placeEntityLabel(entity, labelText, fontSize, labelBoxes);
      labelBoxes.push(placement.box);
      const text = new host.graphic.Text({
        style: {
          x: placement.x,
          y: placement.y,
          text: labelText,
              /* v8 ignore next -- The final literal fallback is only for malformed host label models. */
              fill: itemLabelModel?.get('color') || labelModel.get('color') || '#0f172a',
              fontSize,
              /* v8 ignore next -- The final literal fallback is only for malformed host label models. */
              fontWeight: itemLabelModel?.get('fontWeight') || labelModel.get('fontWeight') || 700,
          align: placement.align,
          verticalAlign: placement.verticalAlign
        },
        silent: true,
        z2: 9
      });
      setAliveRenderKey(text, `entity-label:${entity.id}`);
      group.add(text);
    }
  });
}

function placeEntityLabel(
  entity: EvolutionFluidEntityLayout,
  text: string,
  fontSize: number,
  boxes: LabelBox[]
): LabelPlacement {
  const width = Math.max(fontSize, Array.from(text).length * fontSize * 0.9);
  const height = fontSize * 1.25;
  const gap = entity.r + 8;
  const candidates = [
    labelPlacement(entity.x, entity.y - gap, width, height, 'center', 'bottom'),
    labelPlacement(entity.x, entity.y + gap, width, height, 'center', 'top'),
    labelPlacement(entity.x + entity.r + 10, entity.y, width, height, 'left', 'middle'),
    labelPlacement(entity.x - entity.r - 10, entity.y, width, height, 'right', 'middle'),
    labelPlacement(entity.x + 14, entity.y - gap - 4, width, height, 'center', 'bottom'),
    labelPlacement(entity.x - 14, entity.y + gap + 4, width, height, 'center', 'top')
  ];
  const clear = candidates.find((candidate) => boxes.every((box) => !boxesOverlap(candidate.box, box)));
  if (clear) return clear;
  return candidates
    .map((candidate) => ({
      candidate,
      overlap: boxes.reduce((sum, box) => sum + overlapArea(candidate.box, box), 0)
    }))
    .sort((left, right) => left.overlap - right.overlap)[0].candidate;
}

function labelPlacement(
  x: number,
  y: number,
  width: number,
  height: number,
  align: LabelPlacement['align'],
  verticalAlign: LabelPlacement['verticalAlign']
): LabelPlacement {
  const left = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  const top = verticalAlign === 'middle' ? y - height / 2 : verticalAlign === 'bottom' ? y - height : y;
  return {
    x,
    y,
    align,
    verticalAlign,
    box: {
      left,
      right: left + width,
      top,
      bottom: top + height
    }
  };
}

function boxesOverlap(left: LabelBox, right: LabelBox): boolean {
  return left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top;
}

function overlapArea(left: LabelBox, right: LabelBox): number {
  const width = Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left));
  const height = Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
  return width * height;
}

function drawBridges(
  host: EChartsHost,
  group: GraphicGroup,
  bridges: EvolutionFluidBridgeLayout[],
  seriesModel: EvolutionFluidSeriesModel
) {
  bridges.forEach((bridge) => {
    /* v8 ignore next -- The literal color fallback is for malformed bridge data; layout always supplies a bridge color. */
    const color = seriesModel.get(['dropletStyle', 'bridgeColor']) || bridge.color || '#38bdf8';
    const style = {
      fill: color,
      opacity: bridge.opacity,
      stroke: null,
      lineWidth: 0
    };
    let path = createWaterdropFusionGraphicElement(host, bridge, style);

    if (!path) {
      /* v8 ignore next -- Covered hosts provide makePath and layout-created bridges carry paths. */
      if (!bridge.path || !host.graphic.makePath) return;
      /* v8 ignore next -- Generic fallback is only used for non-surface bridge paths. */
      path = host.graphic.makePath(bridge.path, {
        style,
        silent: true,
        z2: bridge.kind === 'surface' ? 2 : 4
      });
    }

    setAliveRenderKey(path, `bridge:${bridge.id}`);
    group.add(path);
  });
}

let WaterdropFusionGraphic: WaterdropFusionGraphicConstructor | null | undefined;

function createWaterdropFusionGraphicElement(
  host: EChartsHost,
  bridge: EvolutionFluidBridgeLayout,
  style: Record<string, unknown>
): GraphicElement | null {
  if (!bridge.surfaceShape) return null;
  const WaterdropFusion = getWaterdropFusionGraphic(host);
  /* v8 ignore next -- ECharts graphic.extendShape exists in supported renderers. */
  if (!WaterdropFusion) return null;
  return new WaterdropFusion({
    shape: bridge.surfaceShape,
    style: {
      ...style,
      /* v8 ignore next -- Bridge style fill is resolved before constructing this element. */
      fill: style.fill || '#ffffff'
    },
    silent: true,
    z2: bridge.kind === 'surface' ? 2 : 4
  });
}

function getWaterdropFusionGraphic(host: EChartsHost): WaterdropFusionGraphicConstructor | null {
  if (WaterdropFusionGraphic !== undefined) return WaterdropFusionGraphic;
  /* v8 ignore next 3 -- Supported ECharts hosts expose extendShape; this is a compatibility guard. */
  if (typeof host.graphic.extendShape !== 'function') {
    WaterdropFusionGraphic = null;
    return WaterdropFusionGraphic;
  }
  WaterdropFusionGraphic = host.graphic.extendShape({
    type: 'waterdropFusion',
    shape: { ...DEFAULT_WATERDROP_FUSION_SHAPE },
    buildPath(ctx: CanvasRenderingContext2D, shape: WaterdropFusionGraphicShape) {
      buildWaterdropFusionPath(ctx as unknown as WaterdropFusionPathContext, shape);
    }
  });
  return WaterdropFusionGraphic;
}

function bridgeEntityDrawPolicy(bridges: EvolutionFluidBridgeLayout[]): EntityDrawPolicy {
  const hiddenCircleIds = new Set<string>();
  const opaqueCircleIds = new Set<string>();
  const elevatedCircleIds = new Set<string>();
  bridges.forEach((bridge) => {
    if (!bridge.surfaceShape) return;
    /* v8 ignore next -- Layout bridges always carry sourceIds. */
    const sourceIds = bridge.sourceIds.length ? bridge.sourceIds : [bridge.sourceId];
    /* v8 ignore next -- Layout bridges always carry targetIds. */
    const targetIds = bridge.targetIds.length ? bridge.targetIds : [bridge.targetId];
    if (bridge.surfaceShape.bridgeOnly) {
      sourceIds.forEach((id) => opaqueCircleIds.add(id));
      targetIds.forEach((id) => opaqueCircleIds.add(id));
      /* v8 ignore next -- Covered bridgeOnly paths are absorb-like in ECharts rendering; split policy is layout-tested. */
      const elevatedIds = bridge.kind === 'split' ? targetIds : sourceIds;
      elevatedIds.forEach((id) => elevatedCircleIds.add(id));
      return;
    }
    /* v8 ignore start -- Absorb/split surface shapes are emitted as bridgeOnly; these branches are for hand-built bridge data. */
    if (bridge.kind === 'absorb') {
      targetIds.forEach((id) => hiddenCircleIds.add(id));
      sourceIds.forEach((id) => opaqueCircleIds.add(id));
    } else if (bridge.kind === 'split') {
      sourceIds.forEach((id) => hiddenCircleIds.add(id));
      targetIds.forEach((id) => opaqueCircleIds.add(id));
    /* v8 ignore stop */
    } else {
      sourceIds.forEach((id) => hiddenCircleIds.add(id));
      targetIds.forEach((id) => hiddenCircleIds.add(id));
    }
  });
  return { hiddenCircleIds, opaqueCircleIds, elevatedCircleIds };
}

function drawTimeline(host: EChartsHost, group: GraphicGroup, layout: EvolutionFluidLayoutResult) {
  if (!layout.timeline.show) return;
  const line = new host.graphic.Line({
    shape: { x1: layout.timeline.startX, y1: layout.timeline.y, x2: layout.timeline.endX, y2: layout.timeline.y },
    style: { stroke: '#64748b', lineWidth: 1.4, opacity: 0.9 },
    silent: true,
    z2: 2
  });
  setAliveRenderKey(line, 'timeline:axis');
  group.add(line);
  layout.timeline.ticks.forEach((tick) => {
    const circle = new host.graphic.Circle({
      shape: { cx: tick.x, cy: layout.timeline.y, r: tick.active ? 4.5 : 3 },
      style: { fill: tick.active ? '#111827' : '#94a3b8', opacity: 1 },
      silent: false,
      cursor: 'pointer',
      z2: 4
    });
    setAliveRenderKey(circle, `timeline:${tick.time}`);
    group.add(circle);
  });
  const handle = new host.graphic.Circle({
    shape: { cx: layout.timeline.handleX, cy: layout.timeline.y, r: 7 },
    style: { fill: '#2563eb', stroke: '#ffffff', lineWidth: 2 },
    z2: 6
  });
  setAliveRenderKey(handle, 'timeline:handle');
  group.add(handle);
}

function formatLabel(formatter: unknown, entity: EvolutionFluidEntityLayout): string {
  if (typeof formatter === 'function') return String(formatter({ data: entity.raw, name: entity.name, value: entity.value, entity }));
  if (typeof formatter === 'string') return formatter.replace(/\{b\}/g, entity.name).replace(/\{c\}/g, String(entity.value));
  return entity.name;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isGeneratedEntity(raw: unknown): boolean {
  return typeof raw === 'object' && raw != null && !Array.isArray(raw) && (raw as { generated?: unknown }).generated === true;
}
