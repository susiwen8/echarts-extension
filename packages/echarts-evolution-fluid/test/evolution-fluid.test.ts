import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import { SVGRenderer } from 'echarts/renderers';

import '../index.ts';
import { resolveEvolutionFluidLayout } from '../src/layout.ts';
import {
  createMetaballBridgePath,
  createSplitEnvelopePath,
  createWaterdropSurfacePath,
  createWaterdropSurfaceShape
} from '../src/metaball.ts';
import { hasValidPath, resolveFluidSimulationOptions } from '../src/fluid-state.ts';
import { createFluidIntents } from '../src/fluid-events.ts';
import { createImplicitSurfaceBlobs } from '../src/implicit-surface.ts';
import { resolveFluidRuntimeFrame } from '../src/fluid-solver.ts';

echarts.use([SVGRenderer]);

test('does not add visualization runtime dependencies', () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

  assert.equal(packageJson.dependencies?.d3, undefined);
  assert.equal(packageJson.dependencies?.['matter-js'], undefined);
  assert.equal(packageJson.dependencies?.['pixi.js'], undefined);
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

test('creates a sampled metaball contour between nearby droplets', () => {
  const path = createMetaballBridgePath({ x: 0, y: 0, r: 20 }, { x: 42, y: 0, r: 16 }, { maxDistance: 100 });

  assert.match(path, /^M /);
  assert.ok((path.match(/\sC\s/g) || []).length >= 8);
  assert.doesNotMatch(path, /\s[AQL]\s/);
  assert.equal(createMetaballBridgePath({ x: 0, y: 0, r: 20 }, { x: 60, y: 0, r: 16 }, { maxDistance: 100 }), '');
  assert.equal(createMetaballBridgePath({ x: 0, y: 0, r: 20 }, { x: 5, y: 0, r: 16 }, { maxDistance: 100 }), '');
});

test('uses waterdrop fusion geometry while split droplets overlap', () => {
  const path = createSplitEnvelopePath({ x: 0, y: 0, r: 24 }, { x: 26, y: 0, r: 12 }, { releaseProgress: 0 });

  assert.match(path, /^M /);
  assert.match(path, /\sL\s/);
  assert.doesNotMatch(path, /\s[AQ]\s/);
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
  assert.equal(layout.bridges[0].sourceIds.length, 3);
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

function distance(left: { x: number; y: number }, right: { x: number; y: number }): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}
