import assert from 'node:assert/strict';
import { test } from 'vitest';

import { __test__ as elementHoverInternals } from '../packages/echarts-layout-core/src/element-hover.ts';
import { __test__ as graphInternals, installGraphLayout } from '../packages/echarts-layout-core/src/echarts.ts';

test('layout core private helpers cover serialization, labels, styles, and animation fallbacks', () => {
  const cyclic = { name: 'cycle' };
  cyclic.self = cyclic;
  assert.equal(graphInternals.stableSerialize(cyclic).includes('__cycle'), true);
  assert.equal(graphInternals.stableSerialize(Symbol('x')).includes('Symbol'), true);
  assert.equal(graphInternals.stableSerialize(() => 1).includes('__function'), true);
  assert.equal(graphInternals.stableSerialize(10n), '"10"');

  const resolver = graphInternals.createValueNodeSizeResolver([
    { value: 1 },
    { value: '5' },
    { value: ['bad', 9] },
    { value: null }
  ]);
  assert.ok(resolver({ value: 9 }) > resolver({ value: 1 }));
  assert.equal(resolver({ value: 'bad' }), 20);
  assert.equal(graphInternals.createValueNodeSizeResolver([])({ value: 100 }), 20);
  assert.equal(graphInternals.createValueNodeSizeResolver([1, null])({ value: 100 }), 20);
  assert.equal(graphInternals.readNodeValue('loose'), undefined);

  assert.deepEqual(graphInternals.graphCenter([]), [0, 0]);
  const placed = graphInternals.placeLabels([
    renderNode('a', -50, -40, 18, 'Huge Label That Must Clamp', 'left'),
    renderNode('b', 10, 10, 18, 'B', 'diagonal')
  ], 'arc', { x: 0, y: 0, width: 38, height: 28 });
  assert.equal(placed.size, 2);
  assert.ok(Number.isFinite(placed.get('a').box.x));
  assert.deepEqual(graphInternals.getLabelPoint({ x: 1, y: 2 }, 'bad', 3).align, 'left');
  assert.equal(graphInternals.formatNodeValue(NaN), '');
  assert.equal(graphInternals.formatNodeValue([null, '', 2500]), '2.5K');
  assert.equal(graphInternals.formatNodeValue({ value: 1 }), '');

  const plain = { style: { opacity: 0.4, old: true } };
  graphInternals.applyGraphElementStyle(plain, {}, { opacity: undefined }, ['opacity', 'lineWidth'], false);
  assert.equal(plain.style.opacity, undefined);
  assert.equal(plain.style.lineWidth, undefined);

  const attrOnly = createElement({ opacity: 0.5 }, { attr: true, setStyle: false });
  graphInternals.transitionGraphicStyle(attrOnly, {}, ['notAnimatable']);
  assert.deepEqual(attrOnly.style, {});
  const noAnimator = createElement({ opacity: 0.5 }, { animate: () => null });
  graphInternals.transitionGraphicStyle(noAnimator, { opacity: 0.8 }, ['opacity']);
  assert.equal(noAnimator.style.opacity, 0.8);
  assert.equal(graphInternals.styleTransitionFallbackValue('lineWidth'), 1);
  assert.equal(graphInternals.styleTransitionFallbackValue('other'), undefined);

  const shapeSetter = createElement({}, { setShape: true });
  graphInternals.setGraphicShape(shapeSetter, { x: 1 });
  assert.equal(shapeSetter.shape.x, 1);
  const shapeAttr = createElement({}, { attr: true });
  graphInternals.setGraphicShape(shapeAttr, { x: 2 });
  assert.equal(shapeAttr.shape.x, 2);
  const shapePlain = createElement({}, {});
  graphInternals.setGraphicShape(shapePlain, { x: 3 });
  assert.equal(shapePlain.shape.x, 3);

  const styleSetter = createElement({ keep: true }, { setStyle: true });
  graphInternals.setGraphicStyle(styleSetter, { opacity: 0.2 });
  assert.equal(styleSetter.style.opacity, 0.2);
  const styleAttr = createElement({ keep: true }, { attr: true });
  graphInternals.setGraphicStyle(styleAttr, { opacity: 0.3 });
  assert.equal(styleAttr.style.opacity, 0.3);
  const stylePlain = createElement({ keep: true }, {});
  graphInternals.setGraphicStyle(stylePlain, { opacity: 0.4 });
  assert.equal(stylePlain.style.opacity, 0.4);

  const replaceAttr = createElement({ old: true }, { attr: true });
  graphInternals.replaceGraphicStyle(replaceAttr, { opacity: 1 });
  assert.equal(replaceAttr.style.old, undefined);
  const replacePlain = createElement({ old: true }, {});
  graphInternals.replaceGraphicStyle(replacePlain, { opacity: 0.9 });
  assert.equal(replacePlain.style.opacity, 0.9);
  graphInternals.removeMissingStyleKeys(null, {});

  const ignoreAttr = createElement({}, { attr: true });
  graphInternals.setGraphicIgnore(ignoreAttr, true);
  assert.equal(ignoreAttr.ignore, true);
  const ignorePlain = createElement({}, {});
  graphInternals.setGraphicIgnore(ignorePlain, true);
  assert.equal(ignorePlain.ignore, true);

  const disabledAnimationModel = { get: (path) => path === 'animation' ? false : undefined };
  assert.equal(graphInternals.readEnterAnimation(disabledAnimationModel, 0).enabled, false);
  const hiddenAnimationModel = { get: (path) => path === 'enterAnimation' ? { enabled: false } : undefined };
  assert.equal(graphInternals.readEnterAnimation(hiddenAnimationModel, 0).enabled, false);

  const edgeNoAnimate = createElement({}, {});
  graphInternals.applyEdgeConnectionAnimation(edgeNoAnimate, 'shape', 'percent', { enabled: true, duration: 1, delay: 0, easing: 'linear' });
  const edgeNoShape = createElement({}, { animate: () => null });
  delete edgeNoShape.shape;
  graphInternals.applyEdgeConnectionAnimation(edgeNoShape, 'shape', 'percent', { enabled: true, duration: 1, delay: 0, easing: 'linear' });
  assert.equal(edgeNoShape.shape.percent, 1);
  const edgeNullAnimator = createElement({}, { animate: () => null });
  graphInternals.applyEdgeConnectionAnimation(edgeNullAnimator, 'shape', 'percent', { enabled: true, duration: 1, delay: 0, easing: 'linear' });
  assert.equal(edgeNullAnimator.shape.percent, 1);
  const nodeNoAnimate = createElement({}, {});
  graphInternals.applyNodeEnterAnimation(nodeNoAnimate, 20, { enabled: true, duration: 1, delay: 0, easing: 'linear' });
  const nodeNoShapeStyle = createElement({}, { animate: () => null });
  delete nodeNoShapeStyle.shape;
  delete nodeNoShapeStyle.style;
  graphInternals.applyNodeEnterAnimation(nodeNoShapeStyle, 20, { enabled: true, duration: 1, delay: 0, easing: 'linear' });
  assert.equal(nodeNoShapeStyle.shape.r, 10);
  const fadeNoAnimate = createElement({}, {});
  graphInternals.applyFadeEnterAnimation(fadeNoAnimate, { enabled: true, duration: 1, delay: 0, easing: 'linear' });
  const fadeNoStyle = createElement({}, { animate: () => null });
  delete fadeNoStyle.style;
  graphInternals.applyFadeEnterAnimation(fadeNoStyle, { enabled: true, duration: 1, delay: 0, easing: 'linear' });
  assert.equal(fadeNoStyle.style.opacity, 1);
  const propNullAnimator = createElement({}, { animate: () => null });
  graphInternals.animateGraphicProperty(propNullAnimator, 'style', { enabled: true, duration: 1, delay: 0, easing: 'linear' }, { opacity: 0.7 });
  assert.equal(propNullAnimator.style.opacity, 0.7);
  const propMissingTarget = createElement({}, { animate: () => null });
  delete propMissingTarget.shape;
  graphInternals.animateGraphicProperty(propMissingTarget, 'shape', { enabled: true, duration: 1, delay: 0, easing: 'linear' }, { r: 4 });
  assert.equal(propMissingTarget.shape, undefined);
});

test('layout core private helpers cover hover and fisheye state fallbacks', () => {
  const edge = {
    kind: 'arcPath',
    element: createElement({ stroke: '#999', lineWidth: 1 }, { attr: true }),
    fisheyeElement: createElement({ stroke: '#999', lineWidth: 1 }, { attr: true }),
    fisheyeElementAdded: false,
    edgeGroup: { add(element) { this.added = element; } },
    sourceId: 'a',
    targetId: 'b',
    baseStyle: { stroke: '#999', lineWidth: 1 },
    fisheyeBaseStyle: { stroke: '#999', lineWidth: 1 }
  };
  graphInternals.updateFisheyeEdge(edge, [0, 0], [20, 8], true);
  assert.equal(edge.fisheyeElementAdded, true);
  graphInternals.updateFisheyeEdge({ ...edge, kind: 'bezier', fisheyeElement: null }, [0, 0], [10, 5], true);

  const lineEdge = {
    kind: 'line',
    element: createElement({}, { attr: true }),
    sourceId: 'a',
    targetId: 'missing',
    baseStyle: {}
  };
  graphInternals.updateFisheyeEdge(lineEdge, [1, 2], [3, 4], false);
  assert.equal(lineEdge.element.shape.x2, 3);

  const renderState = createRenderState(edge, lineEdge);
  graphInternals.applyFisheye(renderState, { radius: 10, scale: 2, labelScale: 1.2 }, [0, 0]);
  graphInternals.resetFisheye(renderState);
  graphInternals.applyEdgeHover(renderState, 99);
  const adjacency = graphInternals.createHoverAdjacency(renderState.edges);
  graphInternals.applyNodeHover(renderState, adjacency, 'missing');
  graphInternals.applyEdgeHoverStyle(edge, { opacity: 0.2 }, ['opacity'], true);
  assert.equal(edge.fisheyeElement.style.opacity, 0.2);
  graphInternals.resetGraphHover(renderState, false);
  const hoverTargets = new WeakSet();
  hoverTargets.add(edge.element);
  assert.equal(graphInternals.isGraphHoverTarget({ parent: edge.element }, hoverTargets), true);
  assert.equal(graphInternals.isGraphHoverTarget(null, hoverTargets), false);
  assert.equal(adjacency.get('a').nodes.has('b'), true);
  const renderToken = {};
  assert.equal(graphInternals.shouldAbortGraphRender({ __renderToken: renderToken }, renderToken), false);
  assert.equal(graphInternals.shouldAbortGraphRender({ __renderToken: {} }, renderToken), true);

  const group = { add(element) { this.added = element; } };
  const view = {};
  const echarts = {
    graphic: {
      Circle: class {
        constructor(options) {
          Object.assign(this, options);
        }
      }
    }
  };
  graphInternals.updateFisheyeRenderState(echarts, group, { getZr: () => null }, view, renderState, null);
  assert.equal(renderState.lens.ignore, true);
  graphInternals.updateFisheyeRenderState(echarts, group, { getZr: () => null }, view, { ...renderState, lens: null }, {
    radius: 20,
    stroke: '#111',
    strokeWidth: 2,
    opacity: 0.8,
    x: 0,
    y: 0,
    scale: 2,
    labelScale: 1
  });
  assert.ok(group.added);
});

test('layout core private helpers cover graph option, layout, hover controller, and lens boundaries', () => {
  const host = createEChartsHost();
  installGraphLayout(host, { chartType: 'testGraph', layoutType: 'arc' });
  const initial = host.seriesConfig.getInitialData.call({}, {
    data: [{ value: 1 }],
    links: [{ source: 0, target: 0 }]
  });
  assert.deepEqual(initial.source, [{ value: 1 }]);
  const emptyInitial = host.seriesConfig.getInitialData.call({}, {});
  assert.deepEqual(emptyInitial.source, []);

  assert.deepEqual(graphInternals.readGraphOption({}), {
    nodes: [],
    edges: []
  });

  assert.deepEqual(graphInternals.readGraphOption({
    option: {
      data: ['node'],
      links: ['edge']
    }
  }), {
    nodes: ['node'],
    edges: ['edge']
  });
  assert.deepEqual(graphInternals.readGraphOption({ option: {} }), {
    nodes: [],
    edges: []
  });

  const model = createSeriesModel({
    layoutOptions: { preventOverlap: true },
    center: ['25%', 10],
    symbolSize: 12,
    width: 200
  });
  const layoutOptions = graphInternals.readLayoutOptions(host, model, {
    getWidth: () => 400,
    getHeight: () => 300
  }, { nodes: [{ value: 1 }], edges: [] });
  assert.equal(layoutOptions.width, 390);
  assert.equal(layoutOptions.height, 286);
  assert.deepEqual(layoutOptions.center, [102.5, 17]);
  assert.equal(layoutOptions.nodeSize, 12);
  assert.equal(graphInternals.createGraphRenderSignature('arc', {}, {}, {
    x: 0,
    y: 0,
    width: 1,
    height: 1
  }).includes('layoutType'), true);
  assert.equal(graphInternals.formatNodeValue([null, '', NaN]), '');
  assert.equal(graphInternals.toNumericValue(['bad', '7']), 7);

  const edge = {
    kind: 'line',
    element: createEventedElement({}, { attr: true }),
    sourceId: 'a',
    targetId: 'b',
    baseStyle: { lineWidth: 1, opacity: 1 },
    fisheyeBaseStyle: null
  };
  const lineEdge = {
    kind: 'line',
    element: createEventedElement({}, { attr: true }),
    sourceId: 'b',
    targetId: 'a',
    baseStyle: { lineWidth: 1, opacity: 1 },
    fisheyeBaseStyle: null
  };
  const renderState = createRenderState(edge, lineEdge);
  renderState.nodes.forEach((node) => {
    node.circle = createEventedElement({ fill: '#123', opacity: 1, lineWidth: 1 }, { attr: true });
  });
  renderState.labels[0].element = createEventedElement({ opacity: 1 }, { attr: true });
  const zr = createZr();
  const controller = graphInternals.installGraphHover(renderState, { getZr: () => zr });
  edge.element.handlers.mouseover();
  zr.handlers.mousemove({ target: edge.element });
  zr.handlers.mousemove({ target: {} });
  controller.dispose();
  assert.equal(zr.offCalls.length, 2);

  graphInternals.updateFisheyeRenderState(host, { add() {} }, { getZr: () => null }, {}, { ...renderState, lens: null }, null);
  graphInternals.applyFisheye({ ...renderState, lens: null }, { radius: 10, scale: 2, labelScale: 1 }, [0, 0]);
  graphInternals.resetFisheye({ ...renderState, lens: null });

  const labelSpec = graphInternals.createLabelSpec(
    createSeriesModel({
      label: {
        show: true,
        position: { invalid: true },
        formatter: () => null
      }
    }),
    createSeriesModel({}),
    { id: 'labelled', x: 0, y: 0, value: 1 },
    20
  );
  assert.equal(labelSpec.position, 'right');
  assert.equal(labelSpec.text, '');

  const drawHost = createEChartsHost();
  drawHost.graphic.Line = drawHost.graphic.Circle;
  drawHost.graphic.Text = drawHost.graphic.Circle;
  const drawGroup = new drawHost.graphic.Group();
  const drawState = graphInternals.drawGraph(
    drawHost,
    drawGroup,
    createDrawSeriesModel({
      animation: false,
      nodes: [{ id: 'rendered', value: 2 }],
      edges: []
    }),
    'radial',
    {
      nodes: [
        { id: 'rendered', x: 0, y: 0, value: 2 },
        { id: 'missing-data-index', x: 10, y: 0, value: 1 }
      ],
      edges: [
        { source: 'rendered', target: 'absent' },
        { source: 'rendered', target: 'rendered' }
      ]
    },
    { x: 0, y: 0, width: 100, height: 100 },
    null
  );
  assert.equal(drawState.nodes.length, 1);
  assert.equal(drawState.edges.length, 1);
  assert.equal(drawState.edges[0].element.__aliveRenderKey, 'edge:rendered->rendered:1');
});

test('element hover private helpers cover transition fallback boundaries', () => {
  assert.deepEqual(elementHoverInternals.createTransitionTarget({}, ['opacity', 'lineWidth']), {
    opacity: 1
  });
  assert.deepEqual(elementHoverInternals.asRecord({ opacity: 0.5 }), { opacity: 0.5 });
  assert.deepEqual(elementHoverInternals.asRecord([]), {});

  const currentStyle = {
    opacity: 0.7,
    obsolete: true
  };
  elementHoverInternals.removeMissingStyleKeys(null, {});
  elementHoverInternals.removeMissingStyleKeys(currentStyle, {
    opacity: 0.4
  });
  assert.equal(currentStyle.obsolete, undefined);

  const active = createElement({ opacity: 1, obsolete: true }, { setStyle: true });
  const dimmed = createElement({ opacity: 0.8, old: true }, { setStyle: true });
  elementHoverInternals.applyHoverItem([
    {
      elements: [active, dimmed]
    }
  ], new Map(), 99, 0.2, 0, 'linear');
  assert.deepEqual(active.style, { opacity: 0.2 });
  assert.deepEqual(dimmed.style, { opacity: 0.2 });

  const resetting = createHoverAnimatable({ opacity: 0.6 });
  elementHoverInternals.resetHoverItems([
    {
      elements: [resetting]
    }
  ], new Map(), 12, 'linear');
  assert.equal(resetting.animations[0].targets[0].opacity, 1);
  assert.equal(resetting.animations[0].easing, 'linear');
  assert.deepEqual(resetting.style, {});
});

function renderNode(id, x, y, size, text, position) {
  return {
    node: { id, x, y },
    dataIndex: 0,
    size,
    circleBox: { x: x - size / 2, y: y - size / 2, width: size, height: size },
    labelSpec: {
      node: { id, x, y },
      text,
      width: text.length * 10,
      height: 20,
      fontSize: 14,
      lineHeight: 16,
      position,
      offset: 2
    }
  };
}

function createElement(style = {}, features = {}) {
  const element = {
    shape: {},
    style: { ...style }
  };
  if (features.attr) {
    element.attr = (keyOrObj, value) => {
      if (keyOrObj === 'shape') element.shape = { ...value };
      else if (keyOrObj === 'style') element.style = { ...value };
      else if (typeof keyOrObj === 'string') element[keyOrObj] = value;
      else Object.assign(element, keyOrObj);
    };
  }
  if (features.setShape) {
    element.setShape = (shape) => {
      element.shape = { ...shape };
    };
  }
  if (features.setStyle) {
    element.setStyle = (nextStyle) => {
      element.style = { ...nextStyle };
    };
  }
  if (features.animate) {
    element.animate = features.animate;
  }
  element.stopAnimation = () => {};
  return element;
}

function createEventedElement(style = {}, features = {}) {
  const element = createElement(style, features);
  element.handlers = {};
  element.on = (name, handler) => {
    element.handlers[name] = handler;
  };
  return element;
}

function createHoverAnimatable(style = {}) {
  const element = {
    style: { ...style },
    animations: [],
    stopAnimation() {}
  };
  element.animate = (key) => {
    const animation = {
      key,
      targets: [],
      callbacks: [],
      easing: undefined,
      when(duration, target) {
        this.duration = duration;
        this.targets.push(target);
        return this;
      },
      done(callback) {
        this.callbacks.push(callback);
        return this;
      },
      start(easing) {
        this.easing = easing;
        Object.assign(element[key], this.targets.at(-1));
        this.callbacks.forEach((callback) => callback());
        return this;
      }
    };
    element.animations.push(animation);
    return animation;
  };
  return element;
}

function createZr() {
  return {
    handlers: {},
    offCalls: [],
    on(name, handler) {
      this.handlers[name] = handler;
    },
    off(name, handler) {
      this.offCalls.push([name, handler]);
      delete this.handlers[name];
    }
  };
}

function createSeriesModel(option = {}) {
  return {
    option,
    get(path) {
      return readPath(option, path);
    },
    getModel(path) {
      return createSeriesModel(readPath(option, path) || {});
    },
    getBoxLayoutParams() {
      return {};
    }
  };
}

function createDrawSeriesModel(option = {}) {
  const source = {
    getItemModel(index) {
      return createSeriesModel(option.nodes?.[index] || {});
    },
    getItemVisual(dataIndex, key) {
      if (key === 'style') return {};
      return undefined;
    },
    setItemLayout() {},
    setItemGraphicEl() {}
  };
  return {
    ...createSeriesModel(option),
    getData() {
      return source;
    }
  };
}

function readPath(source, path) {
  const parts = Array.isArray(path) ? path : String(path).split('.');
  let current = source;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

function createEChartsHost() {
  return {
    seriesConfig: null,
    viewConfig: null,
    helper: {
      createDimensions(nodes) {
        return Object.keys(nodes[0] || { value: 0 });
      },
      getLayoutRect(params, size) {
        return {
          x: 5,
          y: 7,
          width: Number(params.width || size.width) - 10,
          height: Number(params.height || size.height) - 14
        };
      }
    },
    number: {
      parsePercent(value, size) {
        if (typeof value === 'string' && value.trim().endsWith('%')) {
          return Number.parseFloat(value) / 100 * size;
        }
        return Number(value) || 0;
      }
    },
    List: class {
      constructor(dimensions, model) {
        this.dimensions = dimensions;
        this.model = model;
        this.source = [];
      }
      initData(source) {
        this.source = source;
      }
    },
    graphic: {
      Group: class {
        constructor() {
          this.children = [];
        }
        add(element) {
          this.children.push(element);
        }
      },
      Circle: class {
        constructor(options = {}) {
          Object.assign(this, options);
        }
      }
    },
    extendSeriesModel(config) {
      this.seriesConfig = config;
    },
    extendChartView(config) {
      this.viewConfig = config;
    }
  };
}

function createRenderState(edge, lineEdge) {
  const nodeA = {
    id: 'a',
    baseX: 0,
    baseY: 0,
    baseRadius: 8,
    baseStyle: { opacity: 1 },
    circle: createElement({ fill: '#2563eb', opacity: 1 }, { attr: true }),
    valueLabel: createElement({ opacity: 1 }, { attr: true }),
    valueLabelBaseStyle: { opacity: 1 },
    valueFontSize: 10,
    valueLineWidth: 1
  };
  const nodeB = {
    id: 'b',
    baseX: 20,
    baseY: 0,
    baseRadius: 8,
    baseStyle: { opacity: 1 },
    circle: createElement({ fill: '#ef4444', opacity: 1 }, { attr: true })
  };
  return {
    nodes: [nodeA, nodeB],
    labels: [
      {
        nodeId: 'missing',
        element: createElement({ opacity: 1 }, { attr: true }),
        baseStyle: { opacity: 1 },
        baseX: 1,
        baseY: 1,
        baseFontSize: 10,
        baseLineHeight: 12
      }
    ],
    edges: [edge, lineEdge],
    lens: createElement({}, { attr: true })
  };
}
