import assert from 'node:assert/strict';
import { test } from 'vitest';

import * as echarts from 'echarts/lib/echarts';
import { SVGRenderer } from 'echarts/renderers';
import {
  fisheyeTransform,
  installFisheyeController,
  resolveFisheyeOptions,
  setFisheyeGraphicIgnore,
  setFisheyeGraphicShape,
  setFisheyeGraphicStyle
} from '@echarts-extension/layout-core';
import {
  __test__ as fisheyeInternals
} from '../packages/echarts-layout-core/src/fisheye.ts';

import '@echarts-extension/fisheye';

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

test('layout-core fisheye options and utility fallbacks cover disabled and invalid inputs', () => {
  const viewport = { x: 0, y: 0, width: 120, height: 80 };

  assert.equal(resolveFisheyeOptions(false, viewport), null);
  assert.equal(resolveFisheyeOptions({ show: false }, viewport), null);
  assert.equal(resolveFisheyeOptions({ enabled: false }, viewport), null);

  const defaults = {
    radius: 20,
    scale: 1.5,
    labelScale: 1.2,
    stroke: '#111',
    strokeWidth: 4,
    opacity: 0.5,
    preview: true
  };
  const invalid = resolveFisheyeOptions({
    radius: 'bad%',
    scale: 0.2,
    labelScale: 0,
    borderColor: '#f00',
    borderWidth: -3,
    opacity: 2
  }, viewport, defaults);
  assert.deepEqual(invalid, {
    radius: 20,
    scale: 1,
    labelScale: 1,
    stroke: '#f00',
    strokeWidth: 0,
    opacity: 1,
    preview: true
  });

  const percent = resolveFisheyeOptions({
    radius: '50%',
    magnification: 3,
    stroke: '#222',
    strokeWidth: 5,
    opacity: -1,
    preview: true
  }, viewport);
  assert.equal(percent.radius, 40);
  assert.equal(percent.scale, 3);
  assert.equal(percent.opacity, 0);
  assert.equal(percent.preview, true);

  assert.deepEqual(fisheyeTransform([100, 100], percent, [0, 0]), {
    x: 100,
    y: 100,
    scale: 1,
    influence: 0
  });
  assert.equal(fisheyeInternals.resolveFisheyeNumber('25%', 1, 200), 50);
  assert.equal(fisheyeInternals.resolveFisheyeNumber('oops%', 7, 200), 7);
  assert.equal(fisheyeInternals.finiteNumber(Infinity, 9), 9);
  assert.deepEqual(fisheyeInternals.asRecord(['not-record']), {});
});

test('layout-core fisheye controller covers preview, event, reset, and dispose guards', () => {
  const viewport = { x: 0, y: 0, width: 200, height: 160 };
  const fisheye = {
    radius: 80,
    scale: 2,
    labelScale: 1.2,
    stroke: '#333',
    strokeWidth: 2,
    opacity: 0.8,
    preview: true
  };

  assert.equal(installFisheyeController({ zrender: null, viewport, fisheye }), undefined);
  assert.equal(installFisheyeController({ zrender: new FakeZRender([]), viewport, fisheye: null }), undefined);

  const lens = new FakeLens();
  const visible = new FakeElement({ x: 90, y: 70, width: 20, height: 20 });
  const ignored = new FakeElement({ x: 10, y: 10, width: 10, height: 10 });
  ignored.ignore = true;
  const invisible = new FakeElement({ x: 20, y: 20, width: 10, height: 10 });
  invisible.invisible = true;
  const excludedParent = { skipFisheye: true };
  const excludedChild = new FakeElement({ x: 40, y: 40, width: 10, height: 10 });
  excludedChild.parent = excludedParent;
  const invalidRect = new FakeElement(null);

  let applyCount = 0;
  let resetCount = 0;
  const zr = new FakeZRender([]);
  const controller = installFisheyeController({
    zrender: zr,
    viewport,
    fisheye,
    lens,
    targetElements: () => [null, lens, ignored, invisible, excludedChild, invalidRect, visible],
    excludeElement: (element) => element.skipFisheye === true,
    onApply: () => {
      applyCount += 1;
    },
    onReset: () => {
      resetCount += 1;
    }
  });

  assert.ok(controller);
  assert.equal(applyCount, 1);
  assert.equal(lens.ignore, false);
  assert.ok(visible.scaleX > 1);
  assert.equal(ignored.scaleX, 1);
  assert.equal(invisible.scaleX, 1);
  assert.equal(excludedChild.scaleX, 1);

  zr.emit('mousemove', { zrX: 250, zrY: 250 });
  assert.equal(resetCount, 1);
  assert.equal(visible.scaleX, 1);
  zr.emit('mousemove', {});
  controller.reset();
  assert.equal(resetCount, 1);

  zr.emit('mousemove', { zrX: 90, zrY: 80 });
  assert.equal(applyCount, 2);
  assert.ok(visible.scaleX > 1);
  controller.dispose();
  assert.equal(resetCount, 2);
  assert.equal(zr.handlers.size, 0);
  controller.apply([100, 90]);
  controller.reset();
  controller.dispose();
  assert.equal(applyCount, 2);
});

test('layout-core fisheye private helpers cover graphic setters and geometry guards', () => {
  const shapeSetter = {
    shape: { old: true },
    setShape(shape) {
      this.shape = shape;
    }
  };
  setFisheyeGraphicShape(shapeSetter, { cx: 1 });
  assert.deepEqual(shapeSetter.shape, { old: true, cx: 1 });

  const shapeAttr = {
    shape: { old: true },
    attr(key, value) {
      this[key] = value;
    }
  };
  setFisheyeGraphicShape(shapeAttr, { cy: 2 });
  assert.deepEqual(shapeAttr.shape, { old: true, cy: 2 });

  const shapePlain = { shape: null };
  setFisheyeGraphicShape(shapePlain, { r: 3 });
  assert.deepEqual(shapePlain.shape, { r: 3 });

  const styleSetter = {
    style: { old: true },
    setStyle(style) {
      this.style = style;
    }
  };
  setFisheyeGraphicStyle(styleSetter, { opacity: 0.5 });
  assert.deepEqual(styleSetter.style, { old: true, opacity: 0.5 });

  const styleAttr = {
    style: { old: true },
    attr(key, value) {
      this[key] = value;
    }
  };
  setFisheyeGraphicStyle(styleAttr, { stroke: '#000' });
  assert.deepEqual(styleAttr.style, { old: true, stroke: '#000' });

  const stylePlain = { style: null };
  setFisheyeGraphicStyle(stylePlain, { fill: '#fff' });
  assert.deepEqual(stylePlain.style, { fill: '#fff' });

  const ignoreAttr = {
    attr(key, value) {
      this[key] = value;
    }
  };
  setFisheyeGraphicIgnore(ignoreAttr, true);
  assert.equal(ignoreAttr.ignore, true);
  const ignorePlain = {};
  setFisheyeGraphicIgnore(ignorePlain, true);
  assert.equal(ignorePlain.ignore, true);

  assert.deepEqual(fisheyeInternals.resolveTargetElements({
    zrender: { storage: { getDisplayList: () => [shapePlain] } }
  }), [shapePlain]);
  assert.deepEqual(fisheyeInternals.resolveTargetElements({ zrender: {} }), []);
  assert.equal(fisheyeInternals.shouldSkipElement(ignorePlain, { lens: null }), true);
  assert.equal(fisheyeInternals.shouldSkipElement({ parent: { skip: true } }, {
    lens: null,
    excludeElement: (element) => element.skip === true
  }), true);

  const baselines = new Map();
  const bounded = {
    x: 5,
    y: 6,
    scaleX: Number.NaN,
    scaleY: 2,
    originX: Number.NaN,
    originY: 7,
    getPaintRect: () => null,
    getBoundingRect: () => ({ x: 10, y: 20, width: 30, height: 40 })
  };
  const baseline = fisheyeInternals.resolveTargetBaseline(bounded, baselines);
  assert.equal(fisheyeInternals.resolveTargetBaseline(bounded, baselines), baseline);
  assert.deepEqual(baseline.center, [25, 40]);
  assert.equal(baseline.scaleX, 1);
  assert.equal(baseline.originX, undefined);
  assert.equal(baseline.originY, 7);
  assert.equal(fisheyeInternals.resolveTargetBaseline({ getPaintRect: () => null }, new Map()), null);

  const target = {
    originX: 1,
    originY: 2,
    dirtyCount: 0,
    dirty() {
      this.dirtyCount += 1;
    }
  };
  fisheyeInternals.setFisheyeElementTransform(target, {
    x: 1,
    y: 2,
    scaleX: 3,
    scaleY: 4,
    originX: undefined,
    originY: 9
  });
  assert.equal(target.originX, undefined);
  assert.equal(target.originY, 9);
  assert.equal(target.dirtyCount, 1);

  const targetAttr = {
    attr(patch) {
      this.patch = patch;
    }
  };
  fisheyeInternals.setFisheyeElementTransform(targetAttr, {
    x: 1,
    y: 2,
    scaleX: 3,
    scaleY: 4,
    originX: 5,
    originY: undefined
  });
  assert.equal(targetAttr.patch.originX, 5);
  assert.equal('originY' in targetAttr.patch, false);

  const lens = {};
  fisheyeInternals.updateFisheyeLens(null, { radius: 1, stroke: '#000', strokeWidth: 1, opacity: 1 }, [1, 2], false);
  fisheyeInternals.updateFisheyeLens(lens, { radius: 9, stroke: '#000', strokeWidth: 2, opacity: 0.7 }, [3, 4], false);
  assert.deepEqual(lens.shape, { cx: 3, cy: 4, r: 9 });
  assert.equal(lens.style.opacity, 0.7);
  fisheyeInternals.updateFisheyeLens(lens, { radius: 9, stroke: '#000', strokeWidth: 2, opacity: 0.7 }, null, true);
  assert.equal(lens.ignore, true);

  assert.equal(fisheyeInternals.readElementRect({}), null);
  assert.equal(fisheyeInternals.readElementRect({ getPaintRect: () => ({ x: NaN, y: 0, width: 1, height: 1 }) }), null);
  assert.equal(fisheyeInternals.readElementRect({ getPaintRect: () => ({ x: 0, y: 0, width: 0, height: 0 }) }), null);
  assert.deepEqual(fisheyeInternals.eventPoint({ zrX: 4, zrY: 5 }), [4, 5]);
  assert.equal(fisheyeInternals.eventPoint({ offsetX: NaN, zrX: NaN }), null);
  assert.equal(fisheyeInternals.pointInRect([2, 2], { x: 0, y: 0, width: 4, height: 4 }), true);
  assert.equal(fisheyeInternals.pointInRect([-1, 2], { x: 0, y: 0, width: 4, height: 4 }), false);
});
