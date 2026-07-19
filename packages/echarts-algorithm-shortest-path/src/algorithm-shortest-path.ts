import * as echarts from 'echarts/lib/echarts';

import {
  SHORTEST_PATH_LABELS,
  createShortestPathDataSource,
  finiteNumber,
  resolveShortestPathLayout
} from './layout.js';
import type {
  ShortestPathEdgeState,
  ShortestPathLayoutEdge,
  ShortestPathLayoutNode,
  ShortestPathLayoutOption,
  ShortestPathLayoutResult,
  ShortestPathNodeState
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
  dataType?: unknown;
  initData(source: unknown[]): void;
  count(): number;
  getItemModel(index: number): EChartsModel;
  getItemVisual(dataIndex: number, key: string): unknown;
  getItemLayout(dataIndex: number): unknown;
  setItemLayout(dataIndex: number, layout: [number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface ShortestPathSeriesModel extends EChartsModel {
  option?: ShortestPathLayoutOption;
  seriesIndex: number;
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
    getECData(element: GraphicElement): {
      dataIndex?: number;
      dataType?: unknown;
      seriesIndex?: number;
      ssrType?: string;
    };
    getLayoutRect(params: unknown, container: { width: number; height: number }): ViewRect;
  };
  List: new (dimensions: unknown, host: ShortestPathSeriesModel) => SeriesData;
  graphic: {
    Circle: new (options: GraphicElementOptions) => GraphicElement;
    Group: new () => GraphicGroup;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Polygon?: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
  };
}

interface ShortestPathChartView {
  group: GraphicGroup;
}

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'padding',
  'algorithm',
  'start',
  'target',
  'currentStep',
  'progress',
  'maxNodes',
  'maxEdges',
  'maxFrames',
  'nodeRadius',
  'edgeWidth',
  'directed'
] as const satisfies ReadonlyArray<Extract<keyof ShortestPathLayoutOption, string>>;

const layerZ = {
  edge: 1,
  edgeLabel: 2,
  node: 6,
  label: 8,
  step: 9
} as const;

const nodeStateColors: Record<ShortestPathNodeState, string> = {
  default: '#e2e8f0',
  start: '#22c55e',
  target: '#ef4444',
  frontier: '#38bdf8',
  visited: '#64748b',
  current: '#f59e0b',
  path: '#8b5cf6'
};

const edgeStateColors: Record<ShortestPathEdgeState, string> = {
  default: '#94a3b8',
  active: '#f59e0b',
  relaxed: '#38bdf8',
  path: '#8b5cf6'
};

echartsHost.extendSeriesModel({
  type: 'series.algorithmShortestPath',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'fill',

  getInitialData(this: ShortestPathSeriesModel, option: ShortestPathLayoutOption) {
    const source = createShortestPathDataSource(option);
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  getTooltipPosition(this: ShortestPathSeriesModel, dataIndex: number) {
    const layout = this.getData().getItemLayout(dataIndex);
    return Array.isArray(layout) ? layout : undefined;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '94%',
    height: '84%',
    padding: {
      top: 48,
      right: 44,
      bottom: 64,
      left: 44
    },
    nodes: [],
    edges: [],
    links: [],
    algorithm: 'dijkstra',
    start: null,
    target: null,
    currentStep: 0,
    progress: null,
    maxNodes: 96,
    maxEdges: 240,
    maxFrames: 8000,
    nodeRadius: 18,
    edgeWidth: 2,
    directed: false,
    edgeStyle: {
      color: '#94a3b8',
      opacity: 0.58
    },
    nodeStyle: {
      color: '#e2e8f0',
      borderColor: '#ffffff',
      borderWidth: 2,
      opacity: 1
    },
    stateStyle: {
      start: { color: '#22c55e' },
      target: { color: '#ef4444' },
      frontier: { color: '#38bdf8' },
      visited: { color: '#64748b' },
      current: { color: '#f59e0b' },
      path: { color: '#8b5cf6' },
      activeEdge: { color: '#f59e0b' },
      relaxedEdge: { color: '#38bdf8' },
      pathEdge: { color: '#8b5cf6' }
    },
    edgeLabel: {
      show: true,
      color: '#475569',
      fontSize: 11,
      fontWeight: 700
    },
    label: {
      show: true,
      color: '#0f172a',
      fontSize: 12,
      fontWeight: 800,
      formatter: '{b}'
    },
    distanceLabel: {
      show: true,
      color: '#64748b',
      fontSize: 10,
      fontWeight: 700
    },
    stepLabel: {
      show: true,
      color: '#0f172a',
      mutedColor: '#64748b',
      fontSize: 13,
      fontWeight: 760
    },
    tooltip: {
      trigger: 'item'
    }
  }
});

echartsHost.extendChartView({
  type: 'algorithmShortestPath',

  render(this: ShortestPathChartView, seriesModel: ShortestPathSeriesModel, ecModel: unknown, api: EChartsApi) {
    const group = this.group;
    group.removeAll();

    try {
      const rect = echartsHost.helper.getLayoutRect(seriesModel.getBoxLayoutParams(), {
        width: api.getWidth(),
        height: api.getHeight()
      });
      const layout = resolveShortestPathLayout(readLayoutOption(seriesModel, rect));
      drawShortestPath(echartsHost, group, seriesModel, layout, rect);
    } catch (error) {
      console.error('[algorithm-shortest-path] render failed', error);
    }
  },

  remove(this: ShortestPathChartView) {
    this.group.removeAll();
  },

  dispose(this: ShortestPathChartView) {
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: ShortestPathSeriesModel, rect: ViewRect): ShortestPathLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: ShortestPathLayoutOption = {
    nodes: Array.isArray(option.nodes) ? option.nodes : (Array.isArray(option.data) ? option.data : []),
    edges: Array.isArray(option.edges) ? option.edges : option.links,
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

function drawShortestPath(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: ShortestPathSeriesModel,
  layout: ShortestPathLayoutResult,
  rect: ViewRect
): void {
  const chartGroup = new echartsInstance.graphic.Group();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  drawEdges(echartsInstance, chartGroup, seriesModel, layout);
  drawNodes(echartsInstance, chartGroup, seriesModel, layout, rect);
  drawStepLabel(echartsInstance, chartGroup, seriesModel, layout);
  group.add(chartGroup);
}

function drawEdges(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: ShortestPathSeriesModel,
  layout: ShortestPathLayoutResult
): void {
  const edgeLabelModel = seriesModel.getModel('edgeLabel');

  layout.edges.forEach((edge) => {
    const edgeStyle = readEdgeStyle(seriesModel, edge);
    group.add(new echartsInstance.graphic.Line({
      shape: {
        x1: edge.x1,
        y1: edge.y1,
        x2: edge.x2,
        y2: edge.y2
      },
      style: edgeStyle,
      silent: Boolean(seriesModel.get('silent')),
      z2: edge.state === 'path' ? layerZ.edge + 2 : layerZ.edge
    }));

    const arrow = createEdgeArrow(echartsInstance, edge, edgeStyle, Boolean(seriesModel.get('silent')));
    if (arrow) group.add(arrow);

    if (edgeLabelModel.get('show') === false) return;
    group.add(new echartsInstance.graphic.Text({
      style: {
        x: edge.labelX,
        y: edge.labelY - 7,
        text: formatWeight(edge.weight),
        fill: edgeLabelModel.get('color') || '#475569',
        fontSize: finiteNumber(edgeLabelModel.get('fontSize'), 11),
        fontWeight: edgeLabelModel.get('fontWeight') || 700,
        align: 'center',
        verticalAlign: 'middle'
      },
      silent: true,
      z2: layerZ.edgeLabel
    }));
  });
}

function createEdgeArrow(
  echartsInstance: EChartsHost,
  edge: ShortestPathLayoutEdge,
  edgeStyle: Record<string, unknown>,
  silent: boolean
): GraphicElement | null {
  if (!edge.directed || !echartsInstance.graphic.Polygon) return null;
  const dx = edge.x2 - edge.x1;
  const dy = edge.y2 - edge.y1;
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length <= 0) return null;
  const ux = dx / length;
  const uy = dy / length;
  const px = -uy;
  const py = ux;
  const lineWidth = finiteNumber(edgeStyle.lineWidth, 2);
  const arrowLength = Math.max(8, lineWidth * 3.5);
  const arrowHalfWidth = Math.max(4, lineWidth * 2.1);
  const tipX = edge.x2;
  const tipY = edge.y2;
  const baseX = tipX - ux * arrowLength;
  const baseY = tipY - uy * arrowLength;

  return new echartsInstance.graphic.Polygon({
    shape: {
      points: [
        [tipX, tipY],
        [baseX + px * arrowHalfWidth, baseY + py * arrowHalfWidth],
        [baseX - px * arrowHalfWidth, baseY - py * arrowHalfWidth]
      ]
    },
    style: {
      fill: edgeStyle.stroke || '#94a3b8',
      opacity: edgeStyle.opacity ?? 0.78
    },
    silent,
    z2: edge.state === 'path' ? layerZ.edge + 3 : layerZ.edge + 1
  });
}

function drawNodes(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: ShortestPathSeriesModel,
  layout: ShortestPathLayoutResult,
  rect: ViewRect
): void {
  const data = seriesModel.getData();
  const labelModel = seriesModel.getModel('label');
  const distanceLabelModel = seriesModel.getModel('distanceLabel');

  layout.nodes.forEach((node) => {
    const itemModel = node.dataIndex >= 0 && node.dataIndex < data.count() ? data.getItemModel(node.dataIndex) : null;
    const circle = new echartsInstance.graphic.Circle({
      shape: {
        cx: node.x,
        cy: node.y,
        r: node.radius
      },
      style: readNodeStyle(data, seriesModel, itemModel, node),
      silent: Boolean(seriesModel.get('silent')),
      z2: layerZ.node
    });

    if (node.dataIndex >= 0 && node.dataIndex < data.count()) {
      data.setItemLayout(node.dataIndex, [rect.x + node.x, rect.y + node.y]);
      data.setItemGraphicEl(node.dataIndex, circle);
      bindTooltipData(echartsInstance, seriesModel, data, node.dataIndex, circle);
    }
    group.add(circle);

    if (labelModel.get('show') !== false) {
      group.add(new echartsInstance.graphic.Text({
        style: {
          x: node.x,
          y: node.y,
          text: formatLabel(labelModel.get('formatter'), node),
          fill: labelModel.get('color') || '#0f172a',
          fontSize: finiteNumber(labelModel.get('fontSize'), 12),
          fontWeight: labelModel.get('fontWeight') || 800,
          align: 'center',
          verticalAlign: 'middle'
        },
        silent: true,
        z2: layerZ.label
      }));
    }

    if (distanceLabelModel.get('show') !== false) {
      group.add(new echartsInstance.graphic.Text({
        style: {
          x: node.x,
          y: node.y + node.radius + 12,
          text: node.distanceLabel,
          fill: distanceLabelModel.get('color') || '#64748b',
          fontSize: finiteNumber(distanceLabelModel.get('fontSize'), 10),
          fontWeight: distanceLabelModel.get('fontWeight') || 700,
          align: 'center',
          verticalAlign: 'middle'
        },
        silent: true,
        z2: layerZ.label
      }));
    }
  });
}

function drawStepLabel(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: ShortestPathSeriesModel,
  layout: ShortestPathLayoutResult
): void {
  const model = seriesModel.getModel('stepLabel');
  if (model.get('show') === false) return;
  const label = `${SHORTEST_PATH_LABELS[layout.algorithm]} · step ${layout.currentStep}/${layout.maxStep}`;
  const path = layout.frame.path.length ? `path ${layout.frame.path.join(' -> ')}` : `${layout.start} -> ${layout.target}`;
  group.add(new echartsInstance.graphic.Text({
    style: {
      x: layout.plot.left,
      y: Math.max(16, layout.plot.top - 30),
      text: label,
      fill: model.get('color') || '#0f172a',
      fontSize: finiteNumber(model.get('fontSize'), 13),
      fontWeight: model.get('fontWeight') || 760,
      align: 'left',
      verticalAlign: 'middle'
    },
    silent: true,
    z2: layerZ.step
  }));
  group.add(new echartsInstance.graphic.Text({
    style: {
      x: layout.plot.right,
      y: Math.max(16, layout.plot.top - 30),
      text: path,
      fill: model.get('mutedColor') || '#64748b',
      fontSize: Math.max(10, finiteNumber(model.get('fontSize'), 13) - 1),
      fontWeight: 650,
      align: 'right',
      verticalAlign: 'middle'
    },
    silent: true,
    z2: layerZ.step
  }));
  if (!layout.frame.description) return;
  group.add(new echartsInstance.graphic.Text({
    style: {
      x: layout.plot.left,
      y: Math.max(34, layout.plot.top - 10),
      text: ellipsize(layout.frame.description, 96),
      fill: model.get('mutedColor') || '#64748b',
      fontSize: Math.max(10, finiteNumber(model.get('fontSize'), 13) - 1),
      fontWeight: 600,
      align: 'left',
      verticalAlign: 'middle'
    },
    silent: true,
    z2: layerZ.step
  }));
}

function readNodeStyle(
  data: SeriesData,
  seriesModel: ShortestPathSeriesModel,
  itemModel: EChartsModel | null | undefined,
  node: ShortestPathLayoutNode
): Record<string, unknown> {
  const nodeStyleModel = itemModel?.getModel('itemStyle') || seriesModel.getModel('nodeStyle');
  const stateStyleModel = seriesModel.getModel(['stateStyle', node.state]);
  const dataStyle = data.getItemVisual(node.dataIndex, 'style');
  const visualColor = data.getItemVisual(node.dataIndex, 'color');
  const fill = stateStyleModel.get('color')
    || (isPlainObject(dataStyle) ? dataStyle.fill || dataStyle.color : undefined)
    || nodeStyleModel.get('color')
    || visualColor
    || nodeStateColors[node.state];

  return {
    fill,
    opacity: finiteNumber(nodeStyleModel.get('opacity'), 1),
    stroke: nodeStyleModel.get('borderColor') || '#ffffff',
    lineWidth: finiteNumber(nodeStyleModel.get('borderWidth'), 2)
  };
}

function readEdgeStyle(
  seriesModel: ShortestPathSeriesModel,
  edge: ShortestPathLayoutEdge
): Record<string, unknown> {
  const edgeStyleModel = seriesModel.getModel('edgeStyle');
  const stateKey = edge.state === 'path' ? 'pathEdge' : edge.state === 'relaxed' ? 'relaxedEdge' : edge.state === 'active' ? 'activeEdge' : '';
  const stateStyleModel = stateKey ? seriesModel.getModel(['stateStyle', stateKey]) : null;
  const stroke = stateStyleModel?.get('color')
    || edgeStyleModel.get('color')
    || edgeStateColors[edge.state];
  const baseWidth = finiteNumber(
    edgeStyleModel.get('width') ?? edgeStyleModel.get('lineWidth'),
    finiteNumber(seriesModel.get('edgeWidth'), 2)
  );
  return {
    stroke,
    opacity: edge.state === 'path' ? 0.98 : finiteNumber(edgeStyleModel.get('opacity'), 0.58),
    lineWidth: edge.state === 'path' ? baseWidth + 1.6 : edge.state === 'active' || edge.state === 'relaxed' ? baseWidth + 0.8 : baseWidth,
    lineDash: edge.directed ? undefined : normalizeDash(edgeStyleModel.get('type'))
  };
}

function bindTooltipData(
  echartsInstance: EChartsHost,
  seriesModel: ShortestPathSeriesModel,
  data: SeriesData,
  dataIndex: number,
  element: GraphicElement
): void {
  const ecData = echartsInstance.helper.getECData(element);
  ecData.dataIndex = dataIndex;
  ecData.dataType = data.dataType || 'algorithmShortestPath';
  ecData.seriesIndex = seriesModel.seriesIndex;
  ecData.ssrType = 'chart';
}

function formatLabel(formatter: unknown, node: ShortestPathLayoutNode): string {
  if (typeof formatter === 'function') {
    return String(formatter({
      data: node.raw,
      name: node.name,
      value: node.value,
      distance: node.distance,
      state: node.state
    }));
  }
  if (typeof formatter === 'string') {
    return formatter
      .replace(/\{b\}/g, node.name)
      .replace(/\{c\}/g, String(node.value))
      .replace(/\{distance\}/g, node.distanceLabel);
  }
  return node.name;
}

function formatWeight(value: number): string {
  if (!Number.isFinite(value)) return '∞';
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function normalizeDash(value: unknown): number[] | undefined {
  if (Array.isArray(value)) return value.map((item) => finiteNumber(item, NaN)).filter(Number.isFinite);
  if (value === 'dashed') return [6, 4];
  if (value === 'dotted') return [2, 4];
  return undefined;
}

function ellipsize(value: string, maxChars: number): string {
  const text = String(value);
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(1, maxChars - 1))}...`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export const __test__ = {
  createShortestPathDataSource,
  drawShortestPath,
  formatLabel,
  readLayoutOption,
  resolveShortestPathLayout
};
