import assert from 'node:assert/strict';
import { test } from 'vitest';

import { normalizeSvgForComparison } from './svg-normalize.ts';

test('normalizes machine precision SVG float jitter', () => {
  const actual = '<text x="664.2012336852368" y="-0.0000000000001" fill-opacity="0.41159999999999997">Label</text>';
  const expected = '<text x="664.201233685237" y="0" fill-opacity="0.4116">Label</text>';

  assert.equal(normalizeSvgForComparison(actual), normalizeSvgForComparison(expected));
});

test('keeps meaningful SVG float differences visible', () => {
  const actual = '<text x="664.2012336852368">Label</text>';
  const expected = '<text x="664.2012336859">Label</text>';

  assert.notEqual(normalizeSvgForComparison(actual), normalizeSvgForComparison(expected));
});
