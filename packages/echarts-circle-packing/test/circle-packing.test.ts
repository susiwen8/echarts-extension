import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import { SVGRenderer } from 'echarts/renderers';
import { installElementHover, setElementHoverDimOpacity } from '@echarts-extension/layout-core';

import { __test__ as circlePackingInternals } from '../src/circle-packing.ts';
import {
  __test__ as circlePackingLayoutInternals,
  flattenCirclePackingData,
  layoutCirclePacking,
  resolveCirclePackingLayout
} from '../src/layout.ts';
import { buildWaterdropFusionPath, createWaterdropFusionShape } from '../src/waterdrop-fusion.ts';
import { buildWaterdropFusionPath as buildEvolutionWaterdropFusionPath } from '../../echarts-evolution-fluid/src/waterdrop-fusion.ts';

echarts.use([SVGRenderer]);

const portfolio = {
  name: 'Portfolio',
  children: [
    {
      name: 'Core',
      value: 120,
      children: [
        { name: 'Search', value: 54 },
        { name: 'Editor', value: 38 },
        { name: 'Storage', value: 28 }
      ]
    },
    {
      name: 'Growth',
      children: [
        { name: 'Campaigns', value: 32 },
        { name: 'Referrals', value: 22 },
        { name: 'Activation', value: 18 }
      ]
    },
    {
      name: 'Platform',
      children: [
        { name: 'API', value: 42 },
        { name: 'Billing', value: 24 }
      ]
    }
  ]
};

const productData = {
  name: 'root',
  children: [
    {
      name: 'Core Experience',
      value: 120,
      children: [
        { name: 'Sync', value: 18 },
        { name: 'Center Experience', value: 54 },
        { name: 'Search', value: 38 },
        { name: 'Other', value: 20 }
      ]
    },
    {
      name: 'Platform',
      children: [
        { name: 'API', value: 42 },
        { name: 'Billing', value: 24 }
      ]
    }
  ]
};

const drilldownData = {
  name: 'root',
  children: [
    {
      name: 'Core',
      children: [
        {
          name: 'Creation',
          children: [
            {
              name: 'Editor',
              children: [
                { name: 'Blocks', value: 18 },
                { name: 'Shortcuts', value: 12 }
              ]
            }
          ]
        }
      ]
    }
  ]
};

const fluidData = {
  id: 'portfolio',
  name: 'Portfolio',
  children: [
    {
      id: 'core',
      name: 'Core',
      children: [
        { id: 'search', name: 'Search', value: 54 },
        { id: 'editor', name: 'Editor', value: 38 },
        { id: 'console', name: 'Console', value: 16 }
      ]
    },
    {
      id: 'growth',
      name: 'Growth',
      children: [
        { id: 'campaigns', name: 'Campaigns', value: 32 },
        { id: 'referrals', name: 'Referrals', value: 22 }
      ]
    }
  ]
};

test('does not depend on external hierarchy layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
  assert.equal(packageJson.dependencies?.['d3-hierarchy'], undefined);
});

test('computes deterministic nested circle packing with contained children', () => {
  const first = layoutCirclePacking(portfolio, {
    width: 640,
    height: 520,
    padding: 24,
    siblingGap: 2,
    nodePadding: 4,
    sort: false
  });
  const second = layoutCirclePacking(portfolio, {
    width: 640,
    height: 520,
    padding: 24,
    siblingGap: 2,
    nodePadding: 4,
    sort: false
  });

  assert.deepEqual(first, second);
  assert.equal(first.root.name, 'Portfolio');
  assert.equal(first.rootVisible, true);
  assert.equal(first.nodes.length, 12);

  const byName = new Map(first.nodes.map((node) => [node.name, node]));
  assert.ok(byName.get('Core').r > byName.get('Growth').r);
  assert.ok(byName.get('Search').r > byName.get('Storage').r);

  assertNodeWithinChart(first.root, first);
  first.nodes.forEach((node) => {
    assert.equal(Number.isFinite(node.x), true, `${node.name} x`);
    assert.equal(Number.isFinite(node.y), true, `${node.name} y`);
    assert.equal(Number.isFinite(node.r), true, `${node.name} radius`);
    if (!node.parentId) return;
    const parent = first.nodes.find((candidate) => candidate.id === node.parentId);
    assert.ok(parent, `${node.name} has parent`);
    assertNodeInsideParent(node, parent);
  });
  assertSiblingCirclesDoNotOverlap(first.nodes, 0.001);
});

test('fluid merge events mutate hierarchy values before packing', () => {
  const result = resolveCirclePackingLayout({
    data: fluidData,
    width: 640,
    height: 520,
    padding: 24,
    sort: false,
    fluid: {
      enabled: true,
      currentTime: 10,
      events: [
        { time: 10, type: 'merge', sources: ['search'], targets: ['editor'] }
      ]
    }
  });
  const byName = new Map(result.nodes.map((node) => [node.name, node]));

  assert.equal(byName.has('Search'), false);
  assert.equal(byName.get('Editor')?.value, 92);
  result.nodes.forEach((node) => {
    if (!node.parentId) return;
    assertNodeInsideParent(node, result.nodes.find((candidate) => candidate.id === node.parentId));
  });
  assertSiblingCirclesDoNotOverlap(result.nodes, 0.001);
});

test('fluid active merge events interpolate nodes and expose liquid bridges', () => {
  const base = resolveCirclePackingLayout({
    data: fluidData,
    width: 640,
    height: 520,
    padding: 24,
    sort: false
  });
  const result = resolveCirclePackingLayout({
    data: fluidData,
    width: 640,
    height: 520,
    padding: 24,
    sort: false,
    fluid: {
      enabled: true,
      currentTime: 9.2,
      events: [
        { time: 10, type: 'merge', sources: ['search'], targets: ['editor'] }
      ],
      bridgeOpacity: 0.82,
      bridgeThreshold: 180
    }
  });
  const baseByName = new Map(base.nodes.map((node) => [node.name, node]));
  const byName = new Map(result.nodes.map((node) => [node.name, node]));
  const search = byName.get('Search');
  const editor = byName.get('Editor');

  assert.ok(search);
  assert.ok(editor);
  assert.equal(search.r < baseByName.get('Search').r, true);
  assert.equal(editor.r > baseByName.get('Editor').r, true);
  assert.equal(result.fluid?.bridges.length, 1);
  assert.equal(result.fluid?.bridges[0].sourceIds.includes(search.id), true);
  assert.equal(result.fluid?.bridges[0].targetIds.includes(editor.id), true);
  assert.match(result.fluid?.bridges[0].path ?? '', /^M /);
  assert.ok(((result.fluid?.bridges[0].path ?? '').match(/\bM\b/g) || []).length >= 3);
  assert.equal(result.fluid?.bridges[0].surfaceShape?.bridgeOnly, undefined);
  assert.equal(result.fluid?.bridges[0].renderPath, false);
  assert.deepEqual(result.fluid?.bridges[0].hiddenIds, []);
  assert.deepEqual(result.fluid?.bridges[0].opaqueIds, [search.id, editor.id]);
  assert.deepEqual(result.fluid?.bridges[0].elevatedIds, [search.id]);
  assert.equal((result.fluid?.bridges[0].surfaceShape?.neck ?? 0) > 0, true);
  assert.equal((result.fluid?.bridges[0].surfaceShape?.bridgeLength ?? 0) > 0, true);
});

test('fluid split bridges follow the same source anchor as the growing target', () => {
  const splitBridgeData = {
    name: 'root',
    children: [
      { id: 'source-a', name: 'A', value: 30 },
      { id: 'source-b', name: 'B', value: 30 },
      { id: 'target', name: 'T', value: 10 }
    ]
  };
  const result = resolveCirclePackingLayout({
    data: splitBridgeData,
    width: 640,
    height: 520,
    padding: 24,
    sort: false,
    fluid: {
      enabled: true,
      currentTime: 9.95,
      events: [
        { time: 10, type: 'split', sources: ['source-a', 'source-b'], targets: ['target'] }
      ],
      bridgeOpacity: 0.82,
      bridgeThreshold: 300
    }
  });

  assert.equal(result.fluid?.bridges.length, 1);
  assert.equal(result.fluid?.bridges[0].sourceId.endsWith('/source-a'), true);
  assert.equal(result.fluid?.bridges[0].targetId.endsWith('/target'), true);
});

test('fluid bridges keep waterdrop geometry while merging circles partially overlap', () => {
  const result = resolveCirclePackingLayout({
    data: {
      name: 'root',
      children: [
        { id: 'source', name: 'Source', value: 12 },
        { id: 'target', name: 'Target', value: 14 },
        { id: 'other', name: 'Other', value: 8 }
      ]
    },
    width: 640,
    height: 520,
    padding: 24,
    sort: false,
    fluid: {
      enabled: true,
      currentTime: 9.46,
      events: [
        { time: 10, type: 'merge', sources: ['source'], targets: ['target'] }
      ],
      bridgeThreshold: 300
    }
  });

  const bridge = result.fluid?.bridges[0];
  assert.ok(bridge?.surfaceShape);
  assert.match(bridge.path, /^M /);
  assert.ok((bridge.path.match(/\bM\b/g) || []).length >= 3);
  assert.equal(bridge.surfaceShape.bridgeOnly, undefined);
});

test('waterdrop absorb bridges reuse the evolution-fluid waterdrop geometry', () => {
  const shape = createWaterdropFusionShape(
    { x: 512, y: 198, r: 55 },
    { x: 587, y: 343, r: 74 },
    { bridgeOnly: true, narrowBridge: true, neckSize: 16, bridgeLength: 178, handleSize: 0.85 }
  );
  assert.ok(shape);
  const circlePackingOps = recordWaterdropPath(buildWaterdropFusionPath, shape);
  const evolutionFluidOps = recordWaterdropPath(buildEvolutionWaterdropFusionPath, shape);

  assert.deepEqual(roundWaterdropOps(circlePackingOps), roundWaterdropOps(evolutionFluidOps));
});

test('fluid renderer helpers draw path, waterdrop, gradient, and fallback bridge variants', () => {
  const surfaceShape = createWaterdropFusionShape(
    { x: 0, y: 0, r: 12 },
    { x: 28, y: 0, r: 10 },
    { bridgeOnly: true, bridgeLength: 36, neckSize: 7 }
  );
  assert.ok(surfaceShape);
  let capturedShapeDefinition;
  const makePathCalls = [];
  const host = {
    graphic: {
      makePath(path, options) {
        makePathCalls.push({ path, options });
        return {
          type: 'path',
          shape: { path },
          style: undefined
        };
      },
      LinearGradient: class LinearGradient {
        constructor(...args) {
          this.args = args;
        }
      },
      extendShape(definition) {
        capturedShapeDefinition = definition;
        return class WaterdropShape {
          constructor(options) {
            this.type = definition.type;
            this.shape = options.shape;
            this.style = options.style;
            this.silent = options.silent;
            this.z2 = options.z2;
          }
        };
      }
    }
  };
  const group = {
    children: [],
    add(element) {
      this.children.push(element);
    }
  };

  circlePackingInternals.resetWaterdropFusionGraphicForTest();
  assert.equal(
    circlePackingInternals.createWaterdropFusionGraphicElement({ graphic: {} }, fluidBridge({ surfaceShape }), {}),
    null
  );
  circlePackingInternals.resetWaterdropFusionGraphicForTest();
  assert.equal(circlePackingInternals.createWaterdropFusionGraphicElement(host, fluidBridge(), {}), null);
  const waterdropElement = circlePackingInternals.createWaterdropFusionGraphicElement(
    host,
    fluidBridge({ surfaceShape }),
    {}
  );
  assert.equal(waterdropElement.type, 'circlePackingWaterdropFusion');
  assert.equal(waterdropElement.style.fill, '#ffffff');

  const fill = circlePackingInternals.createCirclePackingBridgeFill(host, fluidBridge({
    color: '#123456',
    gradient: {
      x0: 0,
      y0: 0,
      x1: 1,
      y1: 1,
      colorStops: [{ offset: 0, color: '#000000' }, { offset: 1, color: '#ffffff' }]
    }
  }));
  assert.deepEqual(fill.args.at(-1), true);

  circlePackingInternals.drawCirclePackingFluidBridges(host, group, [], true);
  circlePackingInternals.drawCirclePackingFluidBridges(host, group, [
    fluidBridge({
      id: 'path-first',
      path: 'M 0 0 L 1 1 Z',
      renderPath: true,
      gradient: {
        x0: 0,
        y0: 0,
        x1: 1,
        y1: 0,
        colorStops: [{ offset: 0, color: '#111111' }, { offset: 1, color: '#222222' }]
      }
    }),
    fluidBridge({
      id: 'waterdrop',
      path: '',
      surfaceShape,
      renderPath: false
    }),
    fluidBridge({
      id: 'path-fallback',
      path: 'M 2 2 L 3 3 Z',
      surfaceShape: undefined,
      renderPath: false
    }),
    fluidBridge({
      id: 'no-shape',
      path: '',
      surfaceShape: undefined,
      renderPath: false
    })
  ], true);

  assert.equal(group.children.length, 3);
  assert.equal(makePathCalls.length, 2);
  assert.equal(group.children[0].style.opacity, 0.78);
  assert.equal(group.children[0].__circlePackingFluidBridge, 'path-first');
  assert.equal(group.children[1].type, 'circlePackingWaterdropFusion');
  assert.equal(group.children[2].shape.path, 'M 2 2 L 3 3 Z');
  const ops = recordWaterdropPath((ctx, shape) => capturedShapeDefinition.buildPath(ctx, shape), surfaceShape);
  assert.ok(ops.length > 0);
  circlePackingInternals.resetWaterdropFusionGraphicForTest();
});

test('fluid draw policy keeps explicit bridge draw hints and descendants in the right layers', () => {
  const hiddenChild = circleNode({ id: 'hidden-child', parentId: 'elevated-parent' });
  const visibleChild = circleNode({ id: 'visible-child', parentId: 'opaque-parent' });
  const elevatedParent = circleNode({ id: 'elevated-parent', children: [hiddenChild] });
  const opaqueParent = circleNode({ id: 'opaque-parent', children: [visibleChild] });
  const nodesById = new Map([
    ['elevated-parent', elevatedParent],
    ['hidden-child', hiddenChild],
    ['opaque-parent', opaqueParent],
    ['visible-child', visibleChild],
    ['source', circleNode({ id: 'source' })],
    ['target', circleNode({ id: 'target' })],
    ['split-source', circleNode({ id: 'split-source' })],
    ['split-target', circleNode({ id: 'split-target' })],
    ['other-source', circleNode({ id: 'other-source' })],
    ['other-target', circleNode({ id: 'other-target' })]
  ]);

  const policy = circlePackingInternals.createCirclePackingFluidDrawPolicy([
    fluidBridge({
      hiddenIds: ['hidden-child'],
      opaqueIds: ['opaque-parent', 'missing-opaque'],
      elevatedIds: ['elevated-parent', 'missing-elevated']
    }),
    fluidBridge({
      opaqueIds: ['source']
    }),
    fluidBridge({
      hiddenIds: ['target']
    }),
    fluidBridge({
      kind: 'split',
      sourceId: 'split-source',
      targetId: 'split-target',
      sourceIds: [],
      targetIds: [],
      surfaceShape: { bridgeOnly: true }
    }),
    fluidBridge({
      kind: 'absorb',
      sourceId: 'source',
      targetId: 'target',
      sourceIds: [],
      targetIds: [],
      surfaceShape: { bridgeOnly: true }
    }),
    fluidBridge({
      kind: 'absorb',
      sourceId: 'source',
      targetId: 'target',
      sourceIds: ['source'],
      targetIds: ['target'],
      surfaceShape: { bridgeOnly: false }
    }),
    fluidBridge({
      kind: 'split',
      sourceId: 'split-source',
      targetId: 'split-target',
      sourceIds: ['split-source'],
      targetIds: ['split-target'],
      surfaceShape: { bridgeOnly: false }
    }),
    fluidBridge({
      kind: 'handoff',
      sourceId: 'other-source',
      targetId: 'other-target',
      sourceIds: ['other-source'],
      targetIds: ['other-target'],
      surfaceShape: { bridgeOnly: false }
    }),
    fluidBridge({
      sourceId: 'ignored',
      targetId: 'ignored-target',
      sourceIds: [],
      targetIds: [],
      surfaceShape: undefined
    })
  ], nodesById);

  assert.equal(policy.hiddenCircleIds.has('hidden-child'), true);
  assert.equal(policy.hiddenCircleIds.has('target'), true);
  assert.equal(policy.hiddenCircleIds.has('split-source'), true);
  assert.equal(policy.hiddenCircleIds.has('other-source'), true);
  assert.equal(policy.hiddenCircleIds.has('other-target'), true);
  assert.equal(policy.opaqueCircleIds.has('opaque-parent'), true);
  assert.equal(policy.opaqueCircleIds.has('visible-child'), true);
  assert.equal(policy.opaqueCircleIds.has('source'), true);
  assert.equal(policy.opaqueCircleIds.has('split-target'), true);
  assert.equal(policy.elevatedCircleIds.has('elevated-parent'), true);
  assert.equal(policy.elevatedCircleIds.has('hidden-child'), false);
  assert.equal(policy.elevatedCircleIds.has('split-target'), true);
  assert.deepEqual(circlePackingInternals.collectCirclePackingDescendantIds(opaqueParent), ['visible-child']);
  assert.equal(circlePackingInternals.resolveCirclePackingFluidCircleZ2(
    circleNode({ id: 'active', depth: 2, fluidActiveTarget: true }),
    policy
  ), 7.02);
  assert.equal(circlePackingInternals.resolveCirclePackingFluidCircleZ2(
    circleNode({ id: 'opaque-parent', depth: 1, children: [visibleChild] }),
    policy
  ), 6.01);
});

test('fluid render style prefers stable layout colors before item fallback colors', () => {
  const data = {
    count: () => 1,
    getItemVisual: () => ({ fill: '#visual' })
  };
  const emptyData = {
    count: () => 0,
    getItemVisual: () => ({ fill: '#unused' })
  };
  const seriesModel = (style = {}) => ({
    get: (path) => (path === 'itemStyle' ? style : undefined)
  });
  const itemModel = (style = {}) => ({
    get: (path) => (path === 'itemStyle' ? style : undefined)
  });

  assert.equal(circlePackingInternals.readNodeStyle(
    data,
    seriesModel(),
    itemModel({ color: '#item' }),
    circleNode({ color: '', raw: {} }),
    0,
    true
  ).fill, '#item');
  assert.equal(circlePackingInternals.readNodeStyle(
    data,
    seriesModel(),
    null,
    circleNode({ color: '', raw: { itemStyle: { color: '#raw' } } }),
    0,
    true
  ).fill, '#raw');
  assert.equal(circlePackingInternals.readNodeStyle(
    data,
    seriesModel({ color: '#series' }),
    null,
    circleNode({ color: '', raw: {} }),
    0,
    true
  ).fill, '#series');
  assert.equal(circlePackingInternals.readNodeStyle(
    data,
    seriesModel(),
    null,
    circleNode({ color: '', raw: {} }),
    0,
    true
  ).fill, '#visual');
  assert.equal(circlePackingInternals.readNodeStyle(
    emptyData,
    seriesModel(),
    null,
    circleNode({ color: '', raw: {} }),
    0,
    true
  ).fill, '#356ac3');
});

test('fluid timing and utility helpers cover normalized event edge cases', () => {
  const date = new Date('2026-01-02T00:00:00.000Z');
  const events = circlePackingLayoutInternals.normalizeCirclePackingFluidEvents([
    { time: '2026-01-03T00:00:00.000Z', type: 'checkpoint', target: 9, bridge: false },
    { id: 7, time: date, span: 2, from: ['a', 3, null], to: 'b', value: -3, showBridge: false },
    'bad'
  ]);

  assert.deepEqual(circlePackingLayoutInternals.normalizeCirclePackingFluidEvents(null), []);
  const datedEvent = events.find((event) => event.id === '7');
  const fallbackEvent = events.find((event) => event.id === 'fluid-event-2');
  assert.equal(datedEvent.time, date.toISOString());
  assert.deepEqual(datedEvent.sourceRefs, ['a', '3']);
  assert.deepEqual(datedEvent.targetRefs, ['b']);
  assert.equal(datedEvent.value, 0);
  assert.equal(datedEvent.drawBridge, false);
  assert.equal(events.some((event) => event.timeValue === Date.parse('2026-01-03T00:00:00.000Z')), true);
  assert.equal(fallbackEvent.type, 'merge');
  assert.deepEqual(circlePackingLayoutInternals.normalizeCirclePackingFluidEvents([
    { id: 'first', time: 1 },
    { id: 'second', time: 1 }
  ]).map((event) => event.id), ['first', 'second']);

  const options = circlePackingLayoutInternals.resolveCirclePackingFluidOptions({
    enabled: true,
    currentTime: '2',
    dropletStyle: { bridgeOpacity: 2, bridgeThreshold: -1, bridgeColor: '#abc' },
    events: [{ time: 1 }]
  });
  assert.equal(options.enabled, true);
  assert.equal(options.bridgeOpacity, 1);
  assert.equal(options.bridgeThreshold, 1);
  assert.equal(options.bridgeColor, '#abc');
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidOptions(null).enabled, false);

  assert.equal(circlePackingLayoutInternals.timeToNumber(3, 0), 3);
  assert.equal(circlePackingLayoutInternals.timeToNumber(date, 0), date.getTime());
  assert.equal(circlePackingLayoutInternals.timeToNumber('4', 0), 4);
  assert.equal(circlePackingLayoutInternals.timeToNumber('2026-01-02T00:00:00.000Z', 0), date.getTime());
  assert.equal(circlePackingLayoutInternals.timeToNumber('bad', 5), 5);
  assert.equal(circlePackingLayoutInternals.timeToNumber({}, 6), 6);
  assert.equal(circlePackingLayoutInternals.stringifyValue(date, 'fallback'), date.toISOString());
  assert.equal(circlePackingLayoutInternals.stringifyValue('', 'fallback'), 'fallback');
  assert.deepEqual(circlePackingLayoutInternals.readIdArray(null), []);
  assert.deepEqual(circlePackingLayoutInternals.readIdArray(['a', 2, null]), ['a', '2']);

  const first = eventObject({ timeValue: 1, type: 'spinOff', targetRefs: ['b'], duration: null });
  const merge = eventObject({ timeValue: 3, type: 'merge', sourceRefs: ['a'], targetRefs: ['b'], duration: 5 });
  const move = eventObject({ timeValue: 4, type: 'move', sourceRefs: ['b'], targetRefs: ['c'], duration: null });
  const checkpoint = eventObject({ timeValue: 5, type: 'checkpoint', targetRefs: ['c'], drawBridge: false, duration: null });
  const normalizedEvents = [first, merge, move, checkpoint];

  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidActivePhase(normalizedEvents, 0.5)?.event, first);
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidActivePhase(normalizedEvents, -2), null);
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidEventProgressAt(normalizedEvents, merge, 2), 0.5);
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidEventSpan(eventObject({ type: 'spinOff', timeValue: 4, duration: null }), undefined), 4);
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidEventSpan(eventObject({ duration: 2 }), undefined), 2);
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidEventSpan(eventObject({ duration: null }), undefined), 1);
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidEventSpan(eventObject({ duration: 5, timeValue: 7 }), 4), 3);
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidEventSpan(checkpoint, 4), 1);
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidEventSpan(first, 0), 1);
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidEventSpan(move, 3), 1);
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidEventSpan(eventObject({ timeValue: 6, type: 'merge', duration: null }), 3), 3);
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidProgress([], 1), 1);
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidProgress(normalizedEvents, null), 1);
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidProgress([eventObject({ timeValue: 1 }), eventObject({ timeValue: 1 })], 0), 0);
  assert.equal(circlePackingLayoutInternals.resolveCirclePackingFluidProgress([eventObject({ timeValue: 1 }), eventObject({ timeValue: 1 })], 1), 1);
  assert.equal(circlePackingLayoutInternals.findPreviousCirclePackingMoveEventForTargets(normalizedEvents, checkpoint), move);
  assert.equal(circlePackingLayoutInternals.findPreviousCirclePackingMoveEventForTargets(normalizedEvents, { ...checkpoint, targetRefs: ['missing'] }), null);
  assert.equal(circlePackingLayoutInternals.findPreviousCirclePackingMoveEventForTargets(normalizedEvents, eventObject({ targetRefs: [] })), null);
  assert.equal(circlePackingLayoutInternals.findFollowingCirclePackingMoveSettleEvent(normalizedEvents, move), checkpoint);
  assert.equal(circlePackingLayoutInternals.findFollowingCirclePackingMoveSettleEvent(normalizedEvents, { ...move, targetRefs: ['missing'] }), null);
  assert.equal(circlePackingLayoutInternals.findFollowingCirclePackingMoveSettleEvent(normalizedEvents, eventObject({ type: 'move', targetRefs: ['c'] })), null);
  assert.equal(circlePackingLayoutInternals.findFollowingCirclePackingMoveSettleEvent(normalizedEvents, eventObject({ targetRefs: [] })), null);
  assert.equal(circlePackingLayoutInternals.hasFollowingCirclePackingMoveSettleEvent(normalizedEvents, move), true);
  assert.equal(circlePackingLayoutInternals.findNextCirclePackingSplitEventFromTargets(normalizedEvents, eventObject({ targetRefs: [] })), null);
  assert.equal(circlePackingLayoutInternals.findNextCirclePackingSplitEventFromTargets([
    eventObject({ id: 'absorb', type: 'merge', targetRefs: ['b'], timeValue: 1 }),
    eventObject({ id: 'late-merge', type: 'merge', sourceRefs: ['b'], timeValue: 2 })
  ], eventObject({ id: 'absorb', type: 'merge', targetRefs: ['b'], timeValue: 1 })), null);
  assert.equal(circlePackingLayoutInternals.findPreviousCirclePackingAbsorbHandoffEvent(normalizedEvents, move), null);
});

test('fluid color and geometry helpers handle bridge boundaries without changing layouts', () => {
  assert.deepEqual(circlePackingLayoutInternals.parseHexColor('#abc'), [170, 187, 204]);
  assert.deepEqual(circlePackingLayoutInternals.parseHexColor('#010203'), [1, 2, 3]);
  assert.equal(circlePackingLayoutInternals.parseHexColor('not-a-color'), null);
  assert.equal(circlePackingLayoutInternals.mixColors('#000000', '#ffffff', 0.5), 'rgb(128, 128, 128)');
  assert.equal(circlePackingLayoutInternals.mixColors('bad', '#ffffff', 0.5), '');
  assert.ok(circlePackingLayoutInternals.normalizeAngleDelta(Math.PI * 3) <= Math.PI);
  assert.ok(circlePackingLayoutInternals.normalizeAngleDelta(-Math.PI * 3) >= -Math.PI);
  assert.equal(circlePackingLayoutInternals.pointDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  assert.deepEqual(roundPoint(circlePackingLayoutInternals.tangentPoint({ x: 0, y: 0 }, 0, 5, 1)), { x: 0, y: 5 });
  assert.deepEqual(circlePackingLayoutInternals.offsetPoint({ x: 1, y: 2 }, { x: 3, y: 4 }, 2), { x: 7, y: 10 });
  assert.equal(circlePackingLayoutInternals.isValidPoint({ x: Infinity, y: 0 }), false);
  assert.deepEqual(roundPoint(circlePackingLayoutInternals.pointOnCircle({ x: 1, y: 1 }, 2, 0)), { x: 3, y: 1 });
  assert.ok(circlePackingLayoutInternals.arcToCubicCommands({ x: 0, y: 0 }, 10, 0, Math.PI * 2).length >= 4);
  assert.equal(circlePackingLayoutInternals.pointCommand({ x: 1.23456, y: 7.8912 }), '1.235 7.891');
  assert.match(circlePackingLayoutInternals.cubicCommand({ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }), /^C /);

  const source = circleNode({ id: 'source', x: 0, y: 0, r: 20, color: '#ff0000' });
  const target = circleNode({ id: 'target', x: 48, y: 0, r: 18, color: '#0000ff', parentId: 'parent' });
  const blocker = circleNode({ id: 'blocker', x: 24, y: 0, r: 4 });
  const parent = circleNode({ id: 'parent', parentId: 'root', x: 48, y: 0, r: 30 });
  const nodesById = new Map([
    ['source', source],
    ['target', target],
    ['blocker', blocker],
    ['parent', parent]
  ]);

  assert.equal(circlePackingLayoutInternals.shouldDrawCirclePackingFluidBridge(nodesById, 'source', 'target', source, target, 120), false);
  nodesById.delete('blocker');
  assert.equal(circlePackingLayoutInternals.shouldDrawCirclePackingFluidBridge(nodesById, 'source', 'target', source, target, 120), true);
  assert.equal(circlePackingLayoutInternals.shouldDrawCirclePackingFluidBridge(nodesById, 'source', 'target', { ...source, r: 0 }, target, 120), false);
  assert.equal(circlePackingLayoutInternals.shouldDrawCirclePackingFluidBridge(nodesById, 'source', 'target', source, { ...source }, 120), false);
  assert.equal(circlePackingLayoutInternals.shouldDrawCirclePackingFluidBridge(nodesById, 'source', 'target', source, { ...target, x: 400 }, 120), false);
  assert.equal(circlePackingLayoutInternals.createCirclePackingFluidBridgePath(source, target, { progress: 0.5, maxDistance: 120 }).startsWith('M '), true);
  assert.equal(circlePackingLayoutInternals.createCirclePackingFluidBridgePath({ ...source, r: 0 }, target, { progress: 0.5, maxDistance: 120 }), '');
  assert.equal(circlePackingLayoutInternals.createCirclePackingFluidBridgePath(source, { ...source }, { progress: 0.5, maxDistance: 120 }), '');
  assert.equal(circlePackingLayoutInternals.createCirclePackingFluidBridgePath(source, target, { progress: 0.01, maxDistance: 120 }), '');
  assert.equal(circlePackingLayoutInternals.createCirclePackingFluidBridgePath(source, { ...target, x: 400 }, { progress: 0.5, maxDistance: 120 }), '');
  assert.equal(circlePackingLayoutInternals.createCirclePackingFluidBridgePath(source, { ...target, x: 30 }, { progress: 0.5, maxDistance: 120 }), '');

  const splitShape = circlePackingLayoutInternals.createCirclePackingWaterdropSurfaceShape(source, target, {
    isSplit: true,
    progress: 0.5,
    maxDistance: 120
  });
  const absorbShape = circlePackingLayoutInternals.createCirclePackingWaterdropSurfaceShape(source, target, {
    isSplit: false,
    progress: 0.5,
    maxDistance: 120
  });
  assert.equal(splitShape?.bridgeOnly, true);
  assert.equal(absorbShape?.bridgeOnly, undefined);
  assert.equal(circlePackingLayoutInternals.createCirclePackingWaterdropSurfaceShape({ ...source, r: 0 }, target, { isSplit: false, progress: 0.5, maxDistance: 120 }), null);
  assert.equal(circlePackingLayoutInternals.createCirclePackingWaterdropSurfaceShape(source, { ...source }, { isSplit: false, progress: 0.5, maxDistance: 120 }), null);
  assert.equal(circlePackingLayoutInternals.createCirclePackingWaterdropSurfaceShape(source, { ...target, x: 400 }, { isSplit: false, progress: 0.5, maxDistance: 120 }), null);
  assert.equal(circlePackingLayoutInternals.createCirclePackingWaterdropSurfaceShape(source, { ...target, x: 90 }, { isSplit: true, progress: 0.5, maxDistance: 120 }), null);
  assert.equal(circlePackingLayoutInternals.createCirclePackingWaterdropSurfaceShape({ ...source, r: 80 }, { ...target, x: 10, r: 5 }, { isSplit: false, progress: 0.5, maxDistance: 120 }), null);
  assert.equal(circlePackingLayoutInternals.createCirclePackingWaterdropSurfaceShape(source, target, { isSplit: false, progress: 0, maxDistance: 120 }), null);
  assert.match(circlePackingLayoutInternals.createCirclePackingWaterdropShapePath(absorbShape), /^C |^M /);
  assert.equal(circlePackingLayoutInternals.createCirclePackingWaterdropShapePath(null), '');

  const moveTarget = circleNode({ ...target, id: 'move-target', parentId: 'parent', x: 43, r: 12 });
  const topParent = circleNode({ ...parent, parentId: null });
  const moveMap = new Map([
    ['source', source],
    ['move-target', moveTarget],
    ['parent', topParent]
  ]);
  assert.equal(circlePackingLayoutInternals.shouldDrawCirclePackingMoveBridge(moveMap, 'source', 'move-target', source, moveTarget, 100), true);
  assert.equal(circlePackingLayoutInternals.shouldDrawCirclePackingMoveBridge(moveMap, 'source', 'move-target', { ...source, r: 0 }, moveTarget, 100), false);
  assert.equal(circlePackingLayoutInternals.shouldDrawCirclePackingMoveBridge(moveMap, 'source', 'move-target', source, { ...source }, 100), false);
  assert.equal(circlePackingLayoutInternals.shouldDrawCirclePackingMoveBridge(moveMap, 'source', 'move-target', source, { ...moveTarget, x: 400 }, 100), false);
  assert.equal(circlePackingLayoutInternals.shouldDrawCirclePackingMoveBridge(moveMap, 'source', 'move-target', { ...source, r: 80 }, { ...moveTarget, x: 10, r: 5 }, 100), false);
  assert.equal(circlePackingLayoutInternals.shouldDrawCirclePackingMoveBridge(new Map([['source', source], ['child', { ...moveTarget, id: 'child', parentId: 'source', x: 42 }]]), 'source', 'child', source, { ...moveTarget, id: 'child', parentId: 'source', x: 42 }, 100), false);
  assert.equal(circlePackingLayoutInternals.isCirclePackingMoveBridgeContainedInTargetParent(new Map([
    ['source', source],
    ['move-target', moveTarget],
    ['parent', parent]
  ]), 'source', moveTarget), true);
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveBridgeShape(source, moveTarget, { progress: 0.5, maxDistance: 100 })?.bridgeOnly, true);
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveBridgeShape({ ...source, r: 0 }, moveTarget, { progress: 0.5, maxDistance: 100 }), null);
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveBridgeShape(source, { ...source }, { progress: 0.5, maxDistance: 100 }), null);
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveBridgeShape(source, moveTarget, { progress: 0.01, maxDistance: 100 }), null);
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveBridgeShape(source, { ...moveTarget, x: 400 }, { progress: 0.5, maxDistance: 100 }), null);
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveBridgeShape(source, moveTarget, { progress: 1, maxDistance: 100 }), null);
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveBridgeShape(source, { ...moveTarget, x: 62 }, { progress: 0.5, maxDistance: 100 }), null);

  const lobe = circlePackingLayoutInternals.createCirclePackingMoveLobeCircle(source, { x: 5, y: 0 }, 10, 0.5, moveTarget, {
    startFromPreferredSide: true
  });
  assert.ok(lobe);
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveLobeCircle({ ...source, r: 0 }, moveTarget, 10, 0.5), null);
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveLobeCircle(source, { x: source.x, y: source.y }, 10, 0.5), null);
  const settle = circlePackingLayoutInternals.createCirclePackingMoveSettleCircle(source, moveTarget, { ...moveTarget, x: 70 }, 0.5, {
    startFromPreferredSide: true
  });
  assert.ok(settle);
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveSettleCircle({ ...source, r: 0 }, moveTarget, moveTarget, 0.5), null);
  assert.deepEqual(roundPoint(circlePackingLayoutInternals.createCirclePackingMoveSettleControlPoint(source, { x: 10, y: 0, r: 5 }, { ...moveTarget, x: 12 })), { x: 21.92, y: 0 });
  assert.deepEqual(circlePackingLayoutInternals.createCirclePackingMoveSettleControlPoint(source, { x: 0, y: 0, r: 5 }, { ...moveTarget, x: 0, y: 0 }), { x: 0, y: 0 });
  assert.equal(circlePackingLayoutInternals.quadraticLerp(0, 10, 20, 0.5), 10);
});

test('waterdrop fusion geometry handles invalid circles, fallback radii, and ordering', () => {
  assert.equal(createWaterdropFusionShape(
    { x: 0, y: 0, r: 0 },
    { x: 10, y: 0, r: 5 }
  ), null);
  const orderedShape = createWaterdropFusionShape(
    { x: 20, y: 0, r: 5 },
    { x: 0, y: 0, r: 8 },
    { bridgeLength: 0, handleSize: Number.NaN, neckSize: Number.NaN }
  );
  assert.ok(orderedShape);
  assert.equal(orderedShape.x0, undefined);
  assert.equal(orderedShape.curve, 0.85);
  assert.equal(orderedShape.neck, 5);
  assert.ok(createWaterdropFusionShape(
    { x: 0, y: 20, r: 5 },
    { x: 0, y: 0, r: 8 }
  ));

  const noRadiusOps = recordWaterdropPath(buildWaterdropFusionPath, {
    ...orderedShape,
    leftRadius: 0,
    rightRadius: 0,
    height: 0
  });
  assert.deepEqual(noRadiusOps, []);

  const defaultCircleOps = recordWaterdropPath(buildWaterdropFusionPath, {
    ...orderedShape,
    r0: 0,
    r1: 0,
    leftRadius: 0,
    rightRadius: 0,
    height: 16,
    width: 34,
    neck: 8,
    bridgeLength: 0
  });
  assert.ok(defaultCircleOps.length > 0);

  const noNeckOps = recordWaterdropPath(buildWaterdropFusionPath, {
    ...orderedShape,
    neck: 0
  });
  assert.ok(noNeckOps.some((op) => op[0] === 'A'));
  assert.equal(noNeckOps.some((op) => op[0] === 'B'), false);

  const containedOps = recordWaterdropPath(buildWaterdropFusionPath, {
    ...orderedShape,
    x0: 0,
    y0: 0,
    r0: 20,
    x1: 5,
    y1: 0,
    r1: 5,
    bridgeOnly: true,
    neck: 5
  });
  assert.deepEqual(containedOps, []);

  const separatedOps = recordWaterdropPath(buildWaterdropFusionPath, {
    ...orderedShape,
    x0: 0,
    y0: 0,
    r0: 8,
    x1: 100,
    y1: 0,
    r1: 8,
    bridgeOnly: true,
    bridgeLength: 0,
    neck: 8
  });
  assert.deepEqual(separatedOps, []);

  const fallbackCoordinateOps = recordWaterdropPath(buildWaterdropFusionPath, {
    ...orderedShape,
    x0: undefined,
    y0: undefined,
    r0: 8,
    x1: undefined,
    y1: undefined,
    r1: 8,
    bridgeOnly: true,
    bridgeLength: 20,
    neck: 8
  });
  assert.ok(fallbackCoordinateOps.length > 0);
});

test('fluid bridge builders cover split, move, absorb, blocked, and settle cases', () => {
  const root = circleNode({ id: 'root', name: 'Root', x: 0, y: 0, r: 100, parentId: null });
  const sourceParent = circleNode({ id: 'source-parent', name: 'Source Parent', x: 0, y: 0, r: 42, parentId: 'root' });
  const source = circleNode({ id: 'source', name: 'Source', x: 18, y: 0, r: 14, parentId: 'source-parent', color: '#ff0000', raw: { id: 'raw-source' } });
  const targetParent = circleNode({ id: 'target-parent', name: 'Target Parent', x: 58, y: 0, r: 42, parentId: 'root' });
  const target = circleNode({ id: 'target', name: 'Target', x: 56, y: 0, r: 12, parentId: 'target-parent', color: '#0000ff', raw: { id: 'raw-target' } });
  root.children = [sourceParent, targetParent];
  sourceParent.children = [source];
  targetParent.children = [target];
  const nodesById = new Map([
    ['root', root],
    ['source-parent', sourceParent],
    ['source', source],
    ['target-parent', targetParent],
    ['target', target]
  ]);
  const fluid = { bridgeOpacity: 0.91, bridgeThreshold: 140, bridgeColor: null, events: [] };

  assert.deepEqual(circlePackingLayoutInternals.createCirclePackingFluidBridges(nodesById, ['source'], ['target'], {
    event: eventObject({ id: 'hidden', type: 'merge', drawBridge: false }),
    progress: 0.5
  }, fluid), []);
  assert.equal(circlePackingLayoutInternals.createCirclePackingFluidBridges(nodesById, ['source'], ['target'], {
    event: eventObject({ id: 'merge', type: 'merge' }),
    progress: 0.7
  }, fluid).length, 1);
  assert.equal(circlePackingLayoutInternals.createCirclePackingFluidBridges(nodesById, ['missing'], ['target'], {
    event: eventObject({ id: 'missing-source', type: 'merge' }),
    progress: 0.5
  }, fluid).length, 0);
  assert.equal(circlePackingLayoutInternals.createCirclePackingFluidBridges(nodesById, ['source'], ['missing'], {
    event: eventObject({ id: 'missing-target', type: 'merge' }),
    progress: 0.5
  }, fluid).length, 0);
  const splitBridge = circlePackingLayoutInternals.createCirclePackingFluidBridges(nodesById, ['source-parent'], ['target'], {
    event: eventObject({ id: 'split', type: 'split' }),
    progress: 0.45
  }, { ...fluid, bridgeColor: '#111111' })[0];
  assert.equal(splitBridge.kind, 'split');
  assert.equal(splitBridge.color, '#111111');
  assert.equal(splitBridge.surfaceShape?.bridgeOnly, true);
  const moveBridge = circlePackingLayoutInternals.createCirclePackingFluidBridges(nodesById, ['source'], ['target'], {
    event: eventObject({ id: 'move', type: 'move' }),
    progress: 0.5
  }, fluid);
  assert.ok(moveBridge.length >= 1);
  assert.equal(moveBridge[0].opacity, 0.78);
  const tooFarAbsorbBridge = circlePackingLayoutInternals.createCirclePackingFluidBridges(new Map([
    ['source', source],
    ['target', { ...target, x: 1000 }]
  ]), ['source'], ['target'], {
    event: eventObject({ id: 'late-absorb', type: 'merge' }),
    progress: 0.7
  }, fluid)[0];
  assert.ok(tooFarAbsorbBridge);
  assert.equal(tooFarAbsorbBridge.surfaceShape, undefined);

  const pairs = circlePackingLayoutInternals.createCirclePackingFluidBridgePairs(nodesById, ['source'], ['target'], false, true);
  assert.deepEqual(pairs, [
    { sourceId: 'source-parent', targetId: 'target' },
    { sourceId: 'target-parent', targetId: 'target' }
  ]);
  circlePackingLayoutInternals.pushCirclePackingFluidBridgePair(pairs, 'source-parent', 'target');
  assert.equal(pairs.length, 2);
  assert.deepEqual(circlePackingLayoutInternals.createCirclePackingFluidBridgePairs(nodesById, ['missing'], ['target'], true, false), []);
  assert.deepEqual(circlePackingLayoutInternals.createCirclePackingFluidBridgePairs(new Map([
    ['source', circleNode({ id: 'source', parentId: 'target' })],
    ['target', circleNode({ id: 'target', parentId: null })]
  ]), ['source'], ['target'], false, true), []);
  assert.equal(circlePackingLayoutInternals.shouldSuppressCirclePackingLateSiblingMoveBridge(new Map([
    ['parent', circleNode({ id: 'parent', parentId: 'root' })]
  ]), circleNode({ id: 'a', parentId: 'parent' }), circleNode({ id: 'b', parentId: 'parent' }), 0.9), true);

  const settleRoot = circleNode({ id: 'settle-root', parentId: null, x: 0, y: 0, r: 120 });
  const settleTargetParent = circleNode({ id: 'settle-target-parent', parentId: 'settle-root', x: 42, y: 0, r: 70 });
  const settleSourceParent = circleNode({ id: 'settle-source-parent', parentId: 'settle-target-parent', x: 0, y: 0, r: 42 });
  const settleSource = circleNode({ id: 'settle-source', name: 'Settle Source', parentId: 'settle-source-parent', x: 18, y: 0, r: 14 });
  const settleTarget = circleNode({ id: 'settle-target', name: 'Settle Target', parentId: 'settle-target-parent', x: 56, y: 0, r: 12 });
  const settleNodesById = new Map([
    ['settle-root', settleRoot],
    ['settle-target-parent', settleTargetParent],
    ['settle-source-parent', settleSourceParent],
    ['settle-source', settleSource],
    ['settle-target', settleTarget]
  ]);
  const previousMove = eventObject({ id: 'move', type: 'move', sourceRefs: ['source'], targetRefs: ['target'], timeValue: 1 });
  const settleEvent = eventObject({ id: 'settle', type: 'checkpoint', targetRefs: ['target'], drawBridge: false, timeValue: 2 });
  const previousSettleMove = eventObject({ id: 'settle-move', type: 'move', sourceRefs: ['settle-source'], targetRefs: ['settle-target'], timeValue: 1 });
  const settleCheckpoint = eventObject({ id: 'settle-checkpoint', type: 'checkpoint', targetRefs: ['settle-target'], drawBridge: false, timeValue: 2 });
  const settleBridges = circlePackingLayoutInternals.createCirclePackingMoveSettleBridges(
    settleNodesById,
    settleNodesById,
    settleNodesById,
    settleNodesById,
    previousSettleMove,
    { event: settleCheckpoint, progress: 0.5 },
    fluid
  );
  assert.equal(settleBridges.length, 1);
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveSettleBridges(
    nodesById,
    nodesById,
    nodesById,
    null,
    null,
    { event: settleEvent, progress: 0.5 },
    fluid
  ).length, 0);
  assert.equal(circlePackingLayoutInternals.resolvePublicNodeIds(['raw-source', 'Target'], nodesById, nodesById).length, 2);
  assert.equal(circlePackingLayoutInternals.findPublicNodeByRef('raw-source', null, nodesById), source);
  assert.equal(circlePackingLayoutInternals.findPublicNodeByRef('Source Parent', nodesById), sourceParent);
  assert.equal(circlePackingLayoutInternals.findPublicNodeByRef('nope', nodesById), undefined);
  assert.equal(circlePackingLayoutInternals.isCirclePackingNodeReferenced(source, ['raw-source']), true);
  assert.equal(circlePackingLayoutInternals.isCirclePackingAncestorNode(nodesById, 'root', 'source'), true);
  assert.equal(circlePackingLayoutInternals.isCirclePackingAncestorNode(nodesById, 'source', 'source'), true);
  assert.equal(circlePackingLayoutInternals.shouldUseCirclePackingMoveSettleTarget(settleNodesById, settleSource, settleTarget), true);
});

test('fluid state and interpolation helpers keep descendants and handoff nodes coherent', () => {
  const root = circlePackingLayoutInternals.normalizeRoot({
    id: 'root',
    name: 'Root',
    children: [
      {
        id: 'a',
        name: 'A',
        children: [
          { id: 'b', name: 'B', value: 10 },
          { id: 'c', name: 'C', value: 5 }
        ]
      },
      { id: 'd', name: 'D', value: 3 }
    ]
  }, {});
  circlePackingLayoutInternals.computeValues(root);
  circlePackingLayoutInternals.applyCirclePackingFluidState(root, {
    pendingSplitEvents: [eventObject({ type: 'split', targetRefs: ['c'] })],
    completedEvents: [
      eventObject({ type: 'split', targetRefs: ['c'] }),
      eventObject({ type: 'move', sourceRefs: ['b'], targetRefs: ['d'] }),
      eventObject({ type: 'merge', sourceRefs: ['c'], targetRefs: ['d'] }),
      eventObject({ type: 'merge', sourceRefs: ['missing'], targetRefs: ['missing-target'] })
    ]
  });
  const lookup = circlePackingLayoutInternals.createMutableNodeLookup(root);
  assert.equal(circlePackingLayoutInternals.resolveMutableNodes('b', lookup)[0].fluidHidden, true);
  assert.equal(circlePackingLayoutInternals.resolveMutableNodes('d', lookup)[0].explicitValue > 3, true);
  circlePackingLayoutInternals.addMutableNodeAlias(lookup, 'alias-d', circlePackingLayoutInternals.resolveMutableNodes('d', lookup)[0]);
  assert.equal(circlePackingLayoutInternals.resolveMutableNodes('alias-d', lookup).length, 1);

  const before = resolveCirclePackingLayout({
    data: {
      id: 'root',
      name: 'Root',
      children: [
        {
          id: 'a',
          name: 'A',
          children: [
            { id: 'b', name: 'B', value: 10 }
          ]
        },
        { id: 'd', name: 'D', value: 8 }
      ]
    },
    width: 300,
    height: 240,
    sort: false
  });
  const after = resolveCirclePackingLayout({
    data: {
      id: 'root',
      name: 'Root',
      children: [
        {
          id: 'a',
          name: 'A',
          children: [
            { id: 'b', name: 'B', value: 10 },
            { id: 'c', name: 'C', value: 3 }
          ]
        },
        { id: 'd', name: 'D', value: 8 }
      ]
    },
    width: 300,
    height: 240,
    sort: false
  });
  const splitEvent = eventObject({ id: 'split-c', type: 'split', sourceRefs: ['a'], targetRefs: ['c'], timeValue: 2 });
  const splitLayout = circlePackingLayoutInternals.interpolateCirclePackingFluidLayouts(before, after, {
    event: splitEvent,
    progress: 0.4
  }, { bridgeOpacity: 0.8, bridgeThreshold: 180, bridgeColor: null, events: [splitEvent] });
  const splitTarget = splitLayout.nodes.find((node) => node.name === 'C');
  assert.ok(splitTarget);
  assert.equal(splitTarget.fluidActiveTarget, true);

  const beforeLookup = circlePackingLayoutInternals.createPublicNodeLookup(before.root);
  const afterLookup = circlePackingLayoutInternals.createPublicNodeLookup(after.root);
  const targetNode = splitLayout.nodes.find((node) => node.name === 'A');
  assert.ok(targetNode);
  circlePackingLayoutInternals.keepCirclePackingSplitTargetDescendantsInsideTarget(
    circlePackingLayoutInternals.createPublicNodeLookup(splitLayout.root),
    afterLookup,
    [targetNode.id]
  );
  circlePackingLayoutInternals.keepCirclePackingAbsorbSourceDescendantsInsideSource(
    circlePackingLayoutInternals.createPublicNodeLookup(splitLayout.root),
    beforeLookup,
    [targetNode.id, 'missing']
  );
  const clone = circlePackingLayoutInternals.cloneCirclePackingNode(targetNode);
  circlePackingLayoutInternals.assignInterpolatedNode(clone, targetNode, { ...targetNode, x: targetNode.x + 10, color: '#ffffff' }, 0.75);
  assert.equal(clone.color, '#ffffff');
  circlePackingLayoutInternals.assignNodeGeometry(clone, { ...targetNode, r: -10, value: -10, percent: -1 });
  assert.equal(clone.r, 0);
  circlePackingLayoutInternals.assignCirclePackingMoveNodeIdentity(clone, splitTarget);
  assert.equal(clone.name, splitTarget.name);
  circlePackingLayoutInternals.constrainCirclePackingNodeInsideParent(clone, { ...targetNode, r: 30 }, 0);
  assert.ok(Number.isFinite(clone.x));
});

test('fluid layout helper edge cases stay defensive for missing handoff and descendants', () => {
  const data = {
    id: 'root',
    name: 'Root',
    children: [
      {
        id: 'a',
        name: 'A',
        children: [
          { id: 'b', name: 'B', value: 10 },
          { id: 'c', name: 'C', value: 5 }
        ]
      },
      { id: 'd', name: 'D', value: 6 }
    ]
  };
  const layoutOptions = { width: 320, height: 240, sort: false };
  const before = resolveCirclePackingLayout({ data, ...layoutOptions });
  const missingSourceAbsorb = eventObject({
    id: 'missing-source',
    type: 'merge',
    sourceRefs: ['missing'],
    targetRefs: ['b'],
    timeValue: 1
  });
  const missingSourceHandoff = eventObject({
    id: 'handoff',
    type: 'split',
    sourceRefs: ['b'],
    targetRefs: ['c'],
    timeValue: 2,
    duration: 1
  });
  assert.equal(circlePackingLayoutInternals.createCirclePackingAbsorbSourceHandoffNodes(
    data,
    layoutOptions,
    { events: [missingSourceAbsorb, missingSourceHandoff] },
    before,
    [],
    { event: missingSourceAbsorb, progress: 0.5 }
  ), undefined);

  const missingTargetAbsorb = eventObject({
    id: 'missing-target-absorb',
    type: 'merge',
    sourceRefs: ['b'],
    targetRefs: ['d'],
    timeValue: 1
  });
  const missingTargetHandoff = eventObject({
    id: 'missing-target-handoff',
    type: 'split',
    sourceRefs: ['d'],
    targetRefs: ['missing'],
    timeValue: 2,
    duration: 1
  });
  assert.equal(circlePackingLayoutInternals.createCirclePackingAbsorbSourceHandoffNodes(
    data,
    layoutOptions,
    { events: [missingTargetAbsorb, missingTargetHandoff] },
    before,
    [],
    { event: missingTargetAbsorb, progress: 0.5 }
  ), undefined);

  const moveEvent = eventObject({
    id: 'move',
    type: 'move',
    sourceRefs: [],
    targetRefs: ['d'],
    timeValue: 1
  });
  const settleEvent = eventObject({
    id: 'settle',
    type: 'checkpoint',
    targetRefs: ['d'],
    drawBridge: false,
    timeValue: 2
  });
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveSettleTargetNodes(
    data,
    layoutOptions,
    { events: [moveEvent, settleEvent] },
    before,
    [],
    { event: moveEvent, progress: 0.5 }
  ), undefined);

  const currentTarget = circleNode({ id: 'target', x: 10, y: 10, r: 20 });
  const afterTarget = circleNode({ id: 'target', x: 20, y: 20, r: 40 });
  const child = circleNode({ id: 'child', parentId: 'target', children: [circleNode({ id: 'grandchild', parentId: 'child' })] });
  circlePackingLayoutInternals.transformCirclePackingTargetDescendant(child, afterTarget, new Map(), currentTarget, 0.5);
  circlePackingLayoutInternals.transformCirclePackingTargetDescendant(child, afterTarget, new Map([
    ['child', circleNode({ id: 'child', x: 24, y: 22, r: 8, value: 4, percent: 0.4 })],
    ['grandchild', circleNode({ id: 'grandchild', x: 26, y: 24, r: 4, value: 2, percent: 0.2 })]
  ]), currentTarget, 0.5);
  assert.equal(child.r, 4);

  const sourceChild = circleNode({ id: 'source-child', parentId: 'source', children: [circleNode({ id: 'source-grandchild', parentId: 'source-child' })] });
  const beforeSource = circleNode({ id: 'source', x: 10, y: 10, r: 20 });
  const currentSource = circleNode({ id: 'source', x: 15, y: 15, r: 10 });
  circlePackingLayoutInternals.transformCirclePackingSourceDescendant(sourceChild, beforeSource, new Map(), currentSource, 0.5);
  circlePackingLayoutInternals.transformCirclePackingSourceDescendant(sourceChild, beforeSource, new Map([
    ['source-child', circleNode({ id: 'source-child', x: 16, y: 18, r: 8, value: 4, percent: 0.4 })],
    ['source-grandchild', circleNode({ id: 'source-grandchild', x: 17, y: 19, r: 4, value: 2, percent: 0.2 })]
  ]), currentSource, 0.5);
  assert.equal(sourceChild.r, 4);

  const appendRoot = circleNode({ id: 'append-root', children: [] });
  circlePackingLayoutInternals.appendAfterOnlyFluidNodes(
    appendRoot,
    { root: circleNode({ id: 'append-root', children: [] }) },
    { root: circleNode({ id: 'append-root', children: [circleNode({ id: 'orphan', parentId: 'missing' })] }) }
  );
  assert.equal(appendRoot.children.length, 0);

  const movingNode = circleNode({ id: 'moving', parentId: 'parent', x: 100, y: 0, r: 10 });
  circlePackingLayoutInternals.keepCirclePackingMoveTargetInsideTargetParent(
    movingNode,
    circleNode({ id: 'moving', parentId: 'parent' }),
    circleNode({ id: 'source', parentId: 'source-parent' }),
    new Map([
      ['parent', circleNode({ id: 'parent', r: 0 })],
      ['source-parent', circleNode({ id: 'source-parent', parentId: 'parent' })]
    ]),
    new Map()
  );
  assert.equal(movingNode.x, 100);
  circlePackingLayoutInternals.keepCirclePackingSplitTargetDescendantsInsideTarget(
    new Map(),
    new Map([['missing-target', circleNode({ id: 'missing-target' })]]),
    ['missing-target']
  );

  const splitSource = circleNode({
    id: 'split-source',
    x: 0,
    y: 0,
    r: 40,
    children: [circleNode({ id: 'bad-child', x: Number.NaN, y: 0, r: 4 })]
  });
  assert.equal(circlePackingLayoutInternals.resolveSplitBudAnchorDistance(splitSource, { x: 1, y: 0 }, 5, 8), 8);

  const mutableLookup = circlePackingLayoutInternals.createMutableNodeLookup({
    id: 'mutable',
    name: 'Mutable',
    raw: null,
    children: []
  });
  assert.equal(mutableLookup.has('mutable'), true);
  assert.equal(circlePackingLayoutInternals.rawNodeId(circleNode({ raw: null })), '');

  const split = eventObject({ id: 'split', type: 'split', sourceRefs: ['x'], targetRefs: ['y'], timeValue: 2 });
  assert.equal(circlePackingLayoutInternals.findPreviousCirclePackingAbsorbHandoffEvent([
    eventObject({ id: 'future', type: 'merge', targetRefs: ['x'], timeValue: 3 }),
    split
  ], split), null);
  assert.equal(circlePackingLayoutInternals.findPreviousCirclePackingAbsorbHandoffEvent([
    eventObject({ id: 'detached-merge', type: 'merge', targetRefs: ['x'], timeValue: 1 })
  ], eventObject({ id: 'detached-split', type: 'split', sourceRefs: ['x'], targetRefs: ['y'], timeValue: 2 }))?.id, 'detached-merge');

  const settleAfterTarget = circleNode({ id: 'settle-after-target', parentId: 'settle-parent', x: 40, y: 0, r: 8 });
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveSettleBridges(
    new Map([['settle-parent', circleNode({ id: 'settle-parent', parentId: 'root', x: 0, y: 0, r: 30 })]]),
    new Map(),
    new Map([['settle-after-target', settleAfterTarget]]),
    null,
    eventObject({ type: 'move', sourceRefs: ['missing-source'], targetRefs: ['settle-after-target'] }),
    { event: eventObject({ type: 'checkpoint', targetRefs: ['settle-after-target'], drawBridge: false }), progress: 0.5 },
    { bridgeOpacity: 0.8, bridgeThreshold: 80, bridgeColor: null }
  ).length, 0);

  const farSettleSourceParent = circleNode({ id: 'far-source-parent', parentId: 'far-target-parent', x: 0, y: 0, r: 20 });
  const farSettleSource = circleNode({ id: 'far-source', parentId: 'far-source-parent', x: 10, y: 0, r: 6 });
  const farSettleTargetParent = circleNode({ id: 'far-target-parent', parentId: 'root', x: 0, y: 0, r: 80 });
  const farSettleTarget = circleNode({ id: 'far-target', parentId: 'far-target-parent', x: 300, y: 0, r: 8 });
  const farSettleMap = new Map([
    ['far-source-parent', farSettleSourceParent],
    ['far-source', farSettleSource],
    ['far-target-parent', farSettleTargetParent],
    ['far-target', farSettleTarget]
  ]);
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveSettleBridges(
    farSettleMap,
    farSettleMap,
    farSettleMap,
    farSettleMap,
    eventObject({ type: 'move', sourceRefs: ['far-source'], targetRefs: ['far-target'] }),
    { event: eventObject({ type: 'checkpoint', targetRefs: ['far-target'], drawBridge: false }), progress: 0.5 },
    { bridgeOpacity: 0.8, bridgeThreshold: 10, bridgeColor: null }
  ).length, 0);
  assert.equal(circlePackingLayoutInternals.createCirclePackingMoveSettleBridges(
    settleNodesForSurfaceNull(),
    settleNodesForSurfaceNull(),
    settleNodesForSurfaceNull(),
    settleNodesForSurfaceNull(),
    eventObject({ type: 'move', sourceRefs: ['surface-source'], targetRefs: ['surface-target'] }),
    { event: eventObject({ type: 'checkpoint', targetRefs: ['surface-target'], drawBridge: false }), progress: 1 },
    { bridgeOpacity: 0.8, bridgeThreshold: 80, bridgeColor: null }
  ).length, 0);
});

test('fluid events can mutate layout without drawing a bridge', () => {
  const result = resolveCirclePackingLayout({
    data: fluidData,
    width: 640,
    height: 520,
    padding: 24,
    sort: false,
    fluid: {
      enabled: true,
      currentTime: 9.2,
      events: [
        { time: 10, type: 'merge', sources: ['search'], targets: ['editor'], bridge: false }
      ],
      bridgeThreshold: 180
    }
  });
  const byName = new Map(result.nodes.map((node) => [node.name, node]));

  assert.equal(result.fluid?.bridges.length, 0);
  assert.equal((byName.get('Search')?.r ?? 0) > 0, true);
  assert.equal((byName.get('Editor')?.r ?? 0) > 0, true);
});

test('fluid layouts handle null and pre-event current time without active bridges', () => {
  const allComplete = resolveCirclePackingLayout({
    data: fluidData,
    width: 640,
    height: 520,
    padding: 24,
    sort: false,
    fluid: {
      enabled: true,
      currentTime: null,
      events: [
        { time: 10, type: 'merge', sources: ['search'], targets: ['editor'] }
      ]
    }
  });
  const beforeAnyEvent = resolveCirclePackingLayout({
    data: fluidData,
    width: 640,
    height: 520,
    padding: 24,
    sort: false,
    fluid: {
      enabled: true,
      currentTime: -10,
      events: [
        { time: 10, type: 'split', sources: ['editor'], targets: ['console'] }
      ]
    }
  });

  assert.equal(allComplete.fluid?.bridges.length, 0);
  assert.equal(beforeAnyEvent.fluid?.bridges.length, 0);
});

test('fluid split events hide pending targets and reveal them after completion', () => {
  const before = resolveCirclePackingLayout({
    data: fluidData,
    width: 640,
    height: 520,
    padding: 24,
    sort: false,
    fluid: {
      enabled: true,
      currentTime: 8,
      events: [
        { time: 10, type: 'split', sources: ['editor'], targets: ['console'] }
      ]
    }
  });
  const after = resolveCirclePackingLayout({
    data: fluidData,
    width: 640,
    height: 520,
    padding: 24,
    sort: false,
    fluid: {
      enabled: true,
      currentTime: 10,
      events: [
        { time: 10, type: 'split', sources: ['editor'], targets: ['console'] }
      ]
    }
  });

  assert.equal(before.nodes.some((node) => node.name === 'Console'), false);
  assert.equal(after.nodes.some((node) => node.name === 'Console'), true);
  after.nodes.forEach((node) => {
    if (!node.parentId) return;
    assertNodeInsideParent(node, after.nodes.find((candidate) => candidate.id === node.parentId));
  });
  assertSiblingCirclesDoNotOverlap(after.nodes, 0.001);
});

test('supports hidden synthetic roots for array data', () => {
  const result = resolveCirclePackingLayout({
    data: [
      { name: 'A', value: 16 },
      { name: 'B', value: 9 },
      { name: 'C', value: 4 }
    ],
    width: 360,
    height: 300,
    padding: 10,
    rootVisible: false,
    sort: false
  });

  assert.equal(result.root.synthetic, true);
  assert.equal(result.rootVisible, false);
  assert.deepEqual(result.nodes.map((node) => node.name), ['A', 'B', 'C']);
  result.nodes.forEach((node) => {
    assert.ok(node.parentId === result.root.id, `${node.name} stays under hidden root`);
    assertNodeWithinChart(node, result);
  });
  assertSiblingCirclesDoNotOverlap(result.nodes, 0.001);
});

test('resolves layout aliases and flattened raw data order', () => {
  const result = resolveCirclePackingLayout({
    layout: {
      width: 500,
      height: 420,
      valueField: 'metrics.size',
      childrenField: 'items',
      nameField: 'label',
      sort: 'name'
    },
    data: {
      label: 'Root',
      items: [
        {
          label: 'Beta',
          metrics: { size: 7 },
          items: [{ label: 'Beta leaf', metrics: { size: 7 } }]
        },
        {
          label: 'Alpha',
          metrics: { size: 9 },
          items: [{ label: 'Alpha leaf', metrics: { size: 9 } }]
        }
      ]
    }
  });

  assert.deepEqual(
    result.root.children.map((node) => node.name),
    ['Alpha', 'Beta']
  );
  assert.deepEqual(
    result.nodes.map((node) => node.name),
    ['Root', 'Alpha', 'Alpha leaf', 'Beta', 'Beta leaf']
  );
  assert.deepEqual(
    flattenCirclePackingData(result.root.raw, {
      valueField: 'metrics.size',
      childrenField: 'items',
      nameField: 'label',
      sort: 'name'
    }).map((item) => item.label),
    ['Root', 'Alpha', 'Alpha leaf', 'Beta', 'Beta leaf']
  );
});

test('keeps descendant circles highlighted when hovering a parent circle', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: false,
    series: [{
      type: 'circlePacking',
      data: portfolio,
      sort: false,
      label: {
        show: true,
        minRadius: 0
      },
      itemStyle: {
        opacity: 0.88
      }
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  assert.equal(circles.length, 12);

  const core = circles[1];
  const platform = circles[9];
  const api = circles[10];
  const billing = circles[11];

  platform.trigger('mouseover', {
    target: platform
  });

  assert.equal(lastHoverTargetOpacity(platform), 0.88);
  assert.equal(lastHoverTargetOpacity(api), 0.88);
  assert.equal(lastHoverTargetOpacity(billing), 0.88);
  assert.equal(lastHoverTargetOpacity(core), 0.12);

  platform.trigger('mouseout', {
    target: platform
  });

  assert.equal(lastHoverTargetOpacity(api), 0.88);
  assert.equal(lastHoverTargetOpacity(billing), 0.88);
  assert.equal(lastHoverTargetOpacity(core), 0.88);

  chart.dispose();
});

test('places parent labels away from child circles', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: false,
    series: [{
      type: 'circlePacking',
      data: productData,
      sort: false,
      label: {
        show: true,
        minRadius: 0
      }
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  const parentLabel = collectTextElements(chart)
    .find((element) => element.style.text === 'Core Experience');
  assert.ok(parentLabel);

  const parentLabelBox = textBoxFromStyle(parentLabel.style);
  const childCircles = circles.slice(2, 6);
  childCircles.forEach((childCircle, childIndex) => {
    assert.equal(
      boxIntersectsCircle(parentLabelBox, childCircle.shape),
      false,
      `parent label overlaps child circle ${childIndex}`
    );
  });

  chart.dispose();
});

test('renders fluid bridges for active circle packing events', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: false,
    series: [{
      type: 'circlePacking',
      data: fluidData,
      sort: false,
      fluid: {
        enabled: true,
        renderMode: 'evolutionFluid',
      currentTime: 9.2,
        events: [
          { time: 10, type: 'merge', sources: ['search'], targets: ['editor'] }
        ],
        bridgeOpacity: 0.82,
        bridgeThreshold: 180
      },
      label: {
        show: false
      }
    }]
  });

  const fluidElements = chart.getZr().storage.getDisplayList()
    .filter((element) => element.__circlePackingFluidBridge || element.type === 'circlePackingWaterdropFusion');
  const displayList = chart.getZr().storage.getDisplayList();
  const firstFluidIndex = displayList.findIndex((element) => element.__circlePackingFluidBridge);
  const firstBackgroundCircleIndex = displayList.findIndex((element) => element.type === 'circle' && element.z2 < 4);
  const firstEventCircleIndex = displayList.findIndex((element) => element.type === 'circle' && element.z2 > 4);
  assert.equal(fluidElements.length > 0, true);
  fluidElements.forEach((element) => {
    assertNoTransparency(element.style?.opacity);
  });
  assert.equal(firstFluidIndex >= 0, true);
  assert.equal(firstBackgroundCircleIndex >= 0, true);
  assert.equal(firstEventCircleIndex >= 0, true);
  assert.equal(firstBackgroundCircleIndex < firstFluidIndex, true);
  assert.equal(firstFluidIndex < firstEventCircleIndex, true);
  assert.equal(fluidElements.some((element) => element.__circlePackingFluidBridge), true);
  assert.equal(displayList.some((element) => element.type === 'circle' && element.style?.lineWidth === 0), true);

  chart.dispose();
});

test('evolution-fluid circle render drops opacity and keeps move source color until handoff', () => {
  const chart = createSsrChart();
  const movingCompanyData = {
    id: 'root',
    name: 'Root',
    children: [
      {
        id: 'company-a',
        name: 'Company A',
        value: 28,
        itemStyle: { color: '#88b7a2' },
        children: [
          { id: 'b-team', name: 'B Team', value: 12, itemStyle: { color: '#5b8def' } },
          { id: 'c-team', name: 'C Team', value: 8, itemStyle: { color: '#14b8a6' } }
        ]
      },
      { id: 'b-company', name: 'B Company', value: 16, itemStyle: { color: '#2563eb' } }
    ]
  };
  const baseOption = {
    animation: false,
    series: [{
      type: 'circlePacking',
      animation: false,
      data: movingCompanyData,
      sort: false,
      fluid: {
        enabled: true,
        renderMode: 'evolutionFluid',
        currentTime: 1.97,
        events: [
          { time: 2, type: 'move', sources: ['b-team'], targets: ['b-company'] }
        ],
        bridgeThreshold: 260
      },
      itemStyle: {
        opacity: 0.42
      },
      enterAnimation: false,
      label: {
        show: false
      }
    }]
  };

  chart.setOption(baseOption);
  const beforeHandoff = findCircleGraphicByName(chart, 'B Team');
  const beforeHandoffStyle = { ...beforeHandoff?.style };
  chart.setOption({
    series: [{
      fluid: {
        currentTime: 1.98
      }
    }]
  });
  const afterHandoff = findCircleGraphicByName(chart, 'B Company');

  assert.ok(beforeHandoff, 'moving source circle renders before handoff');
  assert.ok(afterHandoff, 'target circle renders after handoff');
  assert.equal(beforeHandoffStyle.fill, '#5b8def');
  assert.equal(afterHandoff.style?.fill, '#2563eb');
  assertNoTransparency(beforeHandoffStyle.opacity);
  assertNoTransparency(afterHandoff.style?.opacity);

  chart.dispose();
});

test('orders evolution-fluid parent circles by hierarchy depth', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: false,
    series: [{
      type: 'circlePacking',
      data: {
        id: 'root',
        name: 'Root',
        children: [
          {
            id: 'parent',
            name: 'Parent',
            value: 40,
            children: [
              {
                id: 'nested-parent',
                name: 'Nested Parent',
                value: 20,
                children: [
                  { id: 'leaf', name: 'Leaf', value: 10 }
                ]
              }
            ]
          }
        ]
      },
      sort: false,
      fluid: {
        enabled: true,
        renderMode: 'evolutionFluid'
      },
      label: {
        show: false
      }
    }]
  });

  const data = chart.getModel().getSeriesByIndex(0).getData();
  const graphicsByName = new Map();
  for (let index = 0; index < data.count(); index += 1) {
    graphicsByName.set(data.getName(index), data.getItemGraphicEl(index));
  }

  const parentCircle = graphicsByName.get('Parent');
  const nestedParentCircle = graphicsByName.get('Nested Parent');
  const leafCircle = graphicsByName.get('Leaf');

  assert.ok(parentCircle, 'parent circle rendered');
  assert.ok(nestedParentCircle, 'nested parent circle rendered');
  assert.ok(leafCircle, 'leaf circle rendered');
  assert.ok(parentCircle.z2 < nestedParentCircle.z2, 'nested parent renders above its ancestor');
  assert.ok(nestedParentCircle.z2 < leafCircle.z2, 'leaf renders above its parent');

  chart.dispose();
});

test('renders evolution-fluid labels above fluid circles', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: false,
    series: [{
      type: 'circlePacking',
      data: {
        id: 'root',
        name: 'Root',
        children: [
          { id: 'company-a', name: 'Company A', value: 20 },
          { id: 'company-b', name: 'Company B', value: 15 }
        ]
      },
      rootVisible: false,
      sort: false,
      fluid: {
        enabled: true,
        renderMode: 'evolutionFluid'
      },
      label: {
        show: true,
        minRadius: 1
      }
    }]
  });

  const displayList = chart.getZr().storage.getDisplayList();
  const maxCircleZ2 = Math.max(...displayList
    .filter((element) => element.type === 'circle')
    .map((element) => element.z2 ?? 0));
  const labels = displayList.filter((element) => (
    (element.type === 'text' || element.type === 'tspan')
    && String(element.style?.text ?? '').includes('Company')
    && !element.ignore
  ));

  assert.equal(labels.length, 2);
  labels.forEach((label) => {
    assert.ok((label.z2 ?? 0) > maxCircleZ2, `${label.style?.text} label is behind a fluid circle`);
  });

  chart.dispose();
});

test('renders active spin-off buds above existing sibling circles', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: false,
    series: [{
      type: 'circlePacking',
      data: {
        id: 'root',
        name: 'Root',
        children: [
          {
            id: 'company-a',
            name: 'Company A',
            value: 36,
            children: [
              { id: 'b-team-a', name: 'B Team', value: 12 },
              { id: 'c-team-a', name: 'C Team', value: 9 }
            ]
          }
        ]
      },
      rootVisible: false,
      sort: false,
      fluid: {
        enabled: true,
        renderMode: 'evolutionFluid',
        currentTime: 0.35,
        events: [
          { time: 0.35, type: 'spinOff', sources: ['company-a'], targets: ['b-team-a'] },
          { time: 0.7, type: 'spinOff', sources: ['company-a'], targets: ['c-team-a'] }
        ]
      },
      label: {
        show: false
      }
    }]
  });

  const bTeam = findCircleGraphicByName(chart, 'B Team');
  const cTeam = findCircleGraphicByName(chart, 'C Team');

  assert.ok(bTeam, 'completed sibling team renders');
  assert.ok(cTeam, 'active spin-off bud renders');
  assert.ok((cTeam?.shape?.r ?? 0) < (bTeam?.shape?.r ?? 0) * 0.25, 'active bud starts small');
  assert.ok(
    (cTeam?.z2 ?? 0) > (bTeam?.z2 ?? 0),
    `active bud renders above completed sibling: B z2=${bTeam?.z2}, C z2=${cTeam?.z2}, B r=${bTeam?.shape?.r}, C r=${cTeam?.shape?.r}`
  );

  chart.dispose();
});

test('renders absorbed parent internals above its evolution-fluid surface', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: false,
    series: [{
      type: 'circlePacking',
      data: {
        id: 'root',
        name: 'Root',
        children: [
          {
            id: 'company-a',
            name: 'Company A',
            value: 20
          },
          {
            id: 'company-b',
            name: 'Company B',
            value: 40,
            children: [
              { id: 'team-d', name: 'Team D', value: 12 },
              { id: 'team-e', name: 'Team E', value: 12 }
            ]
          }
        ]
      },
      sort: false,
      fluid: {
        enabled: true,
        renderMode: 'evolutionFluid',
        currentTime: 9.2,
        events: [
          { time: 10, type: 'acquire', sources: ['company-b'], targets: ['company-a'] }
        ],
        bridgeThreshold: 260
      },
      label: {
        show: false
      }
    }]
  });

  const data = chart.getModel().getSeriesByIndex(0).getData();
  const graphicsByName = new Map();
  for (let index = 0; index < data.count(); index += 1) {
    graphicsByName.set(data.getName(index), data.getItemGraphicEl(index));
  }

  const companyB = graphicsByName.get('Company B');
  const teamD = graphicsByName.get('Team D');
  const teamE = graphicsByName.get('Team E');

  assert.ok(companyB, 'absorbed parent rendered');
  assert.ok(teamD, 'first internal circle rendered');
  assert.ok(teamE, 'second internal circle rendered');
  assert.ok(companyB.z2 < teamD.z2, 'first internal circle renders above absorbed parent');
  assert.ok(companyB.z2 < teamE.z2, 'second internal circle renders above absorbed parent');

  chart.dispose();
});

test('keeps an absorbed parent above the acquiring parent during handoff', () => {
  const chart = createSsrChart();
  const option = {
    animation: false,
    series: [{
      type: 'circlePacking',
      data: {
        id: 'root',
        name: 'Root',
        children: [
          {
            id: 'company-a',
            name: 'Company A',
            value: 36,
            children: [
              {
                id: 'company-b-inside-a',
                name: 'Company B Inside A',
                value: 16,
                children: [
                  { id: 'inside-e', name: 'Inside E', value: 8 }
                ]
              }
            ]
          },
          {
            id: 'company-b',
            name: 'Company B',
            value: 16,
            children: [
              { id: 'team-d', name: 'Team D', value: 8 },
              { id: 'team-e', name: 'Team E', value: 7 }
            ]
          }
        ]
      },
      sort: false,
      fluid: {
        enabled: true,
        renderMode: 'evolutionFluid',
        currentTime: 1.2,
        events: [
          { time: 2, type: 'acquire', sources: ['company-b'], targets: ['company-a'] },
          { time: 2.25, type: 'spinOff', sources: ['company-a'], targets: ['company-b-inside-a'] }
        ],
        bridgeThreshold: 260
      },
      label: {
        show: false
      }
    }]
  };

  chart.setOption(option);
  option.series[0].fluid.currentTime = 1.99;
  chart.setOption(option);

  const data = chart.getModel().getSeriesByIndex(0).getData();
  const graphicsByName = new Map();
  for (let index = 0; index < data.count(); index += 1) {
    graphicsByName.set(data.getName(index), data.getItemGraphicEl(index));
  }

  const companyA = graphicsByName.get('Company A');
  const companyB = graphicsByName.get('Company B');
  const teamD = graphicsByName.get('Team D');

  assert.ok(companyA, 'acquiring parent rendered');
  assert.ok(companyB, 'absorbed parent rendered');
  assert.ok(teamD, 'absorbed internal circle rendered');
  assert.ok(
    companyA.z2 < companyB.z2,
    `absorbed parent renders above acquiring parent: A ${companyA.z2}, B ${companyB.z2}`
  );
  assert.ok(
    companyB.z2 < teamD.z2,
    `absorbed internal circle renders above absorbed parent: B ${companyB.z2}, team ${teamD.z2}`
  );
  const displayList = chart.getZr().storage.getDisplayList();
  assert.ok(
    displayList.indexOf(companyA) < displayList.indexOf(companyB),
    'absorbed parent is drawn after acquiring parent during handoff'
  );
  assertNoTransparency(companyB.style?.opacity);
  assert.ok(!companyB.style?.shadowBlur);

  chart.dispose();
});

test('keeps evolution-fluid bridge geometry aligned with the latest scrubbed frame', () => {
  const chart = createSsrChart();
  const fluid = {
    enabled: true,
    renderMode: 'evolutionFluid',
    currentTime: 9.05,
    events: [
      { time: 10, type: 'merge', sources: ['search'], targets: ['editor'] }
    ],
    bridgeOpacity: 0.82,
    bridgeThreshold: 180
  };
  const baseSeries = {
    type: 'circlePacking',
    left: 0,
    top: 0,
    width: 640,
    height: 420,
    data: fluidData,
    sort: false,
    padding: 24,
    fluid,
    label: {
      show: false
    }
  };

  chart.setOption({
    animation: true,
    animationDurationUpdate: 1000,
    series: [baseSeries]
  });
  chart.setOption({
    animation: true,
    animationDurationUpdate: 1000,
    series: [{
      ...baseSeries,
      fluid: {
        ...fluid,
        currentTime: 9.2
      }
    }]
  });

  const expected = resolveCirclePackingLayout({
    data: fluidData,
    width: 640,
    height: 420,
    padding: 24,
    sort: false,
    fluid: {
      ...fluid,
      currentTime: 9.2
    }
  });
  const expectedBridge = expected.fluid?.bridges[0];
  const bridgeElement = chart.getZr().storage.getDisplayList()
    .find((element) => element.__circlePackingFluidBridge);

  assert.ok(expectedBridge?.path);
  assert.ok(expectedBridge?.surfaceShape);
  assert.ok(bridgeElement?.shape);
  assert.equal(expectedBridge.renderPath, false);
  assert.match(expectedBridge.path, /^M /);
  assertNoTransparency(bridgeElement.style?.opacity);
  assert.ok(!bridgeElement.style?.shadowBlur);
  assert.ok(!bridgeElement.style?.shadowColor);
  assert.equal((bridgeElement.animators || []).length, 0);

  chart.dispose();
});

test('clicking a descendant zooms to its parent and the next click restores the root view', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: true,
    series: [{
      type: 'circlePacking',
      data: portfolio,
      sort: false,
      focusAnimation: false,
      label: {
        show: false
      }
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  const rootGroup = circles[0].parent;
  const api = circles[10];
  const rootX = rootGroup.x;
  const rootY = rootGroup.y;

  api.trigger('mousedown', {
    target: api
  });

  assert.equal(rootGroup.scaleX > 1, true);
  assert.equal(rootGroup.scaleY, rootGroup.scaleX);
  assert.notEqual(rootGroup.x, 0);

  api.trigger('mousedown', {
    target: api
  });

  assert.equal(rootGroup.scaleX, 1);
  assert.equal(rootGroup.scaleY, 1);
  assert.equal(rootGroup.x, rootX);
  assert.equal(rootGroup.y, rootY);

  chart.dispose();
});

test('clicking a top-level branch zooms into that branch instead of no-oping on the root', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: true,
    series: [{
      type: 'circlePacking',
      data: portfolio,
      sort: false,
      focusAnimation: false,
      label: {
        show: false
      }
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  const rootGroup = circles[0].parent;
  const core = circles[1];

  core.trigger('mousedown', {
    target: core
  });

  assert.equal(rootGroup.scaleX > 1, true);
  assert.equal(rootGroup.scaleY, rootGroup.scaleX);

  chart.dispose();
});

test('clicking a visible label zooms like clicking its data circle', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: true,
    series: [{
      type: 'circlePacking',
      data: portfolio,
      sort: false,
      focusAnimation: false,
      label: {
        show: true,
        minRadius: 0
      }
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  const rootGroup = circles[0].parent;
  const coreLabel = collectTextElements(chart)
    .find((element) => element.style.text === 'Core');
  assert.ok(coreLabel);

  coreLabel.trigger('mousedown', {
    target: coreLabel
  });

  assert.equal(rootGroup.scaleX > 1, true);
  assert.equal(rootGroup.scaleY, rootGroup.scaleX);

  coreLabel.trigger('mousedown', {
    target: coreLabel
  });

  assert.equal(rootGroup.scaleX, 1);
  assert.equal(rootGroup.scaleY, 1);

  chart.dispose();
});

test('focused labels recompute wrapping and stay visually readable after zooming', () => {
  const node = circleNode({
    name: 'Center Experience',
    x: 40,
    y: 36,
    r: 16
  });
  const element = {
    style: {}
  };
  const labelItem = {
    element,
    node,
    allNodes: [node],
    text: 'Center Experience',
    requestedFontSize: 12,
    requestedLineHeight: 14,
    minRadius: 18
  };

  circlePackingInternals.updateCirclePackingFocusLabels([labelItem], 1, circlePackingInternals.disabledEnterAnimation());

  assert.equal(element.ignore, true);
  assert.match(element.style.text, /\.\.\./);

  circlePackingInternals.updateCirclePackingFocusLabels([labelItem], 4, circlePackingInternals.disabledEnterAnimation());

  assert.equal(element.ignore, false);
  assert.equal(element.style.text.includes('...'), false);
  assert.equal(element.style.text.replace(/\s+/g, ''), 'CenterExperience');
  assert.equal(element.style.fontSize * 4, 12);
  assert.equal(element.style.lineHeight * 4, 14);
});

test('hover keeps focused label sizing instead of restoring the pre-focus label style', () => {
  const trigger = createHoverableElement({ opacity: 1 });
  const other = createHoverableElement({ opacity: 1 });
  const label = createHoverableElement({
    text: 'Center...',
    fontSize: 12,
    lineHeight: 14,
    opacity: 1
  });
  const node = circleNode({
    name: 'Center Experience',
    x: 40,
    y: 36,
    r: 16
  });

  const hoverItem = circlePackingInternals.createHoverItem(trigger);
  circlePackingInternals.addHoverElement(hoverItem, label);
  setElementHoverDimOpacity(label, 0.42);
  installElementHover([hoverItem, circlePackingInternals.createHoverItem(other)], {
    transitionDuration: 0
  });

  trigger.trigger('mouseover');
  trigger.trigger('mouseout');

  circlePackingInternals.updateCirclePackingFocusLabels([{
    element: label,
    node,
    allNodes: [node],
    text: 'Center Experience',
    requestedFontSize: 12,
    requestedLineHeight: 14,
    minRadius: 18
  }], 4, circlePackingInternals.disabledEnterAnimation());
  const focusedStyle = { ...label.style };

  other.trigger('mouseover');

  assert.equal(label.style.text, focusedStyle.text);
  assert.equal(label.style.fontSize, focusedStyle.fontSize);
  assert.equal(label.style.lineHeight, focusedStyle.lineHeight);
  assert.equal(label.style.opacity, 0.42);
});

test('label focus state drops transient hover opacity from the stored label style', () => {
  const label = createHoverableElement({
    text: 'Center...',
    fontSize: 12,
    lineHeight: 14,
    opacity: 0.12
  });
  const node = circleNode({
    name: 'Center Experience',
    x: 40,
    y: 36,
    r: 16
  });

  circlePackingInternals.updateCirclePackingFocusLabels([{
    element: label,
    node,
    allNodes: [node],
    text: 'Center Experience',
    requestedFontSize: 12,
    requestedLineHeight: 14,
    minRadius: 18
  }], 4, circlePackingInternals.disabledEnterAnimation());

  assert.equal(label.style.text.includes('...'), false);
  assert.equal(label.style.opacity, undefined);
  assert.deepEqual(circlePackingInternals.createCirclePackingLabelHoverBaseStyle({
    text: 'Center Experience',
    fontSize: 3,
    opacity: 0.12
  }), {
    text: 'Center Experience',
    fontSize: 3
  });
});

test('clicking a deeper descendant while focused drills into its parent instead of restoring root', () => {
  const chart = createSsrChart();

  chart.setOption({
    animation: true,
    series: [{
      type: 'circlePacking',
      data: drilldownData,
      sort: false,
      focusAnimation: false,
      label: {
        show: false
      }
    }]
  });

  const circles = chart.getZr().storage.getDisplayList().filter((element) => element.type === 'circle');
  const rootGroup = circles[0].parent;
  const core = circles[1];
  const blocks = circles[4];

  core.trigger('mousedown', {
    target: core
  });
  const topLevelScale = rootGroup.scaleX;

  blocks.trigger('mousedown', {
    target: blocks
  });

  assert.equal(rootGroup.scaleX > topLevelScale, true);
  assert.equal(rootGroup.scaleY, rootGroup.scaleX);

  blocks.trigger('mousedown', {
    target: blocks
  });

  assert.equal(rootGroup.scaleX, 1);
  assert.equal(rootGroup.scaleY, 1);

  chart.dispose();
});

test('focus target resolves branch nodes to themselves and leaf nodes to their parent', () => {
  const root = circleNode({ id: 'root', name: 'Root', x: 50, y: 40, r: 20 });
  const parent = circleNode({ id: 'parent', name: 'Parent', parentId: 'root', x: 30, y: 40, r: 10 });
  const child = circleNode({ id: 'child', name: 'Child', parentId: 'parent', x: 28, y: 40, r: 4 });
  const leaf = circleNode({ id: 'leaf', name: 'Leaf', parentId: 'child', x: 27, y: 40, r: 2 });
  root.children = [parent];
  parent.children = [child];
  child.children = [leaf];
  const nodesById = new Map([
    [root.id, root],
    [parent.id, parent],
    [child.id, child],
    [leaf.id, leaf]
  ]);

  assert.equal(circlePackingInternals.resolveCirclePackingFocusTarget(parent, nodesById, root), parent);
  assert.equal(circlePackingInternals.resolveCirclePackingFocusTarget(child, nodesById, root), child);
  assert.equal(circlePackingInternals.resolveCirclePackingFocusTarget(leaf, nodesById, root), child);
});

test('focus transforms animate with the configured duration and easing', () => {
  const group = createAnimatableGroup();
  const transform = {
    x: -24,
    y: 18,
    scaleX: 2.5,
    scaleY: 2.5
  };

  circlePackingInternals.applyCirclePackingFocus(group, transform, {
    enabled: true,
    duration: 640,
    delay: 0,
    easing: 'quarticOut'
  });

  assert.equal(group.stopAnimationCalls[0].scope, 'circle-packing-focus');
  assert.deepEqual(group.animateToCalls[0].target, transform);
  assert.equal(group.animateToCalls[0].config.duration, 640);
  assert.equal(group.animateToCalls[0].config.easing, 'quarticOut');
  assert.equal(group.animateToCalls[0].config.scope, 'circle-packing-focus');

  group.animateToCalls[0].config.done();

  assert.equal(group.x, -24);
  assert.equal(group.y, 18);
  assert.equal(group.scaleX, 2.5);
  assert.equal(group.scaleY, 2.5);
});

test('label focus state follows focus animation and hides ignored labels immediately', () => {
  const visibleLabel = createAnimatableLabel({
    text: 'Old',
    fontSize: 12,
    lineHeight: 14
  });
  const animation = {
    enabled: true,
    duration: 320,
    delay: 0,
    easing: 'quadraticOut'
  };

  circlePackingInternals.assignCirclePackingLabelState(visibleLabel, {
    ignore: false,
    style: {
      x: 8,
      y: 9,
      text: 'Readable Label',
      fontSize: 4,
      lineHeight: 5
    }
  }, animation);

  assert.equal(visibleLabel.ignore, false);
  assert.equal(visibleLabel.style.text, 'Readable Label');
  assert.equal(visibleLabel.stopAnimationCalls[0].scope, 'circle-packing-focus');
  assert.equal(visibleLabel.animateToCalls[0].config.duration, 320);
  assert.equal(visibleLabel.animateToCalls[0].config.easing, 'quadraticOut');
  assert.deepEqual(visibleLabel.animateToCalls[0].target.style, {
    text: 'Readable Label',
    fontSize: 4,
    lineHeight: 5,
    x: 8,
    y: 9
  });

  visibleLabel.animateToCalls[0].config.done();

  assert.equal(visibleLabel.style.fontSize, 4);
  assert.equal(visibleLabel.style.lineHeight, 5);

  const bareLabel = createAnimatableLabel();
  delete bareLabel.style;
  circlePackingInternals.assignCirclePackingLabelState(bareLabel, {
    ignore: false,
    style: {
      text: 'Bare Label',
      fontSize: 6
    }
  }, animation);

  bareLabel.animateToCalls[0].config.done();

  assert.equal(bareLabel.style.text, 'Bare Label');
  assert.equal(bareLabel.style.fontSize, 6);

  const ignoredLabel = createAnimatableLabel({ text: 'Hidden' });
  circlePackingInternals.assignCirclePackingLabelState(ignoredLabel, {
    ignore: true,
    style: {
      text: 'Hidden',
      fontSize: 3,
      lineHeight: 4
    }
  }, animation);

  assert.equal(ignoredLabel.ignore, true);
  assert.equal(ignoredLabel.style.fontSize, 3);
  assert.equal(ignoredLabel.animateToCalls.length, 0);
});

test('label geometry helpers handle missing children and duplicate candidates', () => {
  assert.deepEqual(
    circlePackingInternals.resolveLabelPosition(
      { ...circleNode({ x: 12, y: 18 }), children: undefined },
      'Leaf',
      12,
      14
    ),
    {
      x: 12,
      y: 18
    }
  );

  assert.deepEqual(circlePackingInternals.dedupeLabelCandidates([
    { x: 1, y: 2 },
    { x: 1, y: 2 },
    { x: 3, y: 4 }
  ]), [
    { x: 1, y: 2 },
    { x: 3, y: 4 }
  ]);
});

test('moves leaf labels away from overlapping smaller circles', () => {
  const parent = circleNode({
    id: 'parent',
    x: 100,
    y: 100,
    r: 96,
    children: []
  });
  const overlappingSource = circleNode({
    id: 'source',
    x: 100,
    y: 100,
    r: 78
  });
  const position = circlePackingInternals.resolveLabelPosition(
    parent,
    'A 大公司',
    12,
    14,
    [parent, overlappingSource]
  );
  const labelBox = textBoxFromStyle({
    x: position.x,
    y: position.y,
    text: 'A 大公司',
    fontSize: 12,
    lineHeight: 14,
    align: 'center',
    verticalAlign: 'middle'
  });

  assert.equal(boxIntersectsCircle(labelBox, {
    cx: overlappingSource.x,
    cy: overlappingSource.y,
    r: overlappingSource.r
  }), false);
});

test('keeps parent label anchored when child circles move during fluid updates', () => {
  const first = circlePackingInternals.resolveLabelPosition(
    circleNode({
      x: 100,
      y: 100,
      r: 80,
      children: [
        circleNode({ x: 82, y: 125, r: 20 }),
        circleNode({ x: 120, y: 122, r: 18 })
      ]
    }),
    'A 大公司',
    12,
    14
  );
  const second = circlePackingInternals.resolveLabelPosition(
    circleNode({
      x: 100,
      y: 100,
      r: 80,
      children: [
        circleNode({ x: 82, y: 142, r: 20 }),
        circleNode({ x: 120, y: 139, r: 18 })
      ]
    }),
    'A 大公司',
    12,
    14
  );

  assert.deepEqual({
    x: roundForAssert(first.x),
    y: roundForAssert(first.y)
  }, {
    x: roundForAssert(second.x),
    y: roundForAssert(second.y)
  });
});

test('keeps company story parent label stable across B spin-off frames', () => {
  const anchors = [1.15, 1.4, 1.7].map((currentTime) => (
    companyStoryLabelAnchorAt(currentTime, 'A 大公司')
  ));

  assert.deepEqual(anchors, [anchors[0], anchors[0], anchors[0]]);
});

test('keeps company story A label clear while A reacquires B', () => {
  const chart = createCompanyStoryChartAt(6.03);
  const aLabel = collectTextElements(chart)
    .find((element) => String(element.style.text).replace(/\s+/g, '') === 'A大公司');

  assert.ok(aLabel, 'A label exists at 6.03');
  const aLabelBox = textBoxFromStyle(aLabel.style);
  const visibleCircles = chart.getZr().storage.getDisplayList()
    .filter((element) => element.type === 'circle' && element.shape?.r > 0)
    .sort((left, right) => right.shape.r - left.shape.r);
  const blockingCircles = visibleCircles.slice(1);
  blockingCircles.forEach((circle, index) => {
    assert.equal(boxIntersectsCircle(aLabelBox, circle.shape), false);
  });

  chart.dispose();
});

test('focus animation options resolve defaults, overrides, and disabled states', () => {
  assert.deepEqual(circlePackingInternals.readFocusAnimation(seriesModelValues({
    focusAnimation: true,
    animationDurationUpdate: 610,
    animationEasingUpdate: 'linear'
  })), {
    enabled: true,
    duration: 610,
    delay: 0,
    easing: 'linear'
  });
  assert.deepEqual(circlePackingInternals.readFocusAnimation(seriesModelValues({
    focusAnimation: {
      duration: -20,
      easing: 'quarticOut'
    }
  })), {
    enabled: true,
    duration: 0,
    delay: 0,
    easing: 'quarticOut'
  });
  assert.deepEqual(circlePackingInternals.readFocusAnimation(seriesModelValues({
    focusAnimation: null,
    animationDuration: 430,
    animationEasing: 'bounceOut'
  })), {
    enabled: true,
    duration: 430,
    delay: 0,
    easing: 'bounceOut'
  });
  assert.equal(circlePackingInternals.readFocusAnimation(seriesModelValues({ animation: false })).enabled, false);
  assert.equal(circlePackingInternals.readFocusAnimation(seriesModelValues({ focusAnimation: false })).enabled, false);
  assert.equal(circlePackingInternals.readFocusAnimation(seriesModelValues({ focusAnimation: { show: false } })).enabled, false);
  assert.equal(circlePackingInternals.readFocusAnimation(seriesModelValues({ focusAnimation: { enabled: false } })).enabled, false);
});

test('focus helpers resolve fallback targets and unmapped elements', () => {
  const root = circleNode({ id: 'root', name: 'Root', x: 50, y: 40, r: 20 });
  const parent = circleNode({ id: 'parent', name: 'Parent', parentId: 'root', x: 30, y: 40, r: 10 });
  const child = circleNode({ id: 'child', name: 'Child', parentId: 'parent', x: 28, y: 40, r: 4 });
  root.children = [parent];
  parent.children = [child];
  const nodesById = new Map([
    [root.id, root],
    [parent.id, parent],
    [child.id, child]
  ]);

  assert.equal(circlePackingInternals.resolveCurrentFocusTarget(parent.id, nodesById, root), parent);
  assert.equal(circlePackingInternals.resolveCurrentFocusTarget('missing', nodesById, root), root);
  assert.equal(circlePackingInternals.resolveCurrentFocusTarget(null, nodesById, root), root);
  assert.equal(circlePackingInternals.resolveCirclePackingFocusTarget(child, nodesById, root), parent);
  assert.equal(circlePackingInternals.resolveCirclePackingFocusTarget(undefined, nodesById, root), root);
  assert.equal(circlePackingInternals.resolveCirclePackingFocusTarget(root, nodesById, root), root);
  assert.equal(
    circlePackingInternals.resolveCirclePackingFocusTarget(
      circleNode({ id: 'solo', name: 'Solo', x: 50, y: 40, r: 20 }),
      nodesById,
      root
    ),
    root
  );
  assert.equal(
    circlePackingInternals.resolveCirclePackingFocusTarget({ ...child, parentId: 'missing' }, nodesById, root),
    root
  );

  const element = {};
  const mappedElement = {};
  const mapped = circlePackingInternals.mapCirclePackingNodeElements(new Map([
    ['kept', [element, element]],
    ['single', element],
    ['dropped', [{}]]
  ]), (candidate) => (candidate === element ? mappedElement : null));
  assert.deepEqual([...mapped.entries()], [
    ['kept', [mappedElement]],
    ['single', [mappedElement]]
  ]);
  assert.deepEqual(circlePackingInternals.mapCirclePackingLabelItems([
    {
      element,
      node: root,
      allNodes: [root, parent, child],
      text: 'Root',
      requestedFontSize: 12,
      requestedLineHeight: 14,
      minRadius: 0
    },
    {
      element: {},
      node: child,
      allNodes: [root, parent, child],
      text: 'Child',
      requestedFontSize: 12,
      requestedLineHeight: 14,
      minRadius: 0
    }
  ], (candidate) => (candidate === element ? mappedElement : null)), [
    {
      element: mappedElement,
      node: root,
      allNodes: [root, parent, child],
      text: 'Root',
      requestedFontSize: 12,
      requestedLineHeight: 14,
      minRadius: 0
    }
  ]);

  const childFocusElement = {};
  const parentFocusElement = {
    children: () => [childFocusElement]
  };
  const focusElementsByNodeId = new Map();
  circlePackingInternals.appendCirclePackingFocusElement(focusElementsByNodeId, 'parent', parentFocusElement);
  circlePackingInternals.appendCirclePackingFocusElement(focusElementsByNodeId, 'parent', parentFocusElement);
  assert.deepEqual(focusElementsByNodeId.get('parent'), [parentFocusElement, childFocusElement]);

  const hoverOnlyItem = { elements: [] };
  const hoverWithTriggerItem = { elements: [], triggerElements: [] };
  circlePackingInternals.addHoverElement(hoverOnlyItem, element);
  circlePackingInternals.addHoverElement(hoverWithTriggerItem, mappedElement);
  assert.deepEqual(hoverOnlyItem, {
    elements: [element],
    triggerElements: [element]
  });
  assert.deepEqual(hoverWithTriggerItem, {
    elements: [mappedElement],
    triggerElements: [mappedElement]
  });

  const transform = circlePackingInternals.createCirclePackingFocusTransform(
    { ...root, r: 0 },
    { center: { x: 50, y: 40 }, radius: 20 },
    { x: 2, y: 3 }
  );
  assert.deepEqual(transform, {
    x: 2,
    y: 3,
    scaleX: 1,
    scaleY: 1
  });
});

function assertNodeInsideParent(node, parent) {
  assert.ok(parent, `${node?.name} has parent`);
  const distance = Math.hypot(node.x - parent.x, node.y - parent.y);
  assert.ok(
    distance + node.r <= parent.r + 0.001,
    `${node.name} is outside ${parent.name}`
  );
}

function roundForAssert(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

function createSsrChart(width = 640, height = 420) {
  return echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width,
    height
  });
}

function loadDemoData(): any {
  const context: { window: { EChartsExtensionExamples?: { data: unknown } } } = { window: {} };
  runInNewContext(
    readFileSync(new URL('../../../docs/shared/demo-data.js', import.meta.url), 'utf8'),
    context
  );
  return context.window.EChartsExtensionExamples?.data;
}

function companyStoryLabelAnchorAt(currentTime, labelText) {
  const chart = createCompanyStoryChartAt(currentTime);
  const label = collectTextElements(chart)
    .find((element) => String(element.style.text).replace(/\s+/g, '') === labelText.replace(/\s+/g, ''));
  assert.ok(label, `${labelText} label exists at ${currentTime}`);
  const circle = findCircleGraphicByName(chart, labelText);
  assert.ok(circle, `${labelText} circle exists at ${currentTime}`);
  const anchor = {
    x: roundForAssert((Number(label.style.x) - circle.shape.cx) / circle.shape.r),
    y: roundForAssert((Number(label.style.y) - circle.shape.cy) / circle.shape.r)
  };

  chart.dispose();
  return anchor;
}

function createCompanyStoryChartAt(currentTime) {
  const chart = createSsrChart();
  const data = loadDemoData();

  chart.setOption({
    animation: false,
    series: [{
      type: 'circlePacking',
      top: 84,
      width: '95%',
      height: '78%',
      padding: 14,
      nodePadding: 3.6,
      siblingGap: 2.2,
      rootVisible: false,
      sort: 'none',
      data: data.circlePackingCompanyStory,
      fluid: {
        enabled: true,
        renderMode: 'evolutionFluid',
        currentTime,
        events: data.circlePackingCompanyStoryEvents,
        bridgeThreshold: 320
      },
      itemStyle: {
        borderColor: 'rgba(255, 255, 255, 0)',
        borderWidth: 0
      },
      label: {
        show: true,
        color: '#111827',
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 14,
        minRadius: 18
      }
    }]
  });

  return chart;
}

function findCircleGraphicByName(chart, name) {
  const data = chart.getModel().getSeriesByIndex(0).getData();
  const index = data.indexOfName(name);
  return index >= 0 ? data.getItemGraphicEl(index) : null;
}

function createAnimatableGroup() {
  return {
    stopAnimationCalls: [],
    animateToCalls: [],
    stopAnimation(scope, forwardToLast) {
      this.stopAnimationCalls.push({ scope, forwardToLast });
    },
    animateTo(target, config, animationProps) {
      this.animateToCalls.push({ target, config, animationProps });
    }
  };
}

function createAnimatableLabel(style = {}) {
  return {
    style: { ...style },
    stopAnimationCalls: [],
    animateToCalls: [],
    stopAnimation(scope, forwardToLast) {
      this.stopAnimationCalls.push({ scope, forwardToLast });
    },
    animateTo(target, config) {
      this.animateToCalls.push({ target, config });
    }
  };
}

function createHoverableElement(style = {}) {
  return {
    style: { ...style },
    handlers: {},
    on(eventName, handler) {
      if (!this.handlers[eventName]) this.handlers[eventName] = new Set();
      this.handlers[eventName].add(handler);
    },
    trigger(eventName, payload = {}) {
      this.handlers[eventName]?.forEach((handler) => handler({ target: this, ...payload }));
    },
    stopAnimation() {}
  };
}

function seriesModelValues(values = {}) {
  return {
    get(path) {
      return values[path];
    }
  };
}

function circleNode(overrides = {}) {
  return {
    id: 'node',
    name: 'Node',
    value: 1,
    percent: 1,
    depth: 0,
    parentId: null,
    children: [],
    dataIndex: 0,
    x: 0,
    y: 0,
    r: 1,
    color: '#000',
    synthetic: false,
    raw: {},
    ...overrides
  };
}

function eventObject(overrides = {}) {
  return {
    id: 'event',
    type: 'merge',
    time: '1',
    timeValue: 1,
    duration: null,
    order: 0,
    sourceRefs: [],
    targetRefs: [],
    value: 0,
    drawBridge: true,
    raw: {},
    ...overrides
  };
}

function fluidBridge(overrides = {}) {
  return {
    id: 'bridge',
    kind: 'absorb',
    sourceId: 'source',
    targetId: 'target',
    sourceIds: ['source'],
    targetIds: ['target'],
    path: 'M 0 0 L 1 1 Z',
    opacity: 0.78,
    color: '#336699',
    surfaceShape: undefined,
    renderPath: false,
    ...overrides
  };
}

function settleNodesForSurfaceNull() {
  const targetParent = circleNode({ id: 'surface-target-parent', parentId: 'root', x: 0, y: 0, r: 80 });
  const sourceParent = circleNode({ id: 'surface-source-parent', parentId: 'surface-target-parent', x: 0, y: 0, r: 30 });
  const source = circleNode({ id: 'surface-source', parentId: 'surface-source-parent', x: 10, y: 0, r: 6 });
  const target = circleNode({ id: 'surface-target', parentId: 'surface-target-parent', x: 45, y: 0, r: 8 });
  return new Map([
    ['surface-target-parent', targetParent],
    ['surface-source-parent', sourceParent],
    ['surface-source', source],
    ['surface-target', target]
  ]);
}

function roundPoint(point) {
  return {
    x: roundForAssert(point.x),
    y: roundForAssert(point.y)
  };
}

function lastHoverTargetOpacity(element) {
  const animator = element.animators
    ?.filter((item) => item.scope === 'element-hover')
    .at(-1);
  return animator?._tracks?.opacity?.keyframes?.at(-1)?.value;
}

function assertNoTransparency(value) {
  assert.equal(value == null || value === 1, true);
}

function collectTextElements(chart) {
  const elements = [];
  chart.getZr().storage.getRoots().forEach((root) => visitTextElements(root, elements));
  return elements;
}

function visitTextElements(element, elements) {
  if (element.style?.text != null) elements.push(element);
  element.children?.().forEach((child) => visitTextElements(child, elements));
}

function textBoxFromStyle(style) {
  const fontSize = Number(style.fontSize) || 12;
  const lineHeight = Number(style.lineHeight) || fontSize + 2;
  const lines = String(style.text).split('\n');
  const width = Math.max(...lines.map((line) => line.length), 1) * fontSize * 0.56;
  const height = lines.length * lineHeight;
  let x = Number(style.x) || 0;
  let y = Number(style.y) || 0;
  if (style.align === 'center') x -= width / 2;
  if (style.align === 'right') x -= width;
  if (style.verticalAlign === 'middle') y -= height / 2;
  if (style.verticalAlign === 'bottom') y -= height;
  return {
    x,
    y,
    width,
    height
  };
}

function boxIntersectsCircle(box, circle) {
  const closestX = Math.max(box.x, Math.min(circle.cx, box.x + box.width));
  const closestY = Math.max(box.y, Math.min(circle.cy, box.y + box.height));
  return Math.hypot(closestX - circle.cx, closestY - circle.cy) < circle.r;
}

function recordWaterdropPath(buildPath, shape) {
  const ops = [];
  buildPath({
    moveTo: (x, y) => ops.push(['M', x, y]),
    arc: (...args) => ops.push(['A', ...args]),
    bezierCurveTo: (...args) => ops.push(['C', ...args]),
    lineTo: (x, y) => ops.push(['L', x, y]),
    closePath: () => ops.push(['Z'])
  }, shape);
  return ops;
}

function roundWaterdropOps(ops) {
  return ops.map((op) => op.map((value) => (
    typeof value === 'number' ? roundForAssert(value) : value
  )));
}

function assertNodeWithinChart(node, layout) {
  assert.ok(node.x - node.r >= -0.001, `${node.name} left bound`);
  assert.ok(node.x + node.r <= layout.width + 0.001, `${node.name} right bound`);
  assert.ok(node.y - node.r >= -0.001, `${node.name} top bound`);
  assert.ok(node.y + node.r <= layout.height + 0.001, `${node.name} bottom bound`);
}

function assertSiblingCirclesDoNotOverlap(nodes, gap) {
  const byParent = new Map();
  nodes.forEach((node) => {
    if (!node.parentId) return;
    const siblings = byParent.get(node.parentId) || [];
    siblings.push(node);
    byParent.set(node.parentId, siblings);
  });

  for (const siblings of byParent.values()) {
    for (let leftIndex = 0; leftIndex < siblings.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < siblings.length; rightIndex += 1) {
        const left = siblings[leftIndex];
        const right = siblings[rightIndex];
        const distance = Math.hypot(right.x - left.x, right.y - left.y);
        assert.ok(
          distance + 0.001 >= left.r + right.r + gap,
          `${left.name} overlaps ${right.name}`
        );
      }
    }
  }
}
