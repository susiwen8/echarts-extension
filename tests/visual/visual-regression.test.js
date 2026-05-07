import assert from 'node:assert/strict';
import { test } from 'vitest';

import {
  actualPath,
  flameActualPath,
  flameSnapshotPath,
  lollipopActualPath,
  lollipopSnapshotPath,
  mosaicActualPath,
  mosaicSnapshotPath,
  radialAreaActualPath,
  radialAreaSnapshotPath,
  radialBoxplotActualPath,
  radialBoxplotSnapshotPath,
  readSnapshot,
  renderFixture,
  renderFlameFixture,
  renderLollipopFixture,
  renderMosaicFixture,
  renderNestedCircleFixture,
  renderRadialAreaFixture,
  renderRadialBoxplotFixture,
  renderSunriseSunsetFixture,
  renderSubwayFixture,
  renderVennFixture,
  nestedCircleActualPath,
  nestedCircleSnapshotPath,
  snapshotPath,
  sunriseSunsetActualPath,
  sunriseSunsetSnapshotPath,
  subwayActualPath,
  subwaySnapshotPath,
  vennActualPath,
  vennSnapshotPath,
  writeActual,
  writeSnapshot
} from './render-fixture.js';

const cases = [
  {
    actualPath,
    name: 'Graph layouts',
    render: renderFixture,
    snapshotPath
  },
  {
    actualPath: radialAreaActualPath,
    name: 'Radial area',
    render: renderRadialAreaFixture,
    snapshotPath: radialAreaSnapshotPath
  },
  {
    actualPath: radialBoxplotActualPath,
    name: 'Radial boxplot',
    render: renderRadialBoxplotFixture,
    snapshotPath: radialBoxplotSnapshotPath
  },
  {
    actualPath: vennActualPath,
    name: 'Venn',
    render: renderVennFixture,
    snapshotPath: vennSnapshotPath
  },
  {
    actualPath: nestedCircleActualPath,
    name: 'Nested circle',
    render: renderNestedCircleFixture,
    snapshotPath: nestedCircleSnapshotPath
  },
  {
    actualPath: mosaicActualPath,
    name: 'Mosaic',
    render: renderMosaicFixture,
    snapshotPath: mosaicSnapshotPath
  },
  {
    actualPath: subwayActualPath,
    name: 'Subway',
    render: renderSubwayFixture,
    snapshotPath: subwaySnapshotPath
  },
  {
    actualPath: flameActualPath,
    name: 'Flame',
    render: renderFlameFixture,
    snapshotPath: flameSnapshotPath
  },
  {
    actualPath: sunriseSunsetActualPath,
    name: 'Sunrise sunset',
    render: renderSunriseSunsetFixture,
    snapshotPath: sunriseSunsetSnapshotPath
  },
  {
    actualPath: lollipopActualPath,
    name: 'Lollipop',
    render: renderLollipopFixture,
    snapshotPath: lollipopSnapshotPath
  }
];

test('SVG visual baselines match rendered fixtures', async () => {
  if (process.env.UPDATE_VISUAL_SNAPSHOTS === '1') {
    for (const visualCase of cases) {
      await writeSnapshot(visualCase.render(), visualCase.snapshotPath);
      console.log(`Updated visual baseline: ${visualCase.snapshotPath}`);
    }
    return;
  }

  for (const visualCase of cases) {
    const actual = visualCase.render();
    let expected;
    try {
      expected = await readSnapshot(visualCase.snapshotPath);
    } catch (error) {
      await writeActual(actual, visualCase.actualPath);
      throw new Error(
        `Missing visual baseline at ${visualCase.snapshotPath}. Run npm run test:visual:update to create it. Actual SVG written to ${visualCase.actualPath}.`
      );
    }

    if (actual !== expected) {
      await writeActual(actual, visualCase.actualPath);
    }

    assert.equal(
      actual,
      expected,
      `${visualCase.name} visual SVG changed. Actual SVG written to ${visualCase.actualPath}.`
    );
    console.log(`Visual baseline matched: ${visualCase.snapshotPath}`);
  }
});
