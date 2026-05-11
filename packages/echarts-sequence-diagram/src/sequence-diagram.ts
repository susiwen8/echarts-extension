import * as echarts from 'echarts/lib/echarts';
import { clearAliveRender, installElementHover, renderAlive, setAliveRenderKey } from '@echarts-extension/layout-core';
import type { AliveRenderState, ElementHoverController, ElementHoverItem, ElementHoverOptions } from '@echarts-extension/layout-core';

import {
  collectSequenceMessageData,
  resolveSequenceDiagramLayout
} from './layout.js';
import type {
  SequenceActivationLayout,
  SequenceConstraintLayout,
  SequenceDiagramLayoutOption,
  SequenceDiagramLayoutResult,
  SequenceFragmentLayout,
  SequenceMessageLayout,
  SequenceMessageType,
  SequenceNoteLayout,
  SequenceParticipantLayout,
  SequencePoint
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
  getItemVisual(dataIndex: number, key: string): unknown;
  getItemLayout(dataIndex: number): unknown;
  setItemLayout(dataIndex: number, layout: [number, number]): void;
  setItemGraphicEl(dataIndex: number, element: GraphicElement): void;
}

interface SequenceDiagramSeriesModel extends EChartsModel {
  option?: SequenceDiagramLayoutOption;
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
  List: new (dimensions: unknown, host: SequenceDiagramSeriesModel) => SeriesData;
  graphic: {
    Group: new () => GraphicGroup;
    Line: new (options: GraphicElementOptions) => GraphicElement;
    Circle?: new (options: GraphicElementOptions) => GraphicElement;
    Rect: new (options: GraphicElementOptions) => GraphicElement;
    Text: new (options: GraphicElementOptions) => GraphicElement;
    Polyline?: new (options: GraphicElementOptions) => GraphicElement;
    Polygon?: new (options: GraphicElementOptions) => GraphicElement;
    makePath?: (path: string, options: GraphicElementOptions) => GraphicElement;
  };
}

interface SequenceDiagramChartView {
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

const echartsHost = echarts as unknown as EChartsHost;
const optionKeys = [
  'padding',
  'headerHeight',
  'headerWidth',
  'messageGap',
  'selfLoopWidth',
  'selfLoopHeight',
  'activationWidth',
  'activationMargin'
] as const satisfies ReadonlyArray<Extract<keyof SequenceDiagramLayoutOption, string>>;

const layerZ = {
  fragment: 0,
  lifeline: 1,
  activation: 2,
  message: 6,
  arrow: 7,
  label: 8,
  constraint: 8,
  note: 9,
  header: 9
} as const;

echartsHost.extendSeriesModel({
  type: 'series.sequenceDiagram',

  visualStyleAccessPath: 'itemStyle',
  visualDrawType: 'stroke',

  getInitialData(this: SequenceDiagramSeriesModel, option: SequenceDiagramLayoutOption) {
    const source = collectSequenceMessageData(option);
    const dimensions = echartsHost.helper.createDimensions(source, {
      coordDimensions: ['value']
    });
    const list = new echartsHost.List(dimensions, this);
    list.initData(source);
    return list;
  },

  getTooltipPosition(this: SequenceDiagramSeriesModel, dataIndex: number) {
    const layout = this.getData().getItemLayout(dataIndex);
    return Array.isArray(layout) ? layout : undefined;
  },

  defaultOption: {
    left: 'center',
    top: 'center',
    width: '94%',
    height: '86%',
    padding: 40,
    headerHeight: 34,
    headerWidth: 112,
    messageGap: 48,
    selfLoopWidth: 56,
    selfLoopHeight: 22,
    activationWidth: 12,
    activationMargin: 12,
    enterAnimation: true,
    participantStyle: {
      color: '#f8fafc',
      borderColor: '#334155',
      borderWidth: 1.2,
      borderRadius: 4
    },
    lifelineStyle: {
      color: '#94a3b8',
      width: 1,
      type: 'dashed',
      opacity: 0.9
    },
    activationStyle: {
      color: '#e0f2fe',
      borderColor: '#0284c7',
      borderWidth: 1,
      opacity: 0.92
    },
    noteStyle: {
      color: '#fef9c3',
      borderColor: '#ca8a04',
      borderWidth: 1,
      opacity: 0.96
    },
    fragmentStyle: {
      color: 'rgba(248, 250, 252, 0.28)',
      borderColor: '#64748b',
      borderWidth: 1,
      opacity: 1
    },
    constraintStyle: {
      color: '#475569',
      width: 1.2,
      opacity: 0.9,
      type: 'dashed'
    },
    lineStyle: {
      color: '#334155',
      width: 1.6,
      opacity: 1
    },
    label: {
      show: true,
      color: '#0f172a',
      fontSize: 12,
      fontWeight: 600,
      formatter: '{b}'
    },
    participantLabel: {
      show: true,
      color: '#0f172a',
      fontSize: 12,
      fontWeight: 700,
      formatter: '{b}'
    },
    emphasis: {
      itemStyle: {
        opacity: 1,
        shadowBlur: 8,
        shadowColor: 'rgba(14, 165, 233, 0.24)'
      }
    },
    tooltip: {
      trigger: 'item'
    }
  }
});

echartsHost.extendChartView({
  type: 'sequenceDiagram',

  render(this: SequenceDiagramChartView, seriesModel: SequenceDiagramSeriesModel, ecModel: unknown, api: EChartsApi) {
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
      const layout = resolveSequenceDiagramLayout(readLayoutOption(seriesModel, rect));
      if (this.__renderToken !== renderToken) return;
      const { hoverItems } = renderAlive(this, echartsHost, group, seriesModel, (targetGroup, targetSeriesModel) => (
        drawSequenceDiagram(echartsHost, targetGroup, targetSeriesModel, layout, rect)
      ));
      this.__hoverController = installElementHover(hoverItems, {
        zrender: api.getZr?.()
      });
    } catch (error) {
      console.error('[sequenceDiagram] render failed', error);
    }
  },

  remove(this: SequenceDiagramChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  },

  dispose(this: SequenceDiagramChartView) {
    this.__renderToken = null;
    this.__hoverController?.dispose();
    this.__hoverController = undefined;
    clearAliveRender(this);
    this.group.removeAll();
  }
});

function readLayoutOption(seriesModel: SequenceDiagramSeriesModel, rect: ViewRect): SequenceDiagramLayoutOption {
  const option = seriesModel.option || {};
  const layoutOption: SequenceDiagramLayoutOption = {
    dsl: typeof option.dsl === 'string' ? option.dsl : undefined,
    source: typeof option.source === 'string' ? option.source : undefined,
    width: rect.width,
    height: rect.height
  };
  if (Array.isArray(option.participants)) layoutOption.participants = option.participants;
  if (Array.isArray(option.messages)) layoutOption.messages = option.messages;
  else if (Array.isArray(option.data)) layoutOption.data = option.data;
  if (Array.isArray(option.activations)) layoutOption.activations = option.activations;
  if (Array.isArray(option.notes)) layoutOption.notes = option.notes;
  if (Array.isArray(option.fragments)) layoutOption.fragments = option.fragments;
  if (Array.isArray(option.constraints)) layoutOption.constraints = option.constraints;

  optionKeys.forEach((key) => {
    const value = seriesModel.get(key);
    if (value !== undefined && value !== null) layoutOption[key as string] = value;
  });

  return layoutOption;
}

function drawSequenceDiagram(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SequenceDiagramSeriesModel,
  layout: SequenceDiagramLayoutResult,
  rect: ViewRect
): ElementHoverItem[] {
  const chartGroup = new echartsInstance.graphic.Group();
  chartGroup.x = rect.x;
  chartGroup.y = rect.y;

  const participantElements = new Map<string, GraphicElement[]>();
  const hoverItems: ElementHoverItem[] = [];

  const fragmentGroup = new echartsInstance.graphic.Group();
  layout.fragments.forEach((fragment) => {
    drawFragment(echartsInstance, fragmentGroup, seriesModel, fragment);
  });
  chartGroup.add(fragmentGroup);

  const lifelineGroup = new echartsInstance.graphic.Group();
  layout.participants.forEach((participant) => {
    participantElements.set(participant.id, drawParticipant(echartsInstance, lifelineGroup, seriesModel, participant));
  });
  chartGroup.add(lifelineGroup);

  const activationGroup = new echartsInstance.graphic.Group();
  layout.activations.forEach((activation) => {
    const activationElement = drawActivation(echartsInstance, activationGroup, seriesModel, activation);
    const elements = participantElements.get(activation.participantId) || [];
    elements.push(activationElement);
    participantElements.set(activation.participantId, elements);
  });
  chartGroup.add(activationGroup);

  const messageGroup = new echartsInstance.graphic.Group();
  layout.messages.forEach((message, index) => {
    const elements = drawMessage(echartsInstance, messageGroup, seriesModel, message, index);
    bindMessageData(seriesModel, message, rect, elements[0]);
    if (seriesModel.get('silent') !== true && elements.length) hoverItems.push({ elements });
  });
  chartGroup.add(messageGroup);

  const constraintGroup = new echartsInstance.graphic.Group();
  layout.constraints.forEach((constraint) => {
    drawConstraint(echartsInstance, constraintGroup, seriesModel, constraint);
  });
  chartGroup.add(constraintGroup);

  const noteGroup = new echartsInstance.graphic.Group();
  layout.notes.forEach((note) => {
    drawNote(echartsInstance, noteGroup, seriesModel, note);
  });
  chartGroup.add(noteGroup);

  group.add(chartGroup);
  return hoverItems;
}

function drawParticipant(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SequenceDiagramSeriesModel,
  participant: SequenceParticipantLayout
): GraphicElement[] {
  if (participant.kind === 'actor') {
    return drawActorParticipant(echartsInstance, group, seriesModel, participant);
  }

  const elements: GraphicElement[] = [];
  const headerStyle = readParticipantStyle(seriesModel, participant);
  const header = new echartsInstance.graphic.Rect({
    shape: {
      x: participant.header.x,
      y: participant.header.y,
      width: participant.header.width,
      height: participant.header.height,
      r: finiteNumber(headerStyle.borderRadius, 4)
    },
    style: {
      fill: headerStyle.color,
      stroke: headerStyle.borderColor,
      lineWidth: headerStyle.borderWidth,
      opacity: headerStyle.opacity
    },
    silent: seriesModel.get('silent') === true,
    z2: layerZ.header
  });
  setAliveRenderKey(header, `sequence-participant-header:${participant.id}`);
  group.add(header);
  elements.push(header);

  const labelModel = seriesModel.getModel('participantLabel');
  if (labelModel.get('show') !== false) {
    const label = new echartsInstance.graphic.Text({
      style: {
        x: participant.x,
        y: participant.header.y + participant.header.height / 2,
        text: formatParticipantLabel(labelModel.get('formatter'), participant),
        width: Math.max(24, participant.header.width - 12),
        overflow: 'truncate',
        ellipsis: '...',
        fill: labelModel.get('color') || '#0f172a',
        fontSize: finiteNumber(labelModel.get('fontSize'), 12),
        fontWeight: labelModel.get('fontWeight') || 700,
        align: 'center',
        verticalAlign: 'middle'
      },
      silent: true,
      z2: layerZ.header
    });
    setAliveRenderKey(label, `sequence-participant-label:${participant.id}`);
    group.add(label);
    elements.push(label);
  }

  const lifeline = new echartsInstance.graphic.Line({
    shape: participant.lifeline,
    style: readLifelineStyle(seriesModel),
    silent: true,
    z2: layerZ.lifeline
  });
  setAliveRenderKey(lifeline, `sequence-lifeline:${participant.id}`);
  group.add(lifeline);
  elements.push(lifeline);

  return elements;
}

function drawActorParticipant(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SequenceDiagramSeriesModel,
  participant: SequenceParticipantLayout
): GraphicElement[] {
  const elements: GraphicElement[] = [];
  const style = readParticipantStyle(seriesModel, participant);
  const stroke = style.borderColor || '#334155';
  const lineWidth = finiteNumber(style.borderWidth, 1.2);
  const silent = seriesModel.get('silent') === true;
  const centerX = participant.x;
  const top = participant.header.y + 4;
  const headRadius = Math.max(5, Math.min(8, participant.header.height / 5));
  const headY = top + headRadius;
  const bodyTop = headY + headRadius;
  const bodyBottom = participant.header.y + participant.header.height - 8;
  const armY = bodyTop + 6;

  if (echartsInstance.graphic.Circle) {
    const head = new echartsInstance.graphic.Circle({
      shape: {
        cx: centerX,
        cy: headY,
        r: headRadius
      },
      style: {
        fill: style.color,
        stroke,
        lineWidth,
        opacity: style.opacity
      },
      silent,
      z2: layerZ.header
    });
    setAliveRenderKey(head, `sequence-actor-head:${participant.id}`);
    group.add(head);
    elements.push(head);
  }

  const actorLines = [
    [centerX, bodyTop, centerX, bodyBottom],
    [centerX - 14, armY, centerX + 14, armY],
    [centerX, bodyBottom, centerX - 12, bodyBottom + 10],
    [centerX, bodyBottom, centerX + 12, bodyBottom + 10]
  ];
  actorLines.forEach((lineShape, index) => {
    const line = new echartsInstance.graphic.Line({
      shape: {
        x1: lineShape[0],
        y1: lineShape[1],
        x2: lineShape[2],
        y2: lineShape[3]
      },
      style: {
        stroke,
        lineWidth,
        opacity: style.opacity
      },
      silent,
      z2: layerZ.header
    });
    setAliveRenderKey(line, `sequence-actor-line:${participant.id}:${index}`);
    group.add(line);
    elements.push(line);
  });

  const labelModel = seriesModel.getModel('participantLabel');
  if (labelModel.get('show') !== false) {
    const label = new echartsInstance.graphic.Text({
      style: {
        x: participant.x,
        y: participant.header.y + participant.header.height + 12,
        text: formatParticipantLabel(labelModel.get('formatter'), participant),
        width: Math.max(34, participant.header.width),
        overflow: 'truncate',
        ellipsis: '...',
        fill: labelModel.get('color') || '#0f172a',
        fontSize: finiteNumber(labelModel.get('fontSize'), 12),
        fontWeight: labelModel.get('fontWeight') || 700,
        align: 'center',
        verticalAlign: 'middle'
      },
      silent: true,
      z2: layerZ.header
    });
    setAliveRenderKey(label, `sequence-actor-label:${participant.id}`);
    group.add(label);
    elements.push(label);
  }

  const lifeline = new echartsInstance.graphic.Line({
    shape: participant.lifeline,
    style: readLifelineStyle(seriesModel),
    silent: true,
    z2: layerZ.lifeline
  });
  setAliveRenderKey(lifeline, `sequence-lifeline:${participant.id}`);
  group.add(lifeline);
  elements.push(lifeline);

  return elements;
}

function drawActivation(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SequenceDiagramSeriesModel,
  activation: SequenceActivationLayout
): GraphicElement {
  const style = readActivationStyle(seriesModel, activation);
  const element = new echartsInstance.graphic.Rect({
    shape: {
      x: activation.x,
      y: activation.y,
      width: activation.width,
      height: activation.height,
      r: 2
    },
    style: {
      fill: style.color,
      stroke: style.borderColor,
      lineWidth: style.borderWidth,
      opacity: style.opacity
    },
    silent: seriesModel.get('silent') === true,
    z2: layerZ.activation
  });
  setAliveRenderKey(element, `sequence-activation:${activation.id}`);
  group.add(element);
  return element;
}

function drawMessage(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SequenceDiagramSeriesModel,
  message: SequenceMessageLayout,
  messageIndex: number
): GraphicElement[] {
  const elements: GraphicElement[] = [];
  const style = readMessageLineStyle(seriesModel, message);
  const animation = readEnterAnimation(seriesModel, messageIndex);
  const line = createMessagePath(echartsInstance, message, style, seriesModel.get('silent') === true);
  applyPathEnterAnimation(line, message, animation);
  setAliveRenderKey(line, `sequence-message-line:${message.id}`);
  group.add(line);
  elements.push(line);

  const arrow = createArrowHead(echartsInstance, message, style, seriesModel.get('silent') === true);
  if (arrow) {
    applyFadeEnterAnimation(arrow, animation);
    setAliveRenderKey(arrow, `sequence-message-arrow:${message.id}`);
    group.add(arrow);
    elements.push(arrow);
  }

  if (message.type === 'destroy') {
    const destroyMarker = createDestroyMarker(echartsInstance, message, style, seriesModel.get('silent') === true);
    destroyMarker.forEach((element, markerIndex) => {
      applyFadeEnterAnimation(element, animation);
      setAliveRenderKey(element, `sequence-message-destroy:${message.id}:${markerIndex}`);
      group.add(element);
      elements.push(element);
    });
  }

  const label = createMessageLabel(echartsInstance, seriesModel, message);
  if (label) {
    applyFadeEnterAnimation(label, animation);
    setAliveRenderKey(label, `sequence-message-label:${message.id}`);
    group.add(label);
    elements.push(label);
  }

  return elements;
}

function createMessagePath(
  echartsInstance: EChartsHost,
  message: SequenceMessageLayout,
  style: Record<string, unknown>,
  silent: boolean
): GraphicElement {
  if (message.points.length === 2) {
    const [source, target] = message.points;
    return new echartsInstance.graphic.Line({
      shape: {
        x1: source.x,
        y1: source.y,
        x2: target.x,
        y2: target.y
      },
      style,
      silent,
      z2: layerZ.message
    });
  }

  if (echartsInstance.graphic.Polyline) {
    return new echartsInstance.graphic.Polyline({
      shape: {
        points: message.points.map((point) => [point.x, point.y])
      },
      style,
      silent,
      z2: layerZ.message
    });
  }

  const path = pointsToPath(message.points);
  if (echartsInstance.graphic.makePath) {
    const element = echartsInstance.graphic.makePath(path, {
      style,
      silent,
      z2: layerZ.message
    });
    return element;
  }

  const [source, target] = [message.points[0], message.points[message.points.length - 1]];
  return new echartsInstance.graphic.Line({
    shape: {
      x1: source.x,
      y1: source.y,
      x2: target.x,
      y2: target.y
    },
    style,
    silent,
    z2: layerZ.message
  });
}

function createArrowHead(
  echartsInstance: EChartsHost,
  message: SequenceMessageLayout,
  style: Record<string, unknown>,
  silent: boolean
): GraphicElement | null {
  if (message.type === 'destroy') return null;
  const points = message.points;
  if (points.length < 2 || !echartsInstance.graphic.Polygon) return null;
  const tip = points[points.length - 1];
  const previous = points[points.length - 2];
  const angle = Math.atan2(tip.y - previous.y, tip.x - previous.x);
  const size = message.type === 'return' || message.type === 'async' ? 8 : 9;
  const spread = Math.PI / 7;
  const left = {
    x: tip.x - Math.cos(angle - spread) * size,
    y: tip.y - Math.sin(angle - spread) * size
  };
  const right = {
    x: tip.x - Math.cos(angle + spread) * size,
    y: tip.y - Math.sin(angle + spread) * size
  };
  const openArrow = message.type === 'return' || message.type === 'async';

  return new echartsInstance.graphic.Polygon({
    shape: {
      points: openArrow
        ? [[left.x, left.y], [tip.x, tip.y], [right.x, right.y]]
        : [[tip.x, tip.y], [left.x, left.y], [right.x, right.y]]
    },
    style: {
      fill: openArrow ? 'transparent' : style.stroke,
      stroke: style.stroke,
      lineWidth: finiteNumber(style.lineWidth, 1.6),
      opacity: style.opacity
    },
    silent,
    z2: layerZ.arrow
  });
}

function createDestroyMarker(
  echartsInstance: EChartsHost,
  message: SequenceMessageLayout,
  style: Record<string, unknown>,
  silent: boolean
): GraphicElement[] {
  const tip = message.points[message.points.length - 1];
  if (!tip) return [];
  const size = 7;
  const markerStyle = {
    stroke: style.stroke,
    lineWidth: Math.max(1.4, finiteNumber(style.lineWidth, 1.6)),
    opacity: style.opacity
  };
  return [
    new echartsInstance.graphic.Line({
      shape: {
        x1: tip.x - size,
        y1: tip.y - size,
        x2: tip.x + size,
        y2: tip.y + size
      },
      style: markerStyle,
      silent,
      z2: layerZ.arrow
    }),
    new echartsInstance.graphic.Line({
      shape: {
        x1: tip.x + size,
        y1: tip.y - size,
        x2: tip.x - size,
        y2: tip.y + size
      },
      style: markerStyle,
      silent,
      z2: layerZ.arrow
    })
  ];
}

function drawNote(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SequenceDiagramSeriesModel,
  note: SequenceNoteLayout
): GraphicElement[] {
  const elements: GraphicElement[] = [];
  const style = readBoxStyle(seriesModel, note, 'noteStyle', {
    color: '#fef9c3',
    borderColor: '#ca8a04',
    borderWidth: 1,
    opacity: 0.96
  });
  const box = new echartsInstance.graphic.Rect({
    shape: {
      x: note.x,
      y: note.y,
      width: note.width,
      height: note.height,
      r: 2
    },
    style: {
      fill: style.color,
      stroke: style.borderColor,
      lineWidth: style.borderWidth,
      opacity: style.opacity
    },
    silent: seriesModel.get('silent') === true,
    z2: layerZ.note
  });
  setAliveRenderKey(box, `sequence-note-box:${note.id}`);
  group.add(box);
  elements.push(box);

  const label = new echartsInstance.graphic.Text({
    style: {
      x: note.x + 10,
      y: note.y + note.height / 2,
      text: note.lines.length ? note.lines.join('\n') : note.text,
      width: Math.max(24, note.width - 20),
      overflow: 'break',
      lineHeight: 15,
      fill: '#713f12',
      fontSize: 12,
      fontWeight: 600,
      align: 'left',
      verticalAlign: 'middle'
    },
    silent: true,
    z2: layerZ.note
  });
  setAliveRenderKey(label, `sequence-note-label:${note.id}`);
  group.add(label);
  elements.push(label);

  return elements;
}

function drawFragment(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SequenceDiagramSeriesModel,
  fragment: SequenceFragmentLayout
): GraphicElement[] {
  const elements: GraphicElement[] = [];
  const style = readBoxStyle(seriesModel, fragment, 'fragmentStyle', {
    color: 'rgba(248, 250, 252, 0.28)',
    borderColor: '#64748b',
    borderWidth: 1,
    opacity: 1
  });
  const frame = new echartsInstance.graphic.Rect({
    shape: {
      x: fragment.x,
      y: fragment.y,
      width: fragment.width,
      height: fragment.height,
      r: 2
    },
    style: {
      fill: style.color,
      stroke: style.borderColor,
      lineWidth: style.borderWidth,
      opacity: style.opacity
    },
    silent: true,
    z2: layerZ.fragment
  });
  setAliveRenderKey(frame, `sequence-fragment-frame:${fragment.id}`);
  group.add(frame);
  elements.push(frame);

  const labelText = `[${fragment.type}]${fragment.text ? ` ${fragment.text}` : ''}`;
  const label = new echartsInstance.graphic.Text({
    style: {
      x: fragment.x + 8,
      y: fragment.y + 14,
      text: labelText,
      fill: '#334155',
      fontSize: 12,
      fontWeight: 700,
      align: 'left',
      verticalAlign: 'middle'
    },
    silent: true,
    z2: layerZ.label
  });
  setAliveRenderKey(label, `sequence-fragment-label:${fragment.id}`);
  group.add(label);
  elements.push(label);

  fragment.operands.forEach((operand, index) => {
    if (operand.separatorY != null) {
      const separator = new echartsInstance.graphic.Line({
        shape: {
          x1: fragment.x,
          y1: operand.separatorY,
          x2: fragment.x + fragment.width,
          y2: operand.separatorY
        },
        style: {
          stroke: style.borderColor,
          lineWidth: 1,
          lineDash: [5, 4],
          opacity: 0.8
        },
        silent: true,
        z2: layerZ.fragment
      });
      setAliveRenderKey(separator, `sequence-fragment-separator:${fragment.id}:${index}`);
      group.add(separator);
      elements.push(separator);
    }
    if (index > 0 && operand.text) {
      const operandLabel = new echartsInstance.graphic.Text({
        style: {
          x: fragment.x + 8,
          y: (operand.separatorY ?? fragment.y) + 14,
          text: operand.text,
          fill: '#475569',
          fontSize: 11,
          fontWeight: 600,
          align: 'left',
          verticalAlign: 'middle'
        },
        silent: true,
        z2: layerZ.label
      });
      setAliveRenderKey(operandLabel, `sequence-fragment-operand:${fragment.id}:${index}`);
      group.add(operandLabel);
      elements.push(operandLabel);
    }
  });

  return elements;
}

function drawConstraint(
  echartsInstance: EChartsHost,
  group: GraphicGroup,
  seriesModel: SequenceDiagramSeriesModel,
  constraint: SequenceConstraintLayout
): GraphicElement[] {
  const elements: GraphicElement[] = [];
  const style = readConstraintStyle(seriesModel, constraint);
  if (constraint.type === 'duration') {
    const line = new echartsInstance.graphic.Line({
      shape: {
        x1: constraint.x1,
        y1: constraint.y1,
        x2: constraint.x2,
        y2: constraint.y2
      },
      style,
      silent: true,
      z2: layerZ.constraint
    });
    setAliveRenderKey(line, `sequence-constraint-line:${constraint.id}`);
    group.add(line);
    elements.push(line);

    [constraint.y1, constraint.y2].forEach((y, index) => {
      const tick = new echartsInstance.graphic.Line({
        shape: {
          x1: constraint.x1 - 5,
          y1: y,
          x2: constraint.x1 + 5,
          y2: y
        },
        style,
        silent: true,
        z2: layerZ.constraint
      });
      setAliveRenderKey(tick, `sequence-constraint-tick:${constraint.id}:${index}`);
      group.add(tick);
      elements.push(tick);
    });
  }

  const label = new echartsInstance.graphic.Text({
    style: {
      x: constraint.labelX,
      y: constraint.labelY,
      text: constraint.type === 'timing' ? `{${constraint.text}}` : constraint.text,
      fill: '#475569',
      fontSize: 11,
      fontWeight: 600,
      align: constraint.type === 'duration' ? 'left' : 'center',
      verticalAlign: 'middle'
    },
    silent: true,
    z2: layerZ.constraint
  });
  setAliveRenderKey(label, `sequence-constraint-label:${constraint.id}`);
  group.add(label);
  elements.push(label);
  return elements;
}

function createMessageLabel(
  echartsInstance: EChartsHost,
  seriesModel: SequenceDiagramSeriesModel,
  message: SequenceMessageLayout
): GraphicElement | null {
  const itemModel = getMessageItemModel(seriesModel, message);
  const labelModel = itemModel?.getModel('label') || seriesModel.getModel('label');
  if (labelModel.get('show') === false) return null;
  const position = messageLabelPosition(message);

  return new echartsInstance.graphic.Text({
    style: {
      x: position.x,
      y: position.y,
      text: formatMessageLabel(labelModel.get('formatter'), message),
      width: messageLabelWidth(message),
      overflow: 'truncate',
      ellipsis: '...',
      fill: labelModel.get('color') || '#0f172a',
      fontSize: finiteNumber(labelModel.get('fontSize'), 12),
      fontWeight: labelModel.get('fontWeight') || 600,
      align: position.align,
      verticalAlign: 'bottom'
    },
    silent: true,
    z2: layerZ.label
  });
}

function bindMessageData(
  seriesModel: SequenceDiagramSeriesModel,
  message: SequenceMessageLayout,
  rect: ViewRect,
  element: GraphicElement | undefined
): void {
  const data = seriesModel.getData();
  if (message.dataIndex < 0 || message.dataIndex >= data.count()) return;
  const point = messageTooltipPoint(message);
  data.setItemLayout(message.dataIndex, [point.x + rect.x, point.y + rect.y]);
  if (element) data.setItemGraphicEl(message.dataIndex, element);
}

function readParticipantStyle(
  seriesModel: SequenceDiagramSeriesModel,
  participant: SequenceParticipantLayout
): Record<string, unknown> {
  return {
    color: '#f8fafc',
    borderColor: '#334155',
    borderWidth: 1.2,
    opacity: 1,
    borderRadius: 4,
    ...asRecord(seriesModel.get('participantStyle')),
    ...asRecord(asRecord(participant.raw).itemStyle)
  };
}

function readLifelineStyle(seriesModel: SequenceDiagramSeriesModel): Record<string, unknown> {
  const style = {
    color: '#94a3b8',
    width: 1,
    opacity: 0.9,
    type: 'dashed',
    ...asRecord(seriesModel.get('lifelineStyle'))
  };
  return {
    stroke: style.color,
    lineWidth: finiteNumber(style.width, 1),
    opacity: finiteNumber(style.opacity, 0.9),
    lineDash: readLineDash(style.type, finiteNumber(style.width, 1))
  };
}

function readActivationStyle(
  seriesModel: SequenceDiagramSeriesModel,
  activation: SequenceActivationLayout
): Record<string, unknown> {
  return {
    color: '#e0f2fe',
    borderColor: '#0284c7',
    borderWidth: 1,
    opacity: 0.92,
    ...asRecord(seriesModel.get('activationStyle')),
    ...asRecord(asRecord(activation.raw).itemStyle)
  };
}

function readBoxStyle(
  seriesModel: SequenceDiagramSeriesModel,
  layout: { raw: unknown },
  seriesStyleKey: string,
  fallback: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...fallback,
    ...asRecord(seriesModel.get(seriesStyleKey)),
    ...asRecord(asRecord(layout.raw).itemStyle)
  };
}

function readConstraintStyle(
  seriesModel: SequenceDiagramSeriesModel,
  constraint: SequenceConstraintLayout
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    color: '#475569',
    width: 1.2,
    opacity: 0.9,
    type: 'dashed',
    ...asRecord(seriesModel.get('constraintStyle')),
    ...asRecord(asRecord(constraint.raw).itemStyle)
  };
  const width = finiteNumber(base.width ?? base.lineWidth, 1.2);
  return {
    stroke: base.color ?? base.stroke,
    lineWidth: width,
    opacity: finiteNumber(base.opacity, 0.9),
    lineDash: readLineDash(base.type, width)
  };
}

function readMessageLineStyle(
  seriesModel: SequenceDiagramSeriesModel,
  message: SequenceMessageLayout
): Record<string, unknown> {
  const itemStyle = asRecord(asRecord(message.raw).lineStyle);
  const base: Record<string, unknown> = {
    color: '#334155',
    width: 1.6,
    opacity: 1,
    type: message.type === 'return' ? 'dashed' : 'solid',
    ...asRecord(seriesModel.get('lineStyle')),
    ...itemStyle
  };
  const width = finiteNumber(base.width ?? base.lineWidth, 1.6);

  return {
    stroke: base.color ?? base.stroke,
    lineWidth: width,
    opacity: finiteNumber(base.opacity, 1),
    lineDash: readLineDash(base.type ?? (message.type === 'return' ? 'dashed' : 'solid'), width),
    lineDashOffset: finiteNumber(base.dashOffset ?? base.lineDashOffset, 0)
  };
}

function readLineDash(type: unknown, width: number): number[] | null {
  if (Array.isArray(type)) {
    const values = type.map((value) => finiteNumber(value, NaN)).filter((value) => Number.isFinite(value) && value > 0);
    return values.length ? values : null;
  }
  if (typeof type !== 'string') return null;
  if (type === 'dashed') return [Math.max(4, width * 4), Math.max(3, width * 3)];
  if (type === 'dotted') return [Math.max(1, width), Math.max(3, width * 3)];
  return null;
}

function messageLabelPosition(message: SequenceMessageLayout): { x: number; y: number; align: string } {
  if (message.direction === 'self') {
    const right = Math.max(...message.points.map((point) => point.x));
    return {
      x: (message.x1 + right) / 2,
      y: message.y - 6,
      align: 'center'
    };
  }

  if (message.type === 'create') {
    return {
      x: message.x1 + (message.x2 - message.x1) * 0.38,
      y: message.y - 6,
      align: 'center'
    };
  }

  return {
    x: (message.x1 + message.x2) / 2,
    y: message.y - 6,
    align: 'center'
  };
}

function messageLabelWidth(message: SequenceMessageLayout): number {
  if (message.direction === 'self') {
    const right = Math.max(...message.points.map((point) => point.x));
    return Math.max(120, right - message.x1 + 64);
  }
  return Math.max(80, Math.abs(message.x2 - message.x1) - 18);
}

function messageTooltipPoint(message: SequenceMessageLayout): SequencePoint {
  if (message.direction === 'self') return messageLabelPosition(message);
  return {
    x: (message.x1 + message.x2) / 2,
    y: message.y
  };
}

function formatParticipantLabel(formatter: unknown, participant: SequenceParticipantLayout): string {
  if (typeof formatter === 'function') {
    return stringifyLabel(formatter({
      data: participant.raw,
      name: participant.name,
      id: participant.id
    }));
  }
  if (typeof formatter === 'string') {
    return replaceTemplateTokens(formatter, {
      '{b}': participant.name,
      '{id}': participant.id
    });
  }
  return participant.name;
}

function formatMessageLabel(formatter: unknown, message: SequenceMessageLayout): string {
  if (typeof formatter === 'function') {
    return stringifyLabel(formatter({
      data: message.raw,
      name: message.text,
      from: message.from,
      to: message.to,
      type: message.type
    }));
  }
  if (typeof formatter === 'string') {
    return replaceTemplateTokens(formatter, {
      '{b}': message.text,
      '{c}': message.text,
      '{from}': message.from,
      '{to}': message.to,
      '{type}': message.type
    });
  }
  return message.text;
}

function getMessageItemModel(
  seriesModel: SequenceDiagramSeriesModel,
  message: SequenceMessageLayout
): EChartsModel | null {
  const data = seriesModel.getData();
  if (message.dataIndex < 0 || message.dataIndex >= data.count()) return null;
  return data.getItemModel(message.dataIndex);
}

function applyPathEnterAnimation(
  element: GraphicElement,
  message: SequenceMessageLayout,
  animation: EnterAnimationConfig
): void {
  if (!animation.enabled) return;
  const target = element as AnimatableGraphicElement;
  const animator = target.animate?.(message.points.length === 2 ? 'shape' : 'style');
  if (!animator) return;

  if (message.points.length === 2) {
    const [source, targetPoint] = message.points;
    target.shape = {
      ...(target.shape || {}),
      x1: source.x,
      y1: source.y,
      x2: source.x,
      y2: source.y
    };
    animator.when(animation.duration, {
      x1: source.x,
      y1: source.y,
      x2: targetPoint.x,
      y2: targetPoint.y
    });
  } else {
    target.style = {
      ...(target.style || {}),
      opacity: 0
    };
    animator.when(animation.duration, {
      opacity: 1
    });
  }

  animator.delay?.(animation.delay);
  animator.start(animation.easing);
}

function applyFadeEnterAnimation(element: GraphicElement, animation: EnterAnimationConfig): void {
  if (!animation.enabled) return;
  const target = element as AnimatableGraphicElement;
  const animator = target.animate?.('style');
  if (!animator) return;
  const opacity = finiteNumber(target.style?.opacity, 1);
  target.style = {
    ...(target.style || {}),
    opacity: 0
  };
  animator.when(animation.duration, {
    opacity
  });
  animator.delay?.(animation.delay);
  animator.start(animation.easing);
}

function readEnterAnimation(seriesModel: SequenceDiagramSeriesModel, index: number): EnterAnimationConfig {
  const option = seriesModel.get('enterAnimation');
  if (option === false || seriesModel.get('animation') === false) {
    return {
      enabled: false,
      duration: 0,
      delay: 0,
      easing: 'cubicOut'
    };
  }
  const record = asRecord(option);
  const duration = resolveAnimationValue(record.duration, index, 360);
  const delay = resolveAnimationValue(record.delay, index, 0) + resolveAnimationValue(record.stagger, index, 0) * index;
  return {
    enabled: true,
    duration,
    delay,
    easing: typeof record.easing === 'string' ? record.easing : 'cubicOut'
  };
}

function resolveAnimationValue(value: unknown, index: number, fallback: number): number {
  if (typeof value === 'function') return Math.max(0, finiteNumber(value(index), fallback));
  return Math.max(0, finiteNumber(value, fallback));
}

function pointsToPath(points: SequencePoint[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${formatNumber(point.x)} ${formatNumber(point.y)}`).join('');
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function finiteNumber(value: unknown, fallback: number): number {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(numeric) ? numeric : fallback;
}

function stringifyLabel(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

function replaceTemplateTokens(template: string, replacements: Record<string, string>): string {
  return Object.entries(replacements).reduce(
    (result, [token, value]) => result.split(token).join(value),
    template
  );
}

export const __test__ = {
  createArrowHead,
  formatMessageLabel,
  formatParticipantLabel,
  messageLabelPosition,
  pointsToPath,
  readLineDash
};
