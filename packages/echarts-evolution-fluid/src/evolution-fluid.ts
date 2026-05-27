import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive, setAliveRenderKey } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import { resolveEvolutionFluidLayout } from './layout.js';
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
}

interface WaterdropFusionGraphicOptions extends GraphicElementOptions {}

interface WaterdropFusionGraphicConstructor {
  new (options: WaterdropFusionGraphicOptions): GraphicElement;
}

interface WaterdropFusionGraphicShape {
  cx: number;
  cy: number;
  width: number;
  height: number;
  neck: number;
  leftRadius: number;
  rightRadius: number;
  dy: number;
  curve: number;
  bridgeLength: number;
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
      const layout = resolveEvolutionFluidLayout({
        ...(seriesModel.option || {}),
        width: rect.width,
        height: rect.height
      });
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawEvolutionFluid(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(hoverItems, { zrender: api.getZr?.() });
    } catch (error) {
      console.error('[evolutionFluid] render failed', error);
    }
  },

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

  drawBridges(host, group, layout.bridges, seriesModel);
  drawEntities(host, group, layout.entities, seriesModel, hoverItems, blobEntityIds(layout.bridges));
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
  hiddenCircleIds = new Set<string>()
) {
  const labelModel = seriesModel.getModel('label');
  const data = seriesModel.getData();
  entities.forEach((entity) => {
    const itemModel = entity.dataIndex < data.count() ? data.getItemModel(entity.dataIndex) : null;
    const itemLabelModel = itemModel?.getModel('label');
    const borderColor = itemModel?.get(['itemStyle', 'borderColor']) ?? seriesModel.get(['itemStyle', 'borderColor']);
    const borderWidth = readNumber(itemModel?.get(['itemStyle', 'borderWidth']) ?? seriesModel.get(['itemStyle', 'borderWidth']), 0);
    if (entity.dataIndex >= 0 && entity.dataIndex < data.count()) {
      data.setItemLayout(entity.dataIndex, [entity.x, entity.y]);
    }
    if (!hiddenCircleIds.has(entity.id)) {
      const circle = new host.graphic.Circle({
        shape: { cx: entity.x, cy: entity.y, r: entity.r },
        style: {
          fill: entity.color,
          opacity: entity.opacity,
          stroke: borderColor || 'rgba(255, 255, 255, 0)',
          lineWidth: borderWidth
        },
        z2: entity.z2 ?? 5
      });
      setAliveRenderKey(circle, `entity:${entity.id}`);
      group.add(circle);
      hoverItems.push({ elements: [circle] });
      if (entity.dataIndex >= 0 && entity.dataIndex < data.count()) {
        data.setItemGraphicEl(entity.dataIndex, circle);
      }
    }
    if ((itemLabelModel?.get('show') ?? labelModel.get('show')) !== false && !isGeneratedEntity(entity.raw)) {
      const labelDirection = entity.dataIndex % 2 === 0 ? -1 : 1;
      const text = new host.graphic.Text({
        style: {
          x: entity.x + (entity.dataIndex % 3 - 1) * 8,
          y: entity.y + labelDirection * (entity.r + 8),
          text: formatLabel(itemLabelModel?.get('formatter') ?? labelModel.get('formatter'), entity),
          fill: itemLabelModel?.get('color') || labelModel.get('color') || '#0f172a',
          fontSize: readNumber(itemLabelModel?.get('fontSize'), readNumber(labelModel.get('fontSize'), 12)),
          fontWeight: itemLabelModel?.get('fontWeight') || labelModel.get('fontWeight') || 700,
          align: 'center',
          verticalAlign: labelDirection < 0 ? 'bottom' : 'top'
        },
        silent: true,
        z2: 9
      });
      setAliveRenderKey(text, `entity-label:${entity.id}`);
      group.add(text);
    }
  });
}

function drawBridges(
  host: EChartsHost,
  group: GraphicGroup,
  bridges: EvolutionFluidBridgeLayout[],
  seriesModel: EvolutionFluidSeriesModel
) {
  bridges.forEach((bridge) => {
    const color = seriesModel.get(['dropletStyle', 'bridgeColor']) || bridge.color || '#38bdf8';
    const style = {
      fill: color,
      opacity: bridge.opacity,
      stroke: null,
      lineWidth: 0
    };
    let path = createWaterdropFusionGraphicElement(host, bridge, style);

    if (!path) {
      if (!bridge.path || !host.graphic.makePath) return;
      path = host.graphic.makePath(bridge.path, {
        style,
        silent: true,
        z2: bridge.kind === 'surface' ? 2 : 6
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
  if (!WaterdropFusion) return null;
  return new WaterdropFusion({
    shape: bridge.surfaceShape,
    style: {
      ...style,
      fill: style.fill || '#ffffff'
    },
    silent: true,
    z2: bridge.kind === 'surface' ? 2 : 6
  });
}

function getWaterdropFusionGraphic(host: EChartsHost): WaterdropFusionGraphicConstructor | null {
  if (WaterdropFusionGraphic !== undefined) return WaterdropFusionGraphic;
  if (typeof host.graphic.extendShape !== 'function') {
    WaterdropFusionGraphic = null;
    return WaterdropFusionGraphic;
  }
  WaterdropFusionGraphic = host.graphic.extendShape({
    type: 'waterdropFusion',
    shape: {
      cx: 0,
      cy: 0,
      width: 0,
      height: 0,
      neck: 0,
      leftRadius: 0,
      rightRadius: 0,
      dy: 0,
      curve: 0.35,
      bridgeLength: 0
    },
    buildPath(ctx: CanvasRenderingContext2D, shape: WaterdropFusionGraphicShape) {
      const x = shape.cx;
      const y = shape.cy;
      const width = shape.width;
      const defaultRadius = shape.height / 2;
      const leftRadius = shape.leftRadius || defaultRadius;
      const rightRadius = shape.rightRadius || defaultRadius;

      if (width <= 0 || leftRadius <= 0 || rightRadius <= 0) {
        return;
      }

      const leftCx = x - width / 2 + leftRadius;
      const rightCx = x + width / 2 - rightRadius;
      const leftCy = y - shape.dy / 2;
      const rightCy = y + shape.dy / 2;
      const vx = rightCx - leftCx;
      const vy = rightCy - leftCy;
      const dist = Math.sqrt(vx * vx + vy * vy) || 1;
      const minRadius = Math.min(leftRadius, rightRadius);
      const maxNeck = waterdropClamp(shape.neck / minRadius, 0, 1);
      const bridgeLength = Math.max(shape.bridgeLength, 0);
      const gap = dist - leftRadius - rightRadius;
      const rawBridgeRate = gap <= 0
        ? 1
        : bridgeLength > 0
          ? waterdropSmoothStep(1 - gap / bridgeLength)
          : 0;
      const bridgeRate = waterdropSmoothStep((rawBridgeRate - 0.42) / 0.58);
      const visibleBridge = bridgeRate <= 0
        ? 0
        : 0.48 + bridgeRate * 0.52;
      const neck = maxNeck * visibleBridge;

      ctx.moveTo(leftCx + leftRadius, leftCy);
      ctx.arc(leftCx, leftCy, leftRadius, 0, Math.PI * 2);

      ctx.moveTo(rightCx + rightRadius, rightCy);
      ctx.arc(rightCx, rightCy, rightRadius, 0, Math.PI * 2);

      if (
        neck <= 0
        || dist <= Math.abs(leftRadius - rightRadius)
      ) {
        return;
      }

      const centerAngle = Math.atan2(vy, vx);
      let leftOverlap = 0;
      let rightOverlap = 0;

      if (dist < leftRadius + rightRadius) {
        leftOverlap = Math.acos(waterdropClamp(
          (leftRadius * leftRadius + dist * dist - rightRadius * rightRadius)
            / (2 * leftRadius * dist),
          -1,
          1
        ));
        rightOverlap = Math.acos(waterdropClamp(
          (rightRadius * rightRadius + dist * dist - leftRadius * leftRadius)
            / (2 * rightRadius * dist),
          -1,
          1
        ));
      }

      const tangentSpread = Math.acos(waterdropClamp((leftRadius - rightRadius) / dist, -1, 1));
      const spread = 0.2 + neck * 0.46;
      const leftSpread = leftOverlap + (tangentSpread - leftOverlap) * spread;
      const rightSpread = rightOverlap
        + (Math.PI - rightOverlap - tangentSpread) * spread;
      const leftTopAngle = centerAngle - leftSpread;
      const leftBottomAngle = centerAngle + leftSpread;
      const rightTopAngle = centerAngle + Math.PI + rightSpread;
      const rightBottomAngle = centerAngle + Math.PI - rightSpread;
      const leftTop = waterdropPointOnCircle(leftCx, leftCy, leftRadius, leftTopAngle);
      const leftBottom = waterdropPointOnCircle(leftCx, leftCy, leftRadius, leftBottomAngle);
      const rightTop = waterdropPointOnCircle(rightCx, rightCy, rightRadius, rightTopAngle);
      const rightBottom = waterdropPointOnCircle(rightCx, rightCy, rightRadius, rightBottomAngle);
      const span = Math.min(
        waterdropDistance(leftTop.x, leftTop.y, rightTop.x, rightTop.y),
        waterdropDistance(leftBottom.x, leftBottom.y, rightBottom.x, rightBottom.y)
      );
      const handle = span * (0.3 + waterdropClamp(shape.curve, 0, 1) * 0.35)
        * waterdropClamp(dist * 2 / (leftRadius + rightRadius), 0, 1);

      ctx.moveTo(leftTop.x, leftTop.y);
      ctx.bezierCurveTo(
        leftTop.x - Math.sin(leftTopAngle) * handle,
        leftTop.y + Math.cos(leftTopAngle) * handle,
        rightTop.x + Math.sin(rightTopAngle) * handle,
        rightTop.y - Math.cos(rightTopAngle) * handle,
        rightTop.x,
        rightTop.y
      );
      ctx.lineTo(rightBottom.x, rightBottom.y);
      ctx.bezierCurveTo(
        rightBottom.x - Math.sin(rightBottomAngle) * handle,
        rightBottom.y + Math.cos(rightBottomAngle) * handle,
        leftBottom.x + Math.sin(leftBottomAngle) * handle,
        leftBottom.y - Math.cos(leftBottomAngle) * handle,
        leftBottom.x,
        leftBottom.y
      );
      ctx.closePath();
    }
  });
  return WaterdropFusionGraphic;
}

function waterdropClamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function waterdropSmoothStep(percent: number): number {
  percent = waterdropClamp(percent, 0, 1);
  return percent * percent * (3 - 2 * percent);
}

function waterdropDistance(x0: number, y0: number, x1: number, y1: number): number {
  const dx = x1 - x0;
  const dy = y1 - y0;
  return Math.sqrt(dx * dx + dy * dy);
}

function waterdropPointOnCircle(cx: number, cy: number, radius: number, angle: number): { x: number; y: number } {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius
  };
}

function blobEntityIds(bridges: EvolutionFluidBridgeLayout[]): Set<string> {
  const ids = new Set<string>();
  bridges.forEach((bridge) => {
    if (bridge.kind === 'surface') return;
    const sourceIds = bridge.sourceIds && bridge.sourceIds.length ? bridge.sourceIds : [bridge.sourceId];
    const targetIds = bridge.targetIds && bridge.targetIds.length ? bridge.targetIds : [bridge.targetId];
    const hiddenIds = bridge.kind === 'absorb' ? sourceIds : bridge.kind === 'split' ? targetIds : [...sourceIds, ...targetIds];
    hiddenIds.forEach((id) => ids.add(id));
  });
  return ids;
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
