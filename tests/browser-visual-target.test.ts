import assert from 'node:assert/strict';
import { test } from 'vitest';

import { resolveScreenshotSelector } from './browser-visual/visual-target.ts';

test('browser visual diffs target chart regions instead of surrounding controls', () => {
  assert.equal(
    resolveScreenshotSelector({
      name: 'standard-chart',
      readySelector: '#chart canvas, #chart svg',
      screenshotSelector: 'main'
    }),
    '#chart'
  );
  assert.equal(
    resolveScreenshotSelector({
      name: 'layout-gallery',
      readySelector: '.layout-card svg',
      screenshotSelector: 'main'
    }),
    '.layout-card__visual'
  );
  assert.equal(
    resolveScreenshotSelector({
      name: 'custom-target',
      chartSelector: '.chart-only'
    }),
    '.chart-only'
  );
});
