import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import {
  layoutSunriseSunset,
  resolveSunriseSunsetLayout
} from '../src/layout.ts';

const referenceTimes = {
  sunrise: '05:12',
  sunset: '18:39',
  moonrise: '22:08',
  moonset: '07:59',
  currentTime: '2026-05-05 10:46:33',
  updatedAt: '10:46'
};

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
});

test('computes deterministic day and moon arcs from reference event times', () => {
  const first = layoutSunriseSunset(referenceTimes, {
    width: 1200,
    height: 760,
    padding: 96
  });
  const second = layoutSunriseSunset(referenceTimes, {
    width: 1200,
    height: 760,
    padding: 96
  });

  assert.deepEqual(first, second);
  assert.equal(first.title, '距离日落还剩');
  assert.equal(first.remainingText, '07:52:27');
  assert.equal(first.updatedText, '更新于10:46');
  assert.equal(first.events.sunrise.label, '05:12');
  assert.equal(first.events.sunset.label, '18:39');
  assert.equal(first.events.moonrise.label, '22:08');
  assert.equal(first.events.moonset.label, '07:59');

  assert.equal(Math.round(first.day.progress * 1000), 415);
  assert.equal(Math.round(first.day.current.x), 514);
  assert.ok(first.day.current.y < first.baselineY - 260, 'sun point is on the upper day arc');
  assert.ok(first.day.solidPath.startsWith('M '), 'solid day path is emitted');
  assert.ok(first.day.dashedPath.includes('L'), 'future day path is emitted');
  assert.ok(first.day.areaPath.endsWith(' Z'), 'progress fill is closed to the baseline');
  assert.deepEqual(first.day.motionPoints[0], first.day.start);
  assert.deepEqual(first.day.motionPoints.at(-1), first.day.current);
  assert.ok(first.day.motionPoints.length > 6, 'sun icon has enough points to move along the arc');
  assert.ok(
    first.day.motionPoints[Math.floor(first.day.motionPoints.length / 2)].y < first.baselineY,
    'sun icon motion follows the curved arc instead of a flat baseline'
  );

  assert.equal(first.moon.wraps, true);
  assert.equal(Math.round(first.moon.durationMinutes), 591);
  assert.ok(first.moon.start.x > first.day.start.x, 'moonrise anchor is inside the day arc');
  assert.ok(first.moon.end.x < first.day.end.x, 'moonset anchor is inside the day arc');
  assert.deepEqual(first.moon.motionPoints[0], first.moon.start);
  assert.deepEqual(first.moon.motionPoints.at(-1), first.moon.current);
});

test('targets the next sunrise outside daylight', () => {
  const result = resolveSunriseSunsetLayout({
    sunrise: '05:12',
    sunset: '18:39',
    moonrise: '22:08',
    moonset: '07:59',
    currentTime: '2026-05-05 23:20:00',
    width: 900,
    height: 560
  });

  assert.equal(result.title, '距离日出还剩');
  assert.equal(result.remainingText, '05:52:00');
  assert.equal(result.day.progress, 1);
  assert.equal(result.moon.visible, true);
  assert.ok(result.moon.current.x > result.moon.start.x);
});

test('allows explicit countdown and title text for static screenshots', () => {
  const result = resolveSunriseSunsetLayout({
    ...referenceTimes,
    title: '距离日落还剩',
    remainingText: '07:51:27',
    updatedText: '更新于10:46',
    width: 1200,
    height: 760
  });

  assert.equal(result.title, '距离日落还剩');
  assert.equal(result.remainingText, '07:51:27');
  assert.equal(result.updatedText, '更新于10:46');
});
