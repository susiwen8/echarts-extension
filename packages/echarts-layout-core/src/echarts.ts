import { createArcBezierShape, createArcShape } from './arc.js';
import { normalizeGraphData } from './data.js';
import {
  fisheyeTransform,
  installFisheyeController,
  resolveFisheyeOptions
} from './fisheye.js';
import { computeGraphLayout } from './layouts.js';
import { clearAliveRender, renderAlive, setAliveRenderKey } from './render-transition.js';
import type { GraphEdge, GraphInput, LayoutOptions, LayoutResult, Point, PublicLayoutNode } from './types.js';
import type { FisheyeController, FisheyeOptions, FisheyeTransform } from './fisheye.js';
import type { AliveRenderState } from './render-transition.js';

type LabelPosition = 'top' | 'bottom' | 'left' | 'right';

interface InstallGraphLayoutConfig {
  chartType: string;
  layoutType: string;
}

interface EChartsApi {
  getWidth(): number;
  getHeight(): number;
  getZr?(): ZRenderLike;
}

interface ZRenderLike {
  on(eventName: string, handler: (event: ZRenderEvent) => void): void;
  off(eventName: string, handler: (event: ZRenderEvent) => void): void;
}

interface ZRenderEvent {
  offsetX?: number;
  offsetY?: number;
  zrX?: number;
  zrY?: number;
  target?: unknown;
}

interface EChartsModel {
  get(path: string | string[]): unknown;
  getModel(path: string | string[]): EChartsModel;
}

interface SeriesData {
  initData(source: unknown[]): void;
  getItemModel(index: number): EChartsModel;
  getItemVisual(dataIndex: number, key: string): unknown;
  setItemLayout(dataIndex: number, layout: [number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface GraphSeriesModel extends EChartsModel {
  option?: GraphInput;
  getBoxLayoutParams(): unknown;
  getData(): SeriesData;
}

interface GraphicElement {
  [key: string]: unknown;
}

interface EventedGraphicElement extends GraphicElement {
  on?: (eventName: string, handler: () => void) => void;
}

interface AnimatableGraphicElement extends GraphicElement {
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  animate?: (key: 'shape' | 'style', loop?: boolean) => GraphicAnimator | null | undefined;
  stopAnimation?: (scope?: string, forwardToLast?: boolean) => void;
}

interface GraphicAnimator {
  scope?: string;
  when(duration: number, target: Record<string, unknown>): GraphicAnimator;
  delay?: (duration: number) => GraphicAnimator;
  done?: (callback: () => void) => GraphicAnimator;
  start(easing?: string): void;
}

interface GraphicGroup extends GraphicElement {
  add(element: GraphicElement): void;
  removeAll(): void;
}

interface GraphicElementOptions {
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  ignore?: boolean;
  silent?: boolean;
  z2?: number;
}

interface EChartsHost {
  extendSeriesModel(option: Record<string, unknown>): void;
  extendChartView(option: Record<string, unknown>): void;
  helper: {
    createDimensions(source: unknown[], options: Record<string, unknown>): unknown;
    getLayoutRect(params: unknown, container: { width: number; height: number }): LayoutRect;
    enableHoverEmphasis?: (element: GraphicElement, focus: unknown, blurScope: unknown) => void;
  };
  List: new (dimensions: unknown, host: GraphSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Arc?: new (options: GraphicElementOptions) => GraphicElement;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    BezierCurve: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
    makePath?: (path: string, options: { style: Record<string, unknown> }) => GraphicElement;
  };
  number: {
    parsePercent(value: unknown, maxValue: number): number;
  };
}

interface GraphChartView {
  group: GraphicGroup;
  __renderToken?: object | null;
  __aliveRenderState?: AliveRenderState;
  __fisheyeController?: FisheyeController;
  __graphHoverController?: GraphHoverController;
  __fisheyePreviewTimer?: ReturnType<typeof setTimeout>;
  __fisheyeSignature?: string;
  __graphRenderSignature?: string;
  __graphRenderState?: GraphRenderState;
}

interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LabelPoint {
  x: number;
  y: number;
  align: string;
  verticalAlign: string;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LabelSpec {
  node: PublicLayoutNode;
  text: string;
  color: unknown;
  fontSize: number;
  lineHeight: number;
  position: string;
  offset: number;
  style: Record<string, unknown>;
  width: number;
  height: number;
}

interface PlacedLabel {
  spec: LabelSpec;
  point: LabelPoint;
  box: Rect;
}

interface RenderNode {
  node: PublicLayoutNode;
  dataIndex: number;
  animationIndex: number;
  itemModel: EChartsModel;
  size: number;
  circleBox: Rect;
  labelSpec: LabelSpec | null;
}

interface RenderedNodeElement {
  group: GraphicElement;
  circle: GraphicElement;
  baseStyle: Record<string, unknown>;
  valueLabel: GraphicElement | null;
  valueLabelBaseStyle: Record<string, unknown> | null;
  valueFontSize: number;
  valueLineWidth: number;
}

interface RenderedNode {
  id: string;
  baseX: number;
  baseY: number;
  baseRadius: number;
  circle: GraphicElement;
  baseStyle: Record<string, unknown>;
  valueLabel: GraphicElement | null;
  valueLabelBaseStyle: Record<string, unknown> | null;
  valueFontSize: number;
  valueLineWidth: number;
}

interface RenderedLabel {
  nodeId: string;
  element: GraphicElement;
  baseStyle: Record<string, unknown>;
  baseX: number;
  baseY: number;
  baseFontSize: number;
  baseLineHeight: number;
}

interface RenderedEdgeElement {
  element: GraphicElement;
  fisheyeElement?: GraphicElement;
  kind: 'line' | 'arcBezier' | 'arcPath';
  baseStyle: Record<string, unknown>;
  fisheyeBaseStyle: Record<string, unknown> | null;
}

interface RenderedEdge extends RenderedEdgeElement {
  sourceId: string;
  targetId: string;
  edgeGroup: GraphicGroup;
  fisheyeElementAdded: boolean;
  baseStyle: Record<string, unknown>;
  fisheyeBaseStyle: Record<string, unknown> | null;
}

interface GraphRenderState {
  nodes: RenderedNode[];
  labels: RenderedLabel[];
  edges: RenderedEdge[];
  lens: GraphicElement | null;
  viewport: Rect;
  enterAnimationEnd: number;
}

interface GraphHoverController {
  dispose(): void;
}

interface EdgeAnimationConfig {
  enabled: boolean;
  duration: number;
  delay: number;
  easing: string;
}

type EnterAnimationConfig = EdgeAnimationConfig;

type AnimationTargetKey = 'shape' | 'style';
type NodeSizeResolver = (node: PublicLayoutNode) => number;

const layoutOptionKeys = [
  'nodeSep',
  'nodeSize',
  'nodeSpacing',
  'linkDistance',
  'unitRadius',
  'focusNode',
  'preventOverlap',
  'strictRadial',
  'maxIteration',
  'maxPreventOverlapIteration',
  'sortBy',
  'sortStrength',
  'maxLevelDiff',
  'sweep',
  'equidistant',
  'startAngle',
  'clockwise',
  'rows',
  'cols',
  'begin',
  'condense',
  'preventOverlapPadding'
] as const satisfies ReadonlyArray<Extract<keyof LayoutOptions, string>>;

const DEFAULT_NODE_SIZE = 20;
const DEFAULT_MIN_VALUE_NODE_SIZE = 10;
const DEFAULT_MAX_VALUE_NODE_SIZE = 32;
const LABEL_COLLISION_PADDING = 2;
const LABEL_VIEWPORT_PADDING = 4;
const GRAPH_HOVER_DIM_OPACITY = 0.12;
const GRAPH_HOVER_LABEL_DIM_OPACITY = 0.18;
const GRAPH_HOVER_ACTIVE_EDGE_OPACITY = 0.96;
const GRAPH_HOVER_EDGE_COLOR = '#1fb6e8';
const GRAPH_HOVER_SHADOW_COLOR = 'rgba(15, 23, 42, 0.24)';
const GRAPH_HOVER_TRANSITION_DURATION = 180;
const GRAPH_HOVER_TRANSITION_EASING = 'cubicOut';
const GRAPH_HOVER_TRANSITION_SCOPE = 'graph-hover';

export function installGraphLayout(echarts: unknown, config: InstallGraphLayoutConfig): void {
  const echartsHost = echarts as EChartsHost;
  const { chartType, layoutType } = config;

  echartsHost.extendSeriesModel({
    type: `series.${chartType}`,

    visualDrawType: 'fill',

    getInitialData(this: GraphSeriesModel, option: GraphInput) {
      const nodes = Array.isArray(option.nodes) ? option.nodes : Array.isArray(option.data) ? option.data : [];
      const dimensions = echartsHost.helper.createDimensions(nodes, {
        coordDimensions: ['value']
      });
      const list = new echartsHost.List(dimensions, this);
      list.initData(nodes);
      return list;
    },

    defaultOption: createDefaultOption(layoutType)
  });

  echartsHost.extendChartView({
    type: chartType,

    render(this: GraphChartView, seriesModel: GraphSeriesModel, ecModel: unknown, api: EChartsApi) {
      const group = this.group;
      const renderToken = {};
      this.__renderToken = renderToken;

      try {
        const graphOption = readGraphOption(seriesModel);
        const layoutOptions = readLayoutOptions(echartsHost, seriesModel, api, graphOption);
        const viewport = {
          x: 0,
          y: 0,
          width: api.getWidth(),
          height: api.getHeight()
        };
        const fisheye = readFisheyeOptions(seriesModel, viewport);
        const renderSignature = createGraphRenderSignature(layoutType, seriesModel, layoutOptions, viewport);
        const fisheyeSignature = stableSerialize(fisheye);

        if (this.__graphRenderState && this.__graphRenderSignature === renderSignature) {
          if (this.__fisheyeSignature !== fisheyeSignature) {
            updateFisheyeRenderState(echartsHost, group, api, this, this.__graphRenderState, fisheye);
            this.__fisheyeSignature = fisheyeSignature;
          }
          return;
        }

        this.__graphHoverController?.dispose();
        this.__graphHoverController = undefined;
        this.__fisheyeController?.dispose();
        this.__fisheyeController = undefined;
        clearFisheyePreviewTimer(this);
        this.__fisheyeSignature = undefined;
        this.__graphRenderState = undefined;
        this.__graphRenderSignature = undefined;

        const layout = computeGraphLayout(layoutType, graphOption, layoutOptions);
        if (!shouldAbortGraphRender(this, renderToken)) {
          const aliveRender = renderAlive<GraphSeriesModel, GraphRenderState>(
            this,
            echartsHost,
            group,
            seriesModel,
            (targetGroup, targetSeriesModel) => ({
              payload: drawGraph(echartsHost, targetGroup, targetSeriesModel, layoutType, layout, viewport, fisheye)
            })
          );
          const renderState = mapGraphRenderState(aliveRender.payload as GraphRenderState, aliveRender.mapElement);
          this.__graphHoverController = installGraphHover(renderState, api);
          this.__graphRenderState = renderState;
          this.__graphRenderSignature = renderSignature;
          this.__fisheyeSignature = fisheyeSignature;
          if (fisheye) {
            this.__fisheyeController = installFisheye(api, renderState, fisheye);
            scheduleInitialFisheyePreview(this, renderState, fisheye, renderState.enterAnimationEnd);
          }
        }
      } catch (error) {
        this.__fisheyeSignature = undefined;
        this.__graphRenderState = undefined;
        this.__graphRenderSignature = undefined;
        console.error(`[${chartType}] layout failed`, error);
      }
    },

    remove(this: GraphChartView) {
      this.__renderToken = null;
      this.__graphHoverController?.dispose();
      this.__graphHoverController = undefined;
      this.__fisheyeController?.dispose();
      this.__fisheyeController = undefined;
      clearFisheyePreviewTimer(this);
      this.__fisheyeSignature = undefined;
      this.__graphRenderState = undefined;
      this.__graphRenderSignature = undefined;
      clearAliveRender(this);
      this.group.removeAll();
    },

    dispose(this: GraphChartView) {
      this.__renderToken = null;
      this.__graphHoverController?.dispose();
      this.__graphHoverController = undefined;
      this.__fisheyeController?.dispose();
      this.__fisheyeController = undefined;
      clearFisheyePreviewTimer(this);
      this.__fisheyeSignature = undefined;
      this.__graphRenderState = undefined;
      this.__graphRenderSignature = undefined;
      clearAliveRender(this);
      this.group.removeAll();
    }
  });
}

function createDefaultOption(layoutType: string) {
  return {
    left: 'center',
    top: 'center',
    width: '80%',
    height: '80%',
    symbolSize: null,
    layout: {},
    layoutAnimation: false,
    enterAnimation: true,
    edgeAnimation: null,
    fisheye: {
      show: true,
      radius: null,
      scale: 2.2,
      labelScale: 1.55,
      stroke: 'rgba(17, 24, 39, 0.86)',
      strokeWidth: 3,
      opacity: 0.92
    },
    edgeStyle: {
      color: '#9aa4b2',
      width: 1,
      opacity: layoutType === 'arc' ? 0.55 : 0.45
    },
    itemStyle: {
      color: '#5470c6',
      borderColor: '#fff',
      borderWidth: 1
    },
    label: {
      show: false,
      color: '#1f2937',
      fontSize: 12,
      position: layoutType === 'arc' ? 'bottom' : 'right'
    },
    emphasis: {
      itemStyle: {
        shadowBlur: 8,
        shadowColor: 'rgba(0, 0, 0, 0.2)'
      },
      edgeStyle: {
        opacity: 0.8
      }
    }
  };
}

function readGraphOption(seriesModel: GraphSeriesModel): GraphInput {
  const option = seriesModel.option || {};
  return {
    nodes: Array.isArray(option.nodes) ? option.nodes : Array.isArray(option.data) ? option.data : [],
    edges: Array.isArray(option.edges) ? option.edges : Array.isArray(option.links) ? option.links : []
  };
}

function readLayoutOptions(
  echarts: EChartsHost,
  seriesModel: GraphSeriesModel,
  api: EChartsApi,
  graphOption: GraphInput
): LayoutOptions {
  const rect = echarts.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
    width: api.getWidth(),
    height: api.getHeight()
  });
  const layoutOptions: LayoutOptions = {
    ...asRecord(seriesModel.get('layout')),
    ...asRecord(seriesModel.get('layoutOptions'))
  };

  layoutOptionKeys.forEach((key) => {
    const value = seriesModel.get(key);
    if (value !== undefined && value !== null) layoutOptions[key as string] = value;
  });

  if (layoutOptions.nodeSize == null) {
    const symbolSize = seriesModel.get('symbolSize');
    layoutOptions.nodeSize = symbolSize == null
      ? createValueNodeSizeResolver(normalizeGraphData(graphOption).nodes)
      : symbolSize as LayoutOptions['nodeSize'];
  }

  layoutOptions.width = rect.width;
  layoutOptions.height = rect.height;
  layoutOptions.center = resolveCenter(echarts, seriesModel.get('center'), rect);
  return layoutOptions;
}

function resolveCenter(echarts: EChartsHost, center: unknown, rect: LayoutRect): [number, number] {
  if (!Array.isArray(center)) {
    return [rect.x + rect.width / 2, rect.y + rect.height / 2];
  }

  return [
    rect.x + echarts.number.parsePercent(center[0], rect.width),
    rect.y + echarts.number.parsePercent(center[1], rect.height)
  ];
}

function createGraphRenderSignature(
  layoutType: string,
  seriesModel: GraphSeriesModel,
  layoutOptions: LayoutOptions,
  viewport: Rect
): string {
  return stableSerialize({
    layoutType,
    option: omitFisheyeOption(seriesModel.option || {}),
    layoutOptions,
    viewport
  });
}

function omitFisheyeOption(option: GraphInput): Record<string, unknown> {
  const copy = {
    ...option
  } as Record<string, unknown>;
  delete copy.fisheye;
  return copy;
}

function stableSerialize(value: unknown, seen = new WeakSet<object>()): string {
  if (value === null) return 'null';
  if (typeof value === 'undefined') return '"__undefined"';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'function') return JSON.stringify(`__function:${value.toString()}`);
  if (typeof value === 'symbol') return JSON.stringify(String(value));
  if (typeof value !== 'object') return JSON.stringify(String(value));
  if (seen.has(value)) return '"__cycle"';

  seen.add(value);
  if (Array.isArray(value)) {
    const serialized = `[${value.map((item) => stableSerialize(item, seen)).join(',')}]`;
    seen.delete(value);
    return serialized;
  }

  const record = value as Record<string, unknown>;
  const serialized = `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key], seen)}`)
    .join(',')}}`;
  seen.delete(value);
  return serialized;
}

function drawGraph(
  echarts: EChartsHost,
  group: GraphicGroup,
  seriesModel: GraphSeriesModel,
  layoutType: string,
  layout: LayoutResult,
  viewport: Rect,
  fisheye: FisheyeOptions | null
): GraphRenderState {
  const data = seriesModel.getData();
  const graph = normalizeGraphData(readGraphOption(seriesModel));
  const nodeById = new Map(layout.nodes.map((node) => [node.id, node]));
  const indexById = new Map(graph.nodes.map((node, index) => [node.id, index]));
  const edgeGroup = new echarts.graphic.Group();
  const nodeGroup = new echarts.graphic.Group();
  const labelGroup = new echarts.graphic.Group();
  const enterAnimationEnd = readGraphEnterAnimationEnd(seriesModel, graph.nodes.length, layout.edges);
  const defaultNodeSize = createValueNodeSizeResolver(layout.nodes);
  const renderNodes: RenderNode[] = [];
  const renderedNodes: RenderedNode[] = [];
  const renderedLabels: RenderedLabel[] = [];
  const renderedEdges: RenderedEdge[] = [];

  layout.edges.forEach((edge, edgeIndex) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) return;
    const renderedEdge = createEdgeElement(echarts, seriesModel, layoutType, edge, source, target, edgeIndex, enterAnimationEnd);
    edgeGroup.add(renderedEdge.element);
    renderedEdges.push({
      ...renderedEdge,
      sourceId: edge.source,
      targetId: edge.target,
      edgeGroup,
      fisheyeElementAdded: false,
      baseStyle: cloneRecord(renderedEdge.baseStyle),
      fisheyeBaseStyle: renderedEdge.fisheyeBaseStyle ? cloneRecord(renderedEdge.fisheyeBaseStyle) : null
    });
  });

  layout.nodes.forEach((node) => {
    const dataIndex = indexById.get(node.id);
    if (dataIndex == null) return;
    const animationIndex = dataIndex;
    const itemModel = data.getItemModel(dataIndex);
    const size = readNodeSize(seriesModel, data, node, dataIndex, defaultNodeSize);
    renderNodes.push({
      node,
      dataIndex,
      animationIndex,
      itemModel,
      size,
      circleBox: circleBox(node, size / 2),
      labelSpec: createLabelSpec(seriesModel, itemModel, node, size)
    });
  });

  const placedLabels = placeLabels(renderNodes, layoutType, viewport);

  renderNodes.forEach((renderNode) => {
    const renderedNode = createNodeElement(echarts, seriesModel, data, renderNode, enterAnimationEnd);
    nodeGroup.add(renderedNode.group);
    renderedNodes.push({
      id: renderNode.node.id,
      baseX: renderNode.node.x,
      baseY: renderNode.node.y,
      baseRadius: renderNode.size / 2,
      circle: renderedNode.circle,
      baseStyle: cloneRecord(renderedNode.baseStyle),
      valueLabel: renderedNode.valueLabel,
      valueLabelBaseStyle: renderedNode.valueLabelBaseStyle ? cloneRecord(renderedNode.valueLabelBaseStyle) : null,
      valueFontSize: renderedNode.valueFontSize,
      valueLineWidth: renderedNode.valueLineWidth
    });

    const placedLabel = placedLabels.get(renderNode.node.id);
    if (placedLabel) {
      const label = createLabelElement(echarts, placedLabel);
      setAliveRenderKey(label, `node-label:${renderNode.node.id}`);
      const baseStyle = cloneStyle(label);
      applyFadeEnterAnimation(label, readGraphEnterAnimation(seriesModel, renderNode.animationIndex, enterAnimationEnd));
      labelGroup.add(label);
      renderedLabels.push({
        nodeId: renderNode.node.id,
        element: label,
        baseStyle,
        baseX: placedLabel.point.x,
        baseY: placedLabel.point.y,
        baseFontSize: placedLabel.spec.fontSize,
        baseLineHeight: placedLabel.spec.lineHeight
      });
    }
  });

  group.add(edgeGroup);
  group.add(nodeGroup);
  group.add(labelGroup);
  const lens = fisheye ? createFisheyeLens(echarts, fisheye) : null;
  if (lens) group.add(lens);

  const renderState = {
    nodes: renderedNodes,
    labels: renderedLabels,
    edges: renderedEdges,
    lens,
    viewport,
    enterAnimationEnd
  };
  return renderState;
}

function mapGraphRenderState(
  renderState: GraphRenderState,
  mapElement: <TElement extends GraphicElement | null | undefined>(element: TElement) => TElement
): GraphRenderState {
  return {
    ...renderState,
    nodes: renderState.nodes.map((node) => ({
      ...node,
      circle: mapElement(node.circle),
      valueLabel: mapElement(node.valueLabel)
    })),
    labels: renderState.labels.map((label) => ({
      ...label,
      element: mapElement(label.element)
    })),
    edges: renderState.edges.map((edge) => ({
      ...edge,
      element: mapElement(edge.element),
      fisheyeElement: mapElement(edge.fisheyeElement),
      edgeGroup: mapElement(edge.edgeGroup) as GraphicGroup
    })),
    lens: mapElement(renderState.lens)
  };
}

function shouldAbortGraphRender(view: GraphChartView, renderToken: object): boolean {
  return view.__renderToken !== renderToken;
}

function createEdgeElement(
  echarts: EChartsHost,
  seriesModel: GraphSeriesModel,
  layoutType: string,
  edge: GraphEdge,
  source: PublicLayoutNode,
  target: PublicLayoutNode,
  edgeIndex: number,
  enterAnimationEnd: number
): RenderedEdgeElement {
  const style = readEdgeStyle(seriesModel, edge);
  const baseStyle = cloneRecord(style);
  const animation = syncEnterAnimationEnd(readEdgeAnimation(seriesModel, edge, edgeIndex), enterAnimationEnd);
  const edgeKey = `edge:${edge.id || `${edge.source}->${edge.target}`}:${edgeIndex}`;
  if (layoutType === 'arc') {
    if (echarts.graphic.Arc) {
      const edgeElement = new echarts.graphic.Arc({
        shape: createArcShape([source.x, source.y], [target.x, target.y]),
        style: cloneRecord(style)
      });
      setAliveRenderKey(edgeElement, edgeKey);
      edgeElement.cursor = 'pointer';
      applyEdgeConnectionAnimation(edgeElement, 'style', 'strokePercent', animation);
      const fisheyeElement = new echarts.graphic.BezierCurve({
        shape: createArcBezierShape([source.x, source.y], [target.x, target.y]),
        style: cloneRecord(style),
        ignore: true,
        silent: true
      });
      setAliveRenderKey(fisheyeElement, `${edgeKey}:fisheye`);
      return {
        element: edgeElement,
        fisheyeElement,
        kind: 'arcPath',
        baseStyle,
        fisheyeBaseStyle: cloneRecord(style)
      };
    }
    const edgeElement = new echarts.graphic.BezierCurve({
      shape: createArcBezierShape([source.x, source.y], [target.x, target.y]),
      style: cloneRecord(style)
    });
    setAliveRenderKey(edgeElement, edgeKey);
    edgeElement.cursor = 'pointer';
    applyEdgeConnectionAnimation(edgeElement, 'shape', 'percent', animation);
    return {
      element: edgeElement,
      kind: 'arcBezier',
      baseStyle,
      fisheyeBaseStyle: null
    };
  }

  const edgeElement = new echarts.graphic.Line({
    shape: {
      x1: source.x,
      y1: source.y,
      x2: target.x,
      y2: target.y
    },
    style: cloneRecord(style)
  });
  setAliveRenderKey(edgeElement, edgeKey);
  edgeElement.cursor = 'pointer';
  applyEdgeConnectionAnimation(edgeElement, 'shape', 'percent', animation);
  return {
    element: edgeElement,
    kind: 'line',
    baseStyle,
    fisheyeBaseStyle: null
  };
}

function createNodeElement(
  echarts: EChartsHost,
  seriesModel: GraphSeriesModel,
  data: SeriesData,
  renderNode: RenderNode,
  enterAnimationEnd: number
): RenderedNodeElement {
  const { node, dataIndex, animationIndex, itemModel, size } = renderNode;
  const itemGroup = new echarts.graphic.Group();
  setAliveRenderKey(itemGroup, `node-group:${node.id}`);
  const nodeStyle = readNodeStyle(seriesModel, itemModel, data, dataIndex);
  const baseStyle = cloneRecord(nodeStyle);
  const circle = new echarts.graphic.Circle({
    shape: {
      cx: node.x,
      cy: node.y,
      r: size / 2
    },
    style: nodeStyle
  });
  setAliveRenderKey(circle, `node:${node.id}`);
  circle.cursor = 'pointer';
  const enterAnimation = readGraphEnterAnimation(seriesModel, animationIndex, enterAnimationEnd);
  applyNodeEnterAnimation(circle, size, enterAnimation);

  data.setItemLayout(dataIndex, [node.x, node.y]);
  data.setItemGraphicEl(dataIndex, circle);

  itemGroup.add(circle);
  const valueLabel = createNodeValueElement(echarts, renderNode);
  const valueLabelBaseStyle = valueLabel ? cloneStyle(valueLabel) : null;
  const valueStyle = valueLabel ? asRecord(valueLabel.style) : {};
  if (valueLabel) {
    setAliveRenderKey(valueLabel, `node-value:${node.id}`);
    valueLabel.cursor = 'pointer';
    applyFadeEnterAnimation(valueLabel, enterAnimation);
    itemGroup.add(valueLabel);
  }
  return {
    group: itemGroup,
    circle,
    baseStyle,
    valueLabel,
    valueLabelBaseStyle,
    valueFontSize: finiteNumber(valueStyle.fontSize, 0),
    valueLineWidth: finiteNumber(valueStyle.lineWidth, 0)
  };
}

function createNodeValueElement(echarts: EChartsHost, renderNode: RenderNode): GraphicElement | null {
  const text = formatNodeValue(renderNode.node.value);
  if (!text) return null;

  const fontSize = resolveNodeValueFontSize(text, renderNode.size);
  return new echarts.graphic.Text({
    style: {
      x: renderNode.node.x,
      y: renderNode.node.y,
      text,
      fill: '#ffffff',
      stroke: 'rgba(15, 23, 42, 0.28)',
      lineWidth: Math.max(1, fontSize * 0.14),
      fontSize,
      fontWeight: 700,
      align: 'center',
      verticalAlign: 'middle'
    }
  });
}

function formatNodeValue(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'number') return Number.isFinite(value) ? formatCompactNumber(value) : '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = formatNodeValue(item);
      if (text) return text;
    }
  }
  return '';
}

function installGraphHover(renderState: GraphRenderState, api?: EChartsApi): GraphHoverController | undefined {
  const adjacency = createHoverAdjacency(renderState.edges);
  const hoverTargets = new WeakSet<object>();
  let active = false;
  const registerHoverTarget = (element: GraphicElement | null | undefined) => {
    if (element && typeof element === 'object') hoverTargets.add(element);
  };
  const reset = (eventOrImmediate: ZRenderEvent | boolean = false) => {
    if (!active) return;
    const immediate = eventOrImmediate === true;
    active = false;
    resetGraphHover(renderState, !immediate);
  };

  renderState.nodes.forEach((node) => {
    const enter = () => {
      active = true;
      applyNodeHover(renderState, adjacency, node.id);
    };
    registerHoverTarget(node.circle);
    registerHoverTarget(node.valueLabel);
    attachHoverHandlers(node.circle, enter, reset);
    if (node.valueLabel) attachHoverHandlers(node.valueLabel, enter, reset);
  });

  renderState.edges.forEach((edge, edgeIndex) => {
    registerHoverTarget(edge.element);
    registerHoverTarget(edge.fisheyeElement);
    attachHoverHandlers(
      edge.element,
      () => {
        active = true;
        applyEdgeHover(renderState, edgeIndex);
      },
      reset
    );
  });

  const zr = api?.getZr?.();
  if (!zr) return undefined;

  const handleMove = (event: ZRenderEvent) => {
    if (!active) return;
    if (!isGraphHoverTarget(event.target, hoverTargets)) reset();
  };

  zr.on('mousemove', handleMove);
  zr.on('globalout', reset);

  return {
    dispose() {
      zr.off('mousemove', handleMove);
      zr.off('globalout', reset);
      reset(true);
    }
  };
}

function isGraphHoverTarget(target: unknown, hoverTargets: WeakSet<object>): boolean {
  let current = target;
  while (current && typeof current === 'object') {
    if (hoverTargets.has(current)) return true;
    current = (current as Record<string, unknown>).parent;
  }
  return false;
}

function createHoverAdjacency(edges: RenderedEdge[]): Map<string, { nodes: Set<string>; edges: Set<number> }> {
  const adjacency = new Map<string, { nodes: Set<string>; edges: Set<number> }>();
  const entryFor = (id: string) => {
    let entry = adjacency.get(id);
    if (!entry) {
      entry = {
        nodes: new Set<string>(),
        edges: new Set<number>()
      };
      adjacency.set(id, entry);
    }
    return entry;
  };

  edges.forEach((edge, edgeIndex) => {
    const source = entryFor(edge.sourceId);
    const target = entryFor(edge.targetId);
    source.nodes.add(edge.targetId);
    source.edges.add(edgeIndex);
    target.nodes.add(edge.sourceId);
    target.edges.add(edgeIndex);
  });

  return adjacency;
}

function applyNodeHover(
  renderState: GraphRenderState,
  adjacency: Map<string, { nodes: Set<string>; edges: Set<number> }>,
  nodeId: string
): void {
  const relatedNodeIds = new Set<string>([nodeId]);
  const relatedEdgeIndexes = new Set<number>();
  const adjacent = adjacency.get(nodeId);
  adjacent?.nodes.forEach((id) => relatedNodeIds.add(id));
  adjacent?.edges.forEach((edgeIndex) => relatedEdgeIndexes.add(edgeIndex));

  const focusNode = renderState.nodes.find((node) => node.id === nodeId);
  const focusColor = String(asRecord(focusNode?.circle?.style).fill || GRAPH_HOVER_EDGE_COLOR);

  applyHoverStyles(renderState, {
    relatedNodeIds,
    relatedEdgeIndexes,
    focusNodeId: nodeId,
    edgeColor: focusColor,
    edgeWidthScale: 2.2
  });
}

function applyEdgeHover(renderState: GraphRenderState, edgeIndex: number): void {
  const edge = renderState.edges[edgeIndex];
  if (!edge) return;

  applyHoverStyles(renderState, {
    relatedNodeIds: new Set([edge.sourceId, edge.targetId]),
    relatedEdgeIndexes: new Set([edgeIndex]),
    edgeColor: GRAPH_HOVER_EDGE_COLOR,
    edgeWidthScale: 4.2
  });
}

function applyHoverStyles(
  renderState: GraphRenderState,
  options: {
    relatedNodeIds: Set<string>;
    relatedEdgeIndexes: Set<number>;
    focusNodeId?: string;
    edgeColor: string;
    edgeWidthScale: number;
  }
): void {
  renderState.nodes.forEach((node) => {
    const isRelated = options.relatedNodeIds.has(node.id);
    const isFocus = node.id === options.focusNodeId;
    applyGraphElementStyle(node.circle, node.baseStyle, {
      opacity: isRelated ? 1 : GRAPH_HOVER_DIM_OPACITY,
      shadowBlur: isFocus ? Math.max(10, node.baseRadius * 0.7) : undefined,
      shadowColor: isFocus ? GRAPH_HOVER_SHADOW_COLOR : undefined,
      lineWidth: isFocus ? Math.max(finiteNumber(node.baseStyle.lineWidth, 1), 2.4) : undefined
    }, ['opacity', 'shadowBlur', 'shadowColor', 'lineWidth'], true);

    if (node.valueLabel && node.valueLabelBaseStyle) {
      applyGraphElementStyle(node.valueLabel, node.valueLabelBaseStyle, {
        opacity: isRelated ? 1 : GRAPH_HOVER_LABEL_DIM_OPACITY
      }, ['opacity'], true);
    }
  });

  renderState.labels.forEach((label) => {
    applyGraphElementStyle(label.element, label.baseStyle, {
      opacity: options.relatedNodeIds.has(label.nodeId) ? 1 : GRAPH_HOVER_LABEL_DIM_OPACITY
    }, ['opacity'], true);
  });

  renderState.edges.forEach((edge, edgeIndex) => {
    const isRelated = options.relatedEdgeIndexes.has(edgeIndex);
    const baseWidth = finiteNumber(edge.baseStyle.lineWidth, 1);
    const hoverWidth = Math.max(baseWidth * options.edgeWidthScale, options.edgeWidthScale >= 4 ? 6 : 2.6);
    const style = isRelated
      ? {
          stroke: options.edgeColor,
          lineWidth: hoverWidth,
          opacity: GRAPH_HOVER_ACTIVE_EDGE_OPACITY,
          shadowBlur: 8,
          shadowColor: `${options.edgeColor}55`
        }
      : {
          opacity: GRAPH_HOVER_DIM_OPACITY
        };
    applyEdgeHoverStyle(edge, style, ['stroke', 'lineWidth', 'opacity', 'shadowBlur', 'shadowColor'], true);
  });
}

function resetGraphHover(renderState: GraphRenderState, transition = true): void {
  renderState.nodes.forEach((node) => {
    applyGraphElementStyle(node.circle, node.baseStyle, {}, ['opacity', 'shadowBlur', 'shadowColor', 'lineWidth'], transition);
    if (node.valueLabel && node.valueLabelBaseStyle) {
      applyGraphElementStyle(node.valueLabel, node.valueLabelBaseStyle, {}, ['opacity'], transition);
    }
  });

  renderState.labels.forEach((label) => {
    applyGraphElementStyle(label.element, label.baseStyle, {}, ['opacity'], transition);
  });

  renderState.edges.forEach((edge) => {
    applyEdgeHoverStyle(edge, {}, ['stroke', 'lineWidth', 'opacity', 'shadowBlur', 'shadowColor'], transition);
  });
}

function applyEdgeHoverStyle(edge: RenderedEdge, style: Record<string, unknown>, keys: string[], transition = false): void {
  applyGraphElementStyle(edge.element, edge.baseStyle, style, keys, transition);
  if (edge.fisheyeElement && edge.fisheyeBaseStyle) {
    applyGraphElementStyle(edge.fisheyeElement, edge.fisheyeBaseStyle, style, keys, transition);
  }
}

function applyGraphElementStyle(
  element: GraphicElement,
  baseStyle: Record<string, unknown>,
  patch: Record<string, unknown>,
  keys: string[],
  transition = false
): void {
  const current = cloneStyle(element);
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      const value = patch[key];
      if (value === undefined) {
        if (Object.prototype.hasOwnProperty.call(baseStyle, key)) {
          current[key] = baseStyle[key];
        } else {
          delete current[key];
        }
      } else {
        current[key] = value;
      }
    } else if (Object.prototype.hasOwnProperty.call(baseStyle, key)) {
      current[key] = baseStyle[key];
    } else {
      delete current[key];
    }
  });
  if (transition) {
    transitionGraphicStyle(element, current, keys);
  } else {
    replaceGraphicStyle(element, current);
  }
}

function transitionGraphicStyle(element: GraphicElement, nextStyle: Record<string, unknown>, keys: string[]): void {
  const target = createStyleTransitionTarget(nextStyle, keys);
  if (!Object.keys(target).length) {
    replaceGraphicStyle(element, nextStyle);
    return;
  }

  const animatable = element as AnimatableGraphicElement;
  animatable.stopAnimation?.(GRAPH_HOVER_TRANSITION_SCOPE, false);
  const animator = animatable.animate?.('style');
  if (!animator) {
    replaceGraphicStyle(element, nextStyle);
    return;
  }

  animator.scope = GRAPH_HOVER_TRANSITION_SCOPE;
  animator
    .when(GRAPH_HOVER_TRANSITION_DURATION, target)
    .done?.(() => replaceGraphicStyle(element, nextStyle));
  animator.start(GRAPH_HOVER_TRANSITION_EASING);
}

function createStyleTransitionTarget(nextStyle: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const target: Record<string, unknown> = {};
  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(nextStyle, key)) {
      target[key] = nextStyle[key];
      return;
    }
    const fallback = styleTransitionFallbackValue(key);
    if (fallback !== undefined) target[key] = fallback;
  });
  return target;
}

function styleTransitionFallbackValue(key: string): unknown {
  if (key === 'opacity') return 1;
  if (key === 'shadowBlur') return 0;
  if (key === 'shadowColor') return '#000';
  if (key === 'lineWidth') return 1;
  return undefined;
}

function attachHoverHandlers(element: GraphicElement, onEnter: () => void, onLeave: () => void): void {
  const evented = element as EventedGraphicElement;
  evented.on?.('mouseover', onEnter);
  evented.on?.('mouseout', onLeave);
}

function formatCompactNumber(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000) return trimFixed(value / 1_000_000, 1) + 'M';
  if (absValue >= 1_000) return trimFixed(value / 1_000, 1) + 'K';
  if (Number.isInteger(value)) return String(value);
  return trimFixed(value, 2);
}

function trimFixed(value: number, fractionDigits: number): string {
  return value.toFixed(fractionDigits).replace(/\.0+$|(\.\d*[1-9])0+$/, '$1');
}

function resolveNodeValueFontSize(text: string, size: number): number {
  const baseSize = Math.max(8, Math.min(14, size * 0.34));
  const maxWidth = Math.max(6, size * 0.78);
  const textWidth = measureText(text, baseSize, baseSize * 1.2).width;
  if (textWidth <= maxWidth) return baseSize;
  return Math.max(7, baseSize * (maxWidth / textWidth));
}

function createLabelSpec(
  seriesModel: GraphSeriesModel,
  itemModel: EChartsModel,
  node: PublicLayoutNode,
  size: number
): LabelSpec | null {
  const labelModel = itemModel.getModel('label');
  const show = labelModel.get('show') ?? seriesModel.get(['label', 'show']);
  if (!show) return null;

  const rawPosition = labelModel.get('position') || seriesModel.get(['label', 'position']) || 'right';
  const position = typeof rawPosition === 'string' ? rawPosition : 'right';
  const offset = size / 2 + 6;
  const formatter = labelModel.get('formatter') || seriesModel.get(['label', 'formatter']);
  const text = String(formatLabel(formatter, node) ?? '');
  const fontSize = finiteNumber(labelModel.get('fontSize') ?? seriesModel.get(['label', 'fontSize']), 12);
  const lineHeight = finiteNumber(labelModel.get('lineHeight') ?? seriesModel.get(['label', 'lineHeight']), fontSize * 1.2);
  const metrics = measureText(text, fontSize, lineHeight);

  return {
    node,
    text,
    color: labelModel.get('color') || seriesModel.get(['label', 'color']) || '#1f2937',
    fontSize,
    lineHeight,
    position,
    offset,
    style: {
      fontWeight: labelModel.get('fontWeight') || seriesModel.get(['label', 'fontWeight']),
      fontFamily: labelModel.get('fontFamily') || seriesModel.get(['label', 'fontFamily'])
    },
    width: metrics.width,
    height: metrics.height
  };
}

function createLabelElement(echarts: EChartsHost, placed: PlacedLabel): GraphicElement {
  return new echarts.graphic.Text({
    style: {
      ...placed.spec.style,
      x: placed.point.x,
      y: placed.point.y,
      text: placed.spec.text,
      fill: placed.spec.color,
      fontSize: placed.spec.fontSize,
      lineHeight: placed.spec.lineHeight,
      align: placed.point.align,
      verticalAlign: placed.point.verticalAlign
    }
  });
}

function createFisheyeLens(echarts: EChartsHost, fisheye: FisheyeOptions): GraphicElement {
  const lens = new echarts.graphic.Circle({
    shape: {
      cx: 0,
      cy: 0,
      r: fisheye.radius
    },
    style: {
      fill: null,
      stroke: fisheye.stroke,
      lineWidth: fisheye.strokeWidth,
      opacity: fisheye.opacity
    },
    ignore: true,
    silent: true,
    z2: 1000
  });
  setAliveRenderKey(lens, 'fisheye-lens');
  return lens;
}

function updateFisheyeRenderState(
  echarts: EChartsHost,
  group: GraphicGroup,
  api: EChartsApi,
  view: GraphChartView,
  renderState: GraphRenderState,
  fisheye: FisheyeOptions | null
): void {
  view.__fisheyeController?.dispose();
  view.__fisheyeController = undefined;
  clearFisheyePreviewTimer(view);

  if (!fisheye) {
    if (renderState.lens) setGraphicIgnore(renderState.lens, true);
    return;
  }

  if (!renderState.lens) {
    renderState.lens = createFisheyeLens(echarts, fisheye);
    group.add(renderState.lens);
  } else {
    setGraphicShape(renderState.lens, {
      r: fisheye.radius
    });
    setGraphicStyle(renderState.lens, {
      fill: null,
      stroke: fisheye.stroke,
      lineWidth: fisheye.strokeWidth,
      opacity: fisheye.opacity
    });
    setGraphicIgnore(renderState.lens, true);
  }

  view.__fisheyeController = installFisheye(api, renderState, fisheye);
  scheduleInitialFisheyePreview(view, renderState, fisheye, 0);
}

function readFisheyeOptions(seriesModel: GraphSeriesModel, viewport: Rect): FisheyeOptions | null {
  return resolveFisheyeOptions(seriesModel.get('fisheye'), viewport);
}

function scheduleInitialFisheyePreview(
  view: GraphChartView,
  renderState: GraphRenderState,
  fisheye: FisheyeOptions,
  delay: number
): void {
  if (!fisheye.preview) return;
  applyInitialFisheyePreview(renderState, fisheye);
  if (delay <= 0) return;
  view.__fisheyePreviewTimer = setTimeout(() => {
    view.__fisheyePreviewTimer = undefined;
    applyInitialFisheyePreview(renderState, fisheye);
  }, delay);
}

function applyInitialFisheyePreview(renderState: GraphRenderState, fisheye: FisheyeOptions): void {
  applyFisheye(renderState, fisheye, [
    renderState.viewport.x + renderState.viewport.width / 2,
    renderState.viewport.y + renderState.viewport.height / 2
  ]);
}

function clearFisheyePreviewTimer(view: GraphChartView): void {
  if (view.__fisheyePreviewTimer === undefined) return;
  clearTimeout(view.__fisheyePreviewTimer);
  view.__fisheyePreviewTimer = undefined;
}

function installFisheye(
  api: EChartsApi,
  renderState: GraphRenderState,
  fisheye: FisheyeOptions
): FisheyeController | undefined {
  return installFisheyeController({
    zrender: api.getZr?.(),
    viewport: renderState.viewport,
    fisheye: { ...fisheye, preview: false },
    lens: renderState.lens,
    targetElements: () => [],
    onApply: (focus) => applyFisheye(renderState, fisheye, focus),
    onReset: () => resetFisheye(renderState)
  });
}

function applyFisheye(renderState: GraphRenderState, fisheye: FisheyeOptions, focus: Point): void {
  const transforms = new Map<string, FisheyeTransform>();
  const nodeById = new Map(renderState.nodes.map((node) => [node.id, node]));

  if (renderState.lens) {
    setGraphicShape(renderState.lens, {
      cx: focus[0],
      cy: focus[1],
      r: fisheye.radius
    });
    setGraphicIgnore(renderState.lens, false);
  }

  renderState.nodes.forEach((node) => {
    const transform = fisheyeTransform([node.baseX, node.baseY], fisheye, focus);
    transforms.set(node.id, transform);
    setGraphicShape(node.circle, {
      cx: transform.x,
      cy: transform.y,
      r: node.baseRadius * transform.scale
    });

    if (node.valueLabel) {
      const lineScale = transform.scale;
      setGraphicStyle(node.valueLabel, {
        x: transform.x,
        y: transform.y,
        fontSize: node.valueFontSize * lineScale,
        lineWidth: Math.max(1, node.valueLineWidth * lineScale)
      });
    }
  });

  renderState.labels.forEach((label) => {
    const node = nodeById.get(label.nodeId);
    const transform = transforms.get(label.nodeId);
    if (!node || !transform) return;

    const labelScale = 1 + (fisheye.labelScale - 1) * transform.influence;
    const offsetScale = 1 + (labelScale - 1) * 0.35;
    setGraphicStyle(label.element, {
      x: transform.x + (label.baseX - node.baseX) * offsetScale,
      y: transform.y + (label.baseY - node.baseY) * offsetScale,
      fontSize: label.baseFontSize * labelScale,
      lineHeight: label.baseLineHeight * labelScale
    });
  });

  renderState.edges.forEach((edge) => {
    const source = transforms.get(edge.sourceId);
    const target = transforms.get(edge.targetId);
    const baseSource = nodeById.get(edge.sourceId);
    const baseTarget = nodeById.get(edge.targetId);
    if (!source || !target || !baseSource || !baseTarget) return;

    updateFisheyeEdge(edge, [source.x, source.y], [target.x, target.y], true);
  });
}

function resetFisheye(renderState: GraphRenderState): void {
  const nodeById = new Map(renderState.nodes.map((node) => [node.id, node]));
  if (renderState.lens) setGraphicIgnore(renderState.lens, true);

  renderState.nodes.forEach((node) => {
    setGraphicShape(node.circle, {
      cx: node.baseX,
      cy: node.baseY,
      r: node.baseRadius
    });
    if (node.valueLabel) {
      setGraphicStyle(node.valueLabel, {
        x: node.baseX,
        y: node.baseY,
        fontSize: node.valueFontSize,
        lineWidth: node.valueLineWidth
      });
    }
  });

  renderState.labels.forEach((label) => {
    setGraphicStyle(label.element, {
      x: label.baseX,
      y: label.baseY,
      fontSize: label.baseFontSize,
      lineHeight: label.baseLineHeight
    });
  });

  renderState.edges.forEach((edge) => {
    const source = nodeById.get(edge.sourceId);
    const target = nodeById.get(edge.targetId);
    if (!source || !target) return;
    updateFisheyeEdge(edge, [source.baseX, source.baseY], [target.baseX, target.baseY], false);
  });
}

function updateFisheyeEdge(edge: RenderedEdge, source: Point, target: Point, active: boolean): void {
  if (edge.kind === 'line') {
    setGraphicShape(edge.element, {
      x1: source[0],
      y1: source[1],
      x2: target[0],
      y2: target[1]
    });
    return;
  }

  const shape = createArcBezierShape(source, target);
  if (edge.kind === 'arcPath' && edge.fisheyeElement) {
    if (!edge.fisheyeElementAdded) {
      edge.edgeGroup.add(edge.fisheyeElement);
      edge.fisheyeElementAdded = true;
    }
    setGraphicIgnore(edge.element, active);
    setGraphicIgnore(edge.fisheyeElement, !active);
    setGraphicShape(edge.fisheyeElement, shape);
    return;
  }

  setGraphicShape(edge.element, shape);
}

function getLabelPoint(node: PublicLayoutNode, position: string, offset: number): LabelPoint {
  const points: Record<LabelPosition, LabelPoint> = {
    top: { x: node.x, y: node.y - offset, align: 'center', verticalAlign: 'bottom' },
    bottom: { x: node.x, y: node.y + offset, align: 'center', verticalAlign: 'top' },
    left: { x: node.x - offset, y: node.y, align: 'right', verticalAlign: 'middle' },
    right: { x: node.x + offset, y: node.y, align: 'left', verticalAlign: 'middle' }
  };
  return isLabelPosition(position) ? points[position] : points.right;
}

function placeLabels(renderNodes: RenderNode[], layoutType: string, viewport: Rect): Map<string, PlacedLabel> {
  const labels = renderNodes.filter((item): item is RenderNode & { labelSpec: LabelSpec } => item.labelSpec != null);
  const placed = new Map<string, PlacedLabel>();
  if (!labels.length) return placed;

  const occupied: Rect[] = renderNodes.map((item) => expandRect(item.circleBox, LABEL_COLLISION_PADDING));
  const labelViewport = expandRect(viewport, -LABEL_VIEWPORT_PADDING);
  const center = graphCenter(renderNodes);

  labels
    .slice()
    .sort((left, right) => {
      const leftDistance = distanceFromCenter(left.node, center);
      const rightDistance = distanceFromCenter(right.node, center);
      return rightDistance - leftDistance || right.size - left.size || left.dataIndex - right.dataIndex;
    })
    .forEach((item) => {
      const spec = item.labelSpec;

      const candidates = createLabelCandidates(spec, layoutType, center);
      let best: PlacedLabel = {
        spec,
        point: candidates[0],
        box: textBoxFromLabelPoint(spec, candidates[0])
      };
      let bestScore = Infinity;

      for (const point of candidates) {
        const box = textBoxFromLabelPoint(spec, point);
        const outside = outsideArea(box, labelViewport);
        const overlap = overlapArea(box, occupied);
        const distance = Math.hypot(point.x - spec.node.x, point.y - spec.node.y);
        const score = overlap * 10000 + outside * 1000 + distance;
        if (score < bestScore) {
          bestScore = score;
          best = { spec, point, box };
        }
        if (overlap === 0 && outside === 0) break;
      }

      if (outsideArea(best.box, labelViewport) > 0) {
        best = clampPlacedLabel(best, labelViewport);
      }
      placed.set(item.node.id, best);
      occupied.push(expandRect(best.box, LABEL_COLLISION_PADDING));
    });

  return placed;
}

function createLabelCandidates(spec: LabelSpec, layoutType: string, center: Point): LabelPoint[] {
  const positions = orderedLabelPositions(spec.node, spec.position, layoutType, center);
  const candidates: LabelPoint[] = [];
  for (let extraOffset = 0; extraOffset <= 180; extraOffset += 12) {
    positions.forEach((position) => {
      candidates.push(getLabelPoint(spec.node, position, spec.offset + extraOffset));
    });
  }
  return candidates;
}

function orderedLabelPositions(
  node: PublicLayoutNode,
  configuredPosition: string,
  layoutType: string,
  center: Point
): LabelPosition[] {
  const radialPosition = outwardLabelPosition(node, center);
  const preferred = isLabelPosition(configuredPosition) ? configuredPosition : radialPosition;
  const primary = layoutType === 'arc' ? preferred : radialPosition;
  const secondary = primary === preferred ? radialPosition : preferred;
  const positions: LabelPosition[] = [];
  const candidates: LabelPosition[] = [primary, secondary, 'right', 'left', 'top', 'bottom'];
  candidates.forEach((position) => {
    if (!positions.includes(position)) positions.push(position);
  });
  return positions;
}

function outwardLabelPosition(node: PublicLayoutNode, center: Point): LabelPosition {
  const dx = node.x - center[0];
  const dy = node.y - center[1];
  if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'top' : 'bottom';
}

function textBoxFromLabelPoint(spec: LabelSpec, point: LabelPoint): Rect {
  let x = point.x;
  let y = point.y;
  if (point.align === 'center') x -= spec.width / 2;
  if (point.align === 'right') x -= spec.width;
  if (point.verticalAlign === 'middle') y -= spec.height / 2;
  if (point.verticalAlign === 'bottom') y -= spec.height;
  return { x, y, width: spec.width, height: spec.height };
}

function clampPlacedLabel(label: PlacedLabel, viewport: Rect): PlacedLabel {
  const clampedBox = {
    ...label.box,
    x: Math.min(Math.max(label.box.x, viewport.x), viewport.x + viewport.width - label.box.width),
    y: Math.min(Math.max(label.box.y, viewport.y), viewport.y + viewport.height - label.box.height)
  };
  const dx = clampedBox.x - label.box.x;
  const dy = clampedBox.y - label.box.y;
  return {
    ...label,
    point: {
      ...label.point,
      x: label.point.x + dx,
      y: label.point.y + dy
    },
    box: clampedBox
  };
}

function measureText(text: string, fontSize: number, lineHeight: number): { width: number; height: number } {
  const lines = text.split('\n');
  const maxLength = Math.max(...lines.map((line) => line.length), 1);
  return {
    width: maxLength * fontSize * 0.62,
    height: lines.length * lineHeight
  };
}

function circleBox(node: PublicLayoutNode, radius: number): Rect {
  return {
    x: node.x - radius,
    y: node.y - radius,
    width: radius * 2,
    height: radius * 2
  };
}

function graphCenter(renderNodes: RenderNode[]): Point {
  if (!renderNodes.length) return [0, 0];
  return [
    renderNodes.reduce((sum, item) => sum + item.node.x, 0) / renderNodes.length,
    renderNodes.reduce((sum, item) => sum + item.node.y, 0) / renderNodes.length
  ];
}

function distanceFromCenter(node: PublicLayoutNode, center: Point): number {
  return Math.hypot(node.x - center[0], node.y - center[1]);
}

function expandRect(rect: Rect, padding: number): Rect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2
  };
}

function overlapArea(rect: Rect, others: Rect[]): number {
  return others.reduce((sum, other) => sum + intersectArea(rect, other), 0);
}

function intersectArea(left: Rect, right: Rect): number {
  const width = Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x);
  const height = Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y);
  return width > 0 && height > 0 ? width * height : 0;
}

function outsideArea(rect: Rect, bounds: Rect): number {
  const horizontal = Math.max(bounds.x - rect.x, 0) + Math.max(rect.x + rect.width - (bounds.x + bounds.width), 0);
  const vertical = Math.max(bounds.y - rect.y, 0) + Math.max(rect.y + rect.height - (bounds.y + bounds.height), 0);
  return horizontal * rect.height + vertical * rect.width;
}

function formatLabel(formatter: unknown, node: PublicLayoutNode): unknown {
  if (typeof formatter === 'function') {
    return (formatter as (params: { data: PublicLayoutNode; name: string; value: unknown }) => unknown)({
      data: node,
      name: node.name,
      value: node.value
    });
  }
  if (typeof formatter === 'string') {
    return formatter.replace(/\{b\}/g, node.name).replace(/\{c\}/g, String(node.value ?? ''));
  }
  return node.name;
}

function readNodeSize(
  seriesModel: GraphSeriesModel,
  data: SeriesData,
  node: PublicLayoutNode,
  dataIndex: number,
  defaultNodeSize: NodeSizeResolver
): number {
  const symbolSize =
    node.symbolSize
    ?? node.size
    ?? data.getItemVisual(dataIndex, 'symbolSize')
    ?? seriesModel.get('symbolSize');

  if (symbolSize == null) return defaultNodeSize(node);
  if (typeof symbolSize === 'function') {
    return finiteNumber((symbolSize as (node: PublicLayoutNode, dataIndex: number) => unknown)(node, dataIndex), DEFAULT_NODE_SIZE);
  }
  if (Array.isArray(symbolSize)) {
    return finiteNumber(Math.max(...symbolSize.map((item) => finiteNumber(item, 0))), DEFAULT_NODE_SIZE);
  }
  return finiteNumber(symbolSize, DEFAULT_NODE_SIZE);
}

function readNodeStyle(
  seriesModel: GraphSeriesModel,
  itemModel: EChartsModel,
  data: SeriesData,
  dataIndex: number
): Record<string, unknown> {
  const normal = asRecord(seriesModel.get('itemStyle'));
  const itemStyle = asRecord(itemModel.get('itemStyle'));
  const visualStyle = asRecord(data.getItemVisual(dataIndex, 'style'));
  return {
    fill: itemStyle.color || normal.color || visualStyle.fill || '#5470c6',
    stroke: itemStyle.borderColor || normal.borderColor || '#fff',
    lineWidth: finiteNumber(itemStyle.borderWidth ?? normal.borderWidth, 1),
    opacity: finiteNumber(itemStyle.opacity ?? normal.opacity, 1)
  };
}

function readEdgeStyle(seriesModel: GraphSeriesModel, edge: GraphEdge): Record<string, unknown> {
  const normal = asRecord(seriesModel.get('edgeStyle'));
  const lineStyle = edge.lineStyle || {};
  return {
    stroke: lineStyle.color || normal.color || '#9aa4b2',
    lineWidth: finiteNumber(lineStyle.width ?? normal.width, 1),
    opacity: finiteNumber(lineStyle.opacity ?? normal.opacity, 0.45),
    fill: null
  };
}

function readEdgeAnimation(
  seriesModel: GraphSeriesModel,
  edge: GraphEdge,
  edgeIndex: number
): EdgeAnimationConfig {
  const animationOption = edge.edgeAnimation ?? seriesModel.get('edgeAnimation');
  const fallbackToEnterAnimation = animationOption == null;
  const resolvedAnimationOption = fallbackToEnterAnimation ? seriesModel.get('enterAnimation') : animationOption;
  return readEnterAnimation(seriesModel, edgeIndex, resolvedAnimationOption);
}

function readEnterAnimation(
  seriesModel: GraphSeriesModel,
  itemIndex: number,
  animationOption = seriesModel.get('enterAnimation')
): EnterAnimationConfig {
  if (seriesModel.get('animation') === false || animationOption === false) {
    return createDisabledEdgeAnimation();
  }

  const option = animationOption == null || animationOption === true ? {} : asRecord(animationOption);
  if (option.show === false || option.enabled === false) {
    return createDisabledEdgeAnimation();
  }

  const baseDelay = resolveAnimationNumber(option.delay ?? seriesModel.get('animationDelay'), itemIndex, itemIndex, 0);
  const stagger = resolveAnimationNumber(option.stagger, itemIndex, itemIndex, 0);
  return {
    enabled: true,
    duration: resolveAnimationNumber(option.duration ?? seriesModel.get('animationDuration'), itemIndex, itemIndex, 600),
    delay: baseDelay + itemIndex * stagger,
    easing: resolveAnimationEasing(option.easing ?? seriesModel.get('animationEasing'))
  };
}

function readNodeEnterAnimationEnd(seriesModel: GraphSeriesModel, nodeCount: number): number {
  let end = 0;
  for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex += 1) {
    const animation = readEnterAnimation(seriesModel, nodeIndex);
    if (animation.enabled) {
      end = Math.max(end, animation.delay + animation.duration);
    }
  }
  return end;
}

function readGraphEnterAnimationEnd(
  seriesModel: GraphSeriesModel,
  nodeCount: number,
  edges: GraphEdge[]
): number {
  let end = readNodeEnterAnimationEnd(seriesModel, nodeCount);
  edges.forEach((edge, edgeIndex) => {
    const animation = readEdgeAnimation(seriesModel, edge, edgeIndex);
    if (animation.enabled) {
      end = Math.max(end, animation.delay + animation.duration);
    }
  });
  return end;
}

function readGraphEnterAnimation(
  seriesModel: GraphSeriesModel,
  itemIndex: number,
  enterAnimationEnd: number
): EnterAnimationConfig {
  return syncEnterAnimationEnd(readEnterAnimation(seriesModel, itemIndex), enterAnimationEnd);
}

function syncEnterAnimationEnd(
  animation: EnterAnimationConfig,
  enterAnimationEnd: number
): EnterAnimationConfig {
  if (!animation.enabled || enterAnimationEnd <= 0) return animation;
  return {
    ...animation,
    duration: Math.max(0, enterAnimationEnd - animation.delay)
  };
}

function createDisabledEdgeAnimation(): EdgeAnimationConfig {
  return {
    enabled: false,
    duration: 0,
    delay: 0,
    easing: 'cubicOut'
  };
}

function resolveAnimationNumber(
  value: unknown,
  item: unknown,
  itemIndex: number,
  fallback: number
): number {
  const resolved = typeof value === 'function'
    ? (value as (item: unknown, itemIndex: number) => unknown)(item, itemIndex)
    : value;
  return finiteNumber(resolved, fallback);
}

function resolveAnimationEasing(value: unknown): string {
  return typeof value === 'string' && value ? value : 'cubicOut';
}

function applyEdgeConnectionAnimation(
  element: GraphicElement,
  targetKey: AnimationTargetKey,
  propertyName: 'percent' | 'strokePercent',
  animation: EdgeAnimationConfig
): void {
  if (!animation.enabled) return;

  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const target = animatable[targetKey] || {};
  target[propertyName] = 0;
  animatable[targetKey] = target;

  const animator = animatable.animate(targetKey);
  if (!animator) {
    target[propertyName] = 1;
    return;
  }

  const chain = animator.when(animation.duration, {
    [propertyName]: 1
  });
  if (animation.delay > 0) chain.delay?.(animation.delay);
  chain.start(animation.easing);
}

function applyNodeEnterAnimation(element: GraphicElement, size: number, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;

  const animatable = element as AnimatableGraphicElement;
  if (typeof animatable.animate !== 'function') return;

  const shape = animatable.shape || {};
  const style = animatable.style || {};
  const radius = finiteNumber(shape.r, size / 2);
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

function setGraphicShape(element: GraphicElement, shape: Record<string, unknown>): void {
  const target = element as GraphicElement & {
    shape?: Record<string, unknown>;
    attr?: (keyOrObj: unknown, value?: unknown) => void;
    setShape?: (shape: Record<string, unknown>) => void;
  };
  const next = {
    ...asRecord(target.shape),
    ...shape
  };
  if (typeof target.setShape === 'function') {
    target.setShape(next);
  } else if (typeof target.attr === 'function') {
    target.attr('shape', next);
  } else {
    target.shape = next;
  }
}

function setGraphicStyle(element: GraphicElement, style: Record<string, unknown>): void {
  const target = element as GraphicElement & {
    style?: Record<string, unknown>;
    attr?: (keyOrObj: unknown, value?: unknown) => void;
    setStyle?: (style: Record<string, unknown>) => void;
  };
  const next = {
    ...asRecord(target.style),
    ...style
  };
  if (typeof target.setStyle === 'function') {
    target.setStyle(next);
  } else if (typeof target.attr === 'function') {
    target.attr('style', next);
  } else {
    target.style = next;
  }
}

function replaceGraphicStyle(element: GraphicElement, style: Record<string, unknown>): void {
  const target = element as GraphicElement & {
    style?: Record<string, unknown>;
    attr?: (keyOrObj: unknown, value?: unknown) => void;
    setStyle?: (style: Record<string, unknown>) => void;
  };
  const next = cloneRecord(style);
  removeMissingStyleKeys(target.style, next);
  if (typeof target.setStyle === 'function') {
    target.setStyle(next);
  } else if (typeof target.attr === 'function') {
    target.attr('style', next);
  } else {
    target.style = next;
  }
}

function removeMissingStyleKeys(current: unknown, next: Record<string, unknown>): void {
  if (!current || typeof current !== 'object' || Array.isArray(current)) return;
  const style = current as Record<string, unknown>;
  Object.keys(style).forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(next, key)) delete style[key];
  });
}

function cloneStyle(element: GraphicElement): Record<string, unknown> {
  return cloneRecord(asRecord((element as { style?: unknown }).style));
}

function cloneRecord(record: Record<string, unknown>): Record<string, unknown> {
  return {
    ...record
  };
}

function setGraphicIgnore(element: GraphicElement, ignore: boolean): void {
  const target = element as GraphicElement & {
    ignore?: boolean;
    attr?: (keyOrObj: unknown, value?: unknown) => void;
  };
  if (typeof target.attr === 'function') {
    target.attr('ignore', ignore);
  } else {
    target.ignore = ignore;
  }
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function createValueNodeSizeResolver(nodes: unknown[]): NodeSizeResolver {
  const values = nodes
    .map((node) => toNumericValue(readNodeValue(node)))
    .filter((value): value is number => value != null);
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 0;

  if (!values.length || minValue === maxValue) {
    return () => DEFAULT_NODE_SIZE;
  }

  return (node) => {
    const value = toNumericValue(readNodeValue(node));
    if (value == null) return DEFAULT_NODE_SIZE;
    const ratio = (value - minValue) / (maxValue - minValue);
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    return DEFAULT_MIN_VALUE_NODE_SIZE
      + clampedRatio * (DEFAULT_MAX_VALUE_NODE_SIZE - DEFAULT_MIN_VALUE_NODE_SIZE);
  };
}

function readNodeValue(node: unknown): unknown {
  return node != null && typeof node === 'object' ? (node as { value?: unknown }).value : undefined;
}

function toNumericValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const numeric = toNumericValue(item);
      if (numeric != null) return numeric;
    }
  }
  return undefined;
}

function isLabelPosition(value: unknown): value is LabelPosition {
  return value === 'top' || value === 'bottom' || value === 'left' || value === 'right';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export const __test__ = {
  stableSerialize,
  readGraphOption,
  readLayoutOptions,
  createGraphRenderSignature,
  omitFisheyeOption,
  drawGraph,
  mapGraphRenderState,
  shouldAbortGraphRender,
  formatNodeValue,
  installGraphHover,
  isGraphHoverTarget,
  createHoverAdjacency,
  applyEdgeHover,
  applyNodeHover,
  applyHoverStyles,
  resetGraphHover,
  applyEdgeHoverStyle,
  applyGraphElementStyle,
  transitionGraphicStyle,
  createStyleTransitionTarget,
  styleTransitionFallbackValue,
  updateFisheyeRenderState,
  applyFisheye,
  resetFisheye,
  updateFisheyeEdge,
  createLabelSpec,
  getLabelPoint,
  placeLabels,
  clampPlacedLabel,
  graphCenter,
  readEnterAnimation,
  applyEdgeConnectionAnimation,
  applyNodeEnterAnimation,
  applyFadeEnterAnimation,
  animateGraphicProperty,
  setGraphicShape,
  setGraphicStyle,
  replaceGraphicStyle,
  removeMissingStyleKeys,
  setGraphicIgnore,
  createValueNodeSizeResolver,
  readNodeValue,
  toNumericValue
};
