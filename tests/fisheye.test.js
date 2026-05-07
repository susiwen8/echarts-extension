import assert from 'node:assert/strict';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import { SVGRenderer } from 'echarts/renderers';
import {
  installFisheyeController,
  resolveFisheyeOptions
} from '@echarts-extension/layout-core';

import 'echarts-fisheye';

echarts.use([SVGRenderer]);

class FakeElement {
  constructor(rect) {
    this.rect = rect;
    this.x = 0;
    this.y = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.originX = 0;
    this.originY = 0;
    this.ignore = false;
  }

  getPaintRect() {
    return this.rect;
  }

  attr(keyOrObj, value) {
    if (typeof keyOrObj === 'string') {
      this[keyOrObj] = value;
      return;
    }
    Object.assign(this, keyOrObj);
  }
}

class FakeLens {
  constructor() {
    this.shape = {};
    this.style = {};
    this.ignore = true;
  }

  attr(key, value) {
    this[key] = value;
  }
}

class FakeZRender {
  constructor(elements) {
    this.elements = elements;
    this.handlers = new Map();
    this.refreshCount = 0;
    this.storage = {
      getDisplayList: () => this.elements
    };
  }

  on(eventName, handler) {
    this.handlers.set(eventName, handler);
  }

  off(eventName, handler) {
    if (this.handlers.get(eventName) === handler) this.handlers.delete(eventName);
  }

  refresh() {
    this.refreshCount += 1;
  }

  emit(eventName, event = {}) {
    this.handlers.get(eventName)?.(event);
  }
}

test('generic fisheye controller magnifies and resets arbitrary display elements', () => {
  const element = new FakeElement({ x: 130, y: 90, width: 20, height: 20 });
  const lens = new FakeLens();
  const zr = new FakeZRender([element, lens]);
  const options = resolveFisheyeOptions({ show: true, radius: 100, scale: 3 }, {
    x: 0,
    y: 0,
    width: 300,
    height: 200
  });

  const controller = installFisheyeController({
    zrender: zr,
    viewport: { x: 0, y: 0, width: 300, height: 200 },
    lens,
    fisheye: options
  });

  assert.ok(controller);
  zr.emit('mousemove', { offsetX: 100, offsetY: 100 });

  assert.equal(lens.ignore, false);
  assert.deepEqual(lens.shape, { cx: 100, cy: 100, r: 100 });
  assert.ok(element.scaleX > 1);
  assert.ok(element.scaleY > 1);
  assert.ok(element.x > 0);
  assert.ok(zr.refreshCount > 0);

  zr.emit('globalout');

  assert.equal(lens.ignore, true);
  assert.equal(element.x, 0);
  assert.equal(element.y, 0);
  assert.equal(element.scaleX, 1);
  assert.equal(element.scaleY, 1);

  controller.dispose();
  assert.equal(zr.handlers.size, 0);
});

test('echarts-fisheye registers a top-level option component', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 320,
    height: 240
  });

  chart.setOption({
    fisheye: {
      show: true,
      radius: 90,
      scale: 2.4
    }
  });

  assert.ok(chart.getModel().getComponent('fisheye'));

  chart.dispose();
});
