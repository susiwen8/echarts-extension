import { PNG } from 'pngjs';

export function stitchPngs(images, options = {}) {
  if (!Array.isArray(images) || images.length === 0) {
    throw new Error('Cannot stitch an empty screenshot list');
  }

  const gap = Math.max(0, Math.floor(options.gap ?? 16));
  const columns = Math.max(1, Math.min(images.length, Math.floor(options.columns ?? images.length)));
  const rows = Math.ceil(images.length / columns);
  const cellWidth = Math.max(...images.map((image) => image.width));
  const cellHeight = Math.max(...images.map((image) => image.height));
  const width = columns * cellWidth + (columns - 1) * gap;
  const height = rows * cellHeight + (rows - 1) * gap;
  const stitched = new PNG({ width, height });

  fillPng(stitched, 255, 255, 255, 255);

  images.forEach((image, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = column * (cellWidth + gap);
    const y = row * (cellHeight + gap);
    copyPng(image, stitched, x, y);
  });

  return stitched;
}

function fillPng(image, red, green, blue, alpha) {
  for (let index = 0; index < image.data.length; index += 4) {
    image.data[index] = red;
    image.data[index + 1] = green;
    image.data[index + 2] = blue;
    image.data[index + 3] = alpha;
  }
}

function copyPng(source, target, offsetX, offsetY) {
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const sourceIndex = (y * source.width + x) * 4;
      const targetIndex = ((offsetY + y) * target.width + offsetX + x) * 4;
      target.data[targetIndex] = source.data[sourceIndex];
      target.data[targetIndex + 1] = source.data[sourceIndex + 1];
      target.data[targetIndex + 2] = source.data[sourceIndex + 2];
      target.data[targetIndex + 3] = source.data[sourceIndex + 3];
    }
  }
}
