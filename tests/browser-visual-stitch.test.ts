import assert from 'node:assert/strict';
import { test } from 'vitest';
import { PNG } from 'pngjs';

import { stitchPngs } from './browser-visual/screenshot-stitch.ts';

test('stitches multiple visual target screenshots without bounding-box gap pixels', () => {
  const red = solidPng(2, 1, 255, 0, 0);
  const blue = solidPng(2, 1, 0, 0, 255);
  const green = solidPng(2, 1, 0, 255, 0);

  const stitched = stitchPngs([red, blue, green], {
    columns: 2,
    gap: 1
  });

  assert.equal(stitched.width, 5);
  assert.equal(stitched.height, 3);
  assert.deepEqual(readPixel(stitched, 0, 0), [255, 0, 0, 255]);
  assert.deepEqual(readPixel(stitched, 3, 0), [0, 0, 255, 255]);
  assert.deepEqual(readPixel(stitched, 0, 2), [0, 255, 0, 255]);
  assert.deepEqual(readPixel(stitched, 2, 0), [255, 255, 255, 255]);
  assert.deepEqual(readPixel(stitched, 0, 1), [255, 255, 255, 255]);
});

function solidPng(width, height, red, green, blue) {
  const image = new PNG({ width, height });
  for (let index = 0; index < image.data.length; index += 4) {
    image.data[index] = red;
    image.data[index + 1] = green;
    image.data[index + 2] = blue;
    image.data[index + 3] = 255;
  }
  return image;
}

function readPixel(image, x, y) {
  const index = (y * image.width + x) * 4;
  return [
    image.data[index],
    image.data[index + 1],
    image.data[index + 2],
    image.data[index + 3]
  ];
}
