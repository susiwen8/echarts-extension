import assert from 'node:assert/strict';
import { test } from 'vitest';

import { __test__ as radialArea } from '../packages/echarts-radial-area/src/radial-area.ts';
import { __test__ as radialBoxplot } from '../packages/echarts-radial-boxplot/src/radial-boxplot.ts';
import { __test__ as subway } from '../packages/echarts-subway/src/subway.ts';
import { layoutSunriseSunset } from '../packages/echarts-sunrise-sunset/src/layout.ts';
import { __test__ as sunriseSunset } from '../packages/echarts-sunrise-sunset/src/sunrise-sunset.ts';
import { __test__ as venn } from '../packages/echarts-venn/src/venn.ts';
import { __test__ as voronoiTreemap } from '../packages/echarts-voronoi-treemap/src/voronoi-treemap.ts';

const enabledAnimation = { enabled: true, duration: 12, delay: 3, easing: 'linear' };
const disabledAnimation = { enabled: false, duration: 0, delay: 0, easing: 'cubicOut' };

test('voronoi treemap private renderer helpers cover labels, legend, and animation fallbacks', () => {
  assert.equal(voronoiTreemap.wrapText('alphabet', 4, 1), 'alp...');
  assert.equal(voronoiTreemap.wrapText('abc', 4, 1), 'abc');
  assert.equal(voronoiTreemap.wrapText('abcdefghij', 3, 3), 'abc\ndef\nghi');
  assert.equal(voronoiTreemap.wrapText('alpha beta gamma delta', 7, 2), 'alpha\nbeta');
  assert.equal(voronoiTreemap.wrapText('alpha beta', 6, 3), 'alpha\nbeta');
  assert.equal(voronoiTreemap.wrapText('superlongword tiny', 5, 3), 'super\ntiny');
  assert.equal(voronoiTreemap.wrapText('alpha beta', 20, 3), 'alpha beta');
  assert.equal(voronoiTreemap.trimLines(['one', 'two', 'three'], 2, 4), 'one\ntwo...');
  assert.deepEqual(voronoiTreemap.readLayoutOption({ get: () => undefined }, { width: 120, height: 90 }), {
    data: undefined,
    layout: undefined,
    layoutOptions: {},
    width: 120,
    height: 90
  });

  const node = {
    raw: { custom: true },
    name: 'Alpha',
    value: 42,
    percent: 0.324,
    depth: 2,
    isLeaf: true,
    parentId: 'root'
  };
  assert.equal(voronoiTreemap.formatLabel(({ name, value }) => `${name}:${value}`, node), 'Alpha:42');
  assert.equal(voronoiTreemap.formatLabel('{b}/{c}/{d}/{p}', node), 'Alpha/42/32/32%');
  assert.equal(voronoiTreemap.formatLabel(null, node), 'Alpha');
  assert.equal(voronoiTreemap.readNodeStyle(createData([]), createSeriesModel({ itemStyle: {} }), null, {
    ...node,
    raw: { itemStyle: {} },
    color: '',
    dataIndex: -1
  }, 99).fill, '#5d7290');
  assert.deepEqual(voronoiTreemap.pointBounds([[2, 3], [-1, 5], [4, -2]]), {
    minX: -1,
    minY: -2,
    maxX: 4,
    maxY: 5
  });

  const data = createData([
    { name: 'Alpha', itemStyle: { color: '#123', opacity: 0.5 } },
    { name: 'Beta' }
  ]);
  const provider = voronoiTreemap.createLegendVisualProvider({
    getRawData: () => data,
    getData: () => data
  });
  assert.deepEqual(provider.getAllNames(), ['Alpha', 'Beta']);
  assert.equal(provider.containName('Beta'), true);
  assert.equal(provider.indexOfName('Alpha'), 0);
  assert.equal(provider.getItemVisual(0, 'legendIcon'), null);
  assert.equal(provider.getItemVisual(0, 'style').fill, '#123');
  assert.equal(provider.getItemVisual(1, 'color'), undefined);

  const element = { style: { opacity: 0.4 } };
  voronoiTreemap.applyFadeEnterAnimation(element, enabledAnimation);
  assert.equal(element.style.opacity, 0.4);
  const fallbackTarget = { style: {} };
  voronoiTreemap.animateGraphicProperty(fallbackTarget, 'style', enabledAnimation, { opacity: 0.7 });
  assert.equal(fallbackTarget.style.opacity, 0.7);
  const missingShapeTarget = { animate: () => null };
  voronoiTreemap.animateGraphicProperty(missingShapeTarget, 'shape', enabledAnimation, { percent: 1 });
  assert.equal(missingShapeTarget.shape, undefined);
  assert.equal(voronoiTreemap.resolveAnimationNumber(4, {}, 0, 1), 4);
  assert.equal(voronoiTreemap.resolveAnimationNumber(() => 'bad', {}, 0, 3), 3);
  assert.equal(voronoiTreemap.resolveAnimationEasing(''), 'cubicOut');
  assert.deepEqual(voronoiTreemap.asRecord([]), {});
  const animated = createAnimatable({ style: { opacity: 0.2 } });
  voronoiTreemap.applyFadeEnterAnimation(animated, enabledAnimation);
  assert.equal(animated.animations[0].target.opacity, 0.2);
  const missingStyleFade = createAnimatable({});
  delete missingStyleFade.style;
  voronoiTreemap.applyFadeEnterAnimation(missingStyleFade, enabledAnimation);
  assert.equal(missingStyleFade.style.opacity, 1);

  const item = { elements: [] };
  voronoiTreemap.addHoverElement(undefined, {});
  voronoiTreemap.addHoverElement(item, { id: 'label' });
  assert.equal(item.triggerElements.length, 1);

  const host = createGraphicHost();
  const group = new host.graphic.Group();
  const seriesModel = createSeriesModel({
    label: { show: false },
    itemStyle: { color: '#abc' },
    enterAnimation: false
  }, data);
  const hover = voronoiTreemap.drawVoronoiTreemap(host, group, seriesModel, {
    nodes: [
      { points: [[0, 0], [1, 0]], area: 10, dataIndex: 0 },
      createVoronoiNode({ area: 100, dataIndex: 0, name: 'Alpha' })
    ]
  }, { x: 1, y: 2, width: 100, height: 100 });
  assert.equal(hover.length, 1);
  voronoiTreemap.drawLabels(host, group, seriesModel, data, [createVoronoiNode({ area: 100 })], new Map());
  assert.ok(group.childrenList.length > 0);

  const labelSeries = createSeriesModel({
    label: { show: true, showInternal: false, minArea: 500, fontSize: 20 },
    enterAnimation: false
  }, data);
  voronoiTreemap.drawLabels(host, group, labelSeries, data, [
    createVoronoiNode({ area: 100 }),
    createVoronoiNode({ area: 600, isLeaf: false }),
    createVoronoiNode({ area: 600, points: [[0, 0], [10, 0], [10, 10], [0, 10]] })
  ], new Map([[0, voronoiTreemap.createHoverItem({})]]));
  voronoiTreemap.drawVoronoiTreemap(host, group, createSeriesModel({
    itemStyle: {},
    label: { show: true },
    enterAnimation: false
  }, createData([])), {
    nodes: [
      createVoronoiNode({ area: 100, dataIndex: -1, color: '' })
    ]
  }, { x: 0, y: 0, width: 100, height: 100 });
});

test('radial area private renderer helpers cover area construction, symbols, dashes, and animations', () => {
  assert.deepEqual(radialArea.readLineDash([1, 'x', 3]), [1, 3]);
  assert.deepEqual(radialArea.readLineDash('dotted'), [1.5, 5]);
  assert.equal(radialArea.readLineDash('solid'), null);
  assert.equal(radialArea.formatAxisLabel((value) => `v:${value}`, 4), 'v:4');
  assert.equal(radialArea.formatAxisLabel('{value}km', 4), '4km');

  const layout = createRadialAreaLayout({ closed: true });
  assert.equal(radialArea.createValueAreaPoints(layout).length, 8);
  assert.equal(radialArea.createValueAreaPoints({ ...layout, closed: false }).length, 6);
  assert.equal(radialArea.pointsToTuples(layout.valuePolygon, true).length, 4);

  const host = createGraphicHost();
  const group = new host.graphic.Group();
  const data = createData([{ value: 1, itemStyle: { color: '#f00' } }]);
  const silentModel = createSeriesModel({
    silent: true,
    showSymbol: true,
    symbolSize: 8,
    itemStyle: { color: '#00f' },
    enterAnimation: false
  }, data);
  const hover = radialArea.drawSymbols(host, group, silentModel, {
    ...layout,
    points: [{ dataIndex: -1 }, ...layout.points]
  }, { x: 2, y: 3, width: 100, height: 100 });
  assert.equal(hover.length, 0);
  assert.equal(data.graphics.get(0).shape.r, 4);
  assert.deepEqual(radialArea.readLayoutOption({ get: () => undefined }, { width: 100, height: 80 }), {
    data: [],
    layout: undefined,
    layoutOptions: {},
    width: 100,
    height: 80
  });
  radialArea.drawGrid(host, group, createSeriesModel({
    radialAxis: { show: false, splitLine: { show: false }, label: { show: false } },
    angleAxis: { show: false, splitLine: { show: false }, label: { show: false } }
  }), layout);
  const radialAreaNoOption = createSeriesModel({});
  delete radialAreaNoOption.option;
  radialArea.drawGrid(host, group, radialAreaNoOption, layout);
  assert.equal(radialArea.drawSymbols(host, group, createSeriesModel({
    silent: true,
    showSymbol: false
  }, data), layout, { x: 2, y: 3, width: 100, height: 100 }).length, 0);

  const areaModel = createSeriesModel({
    areaStyle: { show: true, color: '#abc' },
    rangeAreaStyle: { show: true },
    enterAnimation: { duration: 4, delay: 0 }
  }, data);
  radialArea.drawAreas(host, group, areaModel, layout);
  radialArea.drawLine(host, group, createSeriesModel({ lineStyle: { color: null } }, data), { ...layout, valuePolygon: [] });
  radialArea.applyPathEnterAnimation({}, 'shape', 'percent', enabledAnimation);
  radialArea.applyCircleEnterAnimation({}, 4, enabledAnimation);
  radialArea.applyFadeEnterAnimation({}, enabledAnimation);
  const radialPathMissingShape = createAnimatable({});
  delete radialPathMissingShape.shape;
  radialArea.applyPathEnterAnimation(radialPathMissingShape, 'shape', 'percent', enabledAnimation);
  assert.equal(radialPathMissingShape.shape.percent, 1);
  const radialCircleMissingTargets = createAnimatable({});
  delete radialCircleMissingTargets.shape;
  delete radialCircleMissingTargets.style;
  radialArea.applyCircleEnterAnimation(radialCircleMissingTargets, 4, enabledAnimation);
  assert.equal(radialCircleMissingTargets.shape.r, 4);
  const radialFadeMissingStyle = createAnimatable({});
  delete radialFadeMissingStyle.style;
  radialArea.applyFadeEnterAnimation(radialFadeMissingStyle, enabledAnimation);
  assert.equal(radialFadeMissingStyle.style.opacity, 1);
  const fallbackTarget = { style: {} };
  radialArea.animateGraphicProperty(fallbackTarget, 'style', enabledAnimation, { opacity: 0.5 });
  assert.equal(fallbackTarget.style.opacity, 0.5);
  const missingShapeTarget = { animate: () => null };
  radialArea.animateGraphicProperty(missingShapeTarget, 'shape', enabledAnimation, { percent: 1 });
  assert.equal(missingShapeTarget.shape, undefined);
  assert.equal(radialArea.resolveAnimationNumber(4, {}, 0, 1), 4);
  assert.equal(radialArea.resolveAnimationNumber(() => 'bad', {}, 0, 3), 3);
  assert.equal(radialArea.resolveAnimationEasing(''), 'cubicOut');
  assert.deepEqual(radialArea.asRecord([]), {});
  assert.equal(radialArea.nestedOptionValue({ parent: { child: 2 } }, 'parent', 'child'), 2);
  assert.equal(radialArea.finiteNumber('6', 0), 6);
  const animated = createAnimatable({ shape: {}, style: { opacity: 0.8 } });
  radialArea.applyCircleEnterAnimation(animated, 9, enabledAnimation);
  assert.equal(animated.animations.length, 2);

  const item = { elements: [] };
  radialArea.addHoverElement(undefined, {});
  radialArea.addHoverElement(item, {});
  assert.equal(item.triggerElements.length, 1);
});

test('radial boxplot private renderer helpers cover fallback arcs, grid branches, and animations', () => {
  assert.deepEqual(radialBoxplot.readLineDash([1, 'bad', 2]), [1, 2]);
  assert.deepEqual(radialBoxplot.readLineDash('dotted'), [1.5, 5]);
  assert.equal(radialBoxplot.readLineDash('solid'), null);
  assert.equal(radialBoxplot.radialBoxplotBoxKey({ id: '', categoryValue: '', name: '', dataIndex: 7 }), '7');
  assert.equal(radialBoxplot.arcPointsForFallback(0, 0, 10, 0, 90, true).length > 4, true);
  assert.equal(radialBoxplot.arcPointsForFallback(0, 0, 10, 90, 0, false).length > 4, true);

  const host = createGraphicHost();
  const layout = createRadialBoxplotLayout();
  const box = layout.boxes[0];
  assert.equal(radialBoxplot.createSectorOrPolygon({ graphic: { ...host.graphic, Sector: null } }, layout, box, {}, true, 1).type, 'polygon');
  assert.equal(radialBoxplot.createArcOrPolyline({ graphic: { ...host.graphic, Arc: null } }, layout, 0, 60, 20, {}, true, 1).type, 'polyline');

  const group = new host.graphic.Group();
  radialBoxplot.drawGrid(host, group, createSeriesModel({
    grid: { show: true },
    angleAxis: { splitLine: { show: true }, label: { show: true, rotate: false } },
    radialAxis: { splitLine: { show: true }, label: { show: true } }
  }), layout);
  assert.ok(group.childrenList.some((child) => child.type === 'line'));
  radialBoxplot.drawGrid(host, group, createSeriesModel({ grid: { show: false } }), layout);
  assert.deepEqual(radialBoxplot.readLayoutOption({ get: () => undefined }, { width: 100, height: 80 }), {
    data: [],
    layout: undefined,
    layoutOptions: {},
    width: 100,
    height: 80
  });
  const radialBoxplotNoOption = createSeriesModel({});
  delete radialBoxplotNoOption.option;
  radialBoxplot.drawGrid(host, group, radialBoxplotNoOption, layout);

  const data = createData([{ itemStyle: { color: '#123' } }]);
  radialBoxplot.drawHitAreas(host, group, createSeriesModel({}, data), {
    ...layout,
    boxes: [{ ...box, dataIndex: -1 }, box]
  }, { x: 1, y: 2, width: 100, height: 100 }, new Map([[0, radialBoxplot.createHoverItem({})]]));
  assert.equal(data.layouts.get(0)[0], box.medianX + 1);

  radialBoxplot.applyPathEnterAnimation({}, 'shape', 'percent', enabledAnimation);
  const boxplotPathMissingShape = createAnimatable({});
  delete boxplotPathMissingShape.shape;
  radialBoxplot.applyPathEnterAnimation(boxplotPathMissingShape, 'shape', 'percent', enabledAnimation);
  assert.equal(boxplotPathMissingShape.shape.percent, 1);
  radialBoxplot.applyLineEnterAnimation({}, enabledAnimation);
  assert.equal(radialBoxplot.readEnterAnimation(createSeriesModel({ enterAnimation: { enabled: false } }), 0).enabled, false);
  const fallbackTarget = { style: {} };
  radialBoxplot.animateGraphicProperty(fallbackTarget, 'style', enabledAnimation, { opacity: 0.6 });
  assert.equal(fallbackTarget.style.opacity, 0.6);
  const animatedMissingTarget = createAnimatable({ shape: undefined });
  radialBoxplot.animateGraphicProperty(animatedMissingTarget, 'shape', enabledAnimation, { percent: 1 });
  assert.equal(animatedMissingTarget.shape.percent, 1);
  const missingLineShape = createAnimatable({ shape: undefined });
  radialBoxplot.applyLineEnterAnimation(missingLineShape, enabledAnimation);
  assert.equal(missingLineShape.shape.percent, 1);
  const missingShapeTarget = { animate: () => null };
  radialBoxplot.animateGraphicProperty(missingShapeTarget, 'shape', enabledAnimation, { percent: 1 });
  assert.equal(missingShapeTarget.shape, undefined);
  assert.equal(radialBoxplot.resolveAnimationNumber(5, {}, 0, 1), 5);
  assert.equal(radialBoxplot.resolveAnimationNumber(() => 'bad', {}, 0, 3), 3);
  assert.equal(radialBoxplot.resolveAnimationEasing(''), 'cubicOut');
  assert.deepEqual(radialBoxplot.asRecord([]), {});
  assert.equal(radialBoxplot.nestedOptionValue({ parent: { child: 2 } }, 'parent', 'child'), 2);
  assert.equal(radialBoxplot.finiteNumber('6', 0), 6);
  const animated = createAnimatable({ shape: {} });
  radialBoxplot.applyLineEnterAnimation(animated, enabledAnimation);
  assert.equal(animated.animations[0].target.percent, 1);
  const item = { elements: [] };
  radialBoxplot.addHoverElement(undefined, {});
  radialBoxplot.addHoverElement(item, {});
  assert.equal(item.triggerElements.length, 1);
});

test('subway private renderer helpers cover route style, label collision, hover, and animation fallbacks', () => {
  assert.deepEqual(subway.readDashArray([1, 'x', -1, 3]), [1, 3]);
  assert.equal(subway.readDashArray([-1, 'x']), null);
  assert.deepEqual(subway.readDashArray('4, bad 2'), [4, 2]);
  assert.deepEqual(subway.readLineDash([2, 3], 5), [2, 3]);
  assert.deepEqual(subway.readLineDash('dashed', 5), [9, 5.75]);
  assert.deepEqual(subway.readLineDash('dotted', 10), [1.2, 11]);
  assert.equal(subway.readLineDash('solid', 5), null);
  assert.equal(subway.isDashedRouteStatus('under_construction'), true);
  assert.equal(subway.isDashedRouteStatus('在建'), true);
  assert.equal(subway.isDashedRouteStatus('建设中'), true);
  assert.equal(subway.isDashedRouteStatus('未开通'), true);
  assert.equal(subway.isDashedRouteStatus(1), false);
  assert.equal(subway.normalizeRouteDirection(0, 0), null);
  assert.deepEqual(subway.normalizeRouteDirection(-2, 0), { x: 1, y: -0 });
  assert.equal(subway.areParallelDirections({ x: 1, y: 0 }, { x: 1, y: 0.01 }), true);
  assert.equal(subway.firstDefined(null, undefined, 'x'), 'x');
  assert.equal(subway.firstFiniteNumber('x', 2), 2);

  const route = {
    id: 'r1',
    name: 'Route',
    color: '#f00',
    lineWidth: 8,
    raw: {
      status: 'open',
      lineStyle: { type: 'dotted', dashOffset: 2 },
      segments: [
        null,
        { lineStyle: {} },
        { from: 'missing', to: 'c', lineStyle: { color: '#00f' } },
        { from: 'a', to: 'c', lineStyle: { color: '#0f0' } },
        { index: 1, status: 'planned' },
        { startIndex: 2, endIndex: 99, lineStyle: { width: 3 } },
        { fromIndex: 0, toIndex: 1, lineStyle: { opacity: 0.5 } }
      ]
    },
    points: [
      { x: 0, y: 0, stationId: 'a' },
      { x: 20, y: 0, stationId: 'b' },
      { x: 40, y: 0, stationId: 'c' },
      { x: 60, y: 20, stationId: 'd' }
    ],
    stationIds: ['a', 'b', 'c', 'd']
  };
  const model = createSeriesModel({
    lineStyle: { dashArray: [2, 3], cap: 'square', join: 'bevel', cornerRadius: 5 }
  });
  const overrides = subway.resolveRouteSegmentStyleOverrides(route);
  assert.equal(overrides.size >= 2, true);
  assert.equal(subway.readRouteStatus(route, { hasStatus: true, status: 'planned', lineStyle: {} }), 'planned');
  assert.deepEqual(subway.readRouteLineDash([{ lineDash: null }, { dashArray: '6 2' }], 'open', 8), [6, 2]);
  assert.equal(subway.createRouteDrawStyle(model, route).style.lineDash.length, 2);
  assert.equal(subway.normalizeSegmentEndpointId(7), '7');
  assert.equal(subway.normalizeSegmentEndpointId(null), undefined);
  assert.equal(subway.readSegmentIndex(2, 1), null);

  const host = createGraphicHost();
  const group = new host.graphic.Group();
  assert.deepEqual(subway.readRoutes({ routes: ['routes'], data: ['data'] }), ['routes']);
  assert.deepEqual(subway.readRoutes({ data: ['data'] }), ['data']);
  assert.deepEqual(subway.readRoutes({}), []);
  assert.deepEqual(subway.readLayoutOption(createSeriesModel({
    data: ['raw'],
    padding: null,
    stationRadius: 5
  }), { x: 0, y: 0, width: 100, height: 80 }), {
    data: ['raw'],
    width: 100,
    height: 80,
    stationRadius: 5
  });
  const noOptionModel = createSeriesModel({});
  delete noOptionModel.option;
  assert.deepEqual(subway.readLayoutOption(noOptionModel, { x: 0, y: 0, width: 20, height: 10 }), {
    data: [],
    width: 20,
    height: 10
  });
  assert.deepEqual(subway.drawRoute(host, group, model, { ...route, points: [] }, 0, new Map()), []);
  assert.deepEqual(subway.drawRoutePath(host, group, [], {}, 0, disabledAnimation), []);
  subway.drawRouteLabels(host, group, createSeriesModel({ routeLabel: { show: true, position: 'start' } }), [{ ...route, points: [] }], new Map());
  subway.drawRouteLabels(host, group, createSeriesModel({ routeLabel: { show: true, position: 'start' } }), [{ ...route, points: [route.points[0]] }], new Map());
  subway.drawRouteLabels(host, group, createSeriesModel({ routeLabel: { show: true, position: 'end' } }), [{ ...route, points: [route.points[0]] }], new Map());

  const station = { id: 'b', x: 20, y: 0, radius: 6, lines: ['r1', 'r2', 'r3'], dataIndex: 0, raw: {}, interchange: true };
  const routes = [
    route,
    { ...route, id: 'r2', lineWidth: 9 },
    { ...route, id: 'r3', lineWidth: 7, points: [{ x: 20, y: 0, stationId: 'b' }, { x: 20, y: 20, stationId: 'x' }] }
  ];
  const offsets = new Map(routes.map((item) => [`${item.id}\0${item.id === 'r3' ? 0 : 1}`, { offsetX: 1, offsetY: 1 }]));
  assert.equal(subway.findParallelStationRouteGroup(station, routes, offsets).routeIds.size, 2);
  assert.equal(subway.resolveStationMarkerGeometry(station, { routes }, offsets).type, 'capsule');
  assert.equal(subway.resolveStationMarkerGeometry({ ...station, lines: ['r1'] }, { routes }, offsets).type, 'circle');
  assert.equal(subway.readStationStyle(createSeriesModel({
    stationStyle: {},
    interchangeStyle: {}
  }, createData([])), null, createData([]), {
    ...station,
    raw: {},
    dataIndex: -1,
    lines: ['r1']
  }, { routes: [{ ...route, color: '#route' }] }).stroke, '#route');
  assert.equal(subway.readStationStyle(createSeriesModel({
    stationStyle: {},
    interchangeStyle: {}
  }, createData([])), null, createData([]), {
    ...station,
    raw: {},
    dataIndex: -1,
    lines: ['missing']
  }, { routes: [] }).stroke, '#111827');

  const subwayData = createData([{ itemStyle: { color: '#fff' } }]);
  const subwaySeries = createSeriesModel({
    silent: false,
    label: { show: false },
    routeLabel: { show: false },
    lineStyle: { type: 'solid' },
    stationStyle: {},
    interchangeStyle: {},
    enterAnimation: false
  }, subwayData);
  const drawnHover = subway.drawSubway(host, group, subwaySeries, {
    routes: [route],
    stations: [
      { id: 'a', name: 'A', x: 0, y: 0, radius: 5, lines: ['r1'], dataIndex: 0, raw: {}, interchange: false },
      { id: 'outside', name: 'Outside', x: 80, y: 20, radius: 5, lines: ['r1'], dataIndex: -1, raw: {}, interchange: false }
    ]
  }, { x: 1, y: 2, width: 100, height: 80 });
  assert.equal(drawnHover.length > 0, true);
  const emptyRouteHover = subway.drawSubway(host, group, subwaySeries, {
    routes: [{ ...route, id: 'empty', points: [], stationIds: [] }],
    stations: []
  }, { x: 0, y: 0, width: 100, height: 80 });
  assert.equal(emptyRouteHover.length, 0);

  assert.equal(subway.readLabelRect({}), null);
  assert.equal(subway.readLabelRect({ getBoundingRect: () => ({ x: Infinity, y: 0, width: 1, height: 1 }) }), null);
  assert.equal(subway.readLabelRect({ getBoundingRect: () => ({ x: 0, y: 0, width: 10, height: 4 }) }).width, 16);
  const occupied = [];
  subway.recordLabelRect({}, occupied);
  assert.equal(occupied.length, 0);
  const noRectLabel = subway.createStationLabel({
    graphic: {
      Text: class {
        constructor(options) {
          Object.assign(this, options);
        }
      }
    }
  }, createSeriesModel({ color: '#111' }), {
    ...station,
    labelPosition: 'right'
  }, 'Label', [], []);
  assert.equal(noRectLabel.style.text, 'Label');
  assert.equal(subway.segmentIntersectsRect(0, 0, 10, 0, { x: 4, y: -1, width: 1, height: 2 }), true);
  assert.equal(subway.segmentIntersectsRect(0, 0, 0, 0, { x: 1, y: 1, width: 1, height: 1 }), false);
  assert.equal(subway.collisionArea({ x: 0, y: 0, width: 4, height: 4 }, { x: 2, y: 2, width: 4, height: 4 }), 4);
  assert.deepEqual(subway.labelPositionCandidates('bottom')[0], 'bottom');
  assert.equal(subway.labelOffsetCandidates(10, [{ padding: 20 }]).at(-1), 74);
  assert.equal(subway.formatStationLabel('{b}:{line}', { name: 'Station', lines: ['A', 'B'], raw: {}, interchange: false }), 'Station:A/B');
  assert.equal(subway.formatRouteLabel(({ name }) => name, route), 'Route');

  const map = new Map();
  subway.addMappedElements(map, 'x', []);
  subway.addMappedElements(map, 'x', [{ id: 1 }]);
  assert.equal(map.get('x').length, 1);
  assert.equal(subway.uniqueGraphicElements([null, map.get('x')[0], map.get('x')[0]]).length, 1);
  assert.equal(subway.createSubwayHoverItems({ routes: [{ ...route, stationIds: ['missing'] }], stations: [{ id: 'missing', lines: ['r1'] }] }, new Map([['r1', [{ id: 'route' }]]]), new Map()).length, 1);
  assert.equal(subway.createSubwayHoverItems({ routes: [{ ...route, id: 'no-elements', stationIds: ['s'] }], stations: [] }, new Map(), new Map([['s', [{ id: 'station' }]]])).length, 0);
  assert.equal(subway.createSubwayHoverItems({ routes: [], stations: [{ id: 'solo', lines: ['missing'] }] }, new Map(), new Map([['solo', [{ id: 'solo-el' }]]])).length, 1);
  assert.equal(subway.createSubwayHoverItems({
    routes: [],
    stations: [
      { id: 'with-elements', lines: ['shared'] },
      { id: 'without-elements', lines: ['shared'] }
    ]
  }, new Map(), new Map([['with-elements', [{ id: 'station-el' }]]])).length, 1);
  assert.equal(subway.createSubwayHoverItems({ routes: [], stations: [{ id: 'missing', lines: [] }] }, new Map(), new Map()).length, 0);

  subway.applyPathEnterAnimation({}, 'shape', 'percent', enabledAnimation);
  subway.applyCircleEnterAnimation({}, 4, enabledAnimation);
  subway.applyFadeEnterAnimation({}, enabledAnimation);
  assert.equal(subway.readEnterAnimation(createSeriesModel({ enterAnimation: { show: false } }), 0).enabled, false);
  subway.applyPathEnterAnimation(createAnimatable({ shape: undefined, style: undefined }), 'shape', 'percent', enabledAnimation);
  subway.applyCircleEnterAnimation(createAnimatable({ shape: undefined, style: undefined }), 4, enabledAnimation);
  subway.applyFadeEnterAnimation(createAnimatable({ style: undefined }), enabledAnimation);
  const fallbackTarget = { style: {} };
  subway.animateGraphicProperty(fallbackTarget, 'style', enabledAnimation, { opacity: 0.4 });
  assert.equal(fallbackTarget.style.opacity, 0.4);
  const fallbackShapeTarget = { animate: () => null };
  subway.animateGraphicProperty(fallbackShapeTarget, 'shape', enabledAnimation, { percent: 1 });
  assert.equal(fallbackShapeTarget.shape, undefined);
});

test('venn private renderer helpers cover bubble rendering and style fallback boundaries', () => {
  const host = createGraphicHost();
  const group = new host.graphic.Group();
  const data = createData([
    { name: 'A' },
    { name: 'B', itemStyle: { borderColor: '#222', borderWidth: 3, opacity: 0.4 } }
  ]);
  const seriesModel = createSeriesModel({
    itemStyle: {},
    label: { show: true },
    enterAnimation: { enabled: false }
  }, data);
  const layout = {
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
  const hoverItems = [];
  venn.drawBubbleVenn(host, group, seriesModel, data, layout, hoverItems, new Map());
  assert.equal(hoverItems.length, 2);
  assert.equal(data.graphics.get(0).shape.r, 10);
  assert.equal(venn.collectRelatedCircleElements(layout.labels[1], new Map([['A', { id: 'circle' }]])).length, 1);
  assert.equal(venn.findDataIndexForCircle({ setKey: 'missing' }, layout.labels, 4), 4);
  assert.equal(venn.readBubbleCircleStyle(createData([{}]), createSeriesModel({ itemStyle: {} }), createSeriesModel({ itemStyle: {} }), 0, 7).fill, '#8cd17d');
  assert.equal(venn.readBubbleCircleStyle(createData([{ style: { fill: '#vis' } }]), createSeriesModel({ itemStyle: { borderColor: '#normal' } }), createSeriesModel({ itemStyle: {} }), 0, 0).stroke, '#normal');
  assert.equal(venn.createLegendVisualProvider(seriesModel).getItemVisual(1, 'name'), 'B');
  assert.equal(venn.readEnterAnimation(seriesModel, 0).enabled, false);
  venn.applyCircleEnterAnimation(createAnimatable({ shape: undefined, style: undefined }), 4, enabledAnimation);
  venn.applyFadeEnterAnimation(createAnimatable({ style: undefined }), enabledAnimation);
  const fallbackTarget = { animate: () => null };
  venn.animateGraphicProperty(fallbackTarget, 'shape', enabledAnimation, { r: 4 });
  assert.equal(fallbackTarget.shape, undefined);
});

test('sunrise sunset private renderer helpers cover custom icons, clipping, motion, and text formatting', () => {
  assert.deepEqual(sunriseSunset.readSource({ data: [{ name: 'one' }] }), [{ name: 'one' }]);
  assert.deepEqual(sunriseSunset.readSource({ data: { name: 'one' } }), [{ name: 'one' }]);
  assert.equal(sunriseSunset.readSource({ sunrise: '06:00' })[0].name, 'sunrise-sunset');
  assert.equal(sunriseSunset.normalizeIconSource(''), undefined);
  assert.deepEqual(sunriseSunset.normalizeIconSource('image://moon.png'), { type: 'image', source: 'moon.png' });
  assert.deepEqual(sunriseSunset.normalizeIconSource('path://M0 0'), { type: 'path', source: 'M0 0' });
  assert.equal(sunriseSunset.normalizeIconSource({ image: ' ' }), undefined);
  assert.deepEqual(sunriseSunset.normalizeIconSource({ image: 'moon.png' }), { type: 'image', source: 'moon.png' });
  assert.equal(sunriseSunset.normalizeIconSource({ path: ' ' }), undefined);
  assert.deepEqual(sunriseSunset.resolveIconSize({ size: [12, 'bad'] }, 20), { width: 12, height: 12 });
  assert.deepEqual(sunriseSunset.resolveIconSize({ size: 'bad', width: 10, height: 9 }, 20), { width: 10, height: 9 });
  assert.deepEqual(sunriseSunset.resolveIconOffset({ offset: [3, 'bad'] }), { x: 3, y: 0 });
  assert.deepEqual(sunriseSunset.resolveIconOffset({ offsetX: 2, offsetY: 4 }), { x: 2, y: 4 });

  const host = createGraphicHost();
  const group = new host.graphic.Group();
  assert.equal(sunriseSunset.addCustomIcon({ graphic: { ...host.graphic, makeImage: null } }, group, 0, 0, 20, '#fff', 1, 1, 'image://moon.png'), null);
  assert.equal(sunriseSunset.addCustomIcon({ graphic: { ...host.graphic, makePath: null } }, group, 0, 0, 20, '#fff', 1, 1, 'M0 0'), null);
  assert.deepEqual(sunriseSunset.addCustomIcon(host, group, 0, 0, 20, '#fff', 1, 1, false), []);
  assert.equal(sunriseSunset.addCustomIcon(host, group, 0, 0, 20, '#fff', 1, 1, { image: 'image://moon.png' }).length, 1);
  assert.equal(sunriseSunset.addCustomIcon({
    graphic: {
      ...host.graphic,
      makeImage(source, rect, layout) {
        const element = new host.graphic.Rect({ shape: rect });
        element.type = 'image';
        element.source = source;
        element.layout = layout;
        delete element.style;
        return element;
      }
    }
  }, group, 0, 0, 20, '#fff', 1, 1, { image: 'moon.png', style: { opacity: 0.25 } })[0].style.opacity, 0.25);
  assert.equal(sunriseSunset.addCustomIcon(host, group, 0, 0, 20, '#fff', 1, 1, { path: 'path://M0 0', style: { opacity: 0.3 } }).length, 1);

  sunriseSunset.addPolygon(host, group, [{ x: 0, y: 0 }, { x: 1, y: 1 }], {}, true, 0, enabledAnimation, 'short');
  sunriseSunset.addPolygon(host, group, [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }], {}, true, 0, enabledAnimation, 'poly');
  sunriseSunset.addPolyline(host, group, [{ x: 0, y: 0 }], {}, true, 0, enabledAnimation, 'short-line');
  sunriseSunset.addPolyline(host, group, [{ x: 0, y: 0 }, { x: 10, y: 0 }], {}, true, 0, enabledAnimation, 'line', 0.5);
  const clipped = createAnimatable({
    shape: {},
    setClipPath(clip) {
      this.clip = clip;
    }
  });
  sunriseSunset.setClipRect(host, clipped, { x: 1, y: 2, width: 3, height: 4 }, 'clip', enabledAnimation, { x: 1, y: 2, width: 0, height: 4 });
  assert.equal(clipped.clip.shape.width, 3);

  sunriseSunset.applyPathEnterAnimation({}, 'shape', 'percent', enabledAnimation);
  sunriseSunset.applyFadeEnterAnimation({}, enabledAnimation);
  const sunriseFadeMissingStyle = createAnimatable({});
  delete sunriseFadeMissingStyle.style;
  sunriseSunset.applyFadeEnterAnimation(sunriseFadeMissingStyle, enabledAnimation);
  assert.equal(sunriseFadeMissingStyle.style.opacity, 1);
  sunriseSunset.applyClipRectEnterAnimation({}, enabledAnimation);
  const noAnimatorMotionGroup = { x: 0, y: 0, animate: () => null };
  sunriseSunset.applyIconMotion(noAnimatorMotionGroup, {
    animation: enabledAnimation,
    motionPoints: [{ x: 0, y: 0 }, { x: 10, y: 4 }],
    yOffset: 2
  });
  assert.equal(noAnimatorMotionGroup.x, 10);
  assert.equal(noAnimatorMotionGroup.y, 6);
  const animatedGroup = createAnimatable({});
  sunriseSunset.applyIconMotion(animatedGroup, {
    animation: enabledAnimation,
    motionPoints: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 4 }],
    yOffset: 1
  });
  assert.equal(animatedGroup.animations[0].whens.length, 3);
  const iconGroupWithoutKey = new host.graphic.Group();
  sunriseSunset.finishIconGroup(group, iconGroupWithoutKey, {
    animation: disabledAnimation,
    motionPoints: [{ x: 0, y: 0 }, { x: 10, y: 0 }],
    yOffset: 0
  });
  assert.equal(group.childrenList.includes(iconGroupWithoutKey), true);
  assert.equal(sunriseSunset.hasIconMotion({ animation: disabledAnimation, motionPoints: [{}, {}] }), false);
  assert.equal(sunriseSunset.shouldForceIconGroup({ forceGroup: true, animation: disabledAnimation, motionPoints: [{}, {}] }), true);
  assert.equal(sunriseSunset.resolveAnimationTarget({ keep: true }, '' ).keep, true);
  assert.equal(sunriseSunset.resolveAnimationTarget({}, 'style').constructor, Object);
  assert.equal(sunriseSunset.formatHeaderText(() => null, 'fallback', { title: 'T', remainingText: 'R', updatedText: 'U' }), '');
  assert.equal(sunriseSunset.formatHeaderText('{title}/{remaining}/{updated}', 'fallback', { title: 'T', remainingText: 'R', updatedText: 'U' }), 'T/R/U');
  assert.equal(sunriseSunset.formatHeaderText(null, 'fallback', { title: 'T', remainingText: 'R', updatedText: 'U' }), 'fallback');
  assert.equal(sunriseSunset.clampPercent(-1), 0);
  assert.equal(sunriseSunset.clampPercent(2), 1);
  assert.equal(sunriseSunset.isAliveRenderUpdate({ __aliveRenderUpdating: true }), true);
});

test('sunrise sunset private renderer helpers cover full draw and disabled animation edges', () => {
  const host = createGraphicHost();
  const group = new host.graphic.Group();
  const layout = layoutSunriseSunset({
    sunrise: '06:00',
    sunset: '18:00',
    moonrise: '21:00',
    moonset: '05:00',
    currentTime: '12:00',
    updatedAt: '12:10'
  }, {
    width: 320,
    height: 220,
    padding: 24
  });
  const emptyData = createData([]);
  const seriesModel = createSeriesModel({
    backgroundStyle: { color: '', opacity: 0 },
    titleLabel: { show: true },
    remainingLabel: { show: true },
    updatedLabel: { show: true },
    dayAreaStyle: {},
    dayLineStyle: {},
    moonLineStyle: {},
    baselineStyle: {},
    eventLabel: { show: true },
    enterAnimation: { show: false }
  }, emptyData);

  assert.deepEqual(sunriseSunset.readLayoutOption(createSeriesModel({
    data: [{ name: 'one' }],
    layoutOptions: null,
    width: null,
    height: 180
  }), { x: 0, y: 0, width: 300, height: 200 }), {
    data: [{ name: 'one' }],
    layout: undefined,
    layoutOptions: {},
    width: 300,
    height: 200
  });
  const sunriseNoOption = createSeriesModel({});
  delete sunriseNoOption.option;
  assert.deepEqual(sunriseSunset.readLayoutOption(sunriseNoOption, { x: 0, y: 0, width: 40, height: 30 }), {
    data: undefined,
    layout: undefined,
    layoutOptions: {},
    width: 40,
    height: 30
  });
  assert.equal(sunriseSunset.drawSunriseSunset(host, group, seriesModel, layout, { x: 2, y: 3, width: 320, height: 220 }).length, 4);
  assert.equal(emptyData.graphics.size, 0);

  const oneData = createData([{ name: 'chart' }]);
  const updatingSeries = createSeriesModel({
    backgroundStyle: { color: '#111', opacity: 1 },
    titleLabel: { show: true },
    remainingLabel: { show: true },
    updatedLabel: { show: true },
    dayAreaStyle: {},
    dayLineStyle: { color: '#day' },
    moonLineStyle: { color: '#moon' },
    baselineStyle: {},
    eventLabel: { show: false },
    enterAnimation: true
  }, oneData);
  updatingSeries.__aliveRenderUpdating = true;
  assert.equal(sunriseSunset.drawSunriseSunset(host, group, updatingSeries, {
    ...layout,
    day: { ...layout.day, visible: false },
    moon: { ...layout.moon, visible: false }
  }, { x: 2, y: 3, width: 320, height: 220 }).length, 0);
  assert.deepEqual(oneData.layouts.get(0), [layout.day.current.x, layout.day.current.y]);

  sunriseSunset.drawHeader(host, group, createSeriesModel({
    titleLabel: { show: true },
    remainingLabel: { show: true },
    updatedLabel: { show: true }
  }), layout);
  sunriseSunset.drawBackground(host, group, createSeriesModel({
    backgroundStyle: { color: '#222', opacity: 1 }
  }), layout);
  sunriseSunset.drawEvents(host, group, createSeriesModel({ eventLabel: { show: false } }), layout, '#000');
  assert.deepEqual(sunriseSunset.createArcProgressClip({ x: 10 }, { x: 110 }, 200, 0.5, 4), {
    x: 6,
    y: 0,
    width: 58,
    height: 200
  });
  assert.deepEqual(sunriseSunset.createArcFutureClip({ x: 10 }, { x: 110 }, 200, 0.5, 4), {
    x: 56,
    y: 0,
    width: 58,
    height: 200
  });
  assert.deepEqual(sunriseSunset.createStackedAreaPoints(
    [{ x: 10, y: 2 }, { x: 20, y: 4 }],
    [{ x: 10, y: 8 }, { x: 20, y: 10 }],
    12
  ), [{ x: 10, y: 2 }, { x: 20, y: 4 }, { x: 20, y: 10 }, { x: 10, y: 8 }]);
  assert.deepEqual(sunriseSunset.createStackedAreaPoints([{ x: 10, y: 2 }], [], 12), []);
  assert.equal(sunriseSunset.interpolateLowerBoundary(15, [], 14), 14);
  assert.equal(sunriseSunset.interpolateLowerBoundary(15, [{ x: 10, y: 8 }, { x: 20, y: 10 }], 12), 9);
  assert.equal(sunriseSunset.interpolateLowerBoundary(10, [{ x: 10, y: 8 }, { x: 10, y: 10 }], 12), 8);
  assert.equal(sunriseSunset.interpolateLowerBoundary(15, [{ x: 10, y: 8 }, { x: Number.NaN, y: 10 }, { x: 20, y: 12 }], 14), 14);
  assert.deepEqual(sunriseSunset.readLineStyle(createSeriesModel({ customStyle: { color: '', width: 'bad', opacity: 'bad' } }), 'customStyle', '#fallback', 3, 0.5), {
    stroke: '#fallback',
    lineWidth: 3,
    opacity: 0.5
  });
  assert.equal(sunriseSunset.readStyleValue(createSeriesModel({ customStyle: { color: null } }), 'customStyle', 'color', '#fallback'), '#fallback');
  assert.equal(sunriseSunset.readEnterAnimation(createSeriesModel({ enterAnimation: { enabled: false } }), 0).enabled, false);
  assert.equal(sunriseSunset.readEnterAnimation(createSeriesModel({ animation: false }), 0).enabled, false);
  sunriseSunset.applyPathEnterAnimation(createAnimatable({ shape: undefined }), 'shape', 'percent', disabledAnimation);
  sunriseSunset.applyFadeEnterAnimation(createAnimatable({ style: undefined }), disabledAnimation);
  sunriseSunset.applyClipRectEnterAnimation(createAnimatable({ shape: undefined }), disabledAnimation);
  sunriseSunset.applyClipRectEnterAnimation(createAnimatable({ shape: { x: 1, y: 2, width: 3, height: 4 } }), enabledAnimation);
  sunriseSunset.applyClipRectEnterAnimation(createAnimatable({ shape: { x: 1, y: 2, width: 3, height: 4 } }), enabledAnimation, {
    x: 1,
    y: 2,
    width: 3,
    height: 4
  });
  const fallbackTarget = { animate: () => null };
  sunriseSunset.animateGraphicProperty(fallbackTarget, 'style', enabledAnimation, { opacity: 0.3 });
  assert.equal(fallbackTarget.style.opacity, 0.3);
  const noDelayTarget = createAnimatable({ style: {} });
  sunriseSunset.animateGraphicProperty(noDelayTarget, 'style', { ...enabledAnimation, delay: 0 }, { opacity: 0.6 });
  assert.equal(noDelayTarget.style.opacity, 0.6);
  const delayedMotion = createAnimatable({});
  sunriseSunset.applyIconMotion(delayedMotion, {
    animation: { ...enabledAnimation, delay: 4 },
    motionPoints: [{ x: 0, y: 0 }, { x: 10, y: 2 }],
    yOffset: 1
  });
  assert.equal(delayedMotion.animations[0].delayDuration, 4);
  const noDelayMotion = createAnimatable({});
  sunriseSunset.applyIconMotion(noDelayMotion, {
    animation: { ...enabledAnimation, delay: 0 },
    motionPoints: [{ x: 0, y: 0 }, { x: 10, y: 2 }],
    yOffset: 1
  });
  assert.equal(noDelayMotion.animations[0].delayDuration, undefined);
  assert.equal(sunriseSunset.formatHeaderText(() => 123, 'fallback', layout), '123');
  assert.equal(sunriseSunset.asRecord({ ok: true }).ok, true);
  assert.equal(sunriseSunset.isPlainObject([]), false);
});

function createVoronoiNode(overrides = {}) {
  return {
    points: [[0, 0], [80, 0], [80, 40], [0, 40]],
    area: 3200,
    dataIndex: 0,
    centroidX: 40,
    centroidY: 20,
    depth: 1,
    isLeaf: true,
    name: 'Node',
    value: 10,
    percent: 0.5,
    parentId: 'root',
    color: '#ddd',
    raw: {},
    ...overrides
  };
}

function createRadialAreaLayout(overrides = {}) {
  const points = [
    { x: 10, y: 0, angle: 0, dataIndex: 0 },
    { x: 0, y: 10, angle: 90, dataIndex: 0 },
    { x: -10, y: 0, angle: 180, dataIndex: 0 }
  ];
  return {
    width: 100,
    height: 100,
    centerX: 0,
    centerY: 0,
    innerRadius: 4,
    outerRadius: 20,
    startAngle: 0,
    closed: true,
    points,
    valuePolygon: points,
    rangePolygon: [
      { x: 10, y: 0 },
      { x: 0, y: 10 },
      { x: -10, y: 0 },
      { x: 0, y: -10 }
    ],
    radialTicks: [{ value: 1, radius: 10 }],
    angleLabels: [{ name: 'A', value: 'A', angle: 0, x: 20, y: 0, align: 'center', verticalAlign: 'middle' }],
    ...overrides
  };
}

function createRadialBoxplotLayout() {
  return {
    width: 100,
    height: 100,
    centerX: 0,
    centerY: 0,
    innerRadius: 4,
    outerRadius: 30,
    startAngle: 0,
    clockwise: true,
    radialTicks: [{ value: 1, radius: 10 }],
    angleLabels: [{ name: 'A', value: 'A', angle: 0, rotation: 0, x: 20, y: 0, align: 'center', verticalAlign: 'middle' }],
    boxes: [{
      id: '',
      categoryValue: '',
      name: '',
      dataIndex: 0,
      q1Radius: 10,
      q3Radius: 20,
      startAngle: 0,
      endAngle: 45,
      capStartAngle: 0,
      capEndAngle: 45,
      minRadius: 8,
      maxRadius: 24,
      medianRadius: 16,
      medianX: 16,
      medianY: 0,
      lowerWhisker: { x1: 8, y1: 0, x2: 10, y2: 0 },
      upperWhisker: { x1: 20, y1: 0, x2: 24, y2: 0 },
      boxPoints: [[10, 0], [20, 0], [20, 10], [10, 10]]
    }]
  };
}

function createSeriesModel(option = {}, data = createData([])) {
  return {
    option,
    get(path) {
      return getPath(option, path);
    },
    getModel(path) {
      return createSeriesModel(getPath(option, path) || {}, data);
    },
    getBoxLayoutParams() {
      return {};
    },
    getData() {
      return data;
    },
    getRawData() {
      return data;
    }
  };
}

function createData(source) {
  return {
    source,
    layouts: new Map(),
    graphics: new Map(),
    initData(nextSource) {
      this.source = Array.isArray(nextSource) ? nextSource : [];
    },
    count() {
      return this.source.length;
    },
    getName(index) {
      return String(this.source[index]?.name ?? index);
    },
    indexOfName(name) {
      return this.source.findIndex((item, index) => this.getName(index) === name);
    },
    getItemModel(index) {
      return createSeriesModel(this.source[index] || {}, this);
    },
    getItemVisual(index, key) {
      const item = this.source[index] || {};
      if (key === 'style') return item.itemStyle || {};
      return item[key];
    },
    setItemLayout(index, layout) {
      this.layouts.set(index, layout);
    },
    setItemGraphicEl(index, element) {
      this.graphics.set(index, element);
    }
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

function createAnimatable(base = {}) {
  const element = {
    shape: {},
    style: {},
    animations: [],
    ...base
  };
  element.animate = (key) => {
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
  };
  return element;
}

function createGraphicHost() {
  class Element {
    constructor(options = {}) {
      this.type = this.constructor.elementType || 'element';
      this.shape = { ...(options.shape || {}) };
      this.style = { ...(options.style || {}) };
      this.silent = options.silent;
      this.z2 = options.z2;
      this.rotation = options.rotation;
      this.originX = options.originX;
      this.originY = options.originY;
    }

    animate(key) {
      return createAnimatable(this).animate(key);
    }

    setClipPath(clip) {
      this.clip = clip;
    }

    getBoundingRect() {
      const width = Number(this.style.text?.length || 1) * 6;
      return {
        x: Number(this.style.x || this.shape.x || 0),
        y: Number(this.style.y || this.shape.y || 0),
        width,
        height: Number(this.style.fontSize || 10)
      };
    }
  }
  class Group extends Element {
    static elementType = 'group';
    constructor() {
      super();
      this.childrenList = [];
    }
    add(element) {
      this.childrenList.push(element);
    }
    removeAll() {
      this.childrenList = [];
    }
  }
  class Circle extends Element { static elementType = 'circle'; }
  class Line extends Element { static elementType = 'line'; }
  class Polygon extends Element { static elementType = 'polygon'; }
  class Polyline extends Element { static elementType = 'polyline'; }
  class Rect extends Element { static elementType = 'rect'; }
  class Sector extends Element { static elementType = 'sector'; }
  class Arc extends Element { static elementType = 'arc'; }
  class Text extends Element { static elementType = 'text'; }
  return {
    graphic: {
      Group,
      Circle,
      Line,
      Polygon,
      Polyline,
      Rect,
      Sector,
      Arc,
      Text,
      makePath(path, options) {
        const element = new Element(options);
        element.type = 'path';
        element.path = path;
        return element;
      },
      makeImage(source, rect, layout) {
        const element = new Element({ shape: rect, style: { image: source, layout } });
        element.type = 'image';
        return element;
      }
    }
  };
}
