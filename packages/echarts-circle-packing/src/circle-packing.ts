import * as echarts from 'echarts/lib/echarts';
import {
  clearAliveRender,
  installElementHover,
  renderAlive,
  setAliveRenderKey,
  setElementHoverBaseStyle,
  setElementHoverDimOpacity
} from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import {
  DEFAULT_CIRCLE_PACKING_COLORS,
  flattenCirclePackingData,
  resolveCirclePackingLayout
} from './layout.js';
import { DEFAULT_WATERDROP_FUSION_SHAPE, buildWaterdropFusionPath } from './waterdrop-fusion.js';
import type {
  CirclePackingFluidBridge,
  CirclePackingLayoutOption,
  CirclePackingLayoutResult,
  CirclePackingNode
} from './layout.js';
import type { WaterdropFusionPathContext, WaterdropFusionShape } from './waterdrop-fusion.js';

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
  getName(index: number): string;
  indexOfName(name: string): number;
  getItemModel(index: number): EChartsModel;
  getItemVisual(dataIndex: number, key: string): unknown;
  setItemLayout(dataIndex: number, layout: [number, number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface CirclePackingSeriesModel extends EChartsModel {
  option?: CirclePackingLayoutOption;
  legendVisualProvider?: unknown;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
  getRawData(): SeriesData;
}

interface GraphicElement {
  [key: string]: unknown;
  children?: () => GraphicElement[];
}

interface AnimatableGraphicElement extends GraphicElement {
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  animate?: (key: AnimationTargetKey, loop?: boolean) => GraphicAnimator | null | undefined;
}

interface FocusableGraphicElement extends AnimatableGraphicElement {
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  ignore?: boolean;
  cursor?: unknown;
  silent?: boolean;
  attr?: (target: Record<string, unknown>) => void;
  animateTo?: (
    target: Record<string, unknown>,
    config?: Record<string, unknown>,
    animationProps?: Record<string, unknown>
  ) => void;
  stopAnimation?: (scope?: string, forwardToLast?: boolean) => void;
  on?: (eventName: string, handler: (event?: unknown) => void) => void;
  off?: (eventName: string, handler: (event?: unknown) => void) => void;
}

interface GraphicAnimator {
  when(duration: number, target: Record<string, unknown>): GraphicAnimator;
  delay?: (duration: number) => GraphicAnimator;
  start(easing?: string): void;
}

interface GraphicGroup extends GraphicElement {
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
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

type WaterdropFusionGraphicShape = WaterdropFusionShape;

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    createDimensions(source: unknown[], options: Record<string, unknown>): unknown;
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: CirclePackingSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
    LinearGradient?: new (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      colorStops: Array<{ offset: number; color: string }>,
      globalCoord?: boolean
    ) => unknown;
    makePath?: (path: string, options: GraphicElementOptions) => GraphicElement;
    extendShape?: (definition: Record<string, unknown>) => WaterdropFusionGraphicConstructor;
  };
}


interface CirclePackingChartView {
  group: GraphicGroup;
  __renderToken?: object | null;
  __hoverController?: ElementHoverController;
  __focusController?: CirclePackingFocusController;
  __aliveRenderState?: AliveRenderState;
  __focusedNodeId?: string | null;
}

interface EnterAnimationConfig {
  enabled: boolean;
  duration: number;
  delay: number;
  easing: string;
}

type AnimationTargetKey = 'shape' | 'style';

interface LabelPosition {
  x: number;
  y: number;
}

interface LabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CirclePackingRenderPayload {
  chartGroup: GraphicGroup;
  nodesById: Map<string, CirclePackingNode>;
  focusElementsByNodeId: Map<string, GraphicElement[]>;
  labelItems: CirclePackingLabelItem[];
}

interface CirclePackingFluidDrawPolicy {
  hiddenCircleIds: Set<string>;
  opaqueCircleIds: Set<string>;
  elevatedCircleIds: Set<string>;
}

interface CirclePackingFocusController {
  dispose(): void;
}

interface CirclePackingFocusTransform extends Record<string, number> {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
}

interface CirclePackingFocusOptions {
  chartGroup: GraphicGroup;
  nodesById: Map<string, CirclePackingNode>;
  focusElementsByNodeId: Map<string, GraphicElement[]>;
  labelItems: CirclePackingLabelItem[];
  root: CirclePackingNode;
  layout: CirclePackingLayoutResult;
  rect: ViewRect;
  seriesModel: CirclePackingSeriesModel;
  getFocusedNodeId(): string | null;
  setFocusedNodeId(nodeId: string | null): void;
}

const FOCUS_TRANSITION_SCOPE = 'circle-packing-focus';
const LABEL_HOVER_DIM_OPACITY = 0.42;
const PARENT_LABEL_PRIMARY_OFFSET = 0.62;
const EPSILON = 1e-6;

interface CirclePackingLabelItem {
  element: GraphicElement;
  node: CirclePackingNode;
  allNodes: CirclePackingNode[];
  text: string;
  requestedFontSize: number;
  requestedLineHeight: number;
  minRadius: number;
}

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'padding',
  'nodePadding',
  'siblingGap',
  'center',
  'radius',
  'rootName',
  'rootVisible',
  'valueField',
  'nameField',
  'childrenField',
  'sort',
  'colors',
  'fluid'
] as const satisfies ReadonlyArray<Extract<keyof CirclePackingLayoutOption, string>>;

echartsHost.extendSeriesModel({
  type: 'series.circlePacking',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: CirclePackingSeriesModel, option: CirclePackingLayoutOption) {
    const source = flattenCirclePackingData(option.data, readInitialDataOptions(option));
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    this.legendVisualProvider = createLegendVisualProvider(this);
    return list;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '88%',
    height: '88%',
    padding: 18,
    nodePadding: 2.5,
    siblingGap: 1.5,
    center: null,
    radius: null,
    rootName: 'root',
    rootVisible: null,
    valueField: 'value',
    nameField: 'name',
    childrenField: 'children',
    sort: true,
    colors: DEFAULT_CIRCLE_PACKING_COLORS,
    fluid: {
      enabled: false,
      events: [],
      currentTime: null,
      bridgeOpacity: 0.78,
      bridgeThreshold: 120,
      bridgeColor: null,
      renderMode: 'circlePacking'
    },
    enterAnimation: true,
    focusAnimation: {
      duration: 520,
      easing: 'cubicOut'
    },
    itemStyle: {
      opacity: 0.88,
      borderColor: '#ffffff',
      borderWidth: 1.2
    },
    label: {
      show: true,
      color: '#101828',
      fontSize: 12,
      fontWeight: 650,
      lineHeight: 14,
      minRadius: 18,
      formatter: null
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowColor: 'rgba(15, 23, 42, 0.22)'
      }
    }
  }
});

echartsHost.extendChartView({
  type: 'circlePacking',

  render(this: CirclePackingChartView, seriesModel: CirclePackingSeriesModel, ecModel: unknown, api: EChartsApi) {
    const group = this.group;
    const renderToken = {};
    this.__renderToken = renderToken;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    this.__focusController?.dispose();
    this.__focusController = undefined;

    try {
      const rect = echartsHost.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
        width: api.getWidth(),
        height: api.getHeight()
      });
      const layout = resolveCirclePackingLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const useEvolutionFluidRender = isEvolutionFluidRenderMode(seriesModel);
      const rendered = renderAlive<CirclePackingSeriesModel, CirclePackingRenderPayload>(
        this,
        echartsHost,
        group,
        seriesModel,
        (targetGroup, targetSeriesModel) => drawCirclePacking(
          echartsHost,
          targetGroup,
          targetSeriesModel,
          layout,
          rect,
          this.__focusedNodeId ?? null
        ),
        useEvolutionFluidRender ? { duration: 0 } : undefined
      );
      const { hoverItems, payload } = rendered;
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
      if (payload) {
        this.__focusController = installCirclePackingFocus({
          chartGroup: rendered.mapElement(payload.chartGroup),
          nodesById: payload.nodesById,
          focusElementsByNodeId: mapCirclePackingNodeElements(payload.focusElementsByNodeId, rendered.mapElement),
          labelItems: mapCirclePackingLabelItems(payload.labelItems, rendered.mapElement),
          root: layout.root,
          layout,
          rect,
          seriesModel,
          getFocusedNodeId: () => this.__focusedNodeId ?? null,
          setFocusedNodeId: (nodeId) => {
            this.__focusedNodeId = nodeId;
          }
        });
      }
    } catch (error) {
      console.error('[circlePacking] render failed', error);
    }
  },

  remove(this: CirclePackingChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    this.__focusController?.dispose();
    this.__focusController = undefined;
    this.__focusedNodeId = null;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: CirclePackingChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    this.__focusController?.dispose();
    this.__focusController = undefined;
    this.__focusedNodeId = null;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readInitialDataOptions(option: CirclePackingLayoutOption): CirclePackingLayoutOption {
  const layoutOption: CirclePackingLayoutOption = {
    ...(isPlainObject(option.layout) ? option.layout : {}),
    ...(isPlainObject(option.layoutOptions) ? option.layoutOptions : {})
  };

  optionKeys.forEach((key) => {
    const value = option[key];
    if (value !== undefined && value !== null) layoutOption[key as string] = value;
  });

  return layoutOption;
}

function readLayoutOption(seriesModel: CirclePackingSeriesModel, rect: ViewRect): CirclePackingLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: CirclePackingLayoutOption = {
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

function drawCirclePacking(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: CirclePackingSeriesModel,
  layout: CirclePackingLayoutResult,
  rect: ViewRect,
  focusedNodeId: string | null = null
): { hoverItems: ElementHoverItem[]; payload: CirclePackingRenderPayload } {
  const data = seriesModel.getData();
  const chartGroup = new echartsInstance.graphic.Group();
  const hoverItems: ElementHoverItem[] = [];
  const hoverItemsByDataIndex = new Map<number, ElementHoverItem>();
  const hoverItemsByNodeId = new Map<string, ElementHoverItem>();
  const nodesById = createCirclePackingNodeMap(layout.root);
  const focusElementsByNodeId = new Map<string, GraphicElement[]>();
  const labelItems: CirclePackingLabelItem[] = [];
  const fluidBridges = layout.fluid?.bridges || [];
  const useEvolutionFluidRender = isEvolutionFluidRenderMode(seriesModel);
  const fluidDrawPolicy = createCirclePackingFluidDrawPolicy(fluidBridges, nodesById);

  if (useEvolutionFluidRender) {
    drawCirclePackingFluidBridges(echartsInstance, chartGroup, fluidBridges, false);
  }

  layout.nodes.forEach((node, index) => {
    if (node.r <= 0) return;
    /* v8 ignore next -- draw policy tests cover hidden fluid ids; renderer receives these only from injected bridge metadata. */
    if (useEvolutionFluidRender && fluidDrawPolicy.hiddenCircleIds.has(node.id)) return;

    const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
    const circleEl = new echartsInstance.graphic.Circle({
      shape: {
        cx: node.x,
        cy: node.y,
        r: node.r
      },
      style: readCirclePackingRenderStyle(
        data,
        seriesModel,
        itemModel,
        node,
        index,
        useEvolutionFluidRender
      ),
      z2: useEvolutionFluidRender
        ? resolveCirclePackingFluidCircleZ2(node, fluidDrawPolicy)
        : undefined
    });
    if (!useEvolutionFluidRender) {
      applyCircleEnterAnimation(circleEl, node.r, readEnterAnimation(seriesModel, index));
    } else {
      setAliveRenderKey(circleEl, `circle-packing-node:${node.id}`);
    }

    if (itemModel && node.dataIndex >= 0 && node.dataIndex < data.count()) {
      data.setItemLayout(node.dataIndex, [node.x, node.y, node.r]);
      data.setItemGraphicEl(node.dataIndex, circleEl);
      if (useEvolutionFluidRender) {
        setAliveRenderKey(circleEl, `circle-packing-node:${node.id}`);
      }
      const hoverItem = createHoverItem(circleEl);
      hoverItems.push(hoverItem);
      hoverItemsByDataIndex.set(node.dataIndex, hoverItem);
      hoverItemsByNodeId.set(node.id, hoverItem);
      appendCirclePackingFocusElement(focusElementsByNodeId, node.id, circleEl);
    }

    chartGroup.add(circleEl);
  });

  if (!useEvolutionFluidRender) {
    drawCirclePackingFluidBridges(echartsInstance, chartGroup, fluidBridges, true);
  }

  drawLabels(
    echartsInstance,
    chartGroup,
    seriesModel,
    data,
    layout.nodes,
    hoverItemsByDataIndex,
    focusElementsByNodeId,
    labelItems,
    useEvolutionFluidRender
  );
  includeDescendantsInHoverItems(layout.nodes, hoverItemsByNodeId);
  const focusTransform = createCirclePackingFocusTransform(
    resolveCurrentFocusTarget(focusedNodeId, nodesById, layout.root),
    layout,
    rect
  );
  assignCirclePackingFocusTransform(chartGroup, focusTransform);
  updateCirclePackingFocusLabels(labelItems, focusTransform.scaleX, disabledEnterAnimation());
  group.add(chartGroup);
  return {
    hoverItems,
    payload: {
      chartGroup,
      nodesById,
      focusElementsByNodeId,
      labelItems
    }
  };
}

function drawCirclePackingFluidBridges(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  bridges: CirclePackingFluidBridge[],
  useOpacity: boolean
): void {
  if (!bridges.length) return;
  bridges.forEach((bridge) => {
    const style: Record<string, unknown> = {
      fill: createCirclePackingBridgeFill(echartsInstance, bridge),
      stroke: null,
      lineWidth: 0
    };
    if (useOpacity) style.opacity = bridge.opacity;
    let path: GraphicElement | null | undefined = null;
    if (bridge.renderPath && bridge.path && echartsInstance.graphic.makePath) {
      path = echartsInstance.graphic.makePath(bridge.path, {
        style,
        silent: true,
        z2: 4
      });
    }
    if (!path) {
      path = createWaterdropFusionGraphicElement(echartsInstance, bridge, style);
    }
    if (!path && bridge.path && echartsInstance.graphic.makePath) {
      path = echartsInstance.graphic.makePath(bridge.path, {
        style,
        silent: true,
        z2: 4
      });
    }
    if (!path) return;
    path.style = {
      ...(path.style as Record<string, unknown> | undefined),
      ...style
    };
    path.__circlePackingFluidBridge = bridge.id;
    setAliveRenderKey(path, `fluid-bridge:${bridge.id}`);
    group.add(path);
  });
}

function createCirclePackingBridgeFill(
  echartsInstance: EChartsHost,
  bridge: CirclePackingFluidBridge
): unknown {
  if (!bridge.gradient || !echartsInstance.graphic.LinearGradient) return bridge.color;
  return new echartsInstance.graphic.LinearGradient(
    bridge.gradient.x0,
    bridge.gradient.y0,
    bridge.gradient.x1,
    bridge.gradient.y1,
    bridge.gradient.colorStops,
    true
  );
}

let WaterdropFusionGraphic: WaterdropFusionGraphicConstructor | null | undefined;

function resetWaterdropFusionGraphicForTest(): void {
  WaterdropFusionGraphic = undefined;
}

function createWaterdropFusionGraphicElement(
  host: EChartsHost,
  bridge: CirclePackingFluidBridge,
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
    z2: 4
  });
}

function getWaterdropFusionGraphic(host: EChartsHost): WaterdropFusionGraphicConstructor | null {
  if (WaterdropFusionGraphic !== undefined) return WaterdropFusionGraphic;
  if (typeof host.graphic.extendShape !== 'function') {
    WaterdropFusionGraphic = null;
    return WaterdropFusionGraphic;
  }
  WaterdropFusionGraphic = host.graphic.extendShape({
    type: 'circlePackingWaterdropFusion',
    shape: { ...DEFAULT_WATERDROP_FUSION_SHAPE },
    buildPath(ctx: CanvasRenderingContext2D, shape: WaterdropFusionGraphicShape) {
      buildWaterdropFusionPath(ctx as unknown as WaterdropFusionPathContext, shape);
    }
  });
  return WaterdropFusionGraphic;
}

function isEvolutionFluidRenderMode(seriesModel: CirclePackingSeriesModel): boolean {
  return seriesModel.get(['fluid', 'renderMode']) === 'evolutionFluid'
    || seriesModel.get(['fluid', 'renderer']) === 'evolutionFluid';
}

function resolveCirclePackingFluidCircleZ2(
  node: CirclePackingNode,
  drawPolicy: CirclePackingFluidDrawPolicy
): number {
  const hierarchyLayer = node.depth * 0.01;
  if (node.fluidActiveTarget) {
    return 7 + hierarchyLayer;
  }
  if (drawPolicy.opaqueCircleIds.has(node.id)) {
    return 6 + hierarchyLayer + (drawPolicy.elevatedCircleIds.has(node.id) ? 0.5 : 0);
  }
  return (node.children.length ? 2 : 3) + hierarchyLayer;
}

function createCirclePackingFluidDrawPolicy(
  bridges: CirclePackingFluidBridge[],
  nodesById: Map<string, CirclePackingNode>
): CirclePackingFluidDrawPolicy {
  const hiddenCircleIds = new Set<string>();
  const opaqueCircleIds = new Set<string>();
  const elevatedCircleIds = new Set<string>();
  bridges.forEach((bridge) => {
    const sourceIds = bridge.sourceIds.length ? bridge.sourceIds : [bridge.sourceId];
    const targetIds = bridge.targetIds.length ? bridge.targetIds : [bridge.targetId];
    if (bridge.hiddenIds || bridge.opaqueIds || bridge.elevatedIds) {
      (bridge.hiddenIds || []).forEach((id) => hiddenCircleIds.add(id));
      (bridge.opaqueIds || []).forEach((id) => opaqueCircleIds.add(id));
      (bridge.elevatedIds || []).forEach((id) => elevatedCircleIds.add(id));
      return;
    }
    if (!bridge.surfaceShape) return;
    if (bridge.surfaceShape.bridgeOnly) {
      const opaqueIds = bridge.opaqueIds || [...sourceIds, ...targetIds];
      opaqueIds.forEach((id) => opaqueCircleIds.add(id));
      const elevatedIds = bridge.elevatedIds || (bridge.kind === 'split' ? targetIds : sourceIds);
      elevatedIds.forEach((id) => elevatedCircleIds.add(id));
      return;
    }
    if (bridge.kind === 'absorb') {
      targetIds.forEach((id) => hiddenCircleIds.add(id));
      sourceIds.forEach((id) => opaqueCircleIds.add(id));
    } else if (bridge.kind === 'split') {
      sourceIds.forEach((id) => hiddenCircleIds.add(id));
      targetIds.forEach((id) => opaqueCircleIds.add(id));
    } else {
      sourceIds.forEach((id) => hiddenCircleIds.add(id));
      targetIds.forEach((id) => hiddenCircleIds.add(id));
    }
  });
  const elevatedSurfaceIds = Array.from(elevatedCircleIds);
  elevatedSurfaceIds.forEach((id) => {
    const node = nodesById.get(id);
    if (!node) return;
    collectCirclePackingDescendantIds(node).forEach((descendantId) => {
      if (!hiddenCircleIds.has(descendantId)) elevatedCircleIds.add(descendantId);
    });
  });
  const eventSurfaceIds = Array.from(opaqueCircleIds);
  eventSurfaceIds.forEach((id) => {
    const node = nodesById.get(id);
    if (!node) return;
    collectCirclePackingDescendantIds(node).forEach((descendantId) => {
      /* v8 ignore next -- hidden descendant filtering is the paired fallback for injected opaque parent metadata. */
      if (!hiddenCircleIds.has(descendantId)) opaqueCircleIds.add(descendantId);
    });
  });
  return { hiddenCircleIds, opaqueCircleIds, elevatedCircleIds };
}

function collectCirclePackingDescendantIds(node: CirclePackingNode): string[] {
  const ids: string[] = [];
  node.children.forEach((child) => {
    ids.push(child.id);
    ids.push(...collectCirclePackingDescendantIds(child));
  });
  return ids;
}

function readCirclePackingRenderStyle(
  data: SeriesData,
  seriesModel: CirclePackingSeriesModel,
  itemModel: EChartsModel | null,
  node: CirclePackingNode,
  index: number,
  useEvolutionFluidRender: boolean
): Record<string, unknown> {
  const style = readNodeStyle(data, seriesModel, itemModel, node, index, useEvolutionFluidRender);
  if (!useEvolutionFluidRender) return style;
  delete style.opacity;
  return {
    ...style,
    stroke: 'rgba(255, 255, 255, 0)',
    lineWidth: 0
  };
}

function installCirclePackingFocus(options: CirclePackingFocusOptions): CirclePackingFocusController {
  const disposers: Array<() => void> = [];

  options.focusElementsByNodeId.forEach((elements, nodeId) => {
    elements.forEach((element) => {
      const evented = element as FocusableGraphicElement;
      const handler = () => handleCirclePackingFocusClick(nodeId, options);
      evented.cursor = 'pointer';
      evented.silent = false;
      evented.on?.('mousedown', handler);
      disposers.push(() => evented.off?.('mousedown', handler));
    });
  });

  return {
    dispose() {
      disposers.forEach((dispose) => dispose());
    }
  };
}

function handleCirclePackingFocusClick(nodeId: string, options: CirclePackingFocusOptions): void {
  const focusedNodeId = options.getFocusedNodeId();
  const clickedNode = options.nodesById.get(nodeId);
  const focusTarget = resolveCirclePackingFocusTarget(clickedNode, options.nodesById, options.root);
  const targetNode = focusedNodeId === focusTarget.id ? options.root : focusTarget;
  const nextFocusedNodeId = targetNode.id === options.root.id ? null : targetNode.id;
  const transform = createCirclePackingFocusTransform(targetNode, options.layout, options.rect);
  const animation = readFocusAnimation(options.seriesModel);

  options.setFocusedNodeId(nextFocusedNodeId);
  updateCirclePackingFocusLabels(options.labelItems, transform.scaleX, animation);
  applyCirclePackingFocus(options.chartGroup, transform, animation);
}

function createCirclePackingNodeMap(root: CirclePackingNode): Map<string, CirclePackingNode> {
  const nodesById = new Map<string, CirclePackingNode>();
  function visit(node: CirclePackingNode) {
    nodesById.set(node.id, node);
    node.children.forEach(visit);
  }
  visit(root);
  return nodesById;
}

function mapCirclePackingNodeElements(
  nodeElementsById: Map<string, GraphicElement | GraphicElement[]>,
  mapElement: <TElement extends GraphicElement | null | undefined>(element: TElement) => TElement
): Map<string, GraphicElement[]> {
  const mapped = new Map<string, GraphicElement[]>();
  nodeElementsById.forEach((elements, nodeId) => {
    const mappedElements: GraphicElement[] = [];
    const sourceElements = Array.isArray(elements) ? elements : [elements];
    sourceElements.forEach((element) => {
      const mappedElement = mapElement(element);
      if (mappedElement && !mappedElements.includes(mappedElement)) mappedElements.push(mappedElement);
    });
    if (mappedElements.length) mapped.set(nodeId, mappedElements);
  });
  return mapped;
}

function mapCirclePackingLabelItems(
  labelItems: CirclePackingLabelItem[],
  mapElement: <TElement extends GraphicElement | null | undefined>(element: TElement) => TElement
): CirclePackingLabelItem[] {
  const mappedItems: CirclePackingLabelItem[] = [];
  labelItems.forEach((item) => {
    const mappedElement = mapElement(item.element);
    if (mappedElement) mappedItems.push({ ...item, element: mappedElement });
  });
  return mappedItems;
}

function appendCirclePackingFocusElement(
  elementsByNodeId: Map<string, GraphicElement[]>,
  nodeId: string,
  element: GraphicElement
): void {
  const elements = elementsByNodeId.get(nodeId) || [];
  collectCirclePackingFocusElements(element).forEach((focusElement) => {
    if (!elements.includes(focusElement)) elements.push(focusElement);
  });
  elementsByNodeId.set(nodeId, elements);
}

function collectCirclePackingFocusElements(element: GraphicElement): GraphicElement[] {
  return [
    element,
    ...(element.children?.() || []).flatMap((child) => collectCirclePackingFocusElements(child))
  ];
}

function resolveCurrentFocusTarget(
  focusedNodeId: string | null,
  nodesById: Map<string, CirclePackingNode>,
  root: CirclePackingNode
): CirclePackingNode {
  return focusedNodeId ? nodesById.get(focusedNodeId) || root : root;
}

function resolveCirclePackingFocusTarget(
  clickedNode: CirclePackingNode | undefined,
  nodesById: Map<string, CirclePackingNode>,
  root: CirclePackingNode
): CirclePackingNode {
  if (!clickedNode) return root;
  if (clickedNode.children.length) return clickedNode;
  if (!clickedNode.parentId) return root;
  const parent = nodesById.get(clickedNode.parentId);
  return parent || root;
}

function createCirclePackingFocusTransform(
  targetNode: CirclePackingNode,
  layout: CirclePackingLayoutResult,
  rect: ViewRect
): CirclePackingFocusTransform {
  const scale = targetNode.r > 0 ? layout.radius / targetNode.r : 1;
  return {
    x: rect.x + layout.center.x - targetNode.x * scale,
    y: rect.y + layout.center.y - targetNode.y * scale,
    scaleX: scale,
    scaleY: scale
  };
}

function readFocusAnimation(
  seriesModel: CirclePackingSeriesModel,
  animationOption = seriesModel.get('focusAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) return disabledEnterAnimation();

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) return disabledEnterAnimation();

  return {
    enabled: true,
    duration: Math.max(0, resolveAnimationNumber(
      option.duration ?? seriesModel.get('animationDurationUpdate') ?? seriesModel.get('animationDuration'),
      {},
      0,
      520
    )),
    delay: 0,
    easing: resolveAnimationEasing(
      option.easing ?? seriesModel.get('animationEasingUpdate') ?? seriesModel.get('animationEasing')
    )
  };
}

function applyCirclePackingFocus(
  group: GraphicGroup,
  transform: CirclePackingFocusTransform,
  animation: EnterAnimationConfig
): void {
  const target = group as FocusableGraphicElement;
  if (!animation.enabled || animation.duration <= 0 || typeof target.animateTo !== 'function') {
    assignCirclePackingFocusTransform(group, transform);
    return;
  }

  target.stopAnimation?.(FOCUS_TRANSITION_SCOPE, false);
  target.animateTo(transform, {
    duration: animation.duration,
    easing: animation.easing,
    scope: FOCUS_TRANSITION_SCOPE,
    done: () => assignCirclePackingFocusTransform(group, transform)
  }, {
    x: true,
    y: true,
    scaleX: true,
    scaleY: true
  });
}

function assignCirclePackingFocusTransform(
  group: GraphicGroup,
  transform: CirclePackingFocusTransform
): void {
  const target = group as FocusableGraphicElement;
  if (typeof target.attr === 'function') {
    target.attr(transform);
    return;
  }
  Object.assign(target, transform);
}

function drawLabels(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: CirclePackingSeriesModel,
  data: SeriesData,
  nodes: CirclePackingNode[],
  hoverItemsByDataIndex: Map<number, ElementHoverItem>,
  focusElementsByNodeId: Map<string, GraphicElement[]> = new Map(),
  labelItems: CirclePackingLabelItem[] = [],
  useEvolutionFluidRender = false
): void {
  const seriesLabelModel = seriesModel.getModel('label');
  if (!seriesLabelModel.get('show')) return;

  nodes.forEach((node) => {
    const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
    const itemLabelModel = itemModel?.getModel('label');
    const show = itemLabelModel?.get('show') ?? seriesLabelModel.get('show');
    const minRadius = finiteNumber(itemLabelModel?.get('minRadius') ?? seriesLabelModel.get('minRadius'), 18);
    if (!show) return;

    const requestedFontSize = finiteNumber(itemLabelModel?.get('fontSize') ?? seriesLabelModel.get('fontSize'), 12);
    const lineHeight = finiteNumber(
      itemLabelModel?.get('lineHeight') ?? seriesLabelModel.get('lineHeight'),
      requestedFontSize + 2
    );
    const text = String(formatLabel(itemLabelModel?.get('formatter') || seriesLabelModel.get('formatter'), node));
    const textEl = new echartsInstance.graphic.Text({
      z2: useEvolutionFluidRender ? resolveCirclePackingFluidLabelZ2(node) : undefined,
      style: {
        x: node.x,
        y: node.y,
        text,
        fill: itemLabelModel?.get('color') || seriesLabelModel.get('color') || '#101828',
        fontSize: requestedFontSize,
        fontWeight: itemLabelModel?.get('fontWeight') || seriesLabelModel.get('fontWeight') || 650,
        lineHeight,
        align: 'center',
        verticalAlign: 'middle'
      },
      silent: true
    });
    setAliveRenderKey(textEl, `circle-packing-label:${node.id}`);
    applyFadeEnterAnimation(textEl, readEnterAnimation(seriesModel, node.dataIndex));
    setElementHoverDimOpacity(textEl, LABEL_HOVER_DIM_OPACITY);
    addHoverElement(hoverItemsByDataIndex.get(node.dataIndex), textEl);
    group.add(textEl);
    appendCirclePackingFocusElement(focusElementsByNodeId, node.id, textEl);
    labelItems.push({
      element: textEl,
      node,
      allNodes: nodes,
      text,
      requestedFontSize,
      requestedLineHeight: lineHeight,
      minRadius
    });
  });
}

function resolveCirclePackingFluidLabelZ2(node: CirclePackingNode): number {
  return 20 + node.depth * 0.01;
}

function updateCirclePackingFocusLabels(
  labelItems: CirclePackingLabelItem[],
  focusScale: number,
  animation: EnterAnimationConfig
): void {
  const scale = Math.max(0.001, finiteNumber(focusScale, 1));
  labelItems.forEach((item) => {
    assignCirclePackingLabelState(item.element, createCirclePackingFocusLabelState(item, scale), animation);
  });
}

function createCirclePackingFocusLabelState(
  item: CirclePackingLabelItem,
  focusScale: number
): { ignore: boolean; style: Record<string, unknown> } {
  const visibleRadius = item.node.r * focusScale;
  const visualFontSize = Math.min(item.requestedFontSize, Math.max(8, visibleRadius * 0.32));
  const fontSize = visualFontSize / focusScale;
  const lineHeight = item.requestedLineHeight / focusScale;
  const wrappedText = wrapText(item.text, item.node.r * 1.5, fontSize, item.node.r);
  const position = resolveLabelPosition(item.node, wrappedText, fontSize, lineHeight, item.allNodes);

  return {
    ignore: visibleRadius < item.minRadius,
    style: {
      x: position.x,
      y: position.y,
      text: wrappedText,
      fontSize,
      lineHeight
    }
  };
}

function assignCirclePackingLabelState(
  element: GraphicElement,
  state: { ignore: boolean; style: Record<string, unknown> },
  animation: EnterAnimationConfig
): void {
  const target = element as FocusableGraphicElement;
  const nextStyle = createCirclePackingLabelStyle(target.style, state.style);
  if (!animation.enabled || animation.duration <= 0 || typeof target.animateTo !== 'function') {
    applyCirclePackingLabelState(target, state.ignore, nextStyle);
    return;
  }

  if (state.ignore) {
    applyCirclePackingLabelState(target, true, nextStyle);
    return;
  }

  applyCirclePackingLabelState(target, false, {
    ...createCirclePackingLabelStyle(target.style, {}),
    text: state.style.text
  });
  target.stopAnimation?.(FOCUS_TRANSITION_SCOPE, false);
  target.animateTo({
    style: nextStyle
  }, {
    duration: animation.duration,
    easing: animation.easing,
    scope: FOCUS_TRANSITION_SCOPE,
    done: () => applyCirclePackingLabelState(target, false, nextStyle)
  });
}

function applyCirclePackingLabelState(
  target: FocusableGraphicElement,
  ignore: boolean,
  style: Record<string, unknown>
): void {
  setElementHoverBaseStyle(target, createCirclePackingLabelHoverBaseStyle(style));
  if (typeof target.attr === 'function') {
    target.attr({
      ignore,
      style
    });
    return;
  }

  target.ignore = ignore;
  target.style = style;
}

function createCirclePackingLabelStyle(
  currentStyle: unknown,
  nextStyle: Record<string, unknown>
): Record<string, unknown> {
  const style = {
    ...asRecord(currentStyle),
    ...nextStyle
  };
  delete style.opacity;
  return style;
}

function createCirclePackingLabelHoverBaseStyle(style: Record<string, unknown>): Record<string, unknown> {
  const baseStyle = {
    ...style
  };
  delete baseStyle.opacity;
  return baseStyle;
}

function readNodeStyle(
  data: SeriesData,
  seriesModel: CirclePackingSeriesModel,
  itemModel: EChartsModel | null,
  node: CirclePackingNode,
  index: number,
  preferLayoutColor = false
): Record<string, unknown> {
  const seriesStyle = asRecord(seriesModel.get('itemStyle'));
  const rawStyle = readRawItemStyle(node.raw);
  const itemStyle = itemModel ? asRecord(itemModel.get('itemStyle')) : rawStyle;
  const visualStyle = node.dataIndex >= 0 && node.dataIndex < data.count()
    ? asRecord(data.getItemVisual(node.dataIndex, 'style'))
    : {};
  const fill = preferLayoutColor
    ? node.color || itemStyle.color || rawStyle.color || seriesStyle.color || visualStyle.fill || DEFAULT_CIRCLE_PACKING_COLORS[index % DEFAULT_CIRCLE_PACKING_COLORS.length]
    : itemStyle.color || rawStyle.color || seriesStyle.color || visualStyle.fill || node.color || DEFAULT_CIRCLE_PACKING_COLORS[index % DEFAULT_CIRCLE_PACKING_COLORS.length];

  return {
    fill,
    stroke: itemStyle.borderColor || rawStyle.borderColor || seriesStyle.borderColor || '#ffffff',
    lineWidth: finiteNumber(itemStyle.borderWidth ?? rawStyle.borderWidth ?? seriesStyle.borderWidth, 1.2),
    opacity: finiteNumber(itemStyle.opacity ?? rawStyle.opacity ?? seriesStyle.opacity, 0.88)
  };
}

function formatLabel(formatter: unknown, node: CirclePackingNode): unknown {
  const params = {
    data: node.raw,
    name: node.name,
    value: node.value,
    percent: node.percent,
    depth: node.depth,
    node
  };

  if (typeof formatter === 'function') {
    return (formatter as (input: typeof params) => unknown)(params);
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{b\}/g, node.name)
      .replace(/\{c\}/g, String(node.value))
      .replace(/\{d\}/g, String(Math.round(node.percent * 100)))
      .replace(/\{p\}/g, `${Math.round(node.percent * 100)}%`);
  }
  return node.name;
}

function wrapText(text: string, maxWidth: number, fontSize: number, radius: number): string {
  const maxChars = Math.max(3, Math.floor(maxWidth / Math.max(fontSize * 0.56, 1)));
  const maxLines = radius > fontSize * 3.2 ? 2 : 1;
  if (text.length <= maxChars) return text;

  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  if (words.length > 1) {
    let current = '';
    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (next.length <= maxChars) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    });
    lines.push(current);
  } else {
    for (let index = 0; index < text.length; index += maxChars) {
      lines.push(text.slice(index, index + maxChars));
    }
  }

  const visible = lines.slice(0, maxLines);
  const usedText = visible.join('').replace(/\s+/g, '');
  const originalText = text.replace(/\s+/g, '');
  if (usedText.length < originalText.length && visible.length) {
    const last = visible[visible.length - 1];
    visible[visible.length - 1] = `${last.slice(0, Math.max(0, maxChars - 3))}...`;
  }

  return visible.join('\n');
}

function resolveLabelPosition(
  node: CirclePackingNode,
  text: string,
  fontSize: number,
  lineHeight: number,
  allNodes: CirclePackingNode[] = []
): LabelPosition {
  const avoidanceCircles = collectLabelAvoidanceCircles(node, allNodes);
  const size = measureLabelText(text, fontSize, lineHeight);
  if (!avoidanceCircles.length) {
    return {
      x: node.x,
      y: node.y
    };
  }

  const candidates = createParentLabelCandidates(node, size);
  const stableCandidate = candidates.find((candidate) => {
    const box = createCenteredLabelBox(candidate, size);
    return labelBoxOverflowFromCircle(box, node) <= 0
      && !labelBoxOverlapsCircles(box, avoidanceCircles);
  });
  if (stableCandidate) return stableCandidate;

  let best = candidates[0];
  let bestScore = Infinity;

  candidates.forEach((candidate) => {
    const box = createCenteredLabelBox(candidate, size);
    const score = scoreParentLabelCandidate(node, box, avoidanceCircles);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  });

  return best;
}

function measureLabelText(text: string, fontSize: number, lineHeight: number): { width: number; height: number } {
  const lines = text.split('\n');
  return {
    width: Math.max(...lines.map((line) => line.length), 1) * fontSize * 0.56,
    height: lines.length * lineHeight
  };
}

function createParentLabelCandidates(
  node: CirclePackingNode,
  size: { width: number; height: number }
): LabelPosition[] {
  const gap = Math.max(4, Math.min(12, node.r * 0.08));
  const fitOffset = Math.max(0, node.r - Math.max(size.width, size.height) / 2 - gap);
  const primaryOffset = Math.min(node.r * PARENT_LABEL_PRIMARY_OFFSET, fitOffset);
  const radialFactors = [0.92, 0.86, 0.72, 0.58, 0.44, 0.3];
  const angles = [
    -Math.PI / 2,
    -Math.PI * 0.72,
    -Math.PI * 0.28,
    Math.PI / 2,
    Math.PI,
    0,
    -Math.PI * 0.86,
    -Math.PI * 0.14,
    Math.PI * 0.14,
    Math.PI * 0.86
  ];
  const candidates: LabelPosition[] = [
    {
      x: node.x,
      y: node.y - primaryOffset
    },
    {
      x: node.x,
      y: node.y + primaryOffset
    },
    {
      x: node.x - primaryOffset,
      y: node.y
    },
    {
      x: node.x + primaryOffset,
      y: node.y
    }
  ];
  radialFactors.forEach((factor) => {
    angles.forEach((angle) => {
      candidates.push({
        x: node.x + Math.cos(angle) * node.r * factor,
        y: node.y + Math.sin(angle) * node.r * factor
      });
    });
  });
  candidates.push({
    x: node.x,
    y: node.y - node.r - size.height / 2 - gap
  });
  candidates.push({
    x: node.x,
    y: node.y
  });
  return dedupeLabelCandidates(candidates);
}

function dedupeLabelCandidates(candidates: LabelPosition[]): LabelPosition[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.x.toFixed(3)},${candidate.y.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function createCenteredLabelBox(position: LabelPosition, size: { width: number; height: number }): LabelBox {
  return {
    x: position.x - size.width / 2,
    y: position.y - size.height / 2,
    width: size.width,
    height: size.height
  };
}

function collectLabelAvoidanceCircles(
  node: CirclePackingNode,
  allNodes: CirclePackingNode[]
): CirclePackingNode[] {
  const circles: CirclePackingNode[] = [];
  const seen = new Set<string>();
  const pushCircle = (circle: CirclePackingNode | undefined) => {
    if (!circle || circle.id === node.id || circle.r <= 0) return;
    if (seen.has(circle.id)) return;
    seen.add(circle.id);
    circles.push(circle);
  };

  (node.children ?? []).forEach(pushCircle);
  allNodes.forEach((candidate) => {
    if (candidate.id === node.id || candidate.r <= 0 || candidate.r >= node.r - EPSILON) return;
    if (!circlesOverlap(node, candidate)) return;
    pushCircle(candidate);
  });
  return circles;
}

function labelBoxOverlapsCircles(box: LabelBox, circles: CirclePackingNode[]): boolean {
  return circles.some((circle) => distanceFromBoxToCircle(box, circle) < 0);
}

function scoreParentLabelCandidate(node: CirclePackingNode, box: LabelBox, avoidanceCircles: CirclePackingNode[]): number {
  const distances = avoidanceCircles.map((circle) => distanceFromBoxToCircle(box, circle));
  const overlapPenalty = distances.reduce((sum, distance, index) => (
    sum + (distance < 0 ? 100000 + Math.abs(distance) * 1000 + avoidanceCircles[index].r : 0)
  ), 0);
  const clearance = Math.min(...distances);
  const parentOverflow = labelBoxOverflowFromCircle(box, node);
  const centerDistance = Math.hypot(box.x + box.width / 2 - node.x, box.y + box.height / 2 - node.y);
  return overlapPenalty + parentOverflow * 50 - clearance + centerDistance * 0.01;
}

function circlesOverlap(left: CirclePackingNode, right: CirclePackingNode): boolean {
  return Math.hypot(left.x - right.x, left.y - right.y) < left.r + right.r;
}

function distanceFromBoxToCircle(box: LabelBox, circle: CirclePackingNode): number {
  const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
  const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));
  return Math.hypot(closestX - circle.x, closestY - circle.y) - circle.r;
}

function labelBoxOverflowFromCircle(box: LabelBox, circle: CirclePackingNode): number {
  const points = [
    [box.x, box.y],
    [box.x + box.width / 2, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height / 2],
    [box.x + box.width, box.y + box.height / 2],
    [box.x, box.y + box.height],
    [box.x + box.width / 2, box.y + box.height],
    [box.x + box.width, box.y + box.height]
  ];
  return points.reduce((overflow, [x, y]) => (
    Math.max(overflow, Math.hypot(x - circle.x, y - circle.y) - circle.r)
  ), 0);
}

function createLegendVisualProvider(seriesModel: CirclePackingSeriesModel) {
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
        fill: itemStyle.color || DEFAULT_CIRCLE_PACKING_COLORS[dataIndex % DEFAULT_CIRCLE_PACKING_COLORS.length],
        stroke: itemStyle.borderColor || '#ffffff',
        opacity: finiteNumber(itemStyle.opacity, 0.88)
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

function readRawItemStyle(raw: unknown): Record<string, unknown> {
  const record = asRecord(raw);
  return asRecord(record.itemStyle);
}

function readEnterAnimation(
  seriesModel: CirclePackingSeriesModel,
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
    duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 580),
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

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
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

function includeDescendantsInHoverItems(
  nodes: CirclePackingNode[],
  hoverItemsByNodeId: Map<string, ElementHoverItem>
): void {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  nodes.forEach((node) => {
    const hoverItem = hoverItemsByNodeId.get(node.id);
    if (!hoverItem) return;

    let parentId = node.parentId;
    while (parentId) {
      const parentHoverItem = hoverItemsByNodeId.get(parentId);
      if (parentHoverItem) addHoverElements(parentHoverItem, hoverItem.elements);
      parentId = nodesById.get(parentId)?.parentId ?? null;
    }
  });
}

function addHoverElements(item: ElementHoverItem, elements: GraphicElement[]): void {
  elements.forEach((element) => {
    if (!item.elements.includes(element)) item.elements.push(element);
  });
}

export const __test__ = {
  readInitialDataOptions,
  readLayoutOption,
  drawCirclePacking,
  drawCirclePackingFluidBridges,
  createCirclePackingBridgeFill,
  createWaterdropFusionGraphicElement,
  getWaterdropFusionGraphic,
  resetWaterdropFusionGraphicForTest,
  resolveCirclePackingFluidCircleZ2,
  createCirclePackingFluidDrawPolicy,
  collectCirclePackingDescendantIds,
  installCirclePackingFocus,
  handleCirclePackingFocusClick,
  createCirclePackingNodeMap,
  mapCirclePackingNodeElements,
  mapCirclePackingLabelItems,
  appendCirclePackingFocusElement,
  collectCirclePackingFocusElements,
  resolveCurrentFocusTarget,
  resolveCirclePackingFocusTarget,
  createCirclePackingFocusTransform,
  readFocusAnimation,
  applyCirclePackingFocus,
  assignCirclePackingFocusTransform,
  drawLabels,
  updateCirclePackingFocusLabels,
  createCirclePackingFocusLabelState,
  assignCirclePackingLabelState,
  applyCirclePackingLabelState,
  createCirclePackingLabelStyle,
  createCirclePackingLabelHoverBaseStyle,
  readNodeStyle,
  formatLabel,
  wrapText,
  resolveLabelPosition,
  dedupeLabelCandidates,
  createLegendVisualProvider,
  collectDataNames,
  readRawItemStyle,
  readEnterAnimation,
  disabledEnterAnimation,
  resolveAnimationNumber,
  resolveAnimationEasing,
  applyCircleEnterAnimation,
  applyFadeEnterAnimation,
  animateGraphicProperty,
  finiteNumber,
  isPlainObject,
  asRecord,
  createHoverItem,
  addHoverElement,
  includeDescendantsInHoverItems,
  addHoverElements
};
