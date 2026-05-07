import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import {
  layoutSpiral,
  normalizeSpiralData,
  resolveSpiralLayout
} from '../lib/src/layout.js';

const sampleData = [
  { name: 'Acquire', value: 34 },
  { name: 'Activate', value: 55 },
  { name: 'Retain', value: 21 },
  { name: 'Refer', value: 13 },
  { name: 'Revenue', value: 8 }
];

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
});

test('does not render or expose a spiral guide line', () => {
  const source = readFileSync(new URL('../src/spiral.ts', import.meta.url), 'utf8');
  const types = readFileSync(new URL('../index.d.ts', import.meta.url), 'utf8');
  const demoRunner = readFileSync(new URL('../../../examples/shared/demo-runner.js', import.meta.url), 'utf8');

  assert.equal(source.includes('createGuideLineElement'), false);
  assert.equal(source.includes('showLine'), false);
  assert.equal(types.includes('showLine'), false);
  assert.equal(demoRunner.includes('Spiral line'), false);
});

test('demo uses a one-by-one spiral-path enter stagger instead of ring-like burst timing', () => {
  const source = readFileSync(new URL('../src/spiral.ts', import.meta.url), 'utf8');
  const demoRunner = readFileSync(new URL('../../../examples/shared/demo-runner.js', import.meta.url), 'utf8');

  assert.equal(source.includes('resolveEnterAnimation(seriesModel, segment.animationOrder)'), true);
  assert.equal(source.includes("seriesModel.get(['enterAnimation', 'replayKey'])"), true);
  assert.equal(demoRunner.includes('chart.clear();'), false);
  assert.match(demoRunner, /onReplay\(\) \{[\s\S]*replayKey \+= 1;[\s\S]*render\(\{ replayKey \}\);/);
  assert.equal(demoRunner.includes('enterAnimation.replayKey'), true);
  assert.match(
    demoRunner,
    /spiral: \{[\s\S]*rangeControl\('enterDuration', 'Enter duration', 'series\.0\.enterAnimation\.duration', 180, 80, 1200, 20\)/
  );
  assert.match(
    demoRunner,
    /spiral: \{[\s\S]*rangeControl\('enterStagger', 'Enter stagger', 'series\.0\.enterAnimation\.stagger', 80, 0, 240, 5\)/
  );
  assert.match(demoRunner, /spiral: \{[\s\S]*enterAnimation: \{ duration: 180, stagger: 80, easing: 'cubicOut' \}/);
});

test('normalizes object and tuple rows into named spiral data points', () => {
  const points = normalizeSpiralData([
    { stage: 'Alpha', score: 42 },
    ['Beta', 18],
    { name: 'Bad', score: 'missing' }
  ], {
    nameField: 'stage',
    valueField: 'score',
    dimensions: ['label', 'amount']
  });

  assert.equal(points.length, 2);
  assert.deepEqual(points.map((point) => point.name), ['Alpha', 'Beta']);
  assert.deepEqual(points.map((point) => point.value), [42, 18]);
  assert.deepEqual(points.map((point) => point.dataIndex), [0, 1]);
});

test('lays out values as deterministic clockwise segments on one spiral path', () => {
  const first = layoutSpiral(sampleData, {
    width: 360,
    height: 300,
    padding: 30,
    turns: 2,
    innerRadius: 48,
    outerRadius: 132,
    radialGap: 8,
    gapAngle: 4,
    startAngle: 0,
    clockwise: true,
    valueField: 'value'
  });
  const second = layoutSpiral(sampleData, {
    width: 360,
    height: 300,
    padding: 30,
    turns: 2,
    innerRadius: 48,
    outerRadius: 132,
    radialGap: 8,
    gapAngle: 4,
    startAngle: 0,
    clockwise: true,
    valueField: 'value'
  });

  assert.deepEqual(first, second);
  assert.equal(first.segments.length, 5);
  assert.deepEqual(first.valueExtent, { min: 8, max: 55 });
  assert.equal(first.centerX, 180);
  assert.equal(first.centerY, 150);
  assert.equal(first.innerRadius, 48);
  assert.equal(first.outerRadius, 132);
  assert.equal(first.turnCount, 2);
  assert.equal(first.segmentsPerTurn, 3);
  assert.equal(first.bandWidth, 22.666667);

  const [firstSegment, secondSegment, thirdSegment, fourthSegment, fifthSegment] = first.segments;
  assert.equal(firstSegment.name, 'Acquire');
  assert.equal(firstSegment.turnIndex, 0);
  assert.equal(firstSegment.segmentIndex, 0);
  assert.equal(firstSegment.animationOrder, 0);
  assert.equal(firstSegment.innerRadius, 53.150367);
  assert.equal(firstSegment.outerRadius, 75.750249);
  assert.equal(firstSegment.startInnerRadius, 48.217207);
  assert.equal(firstSegment.endInnerRadius, 58.085232);
  assert.equal(firstSegment.startAngleDegree, 2);
  assert.equal(firstSegment.endAngleDegree, 118);
  assert.equal(Number(firstSegment.valueRatio.toFixed(3)), 0.553);
  assert.match(firstSegment.path, /^M /);
  assert.equal(firstSegment.path.includes(' A '), false);

  assert.equal(secondSegment.segmentIndex, 1);
  assert.equal(secondSegment.animationOrder, 1);
  assert.equal(secondSegment.startAngleDegree, 122);
  assert.equal(secondSegment.endAngleDegree, 238);
  assert.ok(secondSegment.innerRadius > firstSegment.innerRadius);
  assert.equal(thirdSegment.segmentIndex, 2);
  assert.equal(thirdSegment.animationOrder, 2);
  assert.equal(thirdSegment.startAngleDegree, 242);
  assert.equal(thirdSegment.endAngleDegree, 358);
  assert.ok(thirdSegment.innerRadius > secondSegment.innerRadius);
  assert.equal(fourthSegment.turnIndex, 1);
  assert.equal(fourthSegment.animationOrder, 3);
  assert.ok(fourthSegment.innerRadius > thirdSegment.innerRadius);
  assert.equal(fifthSegment.turnIndex, 1);
  assert.equal(fifthSegment.animationOrder, 4);
  assert.ok(fifthSegment.path.endsWith('Z'));
});

test('resolves series-style options, explicit radii, sorting, and counterclockwise direction', () => {
  const layout = resolveSpiralLayout({
    data: sampleData,
    width: 420,
    height: 320,
    layoutOptions: {
      padding: 20,
      turns: 1.5
    },
    innerRadius: 24,
    outerRadius: 116,
    radialGap: 6,
    gapAngle: 3,
    startAngle: 90,
    clockwise: false,
    sort: 'desc',
    min: 0,
    max: 60
  });

  assert.equal(layout.turns, 1.5);
  assert.equal(layout.turnCount, 2);
  assert.equal(layout.innerRadius, 24);
  assert.equal(layout.outerRadius, 116);
  assert.deepEqual(layout.segments.map((segment) => segment.name), [
    'Activate',
    'Acquire',
    'Retain',
    'Refer',
    'Revenue'
  ]);
  assert.ok(
    layout.segments[1].startAngleDegree < layout.segments[0].startAngleDegree,
    'counterclockwise segments decrease angle'
  );
  layout.segments.forEach((segment) => {
    assert.ok(segment.x >= 94 && segment.x <= 326, `${segment.name} x bound`);
    assert.ok(segment.y >= 44 && segment.y <= 276, `${segment.name} y bound`);
    assert.ok(segment.valueRatio >= 0 && segment.valueRatio <= 1, `${segment.name} value ratio`);
  });
});
