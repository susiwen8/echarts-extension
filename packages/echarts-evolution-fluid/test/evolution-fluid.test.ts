import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import { SVGRenderer } from 'echarts/renderers';

import '../index.ts';
import { resolveEvolutionFluidLayout } from '../src/layout.ts';
import {
  computeMetaballBridgeStrength,
  createFusionEnvelopePath,
  createMetaballBridgePath,
  createSplitEnvelopePath,
  createWaterdropFusionShape,
  createWaterdropSurfacePath,
  createWaterdropSurfaceShape
} from '../src/metaball.ts';
import { hasValidPath, resolveFluidSimulationOptions, stableRound } from '../src/fluid-state.ts';
import { activeFluidIntents, contactProgress, createFluidIntents, intentProgress } from '../src/fluid-events.ts';
import { createImplicitSurfaceBlobs } from '../src/implicit-surface.ts';
import { fluidFrameToBridges, fluidFrameToEntities } from '../src/fluid-render-model.ts';
import { resolveFluidRuntimeFrame } from '../src/fluid-solver.ts';
import { buildWaterdropFusionPath } from '../src/waterdrop-fusion.ts';
import type { WaterdropFusionPathContext } from '../src/waterdrop-fusion.ts';

echarts.use([SVGRenderer]);

test('does not add visualization runtime dependencies', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

  assert.equal(packageJson.dependencies?.d3, undefined);
  assert.equal(packageJson.dependencies?.['matter-js'], undefined);
  assert.equal(packageJson.dependencies?.['pixi.js'], undefined);
});

test('owns waterdrop fusion rendering instead of importing a private zrender shape', () => {
  const source = readFileSync(new URL('../src/evolution-fluid.ts', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /zrender\/lib\/graphic\/shape\/WaterdropFusion/);
});

test('builds owned waterdrop fusion bridge geometry from circle shape data', () => {
  const commands: string[] = [];
  const ctx: WaterdropFusionPathContext = {
    moveTo: () => commands.push('M'),
    arc: () => commands.push('A'),
    bezierCurveTo: () => commands.push('C'),
    lineTo: () => commands.push('L'),
    closePath: () => commands.push('Z')
  };

  buildWaterdropFusionPath(ctx, {
    cx: 0,
    cy: 0,
    width: 0,
    height: 0,
    x0: 0,
    y0: 0,
    r0: 30,
    x1: 56,
    y1: 4,
    r1: 24,
    neck: 20,
    leftRadius: 30,
    rightRadius: 24,
    dy: 4,
    curve: 0.85,
    bridgeLength: 80,
    bridgeOnly: true
  });

  assert.deepEqual(commands, ['M', 'C', 'L', 'C', 'Z']);
});

test('owned waterdrop fusion path handles defaults, full circles, and empty radii', () => {
  const fullCommands: string[] = [];
  const fullCtx: WaterdropFusionPathContext = {
    moveTo: () => fullCommands.push('M'),
    arc: () => fullCommands.push('A'),
    bezierCurveTo: () => fullCommands.push('C'),
    lineTo: () => fullCommands.push('L'),
    closePath: () => fullCommands.push('Z')
  };
  buildWaterdropFusionPath(fullCtx, {
    cx: 50,
    cy: 20,
    width: 56,
    height: 24,
    neck: 8,
    leftRadius: 0,
    rightRadius: 0,
    dy: 10,
    curve: 0.2,
    bridgeLength: 80
  });

  const emptyCommands: string[] = [];
  buildWaterdropFusionPath({
    moveTo: () => emptyCommands.push('M'),
    arc: () => emptyCommands.push('A'),
    bezierCurveTo: () => emptyCommands.push('C'),
    lineTo: () => emptyCommands.push('L'),
    closePath: () => emptyCommands.push('Z')
  }, {
    cx: 0,
    cy: 0,
    width: 0,
    height: 0,
    x0: 0,
    y0: 0,
    r0: 0,
    x1: 0,
    y1: 0,
    r1: 0,
    neck: 0,
    leftRadius: 0,
    rightRadius: 0,
    dy: 0,
    curve: 0,
    bridgeLength: 0
  });

  assert.deepEqual(fullCommands, ['M', 'A', 'M', 'A', 'M', 'C', 'L', 'C', 'Z']);
  assert.deepEqual(emptyCommands, []);
});

test('returns an empty-safe layout result', () => {
  const layout = resolveEvolutionFluidLayout({ width: 640, height: 360 });

  assert.equal(layout.width, 640);
  assert.equal(layout.height, 360);
  assert.deepEqual(layout.entities, []);
  assert.deepEqual(layout.events, []);
  assert.equal(layout.timeline.show, true);
});

test('parses fluid simulation options with safe deterministic defaults', () => {
  assert.deepEqual(resolveFluidSimulationOptions(undefined), {
    enabled: false,
    mode: 'implicit',
    quality: 'balanced',
    substeps: 6,
    surfaceThreshold: 1,
    stickDistance: 0,
    breakDistance: 0,
    damping: 0.82,
    surfaceTension: 0.34,
    areaConservation: true
  });

  assert.deepEqual(resolveFluidSimulationOptions({
    enabled: true,
    mode: 'physical',
    quality: 'smooth',
    substeps: 64,
    surfaceThreshold: 0.74,
    stickDistance: 2,
    breakDistance: 5,
    damping: 2,
    surfaceTension: -1,
    areaConservation: false
  }), {
    enabled: true,
    mode: 'physical',
    quality: 'smooth',
    substeps: 32,
    surfaceThreshold: 0.74,
    stickDistance: 2,
    breakDistance: 5,
    damping: 1,
    surfaceTension: 0,
    areaConservation: false
  });
});

test('rejects invalid fluid surface paths before rendering', () => {
  assert.equal(hasValidPath('M 0 0 C 1 1 2 2 3 3 Z'), true);
  assert.equal(hasValidPath('M 0 0 Q 1 1 2 2 Z'), false);
  assert.equal(hasValidPath('M 0 0 C NaN 1 2 2 3 3 Z'), false);
  assert.equal(hasValidPath(''), false);
  assert.equal(stableRound(Number.POSITIVE_INFINITY), 0);
});

test('fluid intents expose absorb contact and completion windows', () => {
  const intents = createFluidIntents([
    {
      id: 'event-0',
      type: 'acquire',
      time: '2020',
      timeValue: 2020,
      order: 0,
      sourceIds: ['beta'],
      targetIds: ['alpha'],
      value: 30,
      raw: {}
    }
  ]);

  assert.equal(intents.length, 1);
  assert.equal(intents[0].type, 'absorb');
  assert.deepEqual(intents[0].sourceIds, ['beta']);
  assert.deepEqual(intents[0].targetIds, ['alpha']);
  assert.equal(intents[0].startTime, 2019);
  assert.equal(intents[0].contactTime, 2019.58);
  assert.equal(intents[0].completionTime, 2020);
});

test('fluid intents cover null-time progress, active windows, and custom filtering', () => {
  const intents = createFluidIntents([
    {
      id: 'empty',
      type: 'custom',
      time: '2020',
      timeValue: 2020,
      order: 0,
      sourceIds: [],
      targetIds: [],
      value: 0,
      raw: {}
    },
    {
      id: 'custom',
      type: 'partnership',
      time: '2021',
      timeValue: 2021,
      order: 1,
      sourceIds: ['alpha'],
      targetIds: ['beta'],
      value: 12,
      raw: {}
    }
  ]);

  assert.equal(intents.length, 1);
  assert.equal(intents[0].type, 'custom');
  assert.deepEqual(activeFluidIntents(intents, null), intents);
  assert.deepEqual(activeFluidIntents(intents, 2019.5), []);
  assert.deepEqual(activeFluidIntents(intents, 2020.5), [intents[0]]);
  assert.deepEqual(activeFluidIntents(intents, 2021.5), []);
  assert.equal(intentProgress(intents[0], null), 1);
  assert.equal(contactProgress(intents[0], null), 1);
});

test('fluid intents treat spinOff as a split with parent and child ids', () => {
  const intents = createFluidIntents([
    {
      id: 'split-0',
      type: 'spinOff',
      time: '2020',
      timeValue: 2020,
      order: 0,
      sourceIds: ['alpha'],
      targetIds: ['beta'],
      value: 20,
      raw: {}
    }
  ]);

  assert.equal(intents[0].type, 'split');
  assert.deepEqual(intents[0].sourceIds, ['alpha']);
  assert.deepEqual(intents[0].targetIds, ['beta']);
});

test('implicit surface returns one connected blob when droplets overlap', () => {
  const blobs = createImplicitSurfaceBlobs([
    {
      id: 'alpha',
      entityId: 'alpha',
      kind: 'entity',
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      radius: 30,
      targetRadius: 30,
      mass: 900,
      color: '#38bdf8',
      opacity: 1,
      active: true,
      groupId: 'group-0'
    },
    {
      id: 'beta',
      entityId: 'beta',
      kind: 'entity',
      x: 146,
      y: 100,
      vx: 0,
      vy: 0,
      radius: 18,
      targetRadius: 18,
      mass: 324,
      color: '#34d399',
      opacity: 0.9,
      active: true,
      groupId: 'group-0'
    }
  ], [{
    id: 'group-0',
    particleIds: ['alpha', 'beta'],
    mode: 'fusing',
    colorPolicy: 'target'
  }], {
    sourceIds: ['beta'],
    targetIds: ['alpha'],
    kind: 'absorb',
    color: '#38bdf8',
    opacity: 0.88,
    surfaceThreshold: 1,
    quality: 'fast'
  });

  assert.equal(blobs.length, 1);
  assert.equal(blobs[0].particleIds.length, 2);
  assert.match(blobs[0].path, /^M /);
  assert.equal((blobs[0].path.match(/\bM\b/g) || []).length, 1);
  assert.doesNotMatch(blobs[0].path, /\b(?:NaN|Infinity|-Infinity)\b/);
  assert.doesNotMatch(blobs[0].path, /\s[AQ]\s/);
});

test('implicit surface returns detached circle paths after positive split gap', () => {
  const blobs = createImplicitSurfaceBlobs([
    {
      id: 'alpha',
      entityId: 'alpha',
      kind: 'entity',
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      radius: 30,
      targetRadius: 30,
      mass: 900,
      color: '#38bdf8',
      opacity: 1,
      active: true,
      groupId: 'group-0'
    },
    {
      id: 'beta',
      entityId: 'beta',
      kind: 'entity',
      x: 170,
      y: 100,
      vx: 0,
      vy: 0,
      radius: 18,
      targetRadius: 18,
      mass: 324,
      color: '#34d399',
      opacity: 0.9,
      active: true,
      groupId: 'group-0'
    }
  ], [{
    id: 'group-0',
    particleIds: ['alpha', 'beta'],
    mode: 'detached',
    colorPolicy: 'source'
  }], {
    sourceIds: ['alpha'],
    targetIds: ['beta'],
    kind: 'split',
    color: '#38bdf8',
    opacity: 0.88,
    surfaceThreshold: 1,
    quality: 'fast'
  });

  assert.equal(blobs.length, 1);
  assert.equal((blobs[0].path.match(/\bM\b/g) || []).length, 2);
  assert.doesNotMatch(blobs[0].path, /\sL\s/);
});

test('implicit surface handles empty, single, and untraceable groups safely', () => {
  const singleParticle = {
    id: 'solo',
    entityId: 'solo',
    kind: 'entity' as const,
    x: 40,
    y: 50,
    vx: 0,
    vy: 0,
    radius: 12,
    targetRadius: 12,
    mass: 144,
    color: '#38bdf8',
    opacity: 1,
    active: true,
    groupId: 'single'
  };
  const baseContext = {
    sourceIds: ['solo'],
    targetIds: ['solo'],
    kind: 'surface' as const,
    color: '#38bdf8',
    opacity: 0.8,
    surfaceThreshold: 1,
    quality: 'smooth' as const
  };

  assert.deepEqual(createImplicitSurfaceBlobs([], [{
    id: 'empty',
    particleIds: ['missing'],
    mode: 'single',
    colorPolicy: 'mixed'
  }], baseContext), []);

  const single = createImplicitSurfaceBlobs([singleParticle], [{
    id: 'single',
    particleIds: ['solo'],
    mode: 'single',
    colorPolicy: 'mixed'
  }], baseContext);
  const untraceable = createImplicitSurfaceBlobs([singleParticle], [{
    id: 'untraceable',
    particleIds: ['solo'],
    mode: 'fusing',
    colorPolicy: 'mixed'
  }], {
    ...baseContext,
    surfaceThreshold: 10_000
  });

  assert.equal(single.length, 1);
  assert.equal((single[0].path.match(/\bM\b/g) || []).length, 1);
  assert.equal(untraceable.length, 1);
  assert.equal((untraceable[0].path.match(/\bM\b/g) || []).length, 1);
});

test('creates a sampled metaball contour between nearby droplets', () => {
  const path = createMetaballBridgePath({ x: 0, y: 0, r: 20 }, { x: 42, y: 0, r: 16 }, { maxDistance: 100 });

  assert.match(path, /^M /);
  assert.ok((path.match(/\sC\s/g) || []).length >= 8);
  assert.doesNotMatch(path, /\s[AQL]\s/);
  assert.equal(computeMetaballBridgeStrength({ x: 0, y: 0, r: 20 }, { x: 10, y: 0, r: 16 }, 100), 0.9);
  assert.equal(computeMetaballBridgeStrength({ x: 0, y: 0, r: 20 }, { x: Number.NaN, y: 0, r: 16 }, 100), 0);
  assert.equal(createMetaballBridgePath({ x: Number.NaN, y: 0, r: 20 }, { x: 42, y: 0, r: 16 }, { maxDistance: 100 }), '');
  assert.equal(createMetaballBridgePath({ x: 0, y: 0, r: 20 }, { x: 60, y: 0, r: 16 }, { maxDistance: 100 }), '');
  assert.equal(createMetaballBridgePath({ x: 0, y: 0, r: 20 }, { x: 5, y: 0, r: 16 }, { maxDistance: 100 }), '');
});

test('uses waterdrop fusion geometry while split droplets overlap', () => {
  const path = createSplitEnvelopePath({ x: 0, y: 0, r: 24 }, { x: 26, y: 0, r: 12 }, { releaseProgress: 0 });

  assert.match(path, /^M /);
  assert.match(path, /\sL\s/);
  assert.doesNotMatch(path, /\s[AQ]\s/);
  assert.match(createSplitEnvelopePath({ x: 0, y: 0, r: 24 }, { x: 0, y: 0, r: 12 }), /^M /);
  assert.equal(createSplitEnvelopePath({ x: 0, y: 0, r: 0 }, { x: 26, y: 0, r: 12 }), '');
  assert.match(createFusionEnvelopePath({ x: 0, y: 0, r: 24 }, { x: 0, y: 0, r: 12 }), /^M /);
  assert.equal(createFusionEnvelopePath({ x: 0, y: Number.NaN, r: 24 }, { x: 26, y: 0, r: 12 }), '');
});

test('uses zrender surface waterdrop paths with circle surfaces and a line-closed neck', () => {
  const path = createWaterdropSurfacePath({ x: 60, y: 220, r: 13 }, { x: 81, y: 229, r: 15 }, { bridgeLength: 38 });
  const reversed = createWaterdropSurfaceShape({ x: 81, y: 229, r: 15 }, { x: 60, y: 220, r: 13 }, { bridgeLength: 38 });

  assert.equal((path.match(/\bM\b/g) || []).length, 3);
  assert.match(path, /\sL\s/);
  assert.doesNotMatch(path, /\s[AQ]\s/);
  assert.equal(reversed?.leftRadius, 13);
  assert.equal(reversed?.rightRadius, 15);
  assert.equal(reversed?.width, 49);
  assert.equal(createWaterdropSurfacePath({ x: 0, y: 0, r: 0 }, { x: 10, y: 0, r: 10 }), '');
  assert.match(createWaterdropSurfacePath({ x: 0, y: 0, r: 10 }, { x: 0, y: 0, r: 8 }), /^M /);
  assert.equal((createWaterdropSurfacePath({ x: 0, y: 0, r: 10 }, { x: 40, y: 0, r: 10 }, { bridgeLength: 0 }).match(/\bM\b/g) || []).length, 2);
  assert.equal(createWaterdropFusionShape({ x: 0, y: 0, r: 0 }, { x: 10, y: 0, r: 10 }), null);
  assert.equal(createWaterdropFusionShape({ x: 0, y: 0, r: 10 }, { x: 30, y: 0, r: 8 }, { neckSize: Number.NaN })?.neck, 8);
});

test('metaball and waterdrop helpers cover degenerate bridge inputs safely', () => {
  assert.equal(createMetaballBridgePath({ x: 0, y: 0, r: 20 }, { x: 0, y: 0, r: 16 }, { maxDistance: 100 }), '');
  assert.equal(createMetaballBridgePath({ x: 0, y: 0, r: 20 }, { x: 120, y: 0, r: 16 }, { maxDistance: 80 }), '');
  assert.equal(computeMetaballBridgeStrength({ x: 0, y: 0, r: 20 }, { x: 0, y: 0, r: 16 }, 100), 0);

  const fallbackCommands: string[] = [];
  buildWaterdropFusionPath({
    moveTo: () => fallbackCommands.push('M'),
    arc: () => fallbackCommands.push('A'),
    bezierCurveTo: () => fallbackCommands.push('C'),
    lineTo: () => fallbackCommands.push('L'),
    closePath: () => fallbackCommands.push('Z')
  }, {
    cx: 0,
    cy: 0,
    width: 40,
    height: 20,
    r0: 10,
    r1: 8,
    neck: 0,
    leftRadius: 0,
    rightRadius: 0,
    dy: 0,
    curve: 0.2,
    bridgeLength: 0
  });

  const noBridgeCommands: string[] = [];
  buildWaterdropFusionPath({
    moveTo: () => noBridgeCommands.push('M'),
    arc: () => noBridgeCommands.push('A'),
    bezierCurveTo: () => noBridgeCommands.push('C'),
    lineTo: () => noBridgeCommands.push('L'),
    closePath: () => noBridgeCommands.push('Z')
  }, {
    cx: 0,
    cy: 0,
    width: 80,
    height: 20,
    neck: 6,
    leftRadius: 10,
    rightRadius: 10,
    dy: 0,
    curve: 0.2,
    bridgeLength: 0
  });

  assert.deepEqual(fallbackCommands, ['M', 'A', 'M', 'A']);
  assert.deepEqual(noBridgeCommands, ['M', 'A', 'M', 'A']);
});

test('normalizes entities, events, and missing event references', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 800,
    height: 420,
    entities: [
      { id: 'alpha', name: 'Alpha AI', industry: 'AI', value: 120, itemStyle: { color: '#38bdf8' } },
      { id: 'beta', name: 'Beta Cloud', category: 'Cloud', value: 80 }
    ],
    events: [
      { time: '2021', type: 'acquire', sources: ['beta', 'missing'], targets: ['alpha'], value: 45 },
      { time: '2019', type: 'found', targets: ['alpha'], value: 'bad' },
      { time: '2021', type: 'rename', sources: ['alpha'], targets: ['alpha'], value: 0 }
    ],
    currentTime: 2020.5
  });

  assert.deepEqual(layout.events.map((event) => `${event.time}:${event.type}:${event.order}`), [
    '2019:found:1'
  ]);
  assert.ok(layout.entities.some((entity) => entity.id === 'missing'));
  assert.equal(layout.entities.find((entity) => entity.id === 'alpha')?.name, 'Alpha AI');
  assert.equal(layout.entities.find((entity) => entity.id === 'beta')?.category, 'Cloud');
  assert.ok((layout.entities.find((entity) => entity.id === 'alpha')?.r || 0) > (layout.entities.find((entity) => entity.id === 'beta')?.r || 0));
  assert.ok(layout.events.every((event) => event.value >= 0));
});

test('normalizes nested fields, duplicate ids, dates, and fallback timeline values', () => {
  const layout = resolveEvolutionFluidLayout({
    width: Number.NaN,
    height: -20,
    data: [
      { meta: { id: 'dup', kind: 5 }, metrics: { score: '49' }, label: 'Primary', itemStyle: { color: '#abc' } },
      { meta: { id: 'dup' }, metrics: { score: -1 }, category: 42, color: '#def' },
      { meta: 'not-a-record', metrics: null, name: 999, value: '16' },
      { meta: { id: 'dup-2' }, metrics: { score: '9' } },
      { meta: { id: 'dup-2' }, metrics: { score: '8' } },
      7
    ],
    events: [
      { meta: { year: new Date('2020-01-01T00:00:00Z') }, type: 'found', target: 'dup', value: '5' },
      { meta: { year: '2021-01-02' }, type: 'custom', source: 999, value: 'bad' },
      { meta: { year: 'not-a-date' }, type: 'rename', value: 1 }
    ],
    entityIdField: 'meta.id',
    valueField: 'metrics.score',
    categoryField: 'meta.kind',
    timeField: 'meta.year',
    currentTime: null,
    layout: { clustering: 'none', center: [60, 'bad%'], categoryGap: '9' },
    dropletStyle: { minRadius: '2', maxRadius: '3', opacity: '0.5', bridgeOpacity: '0.3' },
    timeline: { show: false, bottom: '24' }
  });

  assert.equal(layout.width, 800);
  assert.equal(layout.height, 1);
  assert.deepEqual(layout.entities.map((entity) => entity.id), ['dup', 'dup-2', 'dup-2-2', 'dup-2-3', 'entity-5']);
  assert.deepEqual(layout.entities.map((entity) => entity.category), ['5', '42', 'default', 'default', 'default']);
  assert.equal(layout.entities[0].color, '#abc');
  assert.equal(layout.entities[1].color, '#def');
  assert.equal(layout.events.length, 3);
  assert.equal(layout.events.at(-1)?.x, 0);
  assert.equal(layout.timeline.show, false);
  assert.equal(layout.progress, 1);
});

test('uses short hex colors and invalid color fallbacks during fusion', () => {
  const split = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    entities: [
      { id: 'parent', industry: 'AI', value: 120, itemStyle: { color: '#abc' } },
      { id: 'child', industry: 'AI', value: 60, itemStyle: { color: '#def' } }
    ],
    events: [
      { time: 2020, type: 'spinOff', sources: ['parent'], targets: ['child'], value: 30 }
    ],
    currentTime: 2019.82,
    dropletStyle: { bridgeThreshold: 260 }
  });
  const absorb = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    entities: [
      { id: 'source', industry: 'AI', value: 60, itemStyle: { color: 'not-a-color' } },
      { id: 'target', industry: 'AI', value: 120, itemStyle: { color: '#38bdf8' } }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['source'], targets: ['target'], value: 30 }
    ],
    currentTime: 2019.82,
    dropletStyle: { bridgeThreshold: 260 }
  });

  assert.match(split.bridges[0]?.color || '', /^rgb\(/);
  assert.equal(absorb.entities.find((entity) => entity.id === 'source')?.color, 'not-a-color');
});

test('completes finished merges while keeping future entities hidden and full timeline ticks', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 },
      { time: 2021, type: 'merge', sources: ['alpha', 'future-shell'], targets: ['future-combined'], value: 80 },
      { time: 2022, type: 'spinOff', sources: ['future-combined'], targets: ['future-spinout'], value: 20 }
    ],
    currentTime: 2020,
    dropletStyle: { bridgeThreshold: 260 }
  });

  assert.deepEqual(layout.events.map((event) => event.time), ['2020']);
  assert.equal(layout.bridges.length, 0);
  assert.ok(layout.entities.some((entity) => entity.id === 'alpha'));
  assert.ok(!layout.entities.some((entity) => entity.id === 'beta'));
  assert.ok(!layout.entities.some((entity) => entity.id === 'future-shell'));
  assert.ok(!layout.entities.some((entity) => entity.id === 'future-combined'));
  assert.ok(!layout.entities.some((entity) => entity.id === 'future-spinout'));
  assert.deepEqual(layout.timeline.ticks.map((tick) => tick.time), ['2020', '2021', '2022']);
  assert.deepEqual(layout.timeline.ticks.map((tick) => tick.active), [true, false, false]);
});

test('moves sources through approach, fusion, and completed merge stages', () => {
  const base = {
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 }
    ],
    dropletStyle: { bridgeThreshold: 260 }
  };
  const before = resolveEvolutionFluidLayout({ ...base, currentTime: 2019 });
  const approaching = resolveEvolutionFluidLayout({ ...base, currentTime: 2019.5 });
  const fusing = resolveEvolutionFluidLayout({ ...base, currentTime: 2019.8 });
  const complete = resolveEvolutionFluidLayout({ ...base, currentTime: 2020 });
  const distance = (layout: ReturnType<typeof resolveEvolutionFluidLayout>) => {
    const alpha = layout.entities.find((entity) => entity.id === 'alpha');
    const beta = layout.entities.find((entity) => entity.id === 'beta');
    return alpha && beta ? Math.hypot(beta.x - alpha.x, beta.y - alpha.y) : Number.POSITIVE_INFINITY;
  };

  assert.ok(distance(approaching) < distance(before));
  assert.equal(approaching.bridges.length, 0);
  assert.ok(fusing.bridges.length > 0);
  assert.ok(!complete.entities.some((entity) => entity.id === 'beta'));
  assert.ok((complete.entities.find((entity) => entity.id === 'alpha')?.r || 0) > (before.entities.find((entity) => entity.id === 'alpha')?.r || 0));
});

test('shrinks absorbed sources throughout the fusion stage', () => {
  const base = {
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 }
    ],
    dropletStyle: { bridgeThreshold: 260 }
  };
  const sourceRadiusAt = (currentTime: number) => (
    resolveEvolutionFluidLayout({ ...base, currentTime })
      .entities.find((entity) => entity.id === 'beta')?.r || 0
  );
  const earlyFusionRadius = sourceRadiusAt(2019.75);
  const midFusionRadius = sourceRadiusAt(2019.85);
  const lateFusionRadius = sourceRadiusAt(2019.95);

  assert.ok(earlyFusionRadius > midFusionRadius);
  assert.ok(midFusionRadius > lateFusionRadius);
  assert.ok(lateFusionRadius > 0);
});

test('keeps a shrinking absorbed source until the merge completes', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 }
    ],
    currentTime: 2019.99,
    dropletStyle: { bridgeThreshold: 260 }
  });

  const beta = layout.entities.find((entity) => entity.id === 'beta');

  assert.ok(beta);
  assert.ok(beta.r < 4);
  assert.ok((beta.opacity || 0) < 0.3);
});

test('fluid simulation preserves area while a source is absorbed', () => {
  const base = {
    width: 760,
    height: 420,
    fluidSimulation: { enabled: true, quality: 'balanced' },
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 }
    ],
    dropletStyle: { bridgeThreshold: 260 }
  };
  const before = resolveEvolutionFluidLayout({ ...base, currentTime: 2019 });
  const mid = resolveEvolutionFluidLayout({ ...base, currentTime: 2019.8 });
  const beforeArea = before.entities
    .filter((entity) => entity.id === 'alpha' || entity.id === 'beta')
    .reduce((sum, entity) => sum + entity.r ** 2, 0);
  const midArea = mid.entities
    .filter((entity) => entity.id === 'alpha' || entity.id === 'beta')
    .reduce((sum, entity) => sum + entity.r ** 2, 0);

  assert.ok(Math.abs(beforeArea - midArea) < beforeArea * 0.04);
  assert.ok((mid.entities.find((entity) => entity.id === 'beta')?.r || 0) < (before.entities.find((entity) => entity.id === 'beta')?.r || 0));
  assert.equal(mid.bridges[0]?.id.startsWith('fluid:'), true);
  assert.equal((mid.bridges[0]?.path.match(/\bM\b/g) || []).length, 1);
});

test('fluid simulation exposes waterdrop surface geometry while a source is absorbed', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    fluidSimulation: { enabled: true, quality: 'balanced' },
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 }
    ],
    currentTime: 2019.8,
    dropletStyle: { bridgeThreshold: 260 }
  });

  const bridge = layout.bridges[0];

  assert.ok(bridge?.surfaceShape);
  assert.ok(bridge.surfaceShape.neck > 0);
  assert.ok(bridge.surfaceShape.leftRadius > 0);
  assert.ok(bridge.surfaceShape.rightRadius > 0);
});

test('fluid simulation keeps connected absorb droplets close after unrelated repulsion', () => {
  const frame = resolveFluidRuntimeFrame([
    fluidTestEntity('alpha', 220, 120, 30, '#111827'),
    fluidTestEntity('beta', 110, 120, 24, '#2563eb'),
    fluidTestEntity('gamma', 200, 100, 44, '#0891b2')
  ], [{
    id: 'event-0',
    type: 'acquire',
    time: '2020',
    timeValue: 2020,
    order: 0,
    sourceIds: ['beta'],
    targetIds: ['alpha'],
    value: 30,
    raw: {}
  }], 2019.78, resolveFluidSimulationOptions({
    enabled: true,
    mode: 'implicit',
    substeps: 14,
    surfaceTension: 0.45,
    stickDistance: 18
  }));
  const alpha = frame.particles.find((particle) => particle.id === 'alpha');
  const beta = frame.particles.find((particle) => particle.id === 'beta');

  assert.ok(alpha);
  assert.ok(beta);
  assert.ok(distance(alpha, beta) - alpha.radius - beta.radius <= 1);
});

test('fluid simulation carries merged target radius into later transitions', () => {
  const base = {
    width: 760,
    height: 420,
    fluidSimulation: { enabled: true, quality: 'balanced' },
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 },
      { id: 'gamma', industry: 'AI', value: 48 }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 },
      { time: 2023, type: 'acquire', sources: ['gamma'], targets: ['alpha'], value: 24 }
    ],
    dropletStyle: { bridgeThreshold: 260 }
  };
  const afterFirstMerge = resolveEvolutionFluidLayout({ ...base, currentTime: 2021.5 })
    .entities.find((entity) => entity.id === 'alpha');
  const secondTransitionStart = resolveEvolutionFluidLayout({ ...base, currentTime: 2022 })
    .entities.find((entity) => entity.id === 'alpha');

  assert.ok(afterFirstMerge);
  assert.ok(secondTransitionStart);
  assert.ok(secondTransitionStart.r >= afterFirstMerge.r - 0.01);
});

test('fluid simulation carries merged source radius into later absorption', () => {
  const base = {
    width: 760,
    height: 420,
    fluidSimulation: { enabled: true, quality: 'balanced' },
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 },
      { id: 'delta', industry: 'AI', value: 90 }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 },
      { time: 2023, type: 'acquire', sources: ['alpha'], targets: ['delta'], value: 60 }
    ],
    dropletStyle: { bridgeThreshold: 260 }
  };
  const afterFirstMerge = resolveEvolutionFluidLayout({ ...base, currentTime: 2021.5 })
    .entities.find((entity) => entity.id === 'alpha');
  const secondTransitionStart = resolveEvolutionFluidLayout({ ...base, currentTime: 2022 })
    .entities.find((entity) => entity.id === 'alpha');

  assert.ok(afterFirstMerge);
  assert.ok(secondTransitionStart);
  assert.ok(secondTransitionStart.r >= afterFirstMerge.r - 0.01);
});

test('fluid simulation grows generated merge targets instead of popping them in at full size', () => {
  const base = {
    width: 760,
    height: 420,
    fluidSimulation: { enabled: true, quality: 'balanced' },
    entities: [
      { id: 'pixel', industry: 'Media', value: 54, itemStyle: { color: '#a78bfa' } },
      { id: 'studio', industry: 'Media', value: 38, itemStyle: { color: '#fb7185' } }
    ],
    events: [
      { id: 'media-merge', time: 2023, type: 'merge', sources: ['pixel', 'studio'], targets: ['pixel-studio'], value: 92 }
    ],
    dropletStyle: { bridgeThreshold: 260 }
  };

  const beforeContact = resolveEvolutionFluidLayout({ ...base, currentTime: 2022.5 });
  const entering = resolveEvolutionFluidLayout({ ...base, currentTime: 2022.66 })
    .entities.find((entity) => entity.id === 'pixel-studio');
  const later = resolveEvolutionFluidLayout({ ...base, currentTime: 2022.82 })
    .entities.find((entity) => entity.id === 'pixel-studio');
  const complete = resolveEvolutionFluidLayout({ ...base, currentTime: 2023 })
    .entities.find((entity) => entity.id === 'pixel-studio');

  assert.equal(beforeContact.entities.some((entity) => entity.id === 'pixel-studio'), false);
  assert.ok(entering);
  assert.ok(later);
  assert.ok(complete);
  assert.ok(entering.r < later.r);
  assert.ok(later.r < complete.r);
  assert.ok(entering.opacity < complete.opacity);
});

test('fluid simulation lets generated merge targets emerge before sources start fusing', () => {
  const base = generatedMergeBaseOption();
  const beforeFusion = resolveEvolutionFluidLayout({ ...base, currentTime: 2022.62 });
  const beforeContact = resolveEvolutionFluidLayout({ ...base, currentTime: 2022.5 });
  const target = beforeFusion.entities.find((entity) => entity.id === 'pixel-studio');
  const pixel = beforeFusion.entities.find((entity) => entity.id === 'pixel');
  const initialPixel = beforeContact.entities.find((entity) => entity.id === 'pixel');

  assert.ok(target);
  assert.ok(target.r > 0);
  assert.ok(target.r < (resolveEvolutionFluidLayout({ ...base, currentTime: 2023 })
    .entities.find((entity) => entity.id === 'pixel-studio')?.r || 0));
  assert.ok(pixel);
  assert.ok(initialPixel);
  assert.ok(Math.abs(pixel.r - initialPixel.r) < 0.01);
  assert.ok(distance(pixel, initialPixel) < 0.01);
  assert.equal(beforeFusion.bridges.length, 0);
});

test('fluid simulation keeps later generated merge sources still until their source slot', () => {
  const base = generatedMergeBaseOption();
  const beforeContact = resolveEvolutionFluidLayout({ ...base, currentTime: 2022.5 });
  const firstSourceFusion = resolveEvolutionFluidLayout({ ...base, currentTime: 2022.74 });
  const initialStudio = beforeContact.entities.find((entity) => entity.id === 'studio');
  const studio = firstSourceFusion.entities.find((entity) => entity.id === 'studio');

  assert.ok(initialStudio);
  assert.ok(studio);
  assert.ok(Math.abs(studio.r - initialStudio.r) < 0.01);
  assert.ok(distance(studio, initialStudio) < 0.01);
});

test('fluid simulation keeps existing points stable when a generated target materializes', () => {
  const base = {
    width: 282,
    height: 378,
    fluidSimulation: { enabled: true, quality: 'balanced' },
    entities: [
      { id: 'pixel', industry: 'Media', value: 54, itemStyle: { color: '#a78bfa' } },
      { id: 'studio', industry: 'Media', value: 38, itemStyle: { color: '#fb7185' } },
      { id: 'stream', industry: 'Media', value: 32, itemStyle: { color: '#ec4899' } },
      { id: 'forge', industry: 'Media', value: 26, itemStyle: { color: '#84cc16' } }
    ],
    events: [
      { id: 'media-merge', time: 2023, type: 'merge', sources: ['pixel', 'studio'], targets: ['pixel-studio'], value: 92 }
    ],
    dropletStyle: { bridgeThreshold: 260 }
  };
  const beforeMaterialize = resolveEvolutionFluidLayout({ ...base, currentTime: 2022.16 });
  const afterMaterialize = resolveEvolutionFluidLayout({ ...base, currentTime: 2022.18 });

  ['studio', 'stream', 'forge'].forEach((id) => {
    const before = beforeMaterialize.entities.find((entity) => entity.id === id);
    const after = afterMaterialize.entities.find((entity) => entity.id === id);

    assert.ok(before);
    assert.ok(after);
    assert.ok(distance(before, after) < 0.01);
  });
});

test('fluid simulation does not hide inactive generated merge sources behind stale bridges', () => {
  const layout = resolveEvolutionFluidLayout({ ...generatedMergeBaseOption(), currentTime: 2022.78 });
  const bridge = layout.bridges[0];

  assert.ok(bridge);
  assert.ok(bridge.sourceIds.length <= 1);
  assert.notDeepEqual(bridge.sourceIds, ['pixel', 'studio']);
  assert.ok(layout.entities.some((entity) => entity.id === 'studio'));
});

test('fluid simulation eases generated merge sources into their movement slot', () => {
  const base = generatedMergeBaseOption();
  const samples = [2022.82, 2022.86, 2022.9, 2022.94, 2022.98]
    .map((currentTime) => resolveEvolutionFluidLayout({ ...base, currentTime })
      .entities.find((entity) => entity.id === 'studio'));

  assert.ok(samples.every(Boolean));
  const largestStep = samples.slice(1).reduce((largest, sample, index) => (
    Math.max(largest, distance(samples[index]!, sample!))
  ), 0);

  assert.ok(largestStep < 24);
});

test('fluid simulation keeps the final generated merge source shrinking until completion', () => {
  const layout = resolveEvolutionFluidLayout({ ...generatedMergeBaseOption(), currentTime: 2022.99 });
  const studio = layout.entities.find((entity) => entity.id === 'studio');

  assert.ok(studio);
  assert.ok(studio.r > 0);
  assert.ok(studio.r < (resolveEvolutionFluidLayout({ ...generatedMergeBaseOption(), currentTime: 2022.5 })
    .entities.find((entity) => entity.id === 'studio')?.r || 0));
  assert.ok((studio.opacity || 0) > 0);
});

test('fluid simulation completes all sources in a generated multi-source merge', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    fluidSimulation: { enabled: true, quality: 'balanced' },
    entities: [
      { id: 'pixel', industry: 'Media', value: 54, itemStyle: { color: '#a78bfa' } },
      { id: 'studio', industry: 'Media', value: 38, itemStyle: { color: '#fb7185' } }
    ],
    events: [
      { id: 'media-merge', time: 2023, type: 'merge', sources: ['pixel', 'studio'], targets: ['pixel-studio'], value: 92 }
    ],
    currentTime: 2023,
    dropletStyle: { bridgeThreshold: 260 }
  });

  assert.ok(layout.entities.some((entity) => entity.id === 'pixel-studio'));
  assert.equal(layout.entities.some((entity) => entity.id === 'pixel'), false);
  assert.equal(layout.entities.some((entity) => entity.id === 'studio'), false);
});

test('fluid simulation leaves detached split children as entities instead of bridge paths', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    fluidSimulation: { enabled: true, quality: 'balanced' },
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'spinOff', sources: ['alpha'], targets: ['beta'], value: 30 }
    ],
    currentTime: 2019.94,
    dropletStyle: { bridgeThreshold: 260 }
  });

  const alpha = layout.entities.find((entity) => entity.id === 'alpha');
  const beta = layout.entities.find((entity) => entity.id === 'beta');

  assert.ok(alpha);
  assert.ok(beta);
  assert.ok(Math.hypot(beta.x - alpha.x, beta.y - alpha.y) - alpha.r - beta.r > 0);
  assert.deepEqual(layout.bridges, []);
});

test('fluid simulation hides split children before their transition starts', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    fluidSimulation: { enabled: true, quality: 'balanced' },
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'spinOff', sources: ['alpha'], targets: ['beta'], value: 30 }
    ],
    currentTime: 2018.9,
    dropletStyle: { bridgeThreshold: 260 }
  });

  assert.ok(layout.entities.some((entity) => entity.id === 'alpha'));
  assert.equal(layout.entities.some((entity) => entity.id === 'beta'), false);
});

test('fluid simulation does not keep stale absorb blobs after completion', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    fluidSimulation: { enabled: true, quality: 'balanced' },
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 }
    ],
    currentTime: 2020.2,
    dropletStyle: { bridgeThreshold: 260 }
  });
  const alpha = layout.entities.find((entity) => entity.id === 'alpha');

  assert.deepEqual(layout.bridges, []);
  assert.ok(alpha);
  assert.ok(alpha.r > 14);
  assert.equal(layout.entities.some((entity) => entity.id === 'beta'), false);
});

test('fluid simulation does not keep stale split blobs after completion', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    fluidSimulation: { enabled: true, quality: 'balanced' },
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'spinOff', sources: ['alpha'], targets: ['beta'], value: 30 }
    ],
    currentTime: 2020.2,
    dropletStyle: { bridgeThreshold: 260 }
  });

  assert.deepEqual(layout.bridges, []);
  assert.ok(layout.entities.some((entity) => entity.id === 'alpha'));
  assert.ok(layout.entities.some((entity) => entity.id === 'beta'));
});

test('physical fluid simulation reports deterministic velocity during absorb approach', () => {
  const frame = resolveFluidRuntimeFrame([
    fluidTestEntity('alpha', 220, 120, 18, '#38bdf8'),
    fluidTestEntity('beta', 100, 120, 12, '#34d399')
  ], [{
    id: 'event-0',
    type: 'acquire',
    time: '2020',
    timeValue: 2020,
    order: 0,
    sourceIds: ['beta'],
    targetIds: ['alpha'],
    value: 30,
    raw: {}
  }], 2019.4, resolveFluidSimulationOptions({
    enabled: true,
    mode: 'physical',
    substeps: 8,
    damping: 0.7,
    surfaceTension: 0.55
  }));

  const beta = frame.particles.find((particle) => particle.id === 'beta');

  assert.ok(beta);
  assert.ok(beta.x > 100);
  assert.ok(beta.vx > 0);
  assert.equal(beta.vy, 0);
});

test('physical fluid simulation separates overlapping unrelated particles', () => {
  const frame = resolveFluidRuntimeFrame([
    fluidTestEntity('alpha', 100, 100, 20, '#38bdf8'),
    fluidTestEntity('beta', 112, 100, 18, '#34d399')
  ], [], 2019.4, resolveFluidSimulationOptions({
    enabled: true,
    mode: 'physical',
    substeps: 10,
    damping: 0.75,
    surfaceTension: 0.3
  }));
  const alpha = frame.particles.find((particle) => particle.id === 'alpha');
  const beta = frame.particles.find((particle) => particle.id === 'beta');

  assert.ok(alpha);
  assert.ok(beta);
  assert.ok(distance(alpha, beta) >= alpha.radius + beta.radius - 0.5);
  assert.notEqual(alpha.vx, 0);
  assert.notEqual(beta.vx, 0);
});

test('physical fluid simulation separates exactly overlapping particles deterministically', () => {
  const options = resolveFluidSimulationOptions({
    enabled: true,
    mode: 'physical',
    substeps: 10,
    damping: 0.75,
    surfaceTension: 0.3
  });
  const first = resolveFluidRuntimeFrame([
    fluidTestEntity('alpha', 100, 100, 20, '#38bdf8'),
    fluidTestEntity('beta', 100, 100, 18, '#34d399')
  ], [], 2019.4, options);
  const second = resolveFluidRuntimeFrame([
    fluidTestEntity('alpha', 100, 100, 20, '#38bdf8'),
    fluidTestEntity('beta', 100, 100, 18, '#34d399')
  ], [], 2019.4, options);
  const firstAlpha = first.particles.find((particle) => particle.id === 'alpha');
  const firstBeta = first.particles.find((particle) => particle.id === 'beta');
  const secondAlpha = second.particles.find((particle) => particle.id === 'alpha');
  const secondBeta = second.particles.find((particle) => particle.id === 'beta');

  assert.ok(firstAlpha);
  assert.ok(firstBeta);
  assert.ok(secondAlpha);
  assert.ok(secondBeta);
  assert.ok(distance(firstAlpha, firstBeta) >= firstAlpha.radius + firstBeta.radius - 0.5);
  assert.deepEqual(
    [firstAlpha.x, firstAlpha.y, firstAlpha.vx, firstAlpha.vy, firstBeta.x, firstBeta.y, firstBeta.vx, firstBeta.vy],
    [secondAlpha.x, secondAlpha.y, secondAlpha.vx, secondAlpha.vy, secondBeta.x, secondBeta.y, secondBeta.vx, secondBeta.vy]
  );
});

test('implicit fluid simulation separates overlapping unrelated particles', () => {
  const frame = resolveFluidRuntimeFrame([
    fluidTestEntity('alpha', 100, 100, 20, '#38bdf8'),
    fluidTestEntity('beta', 112, 100, 18, '#34d399')
  ], [], 2019.4, resolveFluidSimulationOptions({
    enabled: true,
    mode: 'implicit',
    substeps: 10,
    damping: 0.75,
    surfaceTension: 0.3
  }));
  const alpha = frame.particles.find((particle) => particle.id === 'alpha');
  const beta = frame.particles.find((particle) => particle.id === 'beta');

  assert.ok(alpha);
  assert.ok(beta);
  assert.ok(distance(alpha, beta) >= alpha.radius + beta.radius - 0.5);
});

test('layout collisionPadding leaves visible space between implicit fluid particles', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 360,
    height: 240,
    fluidSimulation: { enabled: true, mode: 'implicit', substeps: 14 },
    layout: { categoryGap: 1, collisionPadding: 12 },
    dropletStyle: { minRadius: 18, maxRadius: 20 },
    entities: [
      { id: 'alpha', industry: 'A', value: 100 },
      { id: 'beta', industry: 'B', value: 100 }
    ],
    events: [],
    currentTime: 190
  });
  const alpha = layout.entities.find((entity) => entity.id === 'alpha');
  const beta = layout.entities.find((entity) => entity.id === 'beta');

  assert.ok(alpha);
  assert.ok(beta);
  assert.ok(distance(alpha, beta) >= alpha.r + beta.r + 10);
});

test('precomputes fluid collision slots for future split targets', () => {
  const base = {
    width: 320,
    height: 240,
    categoryField: 'region',
    fluidSimulation: { enabled: true, mode: 'implicit', substeps: 16 },
    layout: { categoryGap: 1, collisionPadding: 28 },
    dropletStyle: { minRadius: 26, maxRadius: 26 },
    entities: [
      { id: 'han', region: 'A', value: 100 },
      { id: 'observer', region: 'B', value: 100 },
      { id: 'future', region: 'C', value: 100 }
    ],
    events: [
      { id: 'future-split', time: 200, type: 'spinOff', sources: ['han'], targets: ['future'], value: 100 }
    ]
  };
  const beforeFutureAppears = resolveEvolutionFluidLayout({ ...base, currentTime: 198.8 });
  const whileFutureAppears = resolveEvolutionFluidLayout({ ...base, currentTime: 199.8 });
  const beforeObserver = beforeFutureAppears.entities.find((entity) => entity.id === 'observer');
  const duringObserver = whileFutureAppears.entities.find((entity) => entity.id === 'observer');

  assert.ok(beforeObserver);
  assert.ok(duringObserver);
  assert.equal(beforeFutureAppears.entities.some((entity) => entity.id === 'future'), false);
  assert.equal(whileFutureAppears.entities.some((entity) => entity.id === 'future'), true);
  assert.deepEqual(
    [duringObserver.x, duringObserver.y],
    [beforeObserver.x, beforeObserver.y]
  );
});

test('completed fluid split releases children to their precomputed layout slots', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 640,
    height: 360,
    fluidSimulation: { enabled: true, mode: 'implicit', substeps: 10 },
    layout: { categoryGap: 260, collisionPadding: 10 },
    dropletStyle: { minRadius: 12, maxRadius: 12 },
    entities: [
      { id: 'parent', industry: 'A', value: 100 },
      { id: 'child', industry: 'B', value: 100 }
    ],
    events: [
      { id: 'split-child', time: 200, type: 'spinOff', sources: ['parent'], targets: ['child'], value: 100 }
    ],
    currentTime: 201
  });
  const parent = layout.entities.find((entity) => entity.id === 'parent');
  const child = layout.entities.find((entity) => entity.id === 'child');

  assert.ok(parent);
  assert.ok(child);
  assert.ok(distance(parent, child) > 180);
});

test('layout respects fixed entity coordinates before category placement', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 600,
    height: 400,
    entities: [
      { id: 'alpha', industry: 'A', value: 50, x: '20%', y: '50%' },
      { id: 'beta', industry: 'B', value: 50, coord: ['75%', '32%'] },
      { id: 'gamma', industry: 'C', value: 50, layout: { x: '85%', y: '68%' } }
    ],
    events: [],
    currentTime: null
  });

  assert.deepEqual(
    layout.entities.map((entity) => [entity.id, entity.x, entity.y]),
    [
      ['alpha', 120, 200],
      ['beta', 450, 128],
      ['gamma', 510, 272]
    ]
  );
});

test('layout parses fixed coordinates from numeric and string forms', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 600,
    height: 400,
    entities: [
      { id: 'numeric-absolute', industry: 'A', value: 50, x: 144, y: 180 },
      { id: 'numeric-normalized', industry: 'B', value: 50, fixedPosition: { x: 0.5, y: 0.25 } },
      { id: 'string-absolute', industry: 'C', value: 50, position: ['360', '220'] },
      { id: 'string-normalized', industry: 'D', value: 50, coord: ['0.25', '0.75'] },
      { id: 'invalid-fixed', industry: 'E', value: 50, x: 'bad', y: ' ' },
      { id: 'invalid-percent', industry: 'F', value: 50, coord: ['bad%', '50%'] }
    ],
    events: [],
    currentTime: null
  });
  const byId = new Map(layout.entities.map((entity) => [entity.id, entity]));

  assert.deepEqual([byId.get('numeric-absolute')?.x, byId.get('numeric-absolute')?.y], [144, 180]);
  assert.deepEqual([byId.get('numeric-normalized')?.x, byId.get('numeric-normalized')?.y], [300, 100]);
  assert.deepEqual([byId.get('string-absolute')?.x, byId.get('string-absolute')?.y], [360, 220]);
  assert.deepEqual([byId.get('string-normalized')?.x, byId.get('string-normalized')?.y], [150, 300]);
  assert.notDeepEqual([byId.get('invalid-fixed')?.x, byId.get('invalid-fixed')?.y], [0, 0]);
  assert.notDeepEqual([byId.get('invalid-percent')?.x, byId.get('invalid-percent')?.y], [0, 200]);
});

test('historical evolution demo keeps early warlord nodes dispersed', () => {
  const data = loadEvolutionFluidDemoData();
  const layout = resolveEvolutionFluidLayout({
    width: 900,
    height: 520,
    entities: data.entities,
    events: data.events,
    currentTime: 190.7,
    categoryField: 'region',
    fluidSimulation: {
      enabled: true,
      mode: 'implicit',
      quality: 'balanced',
      substeps: 14,
      areaConservation: true
    },
    dropletStyle: {
      opacity: 0.94,
      bridgeOpacity: 1,
      bridgeThreshold: 260,
      minRadius: 3.5,
      maxRadius: 18
    },
    layout: {
      center: ['50%', '43%'],
      categoryGap: 156,
      collisionPadding: 22
    },
    timeline: { show: true }
  });
  const earlyWarlordIds = [
    'dong-zhuo',
    'yuan-shao',
    'gongsun-zan',
    'gongsun-yuan',
    'yuan-shu',
    'ma-han',
    'liu-biao',
    'liu-zhang',
    'sun-wu',
    'liu-yao',
    'wang-lang',
    'shi-xie'
  ];
  const earlyWarlords = earlyWarlordIds.map((id) => layout.entities.find((entity) => entity.id === id));

  assert.equal(earlyWarlords.every(Boolean), true);
  earlyWarlords.forEach((left, leftIndex) => {
    earlyWarlords.slice(leftIndex + 1).forEach((right) => {
      assert.ok(left);
      assert.ok(right);
      assert.ok(distance(left, right) > 48, `${left.id} and ${right.id} should not be visually stacked`);
    });
  });
});

test('physical split release gives detached child an outward velocity', () => {
  const frame = resolveFluidRuntimeFrame([
    fluidTestEntity('alpha', 120, 120, 20, '#38bdf8'),
    fluidTestEntity('beta', 190, 120, 12, '#34d399')
  ], [{
    id: 'split-0',
    type: 'spinOff',
    time: '2020',
    timeValue: 2020,
    order: 0,
    sourceIds: ['alpha'],
    targetIds: ['beta'],
    value: 20,
    raw: {}
  }], 2019.94, resolveFluidSimulationOptions({
    enabled: true,
    mode: 'physical',
    substeps: 8,
    damping: 0.72,
    surfaceTension: 0.4
  }));
  const beta = frame.particles.find((particle) => particle.id === 'beta');

  assert.ok(beta);
  assert.ok(beta.x > 120);
  assert.ok(beta.vx > 0);
});

test('physical split release follows the child direction instead of a fixed east bias', () => {
  const frame = resolveFluidRuntimeFrame([
    fluidTestEntity('alpha', 120, 120, 20, '#38bdf8'),
    fluidTestEntity('beta', 50, 120, 12, '#34d399')
  ], [{
    id: 'split-0',
    type: 'spinOff',
    time: '2020',
    timeValue: 2020,
    order: 0,
    sourceIds: ['alpha'],
    targetIds: ['beta'],
    value: 20,
    raw: {}
  }], 2019.94, resolveFluidSimulationOptions({
    enabled: true,
    mode: 'physical',
    substeps: 8,
    damping: 0.72,
    surfaceTension: 0.4
  }));
  const beta = frame.particles.find((particle) => particle.id === 'beta');

  assert.ok(beta);
  assert.ok(beta.x < 120);
  assert.ok(beta.vx < 0);
});

test('physical split breakDistance delays detachment until the configured gap opens', () => {
  const baseEntities = [
    fluidTestEntity('alpha', 120, 120, 20, '#38bdf8'),
    fluidTestEntity('beta', 190, 120, 12, '#34d399')
  ];
  const splitEvents = [{
    id: 'split-0',
    type: 'spinOff',
    time: '2020',
    timeValue: 2020,
    order: 0,
    sourceIds: ['alpha'],
    targetIds: ['beta'],
    value: 20,
    raw: {}
  }];
  const defaultFrame = resolveFluidRuntimeFrame(baseEntities, splitEvents, 2019.9, resolveFluidSimulationOptions({
    enabled: true,
    mode: 'physical',
    substeps: 8,
    breakDistance: 0
  }));
  const delayedFrame = resolveFluidRuntimeFrame(baseEntities, splitEvents, 2019.9, resolveFluidSimulationOptions({
    enabled: true,
    mode: 'physical',
    substeps: 8,
    breakDistance: 24
  }));

  assert.equal(defaultFrame.groups[0]?.mode, 'detached');
  assert.equal(delayedFrame.groups[0]?.mode, 'splitting');
  assert.ok((delayedFrame.blobs[0]?.path.match(/\bM\b/g) || []).length <= 1);
});

test('fluid runtime returns identical geometry for repeated physical frames', () => {
  const entities = [
    fluidTestEntity('alpha', 220, 120, 18, '#38bdf8'),
    fluidTestEntity('beta', 100, 120, 12, '#34d399'),
    fluidTestEntity('gamma', 130, 122, 11, '#a78bfa')
  ];
  const events = [{
    id: 'event-0',
    type: 'acquire',
    time: '2020',
    timeValue: 2020,
    order: 0,
    sourceIds: ['beta'],
    targetIds: ['alpha'],
    value: 30,
    raw: {}
  }];
  const options = resolveFluidSimulationOptions({
    enabled: true,
    mode: 'physical',
    substeps: 8,
    damping: 0.72,
    surfaceTension: 0.45
  });

  const first = resolveFluidRuntimeFrame(entities, events, 2019.72, options);
  const second = resolveFluidRuntimeFrame(entities, events, 2019.72, options);

  assert.deepEqual(
    first.particles.map((particle) => [particle.id, particle.x, particle.y, particle.vx, particle.vy, particle.radius, particle.opacity]),
    second.particles.map((particle) => [particle.id, particle.x, particle.y, particle.vx, particle.vy, particle.radius, particle.opacity])
  );
  assert.deepEqual(
    first.blobs.map((blob) => [blob.id, blob.kind, blob.path, blob.color, blob.opacity]),
    second.blobs.map((blob) => [blob.id, blob.kind, blob.path, blob.color, blob.opacity])
  );
});

test('uses a single continuous blob outline during fusion', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 }
    ],
    currentTime: 2019.8,
    dropletStyle: { bridgeThreshold: 260 }
  });

  const bridge = layout.bridges[0];
  assert.match(bridge.path, /^M /);
  assert.ok(bridge.surfaceShape);
  assert.ok((bridge.path.match(/\sC\s/g) || []).length >= 8);
  assert.doesNotMatch(bridge.path, /\s[AQ]\s/);
});

test('keeps an exposed liquid neck before an absorbed source is swallowed', () => {
  const base = {
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 }
    ],
    dropletStyle: { bridgeThreshold: 260 }
  };
  const early = resolveEvolutionFluidLayout({ ...base, currentTime: 2019.75 });
  const mid = resolveEvolutionFluidLayout({ ...base, currentTime: 2019.8 });
  const earlyBridge = early.bridges[0];
  const midBridge = mid.bridges[0];
  const alpha = mid.entities.find((entity) => entity.id === 'alpha');
  const beta = mid.entities.find((entity) => entity.id === 'beta');

  assert.ok(earlyBridge?.surfaceShape);
  assert.ok(earlyBridge.surfaceShape.neck > Math.min(earlyBridge.surfaceShape.leftRadius, earlyBridge.surfaceShape.rightRadius) * 0.2);
  assert.ok(midBridge?.surfaceShape);
  assert.equal((midBridge.path.match(/\bM\b/g) || []).length, 3);
  assert.ok(alpha);
  assert.ok(beta);

  const centerDistance = distance(alpha, beta);
  const minRadius = Math.min(alpha.r, beta.r);
  const gap = centerDistance - alpha.r - beta.r;

  assert.ok(centerDistance > Math.abs(alpha.r - beta.r) + minRadius * 0.4);
  assert.ok(gap > -minRadius * 0.75);
});

test('keeps surface fusion stages while the absorbed source disappears', () => {
  const base = {
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 }
    ],
    dropletStyle: { bridgeThreshold: 260 }
  };
  const continuing = resolveEvolutionFluidLayout({ ...base, currentTime: 2019.75 }).bridges[0];
  const nearComplete = resolveEvolutionFluidLayout({ ...base, currentTime: 2019.97 }).bridges[0];
  const continuingBounds = pathBounds(continuing.path);
  const nearCompleteBounds = pathBounds(nearComplete.path);

  assert.ok(continuing);
  assert.ok(nearComplete);
  assert.ok(continuingBounds.width > continuingBounds.height * 1.2);
  assert.ok(Math.abs(nearCompleteBounds.width - nearCompleteBounds.height) < 1);
  assert.ok(nearCompleteBounds.width < continuingBounds.width);
  assert.equal((nearComplete.path.match(/\bM\b/g) || []).length, 1);
});

test('sequences simultaneous multi-source fusion into one active surface bridge', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 },
      { id: 'gamma', industry: 'AI', value: 58 },
      { id: 'delta', industry: 'AI', value: 54 }
    ],
    events: [
      { id: 'triple-acquire', time: 2020, type: 'acquire', sources: ['beta', 'gamma', 'delta'], targets: ['alpha'], value: 90 }
    ],
    currentTime: 2019.8,
    dropletStyle: { bridgeThreshold: 260 }
  });

  assert.equal(layout.bridges.length, 1);
  assert.equal(layout.bridges[0].sourceIds.length, 1);
  assert.ok(['beta', 'gamma', 'delta'].includes(layout.bridges[0].sourceIds[0]));
  assert.deepEqual(layout.bridges[0].targetIds, ['alpha']);
  assert.equal((layout.bridges[0].path.match(/\bM\b/g) || []).length, 3);
  assert.ok(layout.entities.some((entity) => entity.id === 'delta'));
});

test('fluid simulation sequences simultaneous multi-source fusion without color leaks', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    fluidSimulation: { enabled: true, quality: 'balanced' },
    entities: [
      { id: 'alpha', industry: 'AI', value: 120, itemStyle: { color: '#38bdf8' } },
      { id: 'beta', industry: 'AI', value: 60, itemStyle: { color: '#34d399' } },
      { id: 'gamma', industry: 'AI', value: 58, itemStyle: { color: '#a78bfa' } },
      { id: 'delta', industry: 'AI', value: 54, itemStyle: { color: '#f59e0b' } }
    ],
    events: [
      { id: 'triple-acquire', time: 2020, type: 'acquire', sources: ['beta', 'gamma', 'delta'], targets: ['alpha'], value: 90 }
    ],
    currentTime: 2019.8,
    dropletStyle: { bridgeThreshold: 260 }
  });

  assert.equal(layout.bridges.length, 1);
  assert.equal(layout.bridges[0].color, '#38bdf8');
  assert.deepEqual(layout.bridges[0].targetIds, ['alpha']);
  assert.equal(layout.bridges[0].sourceIds.length, 1);
  assert.ok(layout.entities.some((entity) => entity.id === 'gamma'));
  assert.ok(layout.entities.some((entity) => entity.id === 'delta'));
});

test('uses deterministic separated circles after split droplets detach', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 40 }
    ],
    events: [
      { time: 2020, type: 'spinOff', sources: ['alpha'], targets: ['beta'], value: 40 }
    ],
    currentTime: 2019.94,
    dropletStyle: { bridgeThreshold: 260 }
  });

  const bridge = layout.bridges[0];

  assert.ok(bridge);
  assert.equal((bridge.path.match(/\bM\b/g) || []).length, 2);
  assert.equal(bridge.surfaceShape, undefined);
  assert.ok((bridge.path.match(/\sC\s/g) || []).length <= 8);
  assert.doesNotMatch(bridge.path, /\s[AQ]\s/);
});

test('does not stretch a split bridge after the child droplet separates from the source', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'spinOff', sources: ['alpha'], targets: ['beta'], value: 30 }
    ],
    currentTime: 2019.94,
    dropletStyle: { bridgeThreshold: 260 }
  });

  const bridge = layout.bridges[0];
  const alpha = layout.entities.find((entity) => entity.id === 'alpha');
  const beta = layout.entities.find((entity) => entity.id === 'beta');

  assert.ok(bridge);
  assert.ok(alpha);
  assert.ok(beta);

  const centerDistance = distance(alpha, beta);
  const minRadius = Math.min(alpha.r, beta.r);
  const gap = centerDistance - alpha.r - beta.r;

  assert.ok(gap > minRadius);
  assert.equal((bridge.path.match(/\bM\b/g) || []).length, 2);
  assert.equal(bridge.surfaceShape, undefined);
});

test('detaches split droplets once a positive gap opens', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'spinOff', sources: ['alpha'], targets: ['beta'], value: 30 }
    ],
    currentTime: 2019.93,
    dropletStyle: { bridgeThreshold: 260 }
  });

  const bridge = layout.bridges[0];
  const alpha = layout.entities.find((entity) => entity.id === 'alpha');
  const beta = layout.entities.find((entity) => entity.id === 'beta');

  assert.ok(bridge);
  assert.ok(alpha);
  assert.ok(beta);

  const centerDistance = distance(alpha, beta);
  const gap = centerDistance - alpha.r - beta.r;

  assert.ok(gap > 0);
  assert.equal((bridge.path.match(/\bM\b/g) || []).length, 2);
  assert.equal(bridge.surfaceShape, undefined);
});

test('uses one smooth blob outline while a split child is still attached', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'spinOff', sources: ['alpha'], targets: ['beta'], value: 30 }
    ],
    currentTime: 2019.9,
    dropletStyle: { bridgeThreshold: 260 }
  });

  const bridge = layout.bridges[0];
  const alpha = layout.entities.find((entity) => entity.id === 'alpha');
  const beta = layout.entities.find((entity) => entity.id === 'beta');

  assert.ok(bridge);
  assert.ok(alpha);
  assert.ok(beta);

  const centerDistance = distance(alpha, beta);
  const gap = centerDistance - alpha.r - beta.r;

  assert.ok(gap < 0);
  assert.equal((bridge.path.match(/\bM\b/g) || []).length, 1);
});

test('surface mode reproduces the reference active-drop absorption stage', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 420,
    height: 300,
    currentTime: 250,
    surface: { enabled: true, seed: 1 },
    dropletStyle: { bridgeColor: '#ffffff' }
  });

  assert.equal(layout.events.length, 0);
  assert.equal(layout.timeline.show, false);
  assert.ok(layout.entities.length < 16);
  assert.equal(layout.entities.at(-1)?.id, '__surface_active');
  assert.ok(layout.entities.every((entity) => entity.color === '#ffffff'));
  assert.equal(layout.bridges.length, 1);
  assert.equal(layout.bridges[0].kind, 'surface');
  assert.equal(layout.entities.find((entity) => entity.id === '__surface_active')?.z2, 3);
  assert.ok(layout.entities.filter((entity) => entity.id !== '__surface_active').every((entity) => entity.z2 === 1));
  assert.equal(layout.bridges[0].surfaceShape?.bridgeLength, 38);
  assert.equal((layout.bridges[0].path.match(/\bM\b/g) || []).length, 3);
  assert.match(layout.bridges[0].path, /\sL\s/);
});

test('surface mode covers fallback shapes, null progress, and merge frames', () => {
  const fallback = resolveEvolutionFluidLayout({
    width: 420,
    height: 300,
    currentTime: null,
    surface: {
      enabled: true,
      activeStart: { x: 10, y: 10, r: 0 },
      targets: [{ x: 20, y: 20, r: 0 }],
      bridgeLength: 'bad'
    },
    dropletStyle: { color: '#123456', opacity: '0.6' },
    timeline: { show: true }
  });
  const merging = resolveEvolutionFluidLayout({
    width: 420,
    height: 300,
    currentTime: 700,
    surface: {
      enabled: true,
      activeStart: { x: 34, y: 260, r: 13 },
      targets: [{ x: 60, y: 260, r: 13 }],
      seed: 1
    },
    dropletStyle: { bridgeColor: '#ffffff' },
    timeline: { show: true }
  });

  assert.equal(fallback.progress, 0);
  assert.equal(fallback.entities.at(-1)?.x, 34);
  assert.equal(fallback.entities.length, 16);
  assert.equal(fallback.timeline.show, true);
  assert.equal(merging.bridges.length, 1);
  assert.ok((merging.bridges[0].surfaceShape?.rightRadius || 0) < 13);
  assert.ok(merging.entities.some((entity) => entity.id === '__surface_drop_0'));

  const finishing = resolveEvolutionFluidLayout({
    width: 420,
    height: 300,
    currentTime: 980,
    surface: {
      enabled: true,
      activeStart: { x: 34, y: 260, r: 13 },
      targets: [{ x: 60, y: 260, r: 13 }],
      seed: 1
    }
  });

  assert.equal(finishing.bridges.length, 0);
  assert.equal(finishing.entities.some((entity) => entity.id === '__surface_drop_0'), false);
});

function pathBounds(path: string): { width: number; height: number } {
  const values = Array.from(path.matchAll(/-?\d+(?:\.\d+)?/g), (match) => Number(match[0]));
  const xs: number[] = [];
  const ys: number[] = [];
  for (let index = 0; index < values.length - 1; index += 2) {
    xs.push(values[index]);
    ys.push(values[index + 1]);
  }
  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys)
  };
}

test('uses each entity as a scatter-sized point by default', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 },
      { id: 'gamma', industry: 'Cloud', value: 40 },
      { id: 'delta', industry: 'Media', value: 30 },
      { id: 'epsilon', industry: 'Media', value: 20 }
    ]
  });

  assert.equal(layout.entities.length, 5);
  assert.ok(layout.entities.every((entity) => entity.r <= 14));
  assert.ok(new Set(layout.entities.map((entity) => `${entity.x},${entity.y}`)).size > 3);
});

test('grows repeatedly absorbed targets by merged droplet area', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 90 },
      { id: 'gamma', industry: 'AI', value: 70 },
      { id: 'delta', industry: 'AI', value: 50 }
    ],
    events: [
      { time: 1, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 },
      { time: 2, type: 'acquire', sources: ['gamma'], targets: ['alpha'], value: 30 },
      { time: 3, type: 'acquire', sources: ['delta'], targets: ['alpha'], value: 30 }
    ],
    currentTime: 3
  });

  assert.deepEqual(layout.entities.map((entity) => entity.id), ['alpha']);
  assert.ok((layout.entities[0]?.r || 0) > 20);
});

test('moves split targets out from the source as individual points', () => {
  const base = {
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2020, type: 'spinOff', sources: ['alpha'], targets: ['beta'], value: 30 }
    ],
    dropletStyle: { bridgeThreshold: 260 }
  };
  const before = resolveEvolutionFluidLayout({ ...base, currentTime: 2019 });
  const separating = resolveEvolutionFluidLayout({ ...base, currentTime: 2019.94 });
  const complete = resolveEvolutionFluidLayout({ ...base, currentTime: 2020 });
  const distance = (layout: ReturnType<typeof resolveEvolutionFluidLayout>) => {
    const alpha = layout.entities.find((entity) => entity.id === 'alpha');
    const beta = layout.entities.find((entity) => entity.id === 'beta');
    return alpha && beta ? Math.hypot(beta.x - alpha.x, beta.y - alpha.y) : 0;
  };

  assert.ok(!before.entities.some((entity) => entity.id === 'beta'));
  assert.ok(separating.entities.some((entity) => entity.id === 'beta'));
  assert.ok(separating.bridges.length > 0);
  assert.ok(distance(complete) > distance(separating));
});

test('layout categoryGap and clustering options affect entity coordinates', () => {
  const baseOption = {
    width: 720,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 },
      { id: 'gamma', industry: 'Cloud', value: 80 },
      { id: 'delta', industry: 'Media', value: 40 }
    ]
  };

  const compact = resolveEvolutionFluidLayout({
    ...baseOption,
    layout: { clustering: 'category', categoryGap: 72 }
  });
  const spacious = resolveEvolutionFluidLayout({
    ...baseOption,
    layout: { clustering: 'category', categoryGap: 180 }
  });
  const unclustered = resolveEvolutionFluidLayout({
    ...baseOption,
    layout: { clustering: 'none', categoryGap: 180 }
  });

  assert.notDeepEqual(
    compact.entities.map((entity) => [entity.id, entity.x, entity.y]),
    spacious.entities.map((entity) => [entity.id, entity.x, entity.y])
  );
  assert.notDeepEqual(
    spacious.entities.map((entity) => [entity.id, entity.x, entity.y]),
    unclustered.entities.map((entity) => [entity.id, entity.x, entity.y])
  );
});

test('keeps a single-event timeline inactive before the first event', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 640,
    height: 360,
    entities: [{ id: 'alpha', industry: 'AI', value: 120 }],
    events: [{ time: 2020, type: 'found', targets: ['alpha'], value: 120 }],
    currentTime: 2019
  });

  assert.deepEqual(layout.events, []);
  assert.equal(layout.timeline.handleX, layout.timeline.startX);
  assert.deepEqual(layout.timeline.ticks.map((tick) => tick.active), [false]);
});

test('keeps earlier split targets visible and skips malformed bridge events', () => {
  const earlierTarget = resolveEvolutionFluidLayout({
    width: 640,
    height: 360,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 }
    ],
    events: [
      { time: 2019, type: 'found', targets: ['beta'], value: 60 },
      { time: 2021, type: 'spinOff', sources: ['alpha'], targets: ['beta'], value: 30 }
    ],
    currentTime: 2019.2
  });
  const emptySplitTarget = resolveEvolutionFluidLayout({
    width: 640,
    height: 360,
    entities: [{ id: 'alpha', industry: 'AI', value: 120 }],
    events: [{ time: 2020, type: 'spinOff', sources: ['alpha'], targets: [], value: 30 }],
    currentTime: 2019.8
  });
  const selfAbsorb = resolveEvolutionFluidLayout({
    width: 640,
    height: 360,
    entities: [{ id: 'alpha', industry: 'AI', value: 120 }],
    events: [{ time: 2020, type: 'acquire', sources: ['alpha'], targets: ['alpha'], value: 30 }],
    currentTime: 2019.8,
    dropletStyle: { bridgeThreshold: 260 }
  });

  assert.ok(earlierTarget.entities.some((entity) => entity.id === 'beta'));
  assert.deepEqual(emptySplitTarget.bridges, []);
  assert.deepEqual(selfAbsorb.bridges, []);
});

test('layout accepts numeric center percentages and string current times', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 640,
    height: 360,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'Cloud', value: 60 }
    ],
    events: [
      { time: '2020-01-01', type: 'found', targets: ['alpha'], value: 120 },
      { time: '2021-01-01', type: 'found', targets: ['beta'], value: 60 }
    ],
    currentTime: '2020-06-01',
    layout: { center: [75, 0.25], categoryGap: 80 },
    timeline: { bottom: 20 }
  });

  assert.ok(layout.progress > 0);
  assert.ok(layout.progress < 1);
  assert.ok(layout.entities.every((entity) => entity.y <= 160));
});

test('creates bridge layouts while an absorbing event is actively fusing', () => {
  const layout = resolveEvolutionFluidLayout({
    width: 760,
    height: 420,
    entities: [
      { id: 'alpha', industry: 'AI', value: 120 },
      { id: 'beta', industry: 'AI', value: 60 },
      { id: 'gamma', industry: 'Cloud', value: 40 },
      { id: 'delta', industry: 'Media', value: 30 }
    ],
    events: [
      { time: 1, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 30 },
      { time: 2, type: 'merge', sources: ['alpha', 'gamma'], targets: ['alpha-gamma'], value: 80 },
      { time: 3, type: 'split', sources: ['alpha-gamma'], targets: ['delta'], value: 20 },
      { time: 4, type: 'partnership', sources: ['delta'], targets: ['alpha-gamma'], value: 10 }
    ],
    currentTime: 3.85,
    dropletStyle: { bridgeThreshold: 240 }
  });

  assert.ok(layout.progress > 0.8);
  assert.ok(layout.bridges.length > 0);
  assert.ok(layout.bridges.every((bridge) => bridge.path.startsWith('M ')));
  assert.ok(layout.bridges.some((bridge) => bridge.id.includes('partnership')));
});

test('echarts model exposes tooltip positions and remove cleanup for data input', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 360,
    height: 240
  });
  try {
    chart.setOption({
      animation: false,
      series: [{
        type: 'evolutionFluid',
        data: [
          { id: 'alpha', name: 'Alpha', industry: 'AI', value: 120 },
          { id: 'beta', name: 'Beta', industry: 'AI', value: 80 }
        ],
        events: [],
        label: { show: false }
      }]
    });
    const model = (chart as unknown as {
      getModel(): {
        getSeriesByIndex(index: number): {
          getTooltipPosition(dataIndex: number): unknown;
        };
      };
    }).getModel();
    const series = model.getSeriesByIndex(0);

    assert.equal(series.getTooltipPosition(0), undefined);
    (series as unknown as {
      getData(): {
        setItemLayout(dataIndex: number, layout: [number, number]): void;
      };
    }).getData().setItemLayout(0, [12, 34]);
    assert.deepEqual(series.getTooltipPosition(0), [12, 34]);
    assert.equal(series.getTooltipPosition(99), undefined);

    chart.clear();
    chart.setOption({
      series: [{
        type: 'evolutionFluid',
        label: { show: false }
      }]
    });
    assert.match(chart.renderToSVGString(), /svg/);
  } finally {
    chart.dispose();
  }
});

test('echarts rendering covers label overlap fallback and formatter variants', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 220,
    height: 160
  });
  try {
    chart.setOption({
      animation: false,
      series: [{
        type: 'evolutionFluid',
        width: 220,
        height: 160,
        entities: Array.from({ length: 8 }, (_, index) => ({
          id: `label-${index}`,
          name: `VeryLongOverlappingLabel${index}`,
          industry: 'Dense',
          value: 80 - index
        })),
        events: [],
        timeline: { show: false },
        label: {
          show: true,
          formatter: false,
          fontSize: 42
        }
      }]
    });
    const fallbackSvg = chart.renderToSVGString();

    chart.setOption({
      series: [{
        type: 'evolutionFluid',
        width: 220,
        height: 160,
        entities: [{ id: 'fn', name: 'Fn', industry: 'Dense', value: 80 }],
        events: [],
        timeline: { show: false },
        label: {
          show: true,
          formatter: ({ name }: { name: string }) => `fn-${name}`
        }
      }]
    }, true);
    const functionSvg = chart.renderToSVGString();

    assert.match(fallbackSvg, /VeryLongOverlappingLabel/);
    assert.match(functionSvg, /fn-Fn/);
  } finally {
    chart.dispose();
  }
});

test('renders droplets, bridge paths, entity labels, and timeline in SVG without event markers', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 720,
    height: 420
  });
  chart.setOption({
    animation: false,
    series: [{
      type: 'evolutionFluid',
      width: 720,
      height: 420,
      entities: [
        { id: 'alpha', name: 'Alpha', industry: 'AI', value: 120, itemStyle: { color: '#38bdf8' } },
        { id: 'beta', name: 'Beta', industry: 'AI', value: 80, itemStyle: { color: '#34d399' } }
      ],
      events: [
        { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 42 }
      ],
      currentTime: 2019.94,
      dropletStyle: { bridgeThreshold: 260 },
      timeline: { show: false },
      label: { show: true }
    }]
  });

  const svg = chart.renderToSVGString();
  assert.match(svg, /Alpha/);
  assert.doesNotMatch(svg, /acquire/);
  assert.match(svg, /<path/);
  assert.match(svg, /<path[^>]+fill="[^"]+"[^>]+fill-opacity=/);
  chart.dispose();
});

test('renders detached split bridges through the generic path fallback', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 720,
    height: 420
  });
  try {
    chart.setOption({
      animation: false,
      series: [{
        type: 'evolutionFluid',
        width: 720,
        height: 420,
        entities: [
          { id: 'alpha', name: 'Alpha', industry: 'AI', value: 120 },
          { id: 'beta', name: 'Beta', industry: 'AI', value: 60 }
        ],
        events: [
          { time: 2020, type: 'spinOff', sources: ['alpha'], targets: ['beta'], value: 42 }
        ],
        currentTime: 2019.94,
        dropletStyle: { bridgeThreshold: 260 },
        timeline: { show: false },
        label: { show: false }
      }]
    });

    const svg = chart.renderToSVGString();

    assert.match(svg, /<path/);
    assert.doesNotMatch(svg, /\b(?:NaN|Infinity|-Infinity)\b/);
  } finally {
    chart.dispose();
  }
});

test('renders surface-mode fusion through the package-owned waterdrop shape', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 720,
    height: 420
  });

  try {
    chart.setOption({
      animation: false,
      series: [{
        type: 'evolutionFluid',
        width: 720,
        height: 420,
        currentTime: 250,
        surface: { enabled: true, seed: 1 },
        dropletStyle: { bridgeColor: '#ffffff' },
        label: { show: false }
      }]
    });

    const svg = chart.renderToSVGString();

    assert.match(svg, /<path/);
    assert.match(svg, /fill="#ffffff"/);
  } finally {
    chart.dispose();
  }
});

test('uses immediate update animation for timeline-driven playback', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 720,
    height: 420
  });
  chart.setOption({
    series: [{
      type: 'evolutionFluid',
      width: 720,
      height: 420,
      entities: [
        { id: 'alpha', name: 'Alpha', industry: 'AI', value: 120 },
        { id: 'beta', name: 'Beta', industry: 'AI', value: 80 }
      ],
      events: [
        { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 42 }
      ],
      currentTime: 2019.94,
      timeline: { show: false },
      label: { show: false }
    }]
  });

  assert.equal(chart.getOption().series[0].animationDurationUpdate, 0);
  chart.dispose();
});

test('renders split fusion as one waterdrop path instead of separate circles and bridge', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 720,
    height: 420
  });
  chart.setOption({
    animation: false,
    series: [{
      type: 'evolutionFluid',
      width: 720,
      height: 420,
      entities: [
        { id: 'alpha', name: 'Alpha', industry: 'AI', value: 120, itemStyle: { color: '#38bdf8' } },
        { id: 'beta', name: 'Beta', industry: 'AI', value: 60, itemStyle: { color: '#34d399' } }
      ],
      events: [
        { time: 2020, type: 'spinOff', sources: ['alpha'], targets: ['beta'], value: 42 }
      ],
      currentTime: 2019.8,
      dropletStyle: { bridgeThreshold: 260 },
      timeline: { show: false },
      label: { show: false }
    }]
  });

  const svg = chart.renderToSVGString();
  assert.match(svg, /<path/);
  assert.match(svg, /<path[^>]+fill="[^"]+"/);
  chart.dispose();
});

test('renders opt-in fluid simulation as deterministic SVG paths', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 720,
    height: 420
  });
  chart.setOption({
    animation: false,
    series: [{
      type: 'evolutionFluid',
      width: 720,
      height: 420,
      fluidSimulation: { enabled: true, quality: 'fast' },
      entities: [
        { id: 'alpha', name: 'Alpha', industry: 'AI', value: 120, itemStyle: { color: '#38bdf8' } },
        { id: 'beta', name: 'Beta', industry: 'AI', value: 80, itemStyle: { color: '#34d399' } }
      ],
      events: [
        { time: 2020, type: 'acquire', sources: ['beta'], targets: ['alpha'], value: 42 }
      ],
      currentTime: 2019.82,
      timeline: { show: false },
      label: { show: false }
    }]
  });

  const svg = chart.renderToSVGString();
  assert.match(svg, /<path/);
  assert.doesNotMatch(svg, /\b(?:NaN|Infinity|-Infinity)\b/);
  assert.match(svg, /<path[^>]+fill="[^"]+"/);
  chart.dispose();
});

test('renders absorbing source with its own color during fluid fusion', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 720,
    height: 420
  });
  chart.setOption({
    animation: false,
    series: [{
      type: 'evolutionFluid',
      width: 720,
      height: 420,
      fluidSimulation: { enabled: true, quality: 'fast' },
      entities: [
        { id: 'source', name: 'Source', industry: 'Edge', value: 80, itemStyle: { color: '#22d3ee' } },
        { id: 'target', name: 'Target', industry: 'Core', value: 120, itemStyle: { color: '#111827' } }
      ],
      events: [
        { time: 2020, type: 'acquire', sources: ['source'], targets: ['target'], value: 80 }
      ],
      currentTime: 2019.82,
      timeline: { show: false },
      label: { show: false }
    }]
  });

  const svg = chart.renderToSVGString();
  assert.match(svg, /fill="#22d3ee"/);
  assert.match(svg, /fill="#111827"/);
  assert.equal((svg.match(/fill="#22d3ee"/g) || []).length, 1);
  assert.ok((svg.match(/fill="#111827"/g) || []).length >= 2);
  const fusionFills = [...svg.matchAll(/fill="(#[0-9a-fA-F]{6})"/g)]
    .map((match) => match[1])
    .filter((color) => color === '#22d3ee' || color === '#111827');
  assert.equal(fusionFills.at(-1), '#22d3ee');
  assert.doesNotMatch(svg, /fill="#22d3ee" fill-opacity="0\.82"/);
  chart.dispose();
});

test('fluid render model keeps a waterdrop bridge when implicit contours split', () => {
  const bridges = fluidFrameToBridges({
    particles: [
      {
        id: 'target',
        entityId: 'target',
        kind: 'entity',
        x: 360,
        y: 180,
        vx: 0,
        vy: 0,
        radius: 72,
        targetRadius: 72,
        mass: 72 ** 2,
        color: '#111827',
        opacity: 1,
        active: true,
        groupId: 'fluid-group:late-acquire'
      },
      {
        id: 'source',
        entityId: 'source',
        kind: 'entity',
        x: 210,
        y: 180,
        vx: 0,
        vy: 0,
        radius: 32,
        targetRadius: 32,
        mass: 32 ** 2,
        color: '#22d3ee',
        opacity: 1,
        active: true,
        groupId: 'fluid-group:late-acquire'
      }
    ],
    groups: [],
    blobs: [{
      id: 'fluid:absorb:late-acquire',
      groupId: 'fluid-group:late-acquire',
      particleIds: ['target', 'source'],
      sourceIds: ['source'],
      targetIds: ['target'],
      kind: 'absorb',
      path: 'M 1 1 C 2 2 3 3 4 4 Z M 5 5 C 6 6 7 7 8 8 Z',
      color: '#111827',
      opacity: 1,
      z2: 3
    }]
  });

  assert.equal(bridges.length, 1);
  assert.ok(bridges[0].surfaceShape);
  assert.equal((bridges[0].surfaceShape as { bridgeOnly?: boolean }).bridgeOnly, true);
  assert.equal(bridges[0].surfaceShape.leftRadius, 32);
  assert.equal(bridges[0].surfaceShape.rightRadius, 72);
  assert.equal(bridges[0].surfaceShape.width, 254);
  assert.equal(bridges[0].surfaceShape.x0, 210);
  assert.equal(bridges[0].surfaceShape.x1, 360);
});

test('fluid render model covers missing particles and bridge fallback ids', () => {
  const baseEntities = [
    fluidTestEntity('alpha', 10, 20, 8, '#38bdf8'),
    fluidTestEntity('beta', 30, 20, 6, '#34d399')
  ];
  const entities = fluidFrameToEntities(baseEntities, {
    particles: [{
      id: 'alpha-particle',
      entityId: 'alpha',
      kind: 'entity',
      x: 11.1234,
      y: 20.5678,
      vx: 0,
      vy: 0,
      radius: 0,
      targetRadius: 8,
      mass: 64,
      color: '#111827',
      opacity: 1,
      active: true,
      groupId: 'alpha'
    }],
    groups: [],
    blobs: []
  });
  const bridges = fluidFrameToBridges({
    particles: [],
    groups: [],
    blobs: [{
      id: 'surface',
      groupId: 'surface',
      particleIds: ['fallback-particle'],
      sourceIds: [],
      targetIds: [],
      kind: 'surface',
      path: 'M 0 0 C 1 1 2 2 3 3 Z',
      color: '#38bdf8',
      opacity: 0.5,
      z2: 2
    }, {
      id: 'missing-target',
      groupId: 'missing-target',
      particleIds: ['source-only'],
      sourceIds: ['source-only'],
      targetIds: ['target-missing'],
      kind: 'absorb',
      path: 'M 0 0 C 1 1 2 2 3 3 Z',
      color: '#38bdf8',
      opacity: 0.5,
      z2: 3
    }]
  });

  assert.deepEqual(entities.map((entity) => entity.id), ['beta']);
  assert.equal(bridges[0].sourceId, 'fallback-particle');
  assert.equal(bridges[0].targetId, 'fallback-particle');
  assert.equal(bridges[0].surfaceShape, undefined);
  assert.equal(bridges[1].surfaceShape, undefined);

  const emptyIds = fluidFrameToBridges({
    particles: [],
    groups: [],
    blobs: [{
      id: 'empty',
      groupId: 'empty',
      particleIds: [],
      sourceIds: [],
      targetIds: [],
      kind: 'surface',
      path: 'M 0 0 C 1 1 2 2 3 3 Z',
      color: '#38bdf8',
      opacity: 0.5,
      z2: 2
    }]
  });

  assert.equal(emptyIds[0].sourceId, '');
  assert.equal(emptyIds[0].targetId, '');
});

test('fluid runtime handles missing intent references, generated pending particles, and overlap directions', () => {
  const missing = resolveFluidRuntimeFrame([
    fluidTestEntity('alpha', 100, 100, 20, '#38bdf8')
  ], [{
    id: 'missing-absorb',
    type: 'acquire',
    time: '2020',
    timeValue: 2020,
    order: 0,
    sourceIds: ['missing-source'],
    targetIds: ['alpha'],
    value: 20,
    raw: {}
  }, {
    id: 'missing-split',
    type: 'spinOff',
    time: '2021',
    timeValue: 2021,
    order: 1,
    sourceIds: ['alpha'],
    targetIds: ['missing-child'],
    value: 20,
    raw: {}
  }], 2019.9, resolveFluidSimulationOptions({ enabled: true }));
  const missingSplit = resolveFluidRuntimeFrame([
    fluidTestEntity('alpha', 100, 100, 20, '#38bdf8')
  ], [{
    id: 'missing-split',
    type: 'spinOff',
    time: '2021',
    timeValue: 2021,
    order: 0,
    sourceIds: ['alpha'],
    targetIds: ['missing-child'],
    value: 20,
    raw: {}
  }], 2020.6, resolveFluidSimulationOptions({ enabled: true }));
  const generatedFuture = resolveFluidRuntimeFrame([{
    ...fluidTestEntity('source', 100, 100, 20, '#38bdf8'),
    raw: { id: 'source' }
  }, {
    ...fluidTestEntity('generated', 140, 100, 20, '#34d399'),
    raw: { id: 'generated', generated: true }
  }], [{
    id: 'future',
    type: 'merge',
    time: '2020',
    timeValue: 2020,
    order: 0,
    sourceIds: ['source'],
    targetIds: ['generated'],
    value: 20,
    raw: {}
  }], 2018.9, resolveFluidSimulationOptions({ enabled: true }));
  const overlappingSplit = resolveFluidRuntimeFrame([
    fluidTestEntity('parent', 100, 100, 20, '#38bdf8'),
    fluidTestEntity('child', 100, 100, 12, '#34d399')
  ], [{
    id: 'overlap-split',
    type: 'spinOff',
    time: '2020',
    timeValue: 2020,
    order: 0,
    sourceIds: ['parent'],
    targetIds: ['child'],
    value: 20,
    raw: {}
  }], 2019.9, resolveFluidSimulationOptions({ enabled: true, mode: 'physical', breakDistance: 100 }));
  const nullTime = resolveFluidRuntimeFrame([
    fluidTestEntity('parent', 100, 100, 20, '#38bdf8'),
    fluidTestEntity('child', 130, 100, 12, '#34d399')
  ], [{
    id: 'null-time-split',
    type: 'spinOff',
    time: '2020',
    timeValue: 2020,
    order: 0,
    sourceIds: ['parent'],
    targetIds: ['child'],
    value: 20,
    raw: {}
  }], null, resolveFluidSimulationOptions({ enabled: true }));
  const customIntent = resolveFluidRuntimeFrame([
    fluidTestEntity('left', 100, 100, 20, '#38bdf8'),
    fluidTestEntity('right', 130, 100, 12, '#34d399')
  ], [{
    id: 'custom',
    type: 'partnership',
    time: '2020',
    timeValue: 2020,
    order: 0,
    sourceIds: ['left'],
    targetIds: ['right'],
    value: 20,
    raw: {}
  }], 2019.8, resolveFluidSimulationOptions({ enabled: true }));
  const overlappingAbsorb = resolveFluidRuntimeFrame([
    fluidTestEntity('target', 100, 100, 20, '#38bdf8'),
    fluidTestEntity('source', 100, 100, 12, '#34d399')
  ], [{
    id: 'overlap-absorb',
    type: 'acquire',
    time: '2020',
    timeValue: 2020,
    order: 0,
    sourceIds: ['source'],
    targetIds: ['target'],
    value: 20,
    raw: {}
  }], 2019.8, resolveFluidSimulationOptions({ enabled: true }));
  const zeroRadiusSource = resolveFluidRuntimeFrame([
    fluidTestEntity('target', 100, 100, 20, '#38bdf8'),
    fluidTestEntity('source', 122, 100, 0, '#34d399')
  ], [{
    id: 'zero-radius',
    type: 'acquire',
    time: '2020',
    timeValue: 2020,
    order: 0,
    sourceIds: ['source'],
    targetIds: ['target'],
    value: 20,
    raw: {}
  }], 2019.8, resolveFluidSimulationOptions({ enabled: true }));

  assert.deepEqual(missing.groups, []);
  assert.deepEqual(missingSplit.groups, []);
  assert.equal(generatedFuture.particles.find((particle) => particle.id === 'generated')?.active, false);
  assert.ok((overlappingSplit.particles.find((particle) => particle.id === 'child')?.x || 0) > 100);
  assert.equal(nullTime.groups.length, 0);
  assert.deepEqual(customIntent.groups, []);
  assert.ok((overlappingAbsorb.particles.find((particle) => particle.id === 'source')?.x || 0) > 100);
  assert.equal(zeroRadiusSource.groups.length, 1);
});

test('implicit surface traces balanced connected blobs for close particles', () => {
  const particles = [
    {
      id: 'left',
      entityId: 'left',
      kind: 'entity' as const,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 12,
      targetRadius: 12,
      mass: 144,
      color: '#38bdf8',
      opacity: 1,
      active: true,
      groupId: 'fallback'
    },
    {
      id: 'right',
      entityId: 'right',
      kind: 'entity' as const,
      x: 36,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 12,
      targetRadius: 12,
      mass: 144,
      color: '#34d399',
      opacity: 1,
      active: true,
      groupId: 'fallback'
    }
  ];
  const blobs = createImplicitSurfaceBlobs(particles, [{
    id: 'fallback',
    particleIds: ['left', 'right'],
    mode: 'fusing',
    colorPolicy: 'mixed'
  }], {
    sourceIds: ['left'],
    targetIds: ['right'],
    kind: 'absorb',
    color: '#38bdf8',
    opacity: 0.8,
    surfaceThreshold: 10_000,
    quality: 'balanced'
  });
  const smoothBlobs = createImplicitSurfaceBlobs(particles, [{
    id: 'smooth',
    particleIds: ['left', 'right'],
    mode: 'fusing',
    colorPolicy: 'mixed'
  }], {
    sourceIds: ['left'],
    targetIds: ['right'],
    kind: 'absorb',
    color: '#38bdf8',
    opacity: 0.8,
    surfaceThreshold: 1,
    quality: 'smooth'
  });

  assert.equal(blobs.length, 1);
  assert.equal((blobs[0].path.match(/\bM\b/g) || []).length, 1);
  assert.equal(smoothBlobs.length, 1);
  assert.ok((smoothBlobs[0].path.match(/\sC\s/g) || []).length > (blobs[0].path.match(/\sC\s/g) || []).length);
});

function fluidTestEntity(id: string, x: number, y: number, r: number, color: string) {
  return {
    id,
    name: id,
    category: 'test',
    value: r * r,
    x,
    y,
    r,
    opacity: 1,
    color,
    active: true,
    dataIndex: 0,
    raw: { id }
  };
}

function generatedMergeBaseOption() {
  return {
    width: 760,
    height: 420,
    fluidSimulation: { enabled: true, quality: 'balanced' },
    entities: [
      { id: 'pixel', industry: 'Media', value: 54, itemStyle: { color: '#a78bfa' } },
      { id: 'studio', industry: 'Media', value: 38, itemStyle: { color: '#fb7185' } }
    ],
    events: [
      { id: 'media-merge', time: 2023, type: 'merge', sources: ['pixel', 'studio'], targets: ['pixel-studio'], value: 92 }
    ],
    dropletStyle: { bridgeThreshold: 260 }
  };
}

function loadEvolutionFluidDemoData(): { entities: unknown[]; events: unknown[] } {
  const window = {} as {
    EChartsExtensionExamples?: {
      data?: {
        evolutionFluid?: {
          entities?: unknown[];
          events?: unknown[];
        };
      };
    };
  };
  runInNewContext(
    readFileSync(new URL('../../../docs/shared/demo-data.js', import.meta.url), 'utf8'),
    { window }
  );
  return {
    entities: window.EChartsExtensionExamples?.data?.evolutionFluid?.entities || [],
    events: window.EChartsExtensionExamples?.data?.evolutionFluid?.events || []
  };
}

function distance(left: { x: number; y: number }, right: { x: number; y: number }): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}
