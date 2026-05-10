import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { test, vi } from 'vitest';

import * as beeswarmLayout from '../packages/echarts-beeswarm/src/layout.ts';
import { __test__ as beeswarmRenderer } from '../packages/echarts-beeswarm/src/beeswarm.ts';
import * as circlePackingLayout from '../packages/echarts-circle-packing/src/layout.ts';
import { __test__ as circlePackingRenderer } from '../packages/echarts-circle-packing/src/circle-packing.ts';
import * as flameLayout from '../packages/echarts-flame/src/layout.ts';
import { __test__ as flameRenderer } from '../packages/echarts-flame/src/flame.ts';
import * as lollipopLayout from '../packages/echarts-lollipop/src/layout.ts';
import { __test__ as lollipopRenderer } from '../packages/echarts-lollipop/src/lollipop.ts';
import * as mosaicLayout from '../packages/echarts-mosaic/src/layout.ts';
import { __test__ as mosaicRenderer } from '../packages/echarts-mosaic/src/mosaic.ts';
import * as nestedCircleLayout from '../packages/echarts-nested-circle/src/layout.ts';
import { __test__ as nestedCircleRenderer } from '../packages/echarts-nested-circle/src/nested-circle.ts';
import * as packBubbleLayout from '../packages/echarts-pack-bubble/src/layout.ts';
import { __test__ as packBubbleRenderer } from '../packages/echarts-pack-bubble/src/pack-bubble.ts';
import * as spiralLayout from '../packages/echarts-spiral/src/layout.ts';
import { __test__ as spiralRenderer } from '../packages/echarts-spiral/src/spiral.ts';
import * as smithLayout from '../packages/echarts-smith/src/layout.ts';
import { __test__ as smithRenderer } from '../packages/echarts-smith/src/smith.ts';
import * as vectorFieldLayout from '../packages/echarts-vector-field/src/layout.ts';
import { __test__ as vectorFieldRenderer } from '../packages/echarts-vector-field/src/vector-field.ts';
import * as vennLayout from '../packages/echarts-venn/src/layout.ts';
import { __test__ as vennRenderer } from '../packages/echarts-venn/src/venn.ts';

const root = path.resolve(import.meta.dirname, '..');

test('private fisheye source helpers execute through the original source map', () => {
  let fisheyeView;
  const fisheyeHost = {
    extendComponentModel() {},
    extendComponentView(option) {
      fisheyeView = option;
    },
    graphic: { Circle: class {} }
  };
  const api = loadPrivateSource('packages/echarts-fisheye/src/fisheye.ts', [
    'markFisheyeElement',
    'isFisheyeElement'
  ], {
    'echarts/lib/echarts': fisheyeHost,
    '@echarts-extension/layout-core': {
      installFisheyeController() {},
      resolveFisheyeOptions() {
        return null;
      },
      setFisheyeGraphicIgnore(element, ignore) {
        element.ignore = ignore;
      }
    }
  });
  const element = {};
  assert.equal(api.isFisheyeElement(element), false);
  api.markFisheyeElement(element);
  assert.equal(api.isFisheyeElement(element), true);

  let removeAllCount = 0;
  const view = {
    group: {
      removeAll() {
        removeAllCount += 1;
      }
    }
  };
  fisheyeView.remove.call(view);
  fisheyeView.dispose.call(view);
  assert.equal(removeAllCount, 2);
});

test('spiral source render exposes the enter-gated hover predicate', () => {
  let chartView;
  let hoverOptions;
  const host = {
    ...graphicHost(),
    helper: {
      createDimensions() {
        return [];
      },
      enableHoverEmphasis() {},
      getLayoutRect() {
        return { x: 0, y: 0, width: 100, height: 80 };
      }
    },
    List: class {
      initData() {}
    },
    extendSeriesModel() {},
    extendChartView(option) {
      chartView = option;
    }
  };

  loadPrivateSource('packages/echarts-spiral/src/spiral.ts', [], {
    'echarts/lib/echarts': host,
    '@echarts-extension/layout-core': {
      clearAliveRender() {},
      installElementHover(_items, options) {
        hoverOptions = options;
        return { dispose() {} };
      },
      renderAlive(_view, _host, group, seriesModel, draw) {
        return { hoverItems: draw(group, seriesModel) };
      }
    },
    './layout.js': {
      resolveSpiralLayout() {
        return { segments: [] };
      }
    }
  });

  const source = data([]);
  const seriesModel = {
    option: { data: [] },
    get() {},
    getModel() {
      return this;
    },
    getBoxLayoutParams() {
      return {};
    },
    getData() {
      return source;
    }
  };
  const view = {
    group: new host.graphic.Group(),
    __spiralEntering: true
  };

  chartView.render.call(view, seriesModel, null, {
    getWidth: () => 100,
    getHeight: () => 80,
    getZr: () => null
  });

  assert.equal(hoverOptions.enabled(), true);
  view.__spiralEntering = true;
  assert.equal(hoverOptions.enabled(), false);
  view.__spiralEntering = false;
  assert.equal(hoverOptions.enabled(), true);
});

test('graph source render guards aborts and empty alive payloads', () => {
  let chartView;
  let activeView;
  let abortOnLayout = false;
  let renderAliveCalls = 0;
  const host = {
    ...graphicHost(),
    helper: {
      createDimensions() {
        return [];
      },
      getLayoutRect() {
        return { x: 0, y: 0, width: 100, height: 80 };
      },
      enableHoverEmphasis() {}
    },
    number: {
      parsePercent(value, maxValue) {
        if (typeof value === 'string' && value.endsWith('%')) return Number(value.slice(0, -1)) / 100 * maxValue;
        return Number(value) || 0;
      }
    },
    List: class {
      initData(source) {
        this.source = source;
      }
    },
    extendSeriesModel() {},
    extendChartView(option) {
      chartView = option;
    }
  };

  const api = loadPrivateSource('packages/echarts-layout-core/src/echarts.ts', ['installGraphLayout'], {
    './arc.js': {
      createArcBezierShape() {
        return {};
      },
      createArcShape() {
        return {};
      }
    },
    './data.js': {
      normalizeGraphData(graphOption) {
        return graphOption;
      }
    },
    './fisheye.js': {
      fisheyeTransform() {
        return { x: 0, y: 0, scale: 1 };
      },
      installFisheyeController() {
        return { dispose() {} };
      },
      resolveFisheyeOptions() {
        return null;
      }
    },
    './layouts.js': {
      computeGraphLayout() {
        if (abortOnLayout) activeView.__renderToken = {};
        return { nodes: [], edges: [] };
      }
    },
    './render-transition.js': {
      clearAliveRender(view) {
        view.__aliveRenderState = undefined;
      },
      renderAlive() {
        renderAliveCalls += 1;
        return { payload: null, hoverItems: [], mapElement: (element) => element };
      },
      setAliveRenderKey(element, key) {
        if (element) element.__aliveRenderKey = key;
      }
    }
  });

  api.installGraphLayout(host, { chartType: 'vmGraph', layoutType: 'arc' });
  const seriesModel = series({ nodes: [], links: [], fisheye: false }).model;
  const chartApi = {
    getWidth: () => 100,
    getHeight: () => 80,
    getZr: () => null
  };

  activeView = { group: new host.graphic.Group() };
  abortOnLayout = true;
  chartView.render.call(activeView, seriesModel, null, chartApi);
  assert.equal(renderAliveCalls, 0);

  activeView = { group: new host.graphic.Group() };
  abortOnLayout = false;
  chartView.render.call(activeView, seriesModel, null, chartApi);
  assert.equal(renderAliveCalls, 1);
  assert.equal(activeView.__graphRenderState, undefined);
});

test('direct renderer test exports cover shared helper branches on real modules', () => {
  const enabled = { enabled: true, duration: 5, delay: 2, easing: 'linear' };
  const disabled = { enabled: false, duration: 0, delay: 0, easing: 'cubicOut' };
  const point = {
    raw: { id: 'raw' },
    id: '',
    name: 'Point',
    value: 7,
    category: 'Group',
    x: 10,
    y: 8,
    x0: 2,
    y0: 3,
    baseX: 0,
    baseY: 0,
    radius: 4,
    centerY: 9,
    dataIndex: 0
  };

  assert.equal(JSON.stringify(beeswarmRenderer.readLineDash('dotted')), '[1.5,5]');
  assert.equal(beeswarmRenderer.readLineDash('solid'), null);
  assert.equal(beeswarmRenderer.formatAxisLabel((value) => `v${value}`, 3), 'v3');
  assert.equal(beeswarmRenderer.formatAxisLabel('{value}%', 3), '3%');
  assert.equal(beeswarmRenderer.formatAxisLabel(null, 3), '3');
  assert.equal(beeswarmRenderer.formatLabel(({ name }) => name, point), 'Point');
  assert.equal(beeswarmRenderer.formatLabel('{b}:{c}:{category}', point), 'Point:7:Group');
  assert.equal(beeswarmRenderer.formatLabel(null, { ...point, name: '', value: null }), '');
  coverCircleAndFadeAnimation(beeswarmRenderer, enabled, disabled);
  assert.equal(beeswarmRenderer.readEnterAnimation(model({ enterAnimation: { show: false } }), 0).enabled, false);
  assert.equal(beeswarmRenderer.readEnterAnimation(model({ enterAnimation: { enabled: false } }), 0).enabled, false);
  assert.equal(beeswarmRenderer.resolveAnimationNumber(() => '6', {}, 0, 1), 6);
  assert.equal(beeswarmRenderer.finiteNumber('', 1), 1);
  coverHover(beeswarmRenderer);

  assert.equal(JSON.stringify(lollipopRenderer.readLineDash('dotted')), '[1.5,5]');
  assert.equal(lollipopRenderer.readLineDash('solid'), null);
  assert.equal(lollipopRenderer.formatAxisLabel(null, 2), '2');
  assert.equal(lollipopRenderer.formatLabel(({ name }) => name, point), 'Point');
  assert.equal(lollipopRenderer.formatLabel('{b}:{c}:{category}', point), 'Point:7:Group');
  assert.equal(lollipopRenderer.formatLabel(null, { ...point, name: '', value: null }), null);
  assert.equal(lollipopRenderer.lollipopPointKey({ ...point, id: 'id' }), 'id');
  assert.equal(lollipopRenderer.lollipopPointKey({ ...point, id: '', category: 'Cat' }), 'Cat');
  assert.equal(lollipopRenderer.lollipopPointKeyFromAliveKey('lollipop-symbol:item-4'), 'item-4');
  assert.deepEqual(lollipopRenderer.graphicChildren({ children: () => [{ id: 1 }] }), [{ id: 1 }]);
  lollipopRenderer.applyStemEnterAnimation(animatable({ shape: {}, style: {} }), point, enabled);
  lollipopRenderer.applyStemEnterAnimation(animatable({ style: {} }), point, enabled);
  coverCircleAndFadeAnimation(lollipopRenderer, enabled, disabled);
  coverHover(lollipopRenderer);

  const mosaicTile = { raw: {}, name: 'Tile', value: 5, percent: 0.25, columnPercent: 0.5, xCategory: 'X', yCategory: 'Y', x: 0, y: 0, width: 64, height: 36, color: '#ddd', dataIndex: 0 };
  assert.equal(mosaicRenderer.formatLabel(({ name }) => name, mosaicTile), 'Tile');
  assert.equal(mosaicRenderer.wrapText('abcdefgh', 4, 1), 'abc...');
  assert.equal(mosaicRenderer.wrapText('short', 10, 1), 'short');
  assert.equal(mosaicRenderer.wrapText('superlongword', 5, 3), 'super\nlongw\nord');
  assert.equal(mosaicRenderer.wrapText('superlongword tiny', 5, 3), 'super\ntiny');
  assert.equal(mosaicRenderer.wrapText('alpha beta gamma', 6, 2), 'alpha\nbeta');
  assert.equal(mosaicRenderer.trimLines(['one', 'two', 'three'], 2, 4), 'one\ntwo...');
  assert.equal(mosaicRenderer.trimLines([], 2, 4), '');
  mosaicRenderer.applyRectEnterAnimation(animatable({ shape: {}, style: { opacity: 0.4 } }), mosaicTile, enabled);
  mosaicRenderer.applyRectEnterAnimation(animatable({ style: { opacity: 0.4 } }), mosaicTile, enabled);
  mosaicRenderer.animateGraphicProperty({ style: {}, animate: () => null }, 'style', enabled, { opacity: 0.8 });
  coverFadeAnimation(mosaicRenderer, enabled, disabled);
  coverHover(mosaicRenderer);

  const nestedParams = { name: 'Ring', value: 2, data: {} };
  assert.equal(nestedCircleRenderer.formatLabel(({ name }) => name, nestedParams), 'Ring');
  assert.equal(nestedCircleRenderer.formatLabel('{b}:{c}', { ...nestedParams, value: null }), 'Ring:');
  assert.equal(nestedCircleRenderer.wrapText('singleword', 4), 'sing\nlewo\nrd');
  assert.equal(nestedCircleRenderer.wrapText('alpha superlongword beta', 6), 'alpha\nsuperl\nongwor\nd beta');
  assert.equal(nestedCircleRenderer.wrapText('superlongword tiny', 5), 'super\nlongw\nord\ntiny');
  assert.deepEqual(nestedCircleRenderer.wrapLongWord('abc', 0), ['a', 'b', 'c']);
  coverCircleAndFadeAnimation(nestedCircleRenderer, enabled, disabled);
  coverHover(nestedCircleRenderer);

  const circleNode = { raw: { itemStyle: { color: '#123' } }, name: 'Circle', value: 9, r: 30, dataIndex: 0 };
  assert.equal(circlePackingRenderer.formatLabel(({ name }) => name, circleNode), 'Circle');
  assert.equal(circlePackingRenderer.formatLabel('{b}:{c}', { ...circleNode, value: null }), 'Circle:null');
  assert.equal(circlePackingRenderer.wrapText('alpha beta gamma', 30, 10, 20).length > 0, true);
  assert.equal(circlePackingRenderer.wrapText('singleverylongword', 30, 10, 20).length > 0, true);
  assert.equal(circlePackingRenderer.wrapText('superlongword tiny', 4, 10, 40), 'superlongword\ntiny');
  assert.equal(circlePackingRenderer.readRawItemStyle(circleNode.raw).color, '#123');
  coverCircleAndFadeAnimation(circlePackingRenderer, enabled, disabled);
  coverHover(circlePackingRenderer);

  const packLabel = { raw: {}, name: 'Pack', value: 6, r: 24, dataIndex: 0 };
  assert.equal(packBubbleRenderer.formatLabel(({ name }) => name, packLabel), 'Pack');
  assert.equal(packBubbleRenderer.wrapText('alpha beta gamma', 30, 10, 20).length > 0, true);
  assert.equal(packBubbleRenderer.wrapText('superlongword tiny', 4, 10, 40), 'superlongword\ntiny');
  coverCircleAndFadeAnimation(packBubbleRenderer, enabled, disabled, { totalDuration: 0 });
  const packTracker = { totalDuration: 0 };
  packBubbleRenderer.trackEnterAnimation(packTracker, { ...enabled, delay: -1, duration: 4 });
  assert.equal(packTracker.totalDuration, 4);
  coverHover(packBubbleRenderer);

  const flameNode = { raw: { itemStyle: { color: '#abc' } }, name: 'Flame', value: 4, width: 20, dataIndex: 0 };
  assert.equal(flameRenderer.formatLabel('{b}:{c}', flameNode), 'Flame:4');
  assert.equal(flameRenderer.formatLabel(null, { ...flameNode, name: '' }), '');
  assert.equal(flameRenderer.ellipsize('abcdef', 4), 'abc...');
  flameRenderer.applyRectEnterAnimation(animatable({ shape: {}, style: { opacity: 0.3 } }), flameNode, enabled);
  flameRenderer.applyRectEnterAnimation(animatable({ style: { opacity: 0.3 } }), flameNode, enabled);
  coverFadeAnimation(flameRenderer, enabled, disabled);
  coverHover(flameRenderer);

  assert.equal(vennRenderer.formatLabel(({ name }) => name, { name: 'V', value: 2 }), 'V');
  assert.equal(vennRenderer.formatLabel('{b}:{c}', { name: 'V', value: null }), 'V:');
  coverCircleAndFadeAnimation(vennRenderer, enabled, disabled);
  coverHover(vennRenderer);

  assert.equal(spiralRenderer.formatLabel(({ name }) => name, { name: 'S', value: 1 }), 'S');
  assert.equal(spiralRenderer.formatLabel('{b}:{c}', { name: 'S', value: null }), 'S:null');
  const spiralAnimated = animatable({ style: {} });
  spiralRenderer.animateGraphicProperty(spiralAnimated, 'style', enabled, { opacity: 0.5 });
  assert.equal(spiralAnimated.style.opacity, 0.5);
  const spiralFallback = { style: {}, animate: () => null };
  spiralRenderer.animateGraphicProperty(spiralFallback, 'style', enabled, { opacity: 0.7 });
  assert.equal(spiralFallback.style.opacity, undefined);
  assert.equal(spiralRenderer.resolveAnimationValue(() => 7, 0, 1), 7);
  assert.equal(spiralRenderer.disabledAnimation().enabled, false);

  const hostWithPath = graphicHost();
  const vectorItem = { startX: 0, startY: 0, endX: 1.23456, endY: 2, headLeftX: 1, headLeftY: 1, headRightX: 2, headRightY: 1 };
  assert.equal(vectorFieldRenderer.createArrowElement(hostWithPath, vectorItem, {}).type, 'path');
  const hostWithoutPath = graphicHost();
  hostWithoutPath.graphic.makePath = null;
  assert.equal(vectorFieldRenderer.createArrowElement(hostWithoutPath, vectorItem, {}).type, 'line');
  vectorFieldRenderer.animateEnter({}, 0, enabled);
  const noVectorAnimator = { style: {}, animate: () => null };
  vectorFieldRenderer.animateEnter(noVectorAnimator, 0, enabled);
  assert.equal(noVectorAnimator.style.opacity, 1);
  const vectorMissingStyle = { animate: () => null };
  vectorFieldRenderer.animateEnter(vectorMissingStyle, 0, enabled);
  assert.equal(vectorMissingStyle.style.opacity, 1);
  assert.deepEqual(vectorFieldRenderer.readLayoutOption({ get: () => undefined }, { width: 100, height: 80 }), {
    data: [],
    width: 100,
    height: 80
  });
  const vectorSeries = series({}, [{}]);
  const vectorGroup = new hostWithPath.graphic.Group();
  assert.equal(vectorFieldRenderer.drawVectorField(hostWithPath, vectorGroup, vectorSeries.model, {
    items: [
      { ...vectorItem, dataIndex: -1 },
      { ...vectorItem, dataIndex: 99 }
    ]
  }, { x: 0, y: 0, width: 100, height: 80 }).length, 0);
  assert.equal(vectorFieldRenderer.resolveEnterAnimation(model({ animation: false }), 0).enabled, false);
  assert.equal(vectorFieldRenderer.resolveAnimationValue(() => 'bad', 0, 4), 4);
  assert.deepEqual(vectorFieldRenderer.asRecord([]), {});
  assert.equal(vectorFieldRenderer.formatPathNumber(1.23456), '1.235');
});

test('smith private helpers cover layout and renderer fallback branches', () => {
  const enabled = { enabled: true, duration: 5, delay: 2, easing: 'linear' };
  const disabled = { enabled: false, duration: 0, delay: 0, easing: 'cubicOut' };
  const host = graphicHost();
  const group = new host.graphic.Group();

  assert.deepEqual(smithLayout.impedanceToGamma(-1, 0), { real: 1, imag: 0, magnitude: 1, angle: 0 });
  assert.deepEqual(smithLayout.gammaToImpedance(1, 0), { r: Infinity, x: 0 });
  assert.equal(smithLayout.__test__.readDataType('other'), undefined);
  assert.equal(smithLayout.__test__.readField({ a: 1 }, 0, undefined, -1, ['a']), undefined);
  assert.equal(smithLayout.__test__.readField(['a'], 0, undefined, -1, []), 'a');
  assert.equal(smithLayout.__test__.readField(7, 'a', undefined, 0, []), undefined);
  assert.deepEqual(smithLayout.__test__.readPair([null, 2]), null);
  assert.deepEqual(smithLayout.__test__.readPair([3]), [3, 0]);
  assert.deepEqual(smithLayout.__test__.readPair({ re: '2', im: '-1' }), [2, -1]);
  assert.deepEqual(smithLayout.__test__.readPair({ real: 3 }), [3, 0]);
  assert.deepEqual(smithLayout.__test__.readPair({ resistance: 3, reactance: 4 }), [3, 4]);
  assert.equal(smithLayout.__test__.readPair({}), null);
  assert.deepEqual(smithLayout.__test__.readNormalizedImpedance({ r: 2 }, {}, undefined, 1), { r: 2, x: 0 });
  assert.deepEqual(smithLayout.__test__.normalizePadding({ top: 1, right: 2, bottom: 3, left: 4 }), { top: 1, right: 2, bottom: 3, left: 4 });
  assert.deepEqual(smithLayout.__test__.readPaddingOption({ top: '5', right: 'bad' }), { top: 5, right: undefined, bottom: undefined, left: undefined });
  assert.deepEqual(smithLayout.__test__.normalizeResistanceValues([2, 2, -1, 0]), [0, 2]);
  assert.deepEqual(smithLayout.__test__.normalizeReactanceValues([0, 1, 1, -1]), [-1, 1]);
  assert.equal(smithLayout.__test__.stringifyName(7), '7');
  assert.equal(smithLayout.__test__.finiteNumber('8', 1), 8);
  assert.equal(smithLayout.__test__.finiteNumber('', 1), 1);
  assert.equal(smithLayout.__test__.cleanNumber(-0), 0);
  assert.equal(smithLayout.__test__.cleanNumber(1), 1);
  assert.equal(smithLayout.__test__.createReactanceArc(0, 10, 10, 5).clockwise, false);
  assert.equal(smithLayout.__test__.resolveSwrCircle({ showSwrCircle: true }, [], 0, 0, 10)?.magnitude, 0);
  assert.equal(smithLayout.resolveSmithChartLayout({ data: null }).points.length, 0);

  const layout = smithLayout.resolveSmithChartLayout({
    data: [
      { z: [2, 1], id: 12 },
      { label: 'Gamma', gammaReal: 2, gammaImag: 0 },
      { label: 'RealOnly', gammaReal: 0.2 },
      42,
      { other: true }
    ],
    layout: {
      width: 260,
      height: 240,
      padding: { top: 12, right: 14, bottom: 16, left: 18 },
      dataType: 'gamma',
      showSwrCircle: true,
      swrIndex: 10,
      resistanceValues: [0, 1, 1],
      reactanceValues: [-1, 0, 1]
    }
  });
  assert.equal(layout.points.length, 2);
  assert.equal(layout.swrCircle?.magnitude, 0.2);

  const impedanceLayout = smithLayout.layoutSmithChart([
    { impedance: { resistance: 3, reactance: -1 } },
    { r: null }
  ], {
    width: 220,
    height: 220,
    padding: 20,
    showSwrCircle: true,
    swrMagnitude: 2
  });
  assert.equal(impedanceLayout.points.length, 1);
  assert.equal(impedanceLayout.swrCircle?.magnitude, 1);

  const smithSeries = series({
    data: [{ name: 'A', r: 1, x: 0, itemStyle: { color: '#123' } }],
    label: { show: true, formatter: '{b}:{c}:{r}:{x}:{gamma}' },
    grid: { label: { show: true, formatter: (value) => `g${value}` } },
    itemStyle: { borderColor: '#fff', borderWidth: 2, opacity: 0.8 },
    lineStyle: { color: '', width: 0 },
    enterAnimation: { show: false }
  }, [{ name: 'A', itemStyle: { color: '#123' } }]);
  const smithPoint = {
    ...impedanceLayout.points[0],
    id: '',
    name: 'A',
    dataIndex: 0
  };

  assert.deepEqual(smithRenderer.readLayoutOption(model({}), { width: 10, height: 20 }), {
    data: [],
    layout: undefined,
    layoutOptions: {},
    width: 10,
    height: 20
  });
  assert.deepEqual(smithRenderer.readLayoutOption({ get: () => undefined }, { width: 5, height: 6 }), {
    data: [],
    layout: undefined,
    layoutOptions: {},
    width: 5,
    height: 6
  });
  const reactanceLabel = smithRenderer.createAxisLabelParams('reactance', -1, 50);
  assert.equal(smithRenderer.formatAxisLabel('{ohms}j', reactanceLabel), '-50j');
  assert.equal(smithRenderer.formatAxisLabel('{value}:{normalized}:{impedance}:{referenceImpedance}:{axis}', reactanceLabel), '-1:-1:-50:50:reactance');
  assert.equal(smithRenderer.formatAxisLabel((value) => `v${value}`, 2), 'v2');
  assert.equal(smithRenderer.formatAxisLabel(null, 2), '2');
  assert.equal(smithRenderer.formatAxisNumber(-0), '0');
  assert.equal(smithRenderer.normalizeAxisLabelParams(reactanceLabel).axis, 'reactance');
  assert.equal(smithRenderer.formatLabel(({ name }) => name, smithPoint), 'A');
  assert.equal(smithRenderer.formatLabel('{b}:{c}:{r}:{x}:{gamma}', smithPoint), 'A:3-j1:3:-1:0.529,-0.118');
  assert.equal(smithRenderer.formatLabel(null, smithPoint), 'A');
  assert.equal(smithRenderer.formatImpedance(smithPoint), '3-j1');
  assert.equal(smithRenderer.smithPointKey({ ...smithPoint, id: '', name: '' }), 'item-0');
  assert.equal(JSON.stringify(smithRenderer.readLineDash('dotted')), '[1.5,5]');
  assert.equal(smithRenderer.readLineDash('solid'), null);
  assert.equal(smithRenderer.readLineStyle(model({ stroke: '#abc', lineWidth: '3', opacity: '0.5' }), {}).stroke, '#abc');
  assert.equal(smithRenderer.readLineStyle(model({}), { color: '#def' }).stroke, '#def');
  assert.deepEqual(smithRenderer.resolveCursorLineStyle(model({}), { lineDash: [5, 6] }).lineDash, [5, 6]);
  assert.equal(smithRenderer.resolveCursorLineStyle(model({ type: 'solid' }), { lineDash: [5, 6] }).lineDash, null);
  assert.equal(smithRenderer.readPointStyle(smithSeries.data, smithSeries.model, model({ itemStyle: { color: '#123' } }), smithPoint).fill, '#123');
  assert.equal(smithRenderer.readPointStyle(data([{ style: { fill: '#456' } }]), model({ itemStyle: {} }), model({}), smithPoint).fill, '#456');
  assert.equal(smithRenderer.readEnterAnimation(model({ animation: false }), 0).enabled, false);
  assert.equal(smithRenderer.readEnterAnimation(model({ enterAnimation: { enabled: false } }), 0).enabled, false);
  assert.equal(smithRenderer.readEnterAnimation(model({ enterAnimation: { show: false } }), 0).enabled, false);
  assert.equal(smithRenderer.resolveAnimationNumber(() => '6', {}, 0, 1), 1);
  assert.equal(smithRenderer.resolveAnimationNumber(() => 6, {}, 0, 1), 6);
  assert.equal(smithRenderer.resolveAnimationEasing(''), 'cubicOut');
  assert.equal(smithRenderer.disabledEnterAnimation().enabled, false);
  assert.equal(JSON.stringify(smithRenderer.asRecord([])), '{}');
  assert.equal(smithRenderer.finiteNumber('8', 1), 1);
  assert.equal(smithRenderer.round(1.23456), 1.235);

  const fallbackHost = graphicHost();
  fallbackHost.graphic.Arc = undefined;
  assert.equal(smithRenderer.createArcElement(fallbackHost, impedanceLayout.reactanceArcs[0], {}).type, 'polyline');
  const sampledSmithArc = smithRenderer.sampleArcPoints(impedanceLayout.reactanceArcs.find((arc) => arc.value === 1));
  assert.equal(sampledSmithArc.length, 80);
  sampledSmithArc.forEach(([x, y]) => {
    assert.ok(Math.hypot(x - impedanceLayout.centerX, y - impedanceLayout.centerY) <= impedanceLayout.radius + 0.001);
  });
  const cursorLayout = smithLayout.layoutSmithChart([], {
    width: 500,
    height: 420,
    padding: 30,
    referenceImpedance: 50
  });
  const cursorState = smithRenderer.resolveSmithCursorState(
    cursorLayout.centerX + cursorLayout.radius * 0.2,
    cursorLayout.centerY - cursorLayout.radius * 0.4,
    cursorLayout
  );
  assert.equal(smithRenderer.resolveSmithCursorState(0, 0, cursorLayout), null);
  const shortCursorState = smithRenderer.resolveSmithCursorState(
    cursorLayout.centerX - cursorLayout.radius,
    cursorLayout.centerY,
    cursorLayout
  );
  assert.equal(shortCursorState.vswr, Infinity);
  assert.equal(shortCursorState.q, Infinity);
  assert.equal(smithRenderer.round(cursorState.impedance.real), 50);
  assert.equal(smithRenderer.round(cursorState.impedance.imag), 50);
  assert.equal(Math.round(cursorState.resistanceCircle.cx), cursorLayout.centerX + cursorLayout.radius / 2);
  assert.equal(Math.round(cursorState.resistanceCircle.cy), cursorLayout.centerY);
  assert.equal(Math.round(cursorState.resistanceCircle.r), cursorLayout.radius / 2);
  assert.equal(Math.round(Math.hypot(cursorState.x - cursorState.resistanceCircle.cx, cursorState.y - cursorState.resistanceCircle.cy)), Math.round(cursorState.resistanceCircle.r));
  assert.deepEqual(smithRenderer.createResistanceCursorCircle(cursorLayout, Infinity), {
    cx: cursorLayout.centerX + cursorLayout.radius,
    cy: cursorLayout.centerY,
    r: 0
  });
  assert.equal(smithRenderer.createResistanceCursorCircle(cursorLayout, -1).r, cursorLayout.radius);
  assert.equal(smithRenderer.round(cursorState.admittance.real), 0.01);
  assert.equal(smithRenderer.round(cursorState.admittance.imag), -0.01);
  assert.equal(smithRenderer.round(cursorState.q), 1);
  assert.match(smithRenderer.formatSmithCursorTooltip(cursorState), /阻抗 = 50 \+ 50j/);
  assert.match(smithRenderer.formatSmithCursorTooltip({ ...cursorState, vswr: Infinity, q: Infinity }), /VSWR = ∞/);
  assert.equal(smithRenderer.sampleReactanceCursorPoints(cursorLayout, 0, 1).every((point) => point[1] === cursorLayout.centerY), true);
  assert.equal(smithRenderer.sampleReactanceCursorPoints(cursorLayout, cursorState.normalized.x, cursorState.normalized.r).length, 81);
  assert.equal(smithRenderer.sampleReactanceCursorPoints(cursorLayout, cursorState.normalized.x).length, 80);
  assert.equal(smithRenderer.readCursorEventPoint({ offsetX: 12, offsetY: 13 }, { x: 2, y: 3, width: 10, height: 10 }).x, 10);
  assert.equal(smithRenderer.readCursorEventPoint({ zrX: 12, zrY: 13 }, { x: 2, y: 3, width: 10, height: 10 }).y, 10);
  assert.equal(smithRenderer.readCursorEventPoint({ event: { offsetX: 12, offsetY: 13 } }, { x: 2, y: 3, width: 10, height: 10 }).x, 10);
  assert.deepEqual(smithRenderer.readCursorEventPoint(
    { offsetX: 112, offsetY: 214 },
    { x: 10, y: 20, width: 100, height: 100 },
    { transformCoordToLocal: (x, y) => [x / 2 - 20, y / 2 - 30] }
  ), { x: 36, y: 77 });
  assert.equal(smithRenderer.readCursorEventPoint({}, { x: 2, y: 3, width: 10, height: 10 }), null);
  assert.deepEqual(smithRenderer.normalizeTooltipPadding(8), [8, 8, 8, 8]);
  assert.deepEqual(smithRenderer.normalizeTooltipPadding([1, 2]), [1, 2, 1, 2]);
  assert.deepEqual(smithRenderer.normalizeTooltipPadding([1, 2, 3, 4]), [1, 2, 3, 4]);
  assert.deepEqual(smithRenderer.normalizeTooltipPadding('x'), [10, 12, 10, 12]);
  assert.deepEqual(smithRenderer.placeTooltip(490, 390, 120, 90, cursorLayout), { x: 356, y: 286 });
  assert.equal(smithRenderer.estimateTooltipWidth(['阻抗 = 50 + 50j'], 14) > 100, true);
  assert.equal(smithRenderer.formatSignedNumber(-0), '0');
  assert.equal(smithRenderer.formatComplexValue({ real: 1, imag: -2 }), '1 - 2j');
  assert.equal(smithRenderer.invertComplex({ real: 0, imag: 0 }).real, Infinity);
  const directElement = {};
  smithRenderer.updateElement(directElement, {
    shape: { x: 1 },
    style: { fill: '#000' },
    invisible: true
  });
  assert.deepEqual(directElement.shape, { x: 1 });
  assert.deepEqual(directElement.style, { fill: '#000' });
  assert.equal(directElement.invisible, true);
  const attrElement = {
    captured: null,
    attr(attrs) {
      this.captured = attrs;
    }
  };
  smithRenderer.updateElement(attrElement, { invisible: false });
  assert.deepEqual(attrElement.captured, { invisible: false });
  const fallbackCursorGroup = new host.graphic.Group();
  const fallbackCursorElements = smithRenderer.createSmithCursorElements(host, fallbackCursorGroup, model({ cursor: {} }));
  smithRenderer.updateSmithCursorElements(fallbackCursorElements, model({ cursor: {} }), cursorLayout, cursorState);
  assert.equal(fallbackCursorElements.tooltipText.style.fill, '#ffffff');
  assert.equal(fallbackCursorElements.tooltipText.style.fontFamily, 'sans-serif');
  smithRenderer.updateSmithCursorElements(fallbackCursorElements, model({ cursor: { tooltip: { show: false } } }), cursorLayout, cursorState);
  assert.equal(fallbackCursorElements.tooltipText.invisible, true);

  const zrHandlers = {};
  const zrender = {
    on(eventName, handler) {
      zrHandlers[eventName] = handler;
    },
    off(eventName, handler) {
      if (zrHandlers[eventName] === handler) delete zrHandlers[eventName];
    }
  };
  const cursorGroup = new host.graphic.Group();
  const cursorController = smithRenderer.installSmithCursor(
    host,
    cursorGroup,
    model({
      cursor: {
        lineStyle: { color: '#111', width: 2 },
        tooltip: { fontSize: 13, padding: [6, 8], backgroundColor: '#010101', color: '#fff' }
      }
    }),
    cursorLayout,
    { x: 5, y: 7, width: cursorLayout.width, height: cursorLayout.height },
    zrender
  );
  zrHandlers.mousemove({ offsetX: 5 + cursorLayout.centerX, offsetY: 7 + cursorLayout.centerY });
  const cursorRoot = cursorGroup.children()[0];
  assert.equal(cursorRoot.invisible, false);
  assert.equal(cursorRoot.children().every((element) => element.invisible !== true), true);
  zrHandlers.mousemove({ offsetX: 5, offsetY: 7 });
  assert.equal(cursorRoot.invisible, true);
  assert.equal(cursorRoot.children().every((element) => element.invisible === true), true);
  zrHandlers.mousemove({});
  assert.equal(cursorRoot.invisible, true);
  assert.equal(cursorRoot.children().every((element) => element.invisible === true), true);
  zrHandlers.mousemove({ offsetX: 5 + cursorLayout.centerX, offsetY: 7 + cursorLayout.centerY });
  assert.equal(cursorRoot.invisible, false);
  assert.equal(cursorRoot.children()[0].invisible, false);
  assert.equal(cursorRoot.children()[1].invisible, false);
  zrHandlers.globalout();
  assert.equal(cursorRoot.invisible, true);
  assert.equal(cursorRoot.children().every((element) => element.invisible === true), true);
  cursorController.dispose();
  assert.equal(zrHandlers.mousemove, undefined);
  assert.equal(smithRenderer.installSmithCursor(host, cursorGroup, model({ silent: true }), cursorLayout, { x: 0, y: 0, width: 1, height: 1 }, zrender), undefined);
  assert.equal(smithRenderer.installSmithCursor(host, cursorGroup, model({ cursor: { show: false } }), cursorLayout, { x: 0, y: 0, width: 1, height: 1 }, zrender), undefined);
  assert.equal(smithRenderer.installSmithCursor(host, cursorGroup, model({}), cursorLayout, { x: 0, y: 0, width: 1, height: 1 }, null), undefined);
  smithRenderer.drawGridLabels(host, group, model({ label: { show: false } }), impedanceLayout);
  smithRenderer.drawGrid(host, group, model({
    grid: {
      axisLine: { show: false },
      resistanceLine: { show: false },
      reactanceLine: { show: false },
      label: { show: false }
    }
  }), impedanceLayout);
  smithRenderer.drawSwrCircle(host, group, smithSeries.model, impedanceLayout);
  assert.equal(smithRenderer.drawSeriesLine(host, group, smithSeries.model, { ...impedanceLayout, points: [smithPoint, { ...smithPoint, x: 2 }] }), null);
  assert.equal(smithRenderer.drawPoints(host, group, series({ silent: true, symbolSize: 4 }, [{}]).model, {
    ...impedanceLayout,
    points: [
      { ...smithPoint, dataIndex: -1 },
      { ...smithPoint, dataIndex: 0 }
    ]
  }, { x: 1, y: 2, width: 10, height: 10 }, null).length, 0);
  smithRenderer.drawPointLabels(host, group, model({ label: { show: false } }), [smithPoint], new Map());
  coverCircleAndFadeAnimation(smithRenderer, enabled, disabled);
  smithRenderer.applyCircleEnterAnimation(animatable({ shape: undefined }), 4, enabled);
  smithRenderer.applyFadeEnterAnimation(animatable({ style: undefined }), enabled);
  const fallback = { style: {}, animate: () => null };
  smithRenderer.animateGraphicProperty(fallback, 'style', enabled, { opacity: 0.7 });
  assert.equal(fallback.style.opacity, 0.7);
  smithRenderer.animateGraphicProperty({ animate: () => null }, 'style', enabled, { opacity: 0.5 });
  coverHover(smithRenderer);
  smithRenderer.addHoverElement({ elements: [], triggerElements: [] }, {});
});

test('direct renderer exports cover draw guards, style fallbacks, and disabled animation branches', () => {
  const enabled = { enabled: true, duration: 5, delay: 2, easing: 'linear' };
  const host = graphicHost();
  const group = new host.graphic.Group();
  const rect = { x: 1, y: 2, width: 100, height: 80 };
  const basePoint = {
    raw: {},
    id: '',
    name: 'Point',
    value: 7,
    category: '',
    x: 20,
    y: 30,
    x0: 0,
    y0: 0,
    baseX: 10,
    baseY: 40,
    radius: 5,
    centerY: 25,
    dataIndex: 0
  };

  const bee = series({
    grid: { show: true },
    valueAxis: {
      show: true,
      splitLine: { show: false },
      axisLine: { show: false },
      label: { show: false },
      name: 'Value',
      nameTextStyle: {}
    },
    categoryAxis: { show: true, label: { show: false } },
    label: { show: true },
    itemStyle: {},
    enterAnimation: { show: false }
  }, [{ label: { show: false } }, {}]);
  const beeLayout = {
    orient: 'horizontal',
    plot: { left: 10, right: 110, top: 10, bottom: 70, width: 100, height: 60 },
    ticks: [{ value: 1, x: 20, y: 50, x1: 10, x2: 110, y1: 10, y2: 70 }],
    categoryLabels: [{ name: 'A', value: 'A', x: 20, y: 74, align: 'center', verticalAlign: 'top' }],
    points: []
  };
  beeswarmRenderer.drawAxes(host, group, bee.model, beeLayout);
  beeswarmRenderer.drawValueAxisLabels(host, group, model({ label: { show: true }, name: 'Horizontal', nameTextStyle: {} }), beeLayout);
  beeswarmRenderer.drawValueAxisLabels(host, group, model({
    label: { show: true, color: '#111', fontWeight: 700 },
    name: 'Styled',
    nameTextStyle: { color: '#222', fontWeight: 800 }
  }), {
    ...beeLayout,
    orient: 'vertical'
  });
  beeswarmRenderer.drawValueAxisLabels(host, group, model({
    label: { show: true },
    name: 'Fallbacks',
    nameTextStyle: {}
  }), {
    ...beeLayout,
    orient: 'vertical'
  });
  beeswarmRenderer.drawCategoryAxisLabels(host, group, model({ label: { show: true, rotate: 45 } }), {
    ...beeLayout,
    orient: 'vertical'
  });
  beeswarmRenderer.drawPointLabels(host, group, bee.model, [
    { ...basePoint, dataIndex: 0 },
    { ...basePoint, dataIndex: 1, y: 10 }
  ], new Map([[1, { elements: [] }]]));
  beeswarmRenderer.drawPoints(host, group, bee.model, {
    ...beeLayout,
    points: [{ ...basePoint, dataIndex: -1 }, { ...basePoint, dataIndex: 99 }]
  }, rect);
  assert.equal(beeswarmRenderer.readLineStyle(model({}), { color: '#fallback' }).stroke, '#fallback');
  assert.equal(beeswarmRenderer.readPointStyle(data([{}]), model({ itemStyle: {} }), model({ itemStyle: {} }), basePoint, 99).fill, '#2ca02c');
  assert.equal(beeswarmRenderer.readEnterAnimation(bee.model, 0).enabled, false);
  assert.deepEqual(beeswarmRenderer.readLayoutOption({ get: () => undefined }, rect), {
    data: [],
    layout: undefined,
    layoutOptions: {},
    width: 100,
    height: 80
  });
  const noOptionBee = model();
  delete noOptionBee.option;
  assert.deepEqual(beeswarmRenderer.readLayoutOption(noOptionBee, rect), {
    data: [],
    layout: undefined,
    layoutOptions: {},
    width: 100,
    height: 80
  });
  beeswarmRenderer.applyCircleEnterAnimation(animatable({ shape: undefined, style: undefined }), 4, enabled);
  beeswarmRenderer.applyFadeEnterAnimation(animatable({ style: undefined }), enabled);
  const beeMissingShape = { animate: () => null };
  beeswarmRenderer.animateGraphicProperty(beeMissingShape, 'shape', enabled, { r: 4 });
  assert.equal(beeMissingShape.shape, undefined);
  assert.deepEqual(beeswarmRenderer.asRecord([]), {});
  assert.equal(beeswarmRenderer.finiteNumber('6', 0), 6);
  assert.equal(beeswarmRenderer.finiteNumber('bad', 1), 1);

  const lolli = series({
    valueAxis: { show: true, splitLine: { show: false }, axisLine: { show: false }, label: { show: false }, name: 'Axis', nameTextStyle: {} },
    categoryAxis: { show: true, label: { show: false } },
    label: { show: true },
    itemStyle: {},
    stemStyle: {},
    enterAnimation: { enabled: false },
    silent: true,
    large: true,
    symbolSize: 8
  }, [{ label: { show: false } }, {}]);
  const lolliLayout = {
    plot: { left: 10, right: 110, top: 10, bottom: 70, width: 100, height: 60 },
    baselineY: 50,
    ticks: [{ value: 1, x1: 10, x2: 110, y: 50 }],
    categoryLabels: [{ name: 'A', value: 'A', x: 20, y: 74 }],
    points: [
      { ...basePoint, id: '', name: '', category: '', dataIndex: 0 },
      { ...basePoint, id: 'inserted', name: 'Inserted', category: 'C', dataIndex: 1, y: 60 }
    ]
  };
  lollipopRenderer.drawAxes(host, group, lolli.model, lolliLayout);
  lollipopRenderer.drawValueAxisLabels(host, group, model({
    label: { show: true },
    name: 'Styled',
    nameTextStyle: { color: '#333', fontWeight: 900 }
  }), lolliLayout);
  lollipopRenderer.drawValueAxisLabels(host, group, model({
    label: { show: true },
    name: 'Fallbacks',
    nameTextStyle: {}
  }), lolliLayout);
  lollipopRenderer.drawCategoryAxisLabels(host, group, model({
    label: { show: true, color: '#444', fontWeight: 700, rotate: 0 }
  }), lolliLayout);
  lollipopRenderer.drawPointLabels(host, group, lolli.model, lolliLayout.points, new Map([[1, { elements: [] }]]));
  lollipopRenderer.drawPoints(host, group, lolli.model, lolliLayout, rect, new Set(['missing']), lolli.model);
  assert.equal(lollipopRenderer.drawMergedStems({ graphic: { ...host.graphic, makePath: null } }, group, lolli.model, lolliLayout.points), false);
  assert.equal(lollipopRenderer.drawMergedStems(host, group, lolli.model, [{ ...basePoint, dataIndex: -1 }]), false);
  assert.deepEqual(lollipopRenderer.drawPoints(host, new host.graphic.Group(), lolli.model, {
    ...lolliLayout,
    points: [
      { ...basePoint, dataIndex: -1 },
      { ...basePoint, dataIndex: 99 }
    ]
  }, rect), []);
  assert.equal(lollipopRenderer.lollipopPointKey({ ...basePoint, id: '', name: '', category: '', dataIndex: 4 }), 'item-4');
  assert.equal(lollipopRenderer.readLineStyle(model({}), { color: '#fallback' }).stroke, '#fallback');
  assert.equal(lollipopRenderer.readPointStyle(data([{}]), model({ itemStyle: {} }), model({ itemStyle: {} }), basePoint).stroke, '#2db5ff');
  assert.equal(lollipopRenderer.readEnterAnimation(lolli.model, 0).enabled, false);
  assert.deepEqual(lollipopRenderer.readLayoutOption({ get: () => undefined }, rect), {
    data: [],
    layout: undefined,
    layoutOptions: {},
    width: 100,
    height: 80
  });
  lollipopRenderer.applyStemEnterAnimation(animatable({ shape: undefined }), basePoint, enabled);
  lollipopRenderer.applyCircleEnterAnimation(animatable({ shape: undefined, style: undefined }), 4, enabled);
  lollipopRenderer.applyFadeEnterAnimation(animatable({ style: undefined }), enabled);
  const lollipopMissingShape = { animate: () => null };
  lollipopRenderer.animateGraphicProperty(lollipopMissingShape, 'shape', enabled, { r: 4 });
  assert.equal(lollipopMissingShape.shape, undefined);
  assert.deepEqual(lollipopRenderer.asRecord([]), {});

  const mosaic = series({
    itemStyle: {},
    label: { show: true, formatter: '{b}', fontSize: 20 },
    enterAnimation: { show: false }
  }, [{ label: { show: false } }, {}, { itemStyle: { color: '#123' }, custom: 'visual' }]);
  const mosaicTiles = [
    { raw: {}, name: 'Hidden', value: 1, percent: 0.1, columnPercent: 0.2, xCategory: 'X', yCategory: 'Y', x: 0, y: 0, width: 80, height: 40, color: '#aaa', dataIndex: 0 },
    { raw: {}, name: 'Tiny', value: 1, percent: 0.1, columnPercent: 0.2, xCategory: 'X', yCategory: 'Y', x: 0, y: 0, width: 4, height: 4, color: '#bbb', dataIndex: 1 },
    { raw: {}, name: 'Shown', value: 1, percent: 0.1, columnPercent: 0.2, xCategory: 'X', yCategory: 'Y', x: 0, y: 0, width: 90, height: 60, color: '#ccc', dataIndex: 2 },
    { raw: {}, name: 'NoData', value: 1, percent: 0.1, columnPercent: 0.2, xCategory: 'X', yCategory: 'Y', x: 0, y: 0, width: 90, height: 60, color: '', dataIndex: -1 }
  ];
  mosaicRenderer.drawLabels(host, group, series({ label: { show: false } }, mosaic.data.source).model, mosaic.data, mosaicTiles, new Map());
  mosaicRenderer.drawLabels(host, group, mosaic.model, mosaic.data, mosaicTiles, new Map([[2, { elements: [] }]]));
  mosaicRenderer.drawMosaic(host, group, mosaic.model, { tiles: mosaicTiles }, rect);
  assert.equal(mosaicRenderer.wrapText('aa bbbb cc dd', 3, 2), 'aa\nbbb');
  assert.equal(mosaicRenderer.trimLines(['abcdef', 'ghij', 'kl'], 2, 4), 'abcdef\nghi...');
  assert.equal(mosaicRenderer.readTileStyle(data([{}]), model({ itemStyle: {} }), null, { ...mosaicTiles[3], color: '' }, 2).fill, '#59a14f');
  assert.equal(mosaicRenderer.createLegendVisualProvider(mosaic.model).getItemVisual(2, 'custom'), 'visual');
  assert.equal(mosaicRenderer.readEnterAnimation(mosaic.model, 0).enabled, false);
  assert.equal(mosaicRenderer.resolveAnimationNumber(() => 9, {}, 0, 1), 9);
  const noOptionMosaic = model();
  delete noOptionMosaic.option;
  assert.deepEqual(mosaicRenderer.readLayoutOption(noOptionMosaic, rect), {
    data: [],
    layout: undefined,
    layoutOptions: {},
    width: 100,
    height: 80
  });
  mosaicRenderer.applyRectEnterAnimation(animatable({ shape: undefined, style: undefined }), mosaicTiles[0], enabled);
  mosaicRenderer.applyFadeEnterAnimation(animatable({ style: undefined }), enabled);
  assert.equal(mosaicRenderer.createLegendVisualProvider(mosaic.model).getItemVisual(1, 'style').fill, '#f28e8c');
  assert.doesNotThrow(() => mosaicRenderer.animateGraphicProperty({ animate: () => null }, 'style', enabled, { opacity: 0.8 }));

  const venn = series({
    itemStyle: {},
    label: { show: true },
    enterAnimation: { enabled: false }
  }, [{ name: 'A' }, { name: 'B', itemStyle: { borderColor: '#222', borderWidth: 3, opacity: 0.4 } }]);
  const vennLayout = {
    mode: 'bubble',
    circles: [
      { id: 'A', name: 'A', setKey: 'A', sets: ['A'], x: 20, y: 20, r: 10, dataIndex: 0, value: 1 },
      { id: 'B', name: 'B', setKey: 'B', sets: ['B'], x: 50, y: 20, r: 12, dataIndex: 1, value: 2 }
    ],
    labels: [
      { name: 'A', value: 1, x: 20, y: 20, dataIndex: 0, setKey: 'A', sets: ['A'] },
      { name: 'AB', value: 1, x: 35, y: 20, dataIndex: 1, setKey: 'A&B', sets: ['A', 'A', 'missing'] }
    ]
  };
  const vennHover = [];
  vennRenderer.drawBubbleVenn(host, group, venn.model, venn.data, vennLayout, vennHover, new Map());
  assert.equal(vennHover.length, 2);
  assert.equal(vennRenderer.collectRelatedCircleElements(vennLayout.labels[1], new Map([['A', { id: 'circle' }]])).length, 1);
  assert.equal(vennRenderer.findDataIndexForCircle({ setKey: 'missing' }, vennLayout.labels, 4), 4);
  assert.equal(vennRenderer.readBubbleCircleStyle(data([{}]), model({ itemStyle: {} }), model({ itemStyle: {} }), 0, 7).fill, '#8cd17d');
  assert.equal(vennRenderer.readBubbleCircleStyle(data([{ style: { fill: '#vis' } }]), model({ itemStyle: { borderColor: '#normal' } }), model({ itemStyle: {} }), 0, 0).stroke, '#normal');
  assert.equal(vennRenderer.createLegendVisualProvider(venn.model).getItemVisual(1, 'name'), 'B');
  assert.equal(vennRenderer.readEnterAnimation(venn.model, 0).enabled, false);
  vennRenderer.applyCircleEnterAnimation(animatable({ shape: undefined, style: undefined }), 4, enabled);
  vennRenderer.applyFadeEnterAnimation(animatable({ style: undefined }), enabled);

  const spiral = series({
    label: { show: true, position: 'inside' },
    itemStyle: {},
    minOpacity: 0.2,
    maxOpacity: 0.8,
    enterAnimation: { enabled: false },
    animation: false
  }, [{ label: { show: false } }, {}]);
  const segment = {
    raw: {},
    name: 'Segment',
    value: 3,
    dataIndex: 1,
    animationOrder: 1,
    path: 'M0 0L1 1',
    x: 30,
    y: 30,
    labelX: 40,
    labelY: 40,
    labelAlign: 'left',
    labelVerticalAlign: 'middle',
    innerRadius: 10,
    outerRadius: 20,
    valueRatio: 0.5
  };
  spiralRenderer.resetAliveRenderForReplay({ __enterReplayKey: 'old' }, model({ enterAnimation: { replayKey: 'new' } }), group);
  assert.equal(spiralRenderer.createSegmentElement({ graphic: { ...host.graphic, makePath: null } }, segment, {}).type, 'circle');
  assert.equal(spiralRenderer.createLabelElement(host, spiral.model, model({ label: { show: false } }), segment), null);
  assert.equal(spiralRenderer.createLabelElement(host, spiral.model, model({ label: { show: true, position: 'outside' } }), segment).style.align, 'left');
  const insideLabel = spiralRenderer.createLabelElement(host, spiral.model, model({ label: { show: true } }), segment);
  assert.equal(insideLabel.style.x, segment.x);
  assert.equal(insideLabel.style.align, 'center');
  assert.equal(spiralRenderer.resolveEnterAnimation(spiral.model, 1).enabled, false);
  const noOptionSpiral = model();
  delete noOptionSpiral.option;
  assert.deepEqual(spiralRenderer.readLayoutOption(noOptionSpiral, rect), {
    data: [],
    width: 100,
    height: 80
  });
  assert.equal(spiralRenderer.scaledOpacity(model({ minOpacity: -1, maxOpacity: 2 }), 0.5), 0.5);
  assert.equal(spiralRenderer.readSegmentStyle(data([{}]), model({ itemStyle: {} }), model({ itemStyle: {} }), segment, 4).fill, '#dc2626');
  assert.equal(spiralRenderer.drawSpiral(host, group, spiral.model, { segments: [{ ...segment, dataIndex: -1 }] }, rect, { totalDuration: 0 }).length, 0);
  const noStyleElement = animatable({});
  delete noStyleElement.style;
  spiralRenderer.applyFadeEnterAnimation(noStyleElement, enabled, { totalDuration: 0 });
  assert.equal(noStyleElement.style.opacity, 1);
  const spiralHoverOptions = spiralRenderer.createSpiralHoverOptions({ __spiralEntering: true }, { getZr: () => 'zr' });
  assert.equal(spiralHoverOptions.dimOpacity, 0.2);
  assert.equal(spiralHoverOptions.zrender, 'zr');
  assert.equal(spiralHoverOptions.enabled(), false);
  const duplicateElement = {};
  const silentSnapshots = spiralRenderer.silenceSpiralHoverElements([{ elements: [null, duplicateElement, duplicateElement], triggerElements: [duplicateElement] }]);
  assert.equal(silentSnapshots.length, 1);
  spiralRenderer.restoreSpiralHoverElements(silentSnapshots);
  assert.equal(spiralRenderer.asRecord({ ok: true }).ok, true);
  assert.deepEqual(spiralRenderer.asRecord([]), {});

  vi.useFakeTimers();
  try {
    const token = {};
    const gatedElement = {};
    const gatedView = { __renderToken: token };
    spiralRenderer.startSpiralEnterGate(gatedView, token, 5, [{ elements: [gatedElement] }]);
    assert.equal(gatedView.__spiralEntering, true);
    assert.equal(gatedElement.silent, true);
    vi.advanceTimersByTime(5);
    assert.equal(gatedView.__spiralEntering, false);
    assert.equal('silent' in gatedElement, false);
  } finally {
    vi.useRealTimers();
  }
  vi.useFakeTimers();
  try {
    const token = {};
    const staleView = { __renderToken: {} };
    spiralRenderer.startSpiralEnterGate(staleView, token, 5, []);
    vi.advanceTimersByTime(5);
    assert.equal(staleView.__spiralEntering, true);
    spiralRenderer.clearSpiralEnterGate(staleView);
  } finally {
    vi.useRealTimers();
  }
});

test('direct renderer exports cover hierarchical fallback render branches', () => {
  const enabled = { enabled: true, duration: 5, delay: 2, easing: 'linear' };
  const host = graphicHost();
  const group = new host.graphic.Group();
  const rect = { x: 2, y: 3, width: 100, height: 80 };

  assert.equal(circlePackingRenderer.readInitialDataOptions({
    layout: { padding: 1 },
    layoutOptions: { nodePadding: 2 },
    padding: 3
  }).padding, 3);
  assert.equal(circlePackingRenderer.readLayoutOption({ get: () => undefined }, rect).width, 100);
  const circleSeries = series({
    itemStyle: {},
    label: { show: false },
    enterAnimation: false
  }, [{ name: 'A' }]);
  circlePackingRenderer.drawCirclePacking(host, group, circleSeries.model, {
    nodes: [
      { raw: {}, name: 'Zero', value: 0, percent: 0, depth: 0, x: 0, y: 0, r: 0, dataIndex: 0, color: '' },
      { raw: {}, name: 'Loose', value: 1, percent: 1, depth: 1, x: 10, y: 10, r: 8, dataIndex: 99, color: '' }
    ]
  }, rect);
  assert.equal(circlePackingRenderer.drawLabels(host, group, circleSeries.model, circleSeries.data, [], new Map()), undefined);
  circlePackingRenderer.drawLabels(host, group, series({
    label: { show: true, minRadius: 1 },
    enterAnimation: false
  }, []).model, data([]), [{
    raw: {},
    name: 'Invalid Label',
    value: 1,
    percent: 1,
    depth: 1,
    x: 10,
    y: 10,
    r: 20,
    dataIndex: -1,
    color: ''
  }], new Map());
  assert.equal(typeof circlePackingRenderer.readNodeStyle(data([]), model({ itemStyle: {} }), null, {
    raw: {},
    dataIndex: -1,
    color: ''
  }, 99).fill, 'string');
  assert.equal(circlePackingRenderer.createLegendVisualProvider(circleSeries.model).getItemVisual(0, 'name'), 'A');
  assert.equal(circlePackingRenderer.resolveAnimationNumber(() => 4, {}, 0, 1), 4);
  assert.equal(circlePackingRenderer.resolveAnimationNumber(7, {}, 0, 1), 7);
  const circleMissingShape = animatable();
  delete circleMissingShape.shape;
  delete circleMissingShape.style;
  circlePackingRenderer.applyCircleEnterAnimation(circleMissingShape, 4, enabled);
  const circleMissingStyle = animatable();
  delete circleMissingStyle.style;
  circlePackingRenderer.applyFadeEnterAnimation(circleMissingStyle, enabled);
  circlePackingRenderer.animateGraphicProperty({ animate: () => null }, 'style', enabled, { opacity: 0.4 });

  assert.equal(flameRenderer.readLayoutOption({ get: () => undefined }, rect).height, 80);
  const flameSeries = series({
    itemStyle: {},
    label: { show: false },
    enterAnimation: false
  }, [{ name: 'A' }]);
  flameRenderer.drawFlame(host, group, flameSeries.model, {
    nodes: [
      { raw: {}, name: 'Flat', value: 0, percent: 0, depth: 0, x: 0, y: 0, width: 0, height: 4, dataIndex: 0, color: '' },
      { raw: {}, name: 'Loose', value: 1, percent: 1, depth: 1, x: 4, y: 4, width: 20, height: 10, dataIndex: 99, color: '' }
    ]
  }, rect);
  assert.equal(flameRenderer.drawLabels(host, group, flameSeries.model, flameSeries.data, [], new Map()), undefined);
  flameRenderer.drawLabels(host, group, series({
    label: { show: true, fontSize: 8 },
    enterAnimation: false
  }, []).model, data([]), [{
    raw: {},
    name: 'Invalid Label',
    value: 1,
    percent: 1,
    depth: 1,
    subtreeHeight: 0,
    parentId: null,
    children: [],
    x: 0,
    y: 0,
    width: 80,
    height: 30,
    dataIndex: -1,
    color: ''
  }], new Map());
  assert.equal(typeof flameRenderer.readNodeStyle(data([]), model({ itemStyle: {} }), null, {
    raw: {},
    dataIndex: -1,
    color: ''
  }, 99).fill, 'string');
  assert.equal(flameRenderer.createLegendVisualProvider(flameSeries.model).getItemVisual(0, 'name'), 'A');
  assert.equal(flameRenderer.resolveAnimationNumber(() => 4, {}, 0, 1), 4);
  assert.equal(flameRenderer.resolveAnimationNumber(7, {}, 0, 1), 7);
  const flameMissingShape = animatable();
  delete flameMissingShape.shape;
  delete flameMissingShape.style;
  flameRenderer.applyRectEnterAnimation(flameMissingShape, { width: 12 }, enabled);
  const flameMissingStyle = animatable();
  delete flameMissingStyle.style;
  flameRenderer.applyFadeEnterAnimation(flameMissingStyle, enabled);
  flameRenderer.animateGraphicProperty({ animate: () => null }, 'style', enabled, { opacity: 0.4 });

  assert.equal(nestedCircleRenderer.readLayoutOption({ get: () => undefined }, rect).width, 100);
  const nestedSeries = series({
    ringStyle: {},
    itemStyle: {},
    titleLabel: { show: true },
    label: { show: false }
  }, [{ name: 'A' }]);
  nestedCircleRenderer.drawRingTitles(host, group, nestedSeries.model, nestedSeries.data, [{
    id: 'ring',
    name: 'Ring',
    value: 1,
    dataIndex: -1,
    x: 20,
    y: 20,
    innerRadius: 4,
    outerRadius: 16,
    titleX: 20,
    titleY: 20,
    titleMaxWidth: 80,
    color: '',
    raw: {}
  }], new Map(), false);
  nestedCircleRenderer.drawLabels(host, group, nestedSeries.model, [], new Map(), false);
  assert.equal(typeof nestedCircleRenderer.readRingStyle(data([]), nestedSeries.model, null, {
    dataIndex: -1,
    color: ''
  }, 99).fill, 'string');
  assert.equal(nestedCircleRenderer.createLegendVisualProvider(nestedSeries.model).getItemVisual(0, 'name'), 'A');
  assert.equal(nestedCircleRenderer.resolveAnimationNumber(() => 4, {}, 0, 1), 4);
  assert.equal(nestedCircleRenderer.resolveAnimationNumber(7, {}, 0, 1), 7);
  assert.equal(nestedCircleRenderer.resolveAnimationEasing('linear'), 'linear');
  const nestedMissingShape = animatable();
  delete nestedMissingShape.shape;
  delete nestedMissingShape.style;
  nestedCircleRenderer.applyCircleEnterAnimation(nestedMissingShape, 4, enabled);
  const nestedMissingStyle = animatable();
  delete nestedMissingStyle.style;
  nestedCircleRenderer.applyFadeEnterAnimation(nestedMissingStyle, enabled);
  nestedCircleRenderer.animateGraphicProperty({ animate: () => null }, 'style', enabled, { opacity: 0.4 });

  const packSeries = series({
    itemStyle: {},
    label: { show: false },
    enterAnimation: true
  }, [{ name: 'A' }]);
  assert.equal(packBubbleRenderer.readLayoutOption({ get: () => undefined }, rect).height, 80);
  assert.equal(typeof packBubbleRenderer.readCircleStyle(data([{ style: {} }]), model({ itemStyle: {} }), model({ itemStyle: {} }), {
    dataIndex: 0,
    color: ''
  }, 99).fill, 'string');
  assert.equal(packBubbleRenderer.formatLabel('{b}:{c}:{category}', { name: 'Pack', value: null, category: null }), 'Pack::');
  assert.equal(packBubbleRenderer.wrapText('alpha beta', 100, 10, 20), 'alpha beta');
  assert.equal(packBubbleRenderer.wrapText('alpha beta', 4, 10, 40), 'alpha\nbeta');
  assert.equal(packBubbleRenderer.createLegendVisualProvider(packSeries.model).getItemVisual(0, 'style').stroke, '#ffffff');
  assert.equal(packBubbleRenderer.readEnterAnimation(packSeries.model, 0, { show: false }).enabled, false);
  assert.equal(packBubbleRenderer.resolveAnimationNumber(() => 4, {}, 0, 1), 4);
  assert.equal(packBubbleRenderer.resolveAnimationNumber(7, {}, 0, 1), 7);
  const packMissingShape = animatable();
  delete packMissingShape.shape;
  delete packMissingShape.style;
  packBubbleRenderer.applyCircleEnterAnimation(packMissingShape, 4, enabled, { totalDuration: 0 });
  const packMissingStyle = animatable();
  delete packMissingStyle.style;
  packBubbleRenderer.applyFadeEnterAnimation(packMissingStyle, enabled, { totalDuration: 0 });
  packBubbleRenderer.animateGraphicProperty({ animate: () => null }, 'style', enabled, { opacity: 0.4 });

  const vennSeries = series({
    hollowStyle: {},
    itemStyle: {},
    label: { show: false },
    enterAnimation: false
  }, [{ name: 'A' }]);
  assert.equal(vennRenderer.readLayoutOption({ get: () => undefined }, rect).width, 100);
  const circleElementsBySet = new Map();
  vennRenderer.addCircleElementBySet(circleElementsBySet, { id: '', name: null, setKey: undefined, sets: [null, 'A'] }, { id: 'circle' });
  vennRenderer.addCircleElementBySet(circleElementsBySet, { id: 'solo', name: null, setKey: undefined }, { id: 'solo-circle' });
  assert.equal(circleElementsBySet.size, 2);
  assert.equal(circleElementsBySet.get('solo').id, 'solo-circle');
  const hollowHover = [];
  vennRenderer.drawHollowVenn(host, group, vennSeries.model, vennSeries.data, {
    mode: 'hollow',
    circles: [{ id: 'A', name: 'A', setKey: 'A', sets: ['A'], x: 10, y: 10, r: 8, dataIndex: 0, value: 1 }],
    labels: [{ name: 'A', value: 1, x: 10, y: 10, dataIndex: -1, setKey: 'A', sets: ['A'] }]
  }, hollowHover, new Map());
  assert.equal(hollowHover.length, 0);
  assert.equal(typeof vennRenderer.readHollowCircleStyle(vennSeries.model, null, 99).stroke, 'string');
  assert.equal(vennRenderer.resolveAnimationNumber(() => 4, {}, 0, 1), 4);
  assert.equal(vennRenderer.resolveAnimationNumber(7, {}, 0, 1), 7);

  vi.useFakeTimers();
  try {
    const token = {};
    const stalePackView = { __renderToken: {} };
    packBubbleRenderer.startPackBubbleEnterGate(stalePackView, token, 5);
    assert.equal(stalePackView.__packBubbleEntering, true);
    vi.advanceTimersByTime(5);
    assert.equal(stalePackView.__packBubbleEntering, true);
    packBubbleRenderer.clearPackBubbleEnterGate(stalePackView);
  } finally {
    vi.useRealTimers();
  }
});

test('private renderer helpers cover label, animation, style, and fallback branches', () => {
  const enabled = { enabled: true, duration: 5, delay: 2, easing: 'linear' };
  const disabled = { enabled: false, duration: 0, delay: 0, easing: 'cubicOut' };
  const point = {
    raw: { id: 'raw' },
    name: 'Point',
    value: 7,
    category: 'Group',
    x: 10,
    y: 8,
    baseX: 0,
    baseY: 0,
    radius: 4,
    centerY: 9,
    dataIndex: 0
  };

  const beeswarm = loadRendererPrivate('packages/echarts-beeswarm/src/beeswarm.ts', [
    'readLineStyle',
    'readLineDash',
    'formatAxisLabel',
    'formatLabel',
    'readEnterAnimation',
    'resolveAnimationNumber',
    'resolveAnimationEasing',
    'applyCircleEnterAnimation',
    'applyFadeEnterAnimation',
    'animateGraphicProperty',
    'addHoverElement',
    'asRecord',
    'finiteNumber'
  ], beeswarmLayout);
  assert.equal(JSON.stringify(beeswarm.readLineDash('dotted')), '[1.5,5]');
  assert.equal(JSON.stringify(beeswarm.readLineStyle(model({ type: 'dashed', width: '2', opacity: '0.5' }), { stroke: '#000' }).lineDash), '[5,6]');
  assert.equal(beeswarm.formatAxisLabel((value) => `v${value}`, 3), 'v3');
  assert.equal(beeswarm.formatAxisLabel('{value}%', 3), '3%');
  assert.equal(beeswarm.formatLabel(({ name }) => name, point), 'Point');
  assert.equal(beeswarm.formatLabel('{b}:{c}:{category}', point), 'Point:7:Group');
  assert.equal(beeswarm.readEnterAnimation(model({ animation: false }), 1).enabled, false);
  assert.equal(beeswarm.readEnterAnimation(model({ enterAnimation: { show: false } }), 1).enabled, false);
  assert.equal(beeswarm.resolveAnimationNumber(() => '6', {}, 0, 1), 6);
  assert.equal(beeswarm.resolveAnimationEasing(''), 'cubicOut');
  coverCircleAndFadeAnimation(beeswarm, enabled, disabled);
  assert.equal(JSON.stringify(beeswarm.asRecord([])), '{}');
  assert.equal(beeswarm.finiteNumber('8', 1), 8);
  assert.equal(beeswarm.finiteNumber('bad', 1), 1);

  const lollipop = loadRendererPrivate('packages/echarts-lollipop/src/lollipop.ts', [
    'readLineDash',
    'formatAxisLabel',
    'formatLabel',
    'readEnterAnimation',
    'resolveAnimationNumber',
    'resolveAnimationEasing',
    'applyStemEnterAnimation',
    'applyCircleEnterAnimation',
    'applyFadeEnterAnimation',
    'animateGraphicProperty',
    'addHoverElement',
    'asRecord'
  ], lollipopLayout);
  assert.equal(JSON.stringify(lollipop.readLineDash('dotted')), '[1.5,5]');
  assert.equal(lollipop.formatAxisLabel('{value}x', 2), '2x');
  assert.equal(lollipop.formatLabel(null, point), 7);
  lollipop.applyStemEnterAnimation(animatable({ shape: {} }), point, enabled);
  lollipop.applyStemEnterAnimation({}, point, enabled);
  coverCircleAndFadeAnimation(lollipop, enabled, disabled);
  assert.equal(lollipop.readEnterAnimation(model({ enterAnimation: false }), 0).enabled, false);
  assert.equal(lollipop.resolveAnimationNumber(() => 4, {}, 0, 1), 4);
  assert.equal(lollipop.resolveAnimationEasing(null), 'cubicOut');
  assert.equal(JSON.stringify(lollipop.asRecord(null)), '{}');

  const mosaic = loadRendererPrivate('packages/echarts-mosaic/src/mosaic.ts', [
    'readLayoutOption',
    'drawMosaic',
    'drawLabels',
    'readTileStyle',
    'formatLabel',
    'wrapText',
    'trimLines',
    'createLegendVisualProvider',
    'collectDataNames',
    'readEnterAnimation',
    'disabledEnterAnimation',
    'resolveAnimationNumber',
    'resolveAnimationEasing',
    'applyRectEnterAnimation',
    'applyFadeEnterAnimation',
    'animateGraphicProperty',
    'createHoverItem',
    'addHoverElement',
    'asRecord',
    'finiteNumber'
  ], mosaicLayout);
  const tile = { raw: {}, name: 'Tile', value: 5, percent: 0.25, columnPercent: 0.5, xCategory: 'X', yCategory: 'Y', width: 12 };
  assert.equal(mosaic.formatLabel(({ name }) => name, tile), 'Tile');
  assert.equal(mosaic.formatLabel('{b}:{c}:{d}:{x}:{y}', tile), 'Tile:5:25:X:Y');
  assert.equal(mosaic.wrapText('abcdefgh', 4, 1), 'abc...');
  assert.equal(mosaic.wrapText('abcdefgh', 3, 3), 'abc\ndef\ngh');
  assert.equal(mosaic.wrapText('alpha betabetabet gamma', 6, 3), 'alpha\nbetabe\ngamma');
  assert.equal(mosaic.trimLines(['one', 'two', 'three'], 2, 4), 'one\ntwo...');
  assert.equal(mosaic.trimLines(['one'], 2, 4), 'one');
  assert.equal(mosaic.wrapText('short', 10, 1), 'short');
  assert.equal(mosaic.wrapText('superlongword', 5, 3), 'super\nlongw\nord');
  assert.equal(mosaic.wrapText('alpha beta gamma', 6, 2), 'alpha\nbeta');
  mosaic.applyRectEnterAnimation(animatable({ shape: {}, style: { opacity: 0.4 } }), tile, enabled);
  mosaic.applyRectEnterAnimation(animatable({ style: { opacity: 0.4 } }), tile, enabled);
  mosaic.applyRectEnterAnimation({}, tile, enabled);
  coverFadeAnimation(mosaic, enabled, disabled);
  coverHover(mosaic);
  assert.equal(JSON.stringify(mosaic.createHoverItem({ id: 'tile' }).triggerElements[0]), '{"id":"tile"}');
  assert.equal(mosaic.readEnterAnimation(model({ enterAnimation: { enabled: false } }), 0).enabled, false);
  assert.equal(mosaic.readEnterAnimation(model({ enterAnimation: { show: false } }), 0).enabled, false);
  assert.equal(mosaic.disabledEnterAnimation().enabled, false);
  assert.equal(mosaic.resolveAnimationNumber(() => 8, {}, 0, 1), 8);
  assert.equal(mosaic.resolveAnimationEasing(''), 'cubicOut');
  assert.equal(JSON.stringify(mosaic.asRecord([])), '{}');
  assert.equal(mosaic.finiteNumber('8', 1), 1);
  const mosaicData = data([
    { name: 'Visual', itemStyle: { color: '#123', borderColor: '#456', opacity: 0.5 } },
    { name: 'Fallback', custom: '#999' }
  ]);
  assert.equal(JSON.stringify(mosaic.collectDataNames(mosaicData)), '["Visual","Fallback"]');
  const mosaicSeries = model({
    data: mosaicData.source,
    itemStyle: { borderWidth: 2, opacity: 0.7 },
    label: { show: true, minArea: 0, formatter: '{b}' },
    enterAnimation: false
  });
  mosaicSeries.getData = () => mosaicData;
  mosaicSeries.getRawData = () => mosaicData;
  assert.equal(mosaic.readLayoutOption(mosaicSeries, { width: 100, height: 80 }).width, 100);
  const noOptionMosaicSeries = model();
  delete noOptionMosaicSeries.option;
  const noOptionMosaicLayout = mosaic.readLayoutOption(noOptionMosaicSeries, { width: 20, height: 10 });
  assert.equal(JSON.stringify(noOptionMosaicLayout.data), '[]');
  assert.equal(noOptionMosaicLayout.layout, undefined);
  assert.equal(JSON.stringify(noOptionMosaicLayout.layoutOptions), '{}');
  assert.equal(noOptionMosaicLayout.width, 20);
  assert.equal(noOptionMosaicLayout.height, 10);
  const mosaicProvider = mosaic.createLegendVisualProvider(mosaicSeries);
  assert.equal(mosaicProvider.getItemVisual(0, 'legendIcon'), null);
  assert.equal(mosaicProvider.getItemVisual(1, 'custom'), '#999');
  assert.equal(mosaicProvider.getItemVisual(0, 'style').fill, '#123');
  assert.equal(mosaicProvider.getItemVisual(1, 'style').opacity, 0.9);
  assert.doesNotThrow(() => mosaic.animateGraphicProperty({ animate: () => null }, 'style', enabled, { opacity: 0.8 }));
  const mosaicHost = graphicHost();
  const mosaicGroup = new mosaicHost.graphic.Group();
  const mosaicTiles = [
    { ...tile, dataIndex: 0, width: 80, height: 50, color: '#aaa' },
    { ...tile, name: 'Tiny', dataIndex: -1, x: 90, y: 0, width: 4, height: 4, color: '#bbb' },
    { ...tile, name: 'NoLabel', dataIndex: 1, x: 0, y: 60, width: 80, height: 40, color: '#ccc' }
  ];
  mosaic.drawMosaic(mosaicHost, mosaicGroup, mosaicSeries, { tiles: mosaicTiles }, { x: 2, y: 3 });
  mosaic.drawLabels(mosaicHost, mosaicGroup, model({ label: { show: false } }), mosaicData, mosaicTiles, new Map());
  assert.equal(mosaicGroup.childrenList.length > 0, true);

  const nested = loadRendererPrivate('packages/echarts-nested-circle/src/nested-circle.ts', [
    'formatLabel',
    'wrapText',
    'wrapLongWord',
    'readEnterAnimation',
    'resolveAnimationNumber',
    'resolveAnimationEasing',
    'applyCircleEnterAnimation',
    'applyFadeEnterAnimation',
    'animateGraphicProperty',
    'addHoverElement',
    'asRecord',
    'finiteNumber'
  ], nestedCircleLayout);
  assert.equal(nested.formatLabel(({ name }) => name, { name: 'Ring', value: 2, data: {} }), 'Ring');
  assert.equal(nested.formatLabel('{b}:{c}', { name: 'Ring', value: null, data: {} }), 'Ring:');
  assert.equal(nested.wrapText('superlongword', 5), 'super\nlongw\nord');
  assert.equal(nested.wrapText('alpha superlongword beta', 6), 'alpha\nsuperl\nongwor\nd beta');
  assert.equal(JSON.stringify(nested.wrapLongWord('abc', 0)), '["a","b","c"]');
  coverCircleAndFadeAnimation(nested, enabled, disabled);
  coverHover(nested);
  assert.equal(nested.readEnterAnimation(model({ animation: false }), 0).enabled, false);
  assert.equal(nested.resolveAnimationNumber(() => 9, {}, 0, 1), 9);
  assert.equal(nested.resolveAnimationEasing(null), 'cubicOut');
  assert.equal(JSON.stringify(nested.asRecord([])), '{}');
  assert.equal(nested.finiteNumber('8', 1), 1);

  const circle = loadRendererPrivate('packages/echarts-circle-packing/src/circle-packing.ts', [
    'formatLabel',
    'wrapText',
    'readRawItemStyle',
    'readEnterAnimation',
    'resolveAnimationNumber',
    'resolveAnimationEasing',
    'applyCircleEnterAnimation',
    'applyFadeEnterAnimation',
    'animateGraphicProperty',
    'addHoverElement',
    'asRecord',
    'finiteNumber'
  ], circlePackingLayout);
  const circleNode = { raw: { labelStyle: { color: '#123' } }, name: 'Circle', value: 9, r: 30 };
  assert.equal(circle.formatLabel(({ name }) => name, circleNode), 'Circle');
  assert.equal(circle.wrapText('alpha beta gamma', 30, 10, 20).length > 0, true);
  assert.equal(circle.wrapText('singleverylongword', 30, 10, 20).length > 0, true);
  assert.equal(circle.readRawItemStyle({ itemStyle: { color: '#123' } }).color, '#123');
  coverCircleAndFadeAnimation(circle, enabled, disabled);
  coverHover(circle);
  assert.equal(circle.readEnterAnimation(model({ enterAnimation: { enabled: false } }), 0).enabled, false);
  assert.equal(circle.resolveAnimationNumber(() => 3, {}, 0, 1), 3);
  assert.equal(circle.resolveAnimationEasing(null), 'cubicOut');
  assert.equal(JSON.stringify(circle.asRecord(null)), '{}');
  assert.equal(circle.finiteNumber('8', 1), 1);

  const flame = loadRendererPrivate('packages/echarts-flame/src/flame.ts', [
    'formatLabel',
    'readRawItemStyle',
    'readEnterAnimation',
    'resolveAnimationNumber',
    'resolveAnimationEasing',
    'applyRectEnterAnimation',
    'applyFadeEnterAnimation',
    'animateGraphicProperty',
    'addHoverElement',
    'asRecord',
    'finiteNumber'
  ], flameLayout);
  const flameNode = { raw: { itemStyle: { color: '#abc' } }, name: 'Flame', value: 4, width: 20 };
  assert.equal(flame.formatLabel('{b}:{c}', flameNode), 'Flame:4');
  assert.equal(flame.readRawItemStyle(flameNode.raw).color, '#abc');
  flame.applyRectEnterAnimation(animatable({ shape: {}, style: { opacity: 0.3 } }), flameNode, enabled);
  flame.applyRectEnterAnimation({}, flameNode, enabled);
  coverFadeAnimation(flame, enabled, disabled);
  coverHover(flame);
  assert.equal(flame.readEnterAnimation(model({ enterAnimation: false }), 0).enabled, false);
  assert.equal(flame.resolveAnimationNumber(() => 3, {}, 0, 1), 3);
  assert.equal(flame.resolveAnimationEasing(null), 'cubicOut');
  assert.equal(JSON.stringify(flame.asRecord([])), '{}');
  assert.equal(flame.finiteNumber('8', 1), 1);

  const pack = loadRendererPrivate('packages/echarts-pack-bubble/src/pack-bubble.ts', [
    'formatLabel',
    'wrapText',
    'readEnterAnimation',
    'resolveAnimationNumber',
    'resolveAnimationEasing',
    'applyCircleEnterAnimation',
    'applyFadeEnterAnimation',
    'animateGraphicProperty',
    'addHoverElement',
    'asRecord',
    'finiteNumber',
    'trackEnterAnimation',
    'startPackBubbleEnterGate',
    'clearPackBubbleEnterGate'
  ], packBubbleLayout);
  const packLabel = { raw: {}, name: 'Pack', value: 6, r: 24 };
  assert.equal(pack.formatLabel(({ name }) => name, packLabel), 'Pack');
  assert.equal(pack.formatLabel('{b}:{c}', packLabel), 'Pack:6');
  assert.equal(pack.wrapText('alpha beta gamma', 30, 10, 20).length > 0, true);
  coverCircleAndFadeAnimation(pack, enabled, disabled, { totalDuration: 0 });
  coverHover(pack);
  const tracker = { totalDuration: 0 };
  pack.trackEnterAnimation(tracker, { ...enabled, delay: -1, duration: 4 });
  assert.equal(tracker.totalDuration, 4);
  const gateView = {};
  pack.startPackBubbleEnterGate(gateView, {}, 0);
  assert.equal(gateView.__packBubbleEntering, false);
  gateView.__packBubbleEnterTimer = 1;
  pack.clearPackBubbleEnterGate(gateView);
  assert.equal(gateView.__packBubbleEntering, false);
  vi.useFakeTimers();
  try {
    const token = {};
    const staleGateView = { __renderToken: {} };
    pack.startPackBubbleEnterGate(staleGateView, token, 5);
    assert.equal(staleGateView.__packBubbleEntering, true);
    vi.advanceTimersByTime(5);
    assert.equal(staleGateView.__packBubbleEntering, true);
    pack.clearPackBubbleEnterGate(staleGateView);
  } finally {
    vi.useRealTimers();
  }
  assert.equal(pack.readEnterAnimation(model({ animation: false }), 0).enabled, false);
  assert.equal(pack.resolveAnimationNumber(() => 3, {}, 0, 1), 3);
  assert.equal(pack.resolveAnimationEasing(null), 'cubicOut');
  assert.equal(JSON.stringify(pack.asRecord([])), '{}');
  assert.equal(pack.finiteNumber('8', 1), 1);

  const venn = loadRendererPrivate('packages/echarts-venn/src/venn.ts', [
    'formatLabel',
    'readEnterAnimation',
    'resolveAnimationNumber',
    'resolveAnimationEasing',
    'applyCircleEnterAnimation',
    'applyFadeEnterAnimation',
    'animateGraphicProperty',
    'addHoverElement',
    'asRecord',
    'finiteNumber'
  ], vennLayout);
  assert.equal(venn.formatLabel(({ name }) => name, { name: 'V', value: 2 }), 'V');
  assert.equal(venn.formatLabel('{b}:{c}', { name: 'V', value: null }), 'V:');
  coverCircleAndFadeAnimation(venn, enabled, disabled);
  coverHover(venn);
  assert.equal(venn.readEnterAnimation(model({ enterAnimation: { show: false } }), 0).enabled, false);
  assert.equal(venn.resolveAnimationNumber(() => 3, {}, 0, 1), 3);
  assert.equal(venn.resolveAnimationEasing(null), 'cubicOut');
  assert.equal(JSON.stringify(venn.asRecord(null)), '{}');
  assert.equal(venn.finiteNumber('8', 1), 1);

  const spiral = loadRendererPrivate('packages/echarts-spiral/src/spiral.ts', [
    'formatLabel',
    'readLayoutOption',
    'animateGraphicProperty',
    'resolveAnimationValue',
    'disabledAnimation',
    'silenceSpiralHoverElements',
    'restoreSpiralHoverElements',
    'startSpiralEnterGate',
    'clearSpiralEnterGate',
    'asRecord',
    'finiteNumber'
  ], spiralLayout);
  assert.equal(spiral.formatLabel(({ name }) => name, { name: 'S', value: 1 }), 'S');
  assert.equal(spiral.formatLabel('{b}:{c}', { name: 'S', value: null }), 'S:null');
  const noOptionSpiralSeries = model();
  delete noOptionSpiralSeries.option;
  const noOptionSpiralLayout = spiral.readLayoutOption(noOptionSpiralSeries, { width: 20, height: 10 });
  assert.equal(JSON.stringify(noOptionSpiralLayout.data), '[]');
  assert.equal(noOptionSpiralLayout.width, 20);
  assert.equal(noOptionSpiralLayout.height, 10);
  const spiralTarget = { style: {}, animate: () => null };
  spiral.animateGraphicProperty(spiralTarget, 'style', enabled, { opacity: 0.5 });
  const animatedSpiralTarget = animatable({ style: {} });
  spiral.animateGraphicProperty(animatedSpiralTarget, 'style', enabled, { opacity: 0.5 });
  assert.equal(animatedSpiralTarget.style.opacity, 0.5);
  assert.equal(spiral.resolveAnimationValue(() => 7, 0, 1), 7);
  assert.equal(spiral.disabledAnimation().enabled, false);
  const silentElement = {};
  const alreadySilent = { silent: false };
  const snapshots = spiral.silenceSpiralHoverElements([{ elements: [silentElement, alreadySilent], triggerElements: [silentElement] }]);
  assert.equal(silentElement.silent, true);
  spiral.restoreSpiralHoverElements(snapshots);
  assert.equal('silent' in silentElement, false);
  assert.equal(alreadySilent.silent, false);
  const spiralView = {};
  spiral.startSpiralEnterGate(spiralView, {}, 0, []);
  assert.equal(spiralView.__spiralEntering, false);
  spiralView.__spiralEnterTimer = 1;
  spiral.clearSpiralEnterGate(spiralView);
  assert.equal(spiralView.__spiralEntering, false);
  vi.useFakeTimers();
  try {
    const token = {};
    const staleSpiralView = { __renderToken: {} };
    spiral.startSpiralEnterGate(staleSpiralView, token, 5, []);
    assert.equal(staleSpiralView.__spiralEntering, true);
    vi.advanceTimersByTime(5);
    assert.equal(staleSpiralView.__spiralEntering, true);
    spiral.clearSpiralEnterGate(staleSpiralView);
  } finally {
    vi.useRealTimers();
  }
  assert.equal(JSON.stringify(spiral.asRecord([])), '{}');
  assert.equal(spiral.finiteNumber('8', 1), 1);

  const vector = loadRendererPrivate('packages/echarts-vector-field/src/vector-field.ts', [
    'createArrowElement',
    'resolveArrowStyle',
    'resolveEnterAnimation',
    'animateEnter',
    'resolveAnimationValue',
    'disabledAnimation',
    'formatPathNumber',
    'asRecord',
    'finiteNumber'
  ], vectorFieldLayout);
  const hostWithPath = graphicHost();
  const vectorItem = { startX: 0, startY: 0, endX: 1.23456, endY: 2, headLeftX: 1, headLeftY: 1, headRightX: 2, headRightY: 1 };
  assert.equal(vector.createArrowElement(hostWithPath, vectorItem, {}).type, 'path');
  const hostWithoutPath = graphicHost();
  hostWithoutPath.graphic.makePath = null;
  assert.equal(vector.createArrowElement(hostWithoutPath, vectorItem, {}).type, 'line');
  assert.equal(vector.resolveArrowStyle(data([{ lineStyle: { width: 2 } }]), model({ lineStyle: { color: '#111' } }), model({ itemStyle: { color: '#222' } }), 0, 0).stroke, '#222');
  assert.equal(vector.resolveEnterAnimation(model({ animation: false }), 0).enabled, false);
  assert.equal(vector.resolveEnterAnimation(model({ enterAnimation: { enabled: false } }), 0).enabled, false);
  vector.animateEnter({}, 0, enabled);
  const noAnimator = { style: {}, animate: () => null };
  vector.animateEnter(noAnimator, 0, enabled);
  assert.equal(noAnimator.style.opacity, 1);
  const animated = animatable({ style: { opacity: 0.4 } });
  vector.animateEnter(animated, 0, enabled);
  assert.equal(animated.animations[0].target.opacity, 0.4);
  assert.equal(vector.resolveAnimationValue(() => 5, 0, 1), 5);
  assert.equal(vector.formatPathNumber(1.23456), '1.235');
  assert.equal(JSON.stringify(vector.asRecord(null)), '{}');
  assert.equal(vector.finiteNumber('8', 1), 1);
});

function loadPrivateSource(relativeFile, names, requireMap = {}) {
  const filename = path.join(root, relativeFile);
  const vmFilename = `${filename}.vm-test.cjs`;
  const source = readFileSync(filename, 'utf8');
  const exposed = names.map((name) => `${name}: typeof ${name} === 'undefined' ? undefined : ${name}`).join(',');
  const compiled = ts.transpileModule(`${source}\nglobalThis.__private__ = { ${exposed} };\n`, {
    fileName: filename,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS
    }
  }).outputText;

  const module = { exports: {} };
  const context = {
    module,
    exports: module.exports,
    globalThis: {},
    console,
    setTimeout,
    clearTimeout,
    require(specifier) {
      if (specifier in requireMap) return requireMap[specifier];
      throw new Error(`Unexpected private source import: ${specifier}`);
    }
  };
  context.globalThis = context;
  runInNewContext(compiled, context, { filename: vmFilename });
  return context.__private__;
}

function loadRendererPrivate(relativeFile, names, layoutModule) {
  return loadPrivateSource(relativeFile, names, {
    'echarts/lib/echarts': {
      helper: {
        createDimensions() {
          return [];
        },
        enableHoverEmphasis() {}
      },
      List: class {
        initData() {}
      },
      graphic: {},
      extendSeriesModel() {},
      extendChartView() {}
    },
    '@echarts-extension/layout-core': {
      clearAliveRender() {},
      installElementHover() {
        return { dispose() {} };
      },
      renderAlive(_view, _host, group, seriesModel, draw) {
        return { payload: draw(group, seriesModel), mapElement: (element) => element };
      },
      setAliveRenderKey(element, key) {
        if (element) element.__aliveRenderKey = key;
      }
    },
    './layout.js': layoutModule
  });
}

function model(values = {}) {
  return {
    option: values,
    values,
    get(path) {
      return getPath(values, path);
    },
    getModel(path) {
      return model(getPath(values, path) || {});
    }
  };
}

function series(option = {}, items = []) {
  const source = data(items);
  const seriesModel = model(option);
  seriesModel.getData = () => source;
  seriesModel.getRawData = () => source;
  seriesModel.getBoxLayoutParams = () => ({});
  return {
    model: seriesModel,
    data: source
  };
}

function data(items = []) {
  return {
    source: items,
    count() {
      return items.length;
    },
    getName(index) {
      return String(items[index]?.name ?? index);
    },
    indexOfName(name) {
      return items.findIndex((item, index) => String(item?.name ?? index) === name);
    },
    getItemModel(index) {
      return model(items[index] || {});
    },
    getItemVisual(index, key) {
      const item = items[index] || {};
      if (key === 'style') return item.style || item.itemStyle || {};
      return item[key];
    },
    getItemLayout() {
      return null;
    },
    setItemLayout() {},
    setItemGraphicEl() {}
  };
}

function getPath(source, path) {
  const parts = Array.isArray(path) ? path : String(path).split('.');
  let current = source;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

function animatable(base = {}) {
  const element = {
    shape: {},
    style: {},
    animations: [],
    ...base
  };
  element.animate = base.animate || ((key) => {
    const record = {
      key,
      whens: [],
      when(duration, target) {
        this.duration = duration;
        this.target = target;
        this.whens.push({ duration, target });
        Object.assign(key ? element[key] || (element[key] = {}) : element, target);
        return this;
      },
      delay(duration) {
        this.delayDuration = duration;
        return this;
      },
      start(easing) {
        this.easing = easing;
      }
    };
    element.animations.push(record);
    return record;
  });
  return element;
}

function createFisheyeElement(options = {}) {
  const element = {
    shape: { ...(options.shape || {}) },
    style: { ...(options.style || {}) },
    x: options.x,
    y: options.y,
    scaleX: options.scaleX,
    scaleY: options.scaleY,
    originX: options.originX,
    originY: options.originY,
    ignore: options.ignore,
    invisible: options.invisible,
    parent: options.parent,
    exclude: options.exclude,
    dirtyCount: 0,
    dirty() {
      this.dirtyCount += 1;
    }
  };
  if (options.rect !== undefined) {
    element.getPaintRect = () => options.rect;
  }
  if (options.boundingRect !== undefined) {
    element.getBoundingRect = () => options.boundingRect;
  }
  if (options.attr) {
    element.attr = (keyOrObj, value) => {
      if (keyOrObj === 'shape') element.shape = { ...value };
      else if (keyOrObj === 'style') element.style = { ...value };
      else if (typeof keyOrObj === 'string') element[keyOrObj] = value;
      else Object.assign(element, keyOrObj);
    };
  }
  if (options.setShape) {
    element.setShape = (shape) => {
      element.shape = { ...shape };
    };
  }
  if (options.setStyle) {
    element.setStyle = (style) => {
      element.style = { ...style };
    };
  }
  return element;
}

function coverCircleAndFadeAnimation(api, enabled, disabled, tracker) {
  api.applyCircleEnterAnimation?.({}, 4, enabled, tracker);
  api.applyCircleEnterAnimation?.(animatable({ shape: {}, style: { opacity: 0.6 } }), 4, disabled, tracker);
  const animated = animatable({ shape: {}, style: { opacity: 0.6 } });
  api.applyCircleEnterAnimation?.(animated, 4, enabled, tracker);
  coverFadeAnimation(api, enabled, disabled, tracker);
  const fallback = { style: {}, animate: () => null };
  api.animateGraphicProperty(fallback, 'style', enabled, { opacity: 0.7 });
  assert.equal(fallback.style.opacity, 0.7);
}

function coverFadeAnimation(api, enabled, disabled, tracker) {
  api.applyFadeEnterAnimation?.({}, enabled, tracker);
  api.applyFadeEnterAnimation?.(animatable({ style: { opacity: 0.3 } }), disabled, tracker);
  const animated = animatable({ style: { opacity: 0.3 } });
  api.applyFadeEnterAnimation?.(animated, enabled, tracker);
}

function coverHover(api) {
  api.addHoverElement(undefined, {});
  const item = { elements: [] };
  api.addHoverElement(item, {});
  assert.equal(item.elements.length, 1);
}

function graphicHost() {
  class Element {
    constructor(options = {}) {
      this.type = this.constructor.elementType || 'element';
      this.shape = { ...(options.shape || {}) };
      this.style = { ...(options.style || {}) };
      this.silent = options.silent;
      this.z2 = options.z2;
    }
  }
  class Group extends Element {
    static elementType = 'group';
    constructor(options = {}) {
      super(options);
      this.childrenList = [];
    }
    add(element) {
      element.parent = this;
      this.childrenList.push(element);
    }
    removeAll() {
      this.childrenList = [];
    }
    children() {
      return this.childrenList;
    }
    childrenRef() {
      return this.childrenList;
    }
  }
  class Circle extends Element {
    static elementType = 'circle';
  }
  class Line extends Element {
    static elementType = 'line';
  }
  class Rect extends Element {
    static elementType = 'rect';
  }
  class Text extends Element {
    static elementType = 'text';
  }
  class Polygon extends Element {
    static elementType = 'polygon';
  }
  class Polyline extends Element {
    static elementType = 'polyline';
  }
  class Arc extends Element {
    static elementType = 'arc';
  }
  return {
    graphic: {
      Group,
      Circle,
      Line,
      Rect,
      Text,
      Polygon,
      Polyline,
      Arc,
      makePath(path, options) {
        const element = new Element(options);
        element.type = 'path';
        element.path = path;
        return element;
      }
    }
  };
}
