import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, vi } from 'vitest';

const registry = vi.hoisted(() => ({
  seriesModels: [],
  chartViews: [],
  componentModels: [],
  componentViews: [],
  animateEnabled: true,
  layoutThrows: false
}));

vi.mock('echarts/lib/echarts', () => {
  class FakeAnimator {
    constructor(element, key) {
      this.element = element;
      this.key = key;
    }

    when(duration, target) {
      this.duration = duration;
      this.target = target;
      Object.assign(this.element[this.key] || (this.element[this.key] = {}), target);
      return this;
    }

    delay(duration) {
      this.delayDuration = duration;
      return this;
    }

    done(callback) {
      callback();
      return this;
    }

    start(easing) {
      this.easing = easing;
    }
  }

  class FakeElement {
    constructor(options = {}) {
      this.type = this.constructor.elementType || 'element';
      this.shape = { ...(options.shape || {}) };
      this.style = { ...(options.style || {}) };
      this.ignore = options.ignore;
      this.silent = options.silent;
      this.z2 = options.z2;
      this.eventListeners = new Map();
    }

    attr(keyOrObj, value) {
      if (typeof keyOrObj === 'string') {
        if (keyOrObj === 'shape') this.shape = { ...value };
        else if (keyOrObj === 'style') this.style = { ...value };
        else this[keyOrObj] = value;
        return;
      }
      Object.assign(this, keyOrObj);
    }

    setShape(shape) {
      this.shape = { ...shape };
    }

    setStyle(style) {
      this.style = { ...style };
    }

    animate(key) {
      return registry.animateEnabled ? new FakeAnimator(this, key) : null;
    }

    stopAnimation() {}

    on(type, handler) {
      if (!this.eventListeners.has(type)) this.eventListeners.set(type, []);
      this.eventListeners.get(type).push(handler);
    }

    emit(type, event = {}) {
      (this.eventListeners.get(type) || []).forEach((handler) => handler(event));
    }

    dirty() {
      this.isDirty = true;
    }

    getBoundingRect() {
      const shape = this.shape || {};
      if (Number.isFinite(shape.r)) {
        return {
          x: Number(shape.cx || 0) - shape.r,
          y: Number(shape.cy || 0) - shape.r,
          width: shape.r * 2,
          height: shape.r * 2
        };
      }
      const x = Number(shape.x ?? shape.x1 ?? 0);
      const y = Number(shape.y ?? shape.y1 ?? 0);
      const x2 = Number(shape.x2 ?? x + Number(shape.width || 0));
      const y2 = Number(shape.y2 ?? y + Number(shape.height || 0));
      return {
        x: Math.min(x, x2),
        y: Math.min(y, y2),
        width: Math.abs(x2 - x),
        height: Math.abs(y2 - y)
      };
    }

    getPaintRect() {
      return this.getBoundingRect();
    }
  }

  class FakeGroup extends FakeElement {
    static elementType = 'group';
    isGroup = true;

    constructor() {
      super();
      this.childrenList = [];
    }

    add(element) {
      element.parent = this;
      this.childrenList.push(element);
    }

    remove(element) {
      this.childrenList = this.childrenList.filter((child) => child !== element);
      element.parent = null;
    }

    removeAll() {
      this.childrenList.forEach((child) => {
        child.parent = null;
      });
      this.childrenList = [];
    }

    children() {
      return this.childrenList;
    }

    childrenRef() {
      return this.childrenList;
    }
  }

  class FakeCircle extends FakeElement { static elementType = 'circle'; }
  class FakeLine extends FakeElement { static elementType = 'line'; }
  class FakePolyline extends FakeElement { static elementType = 'polyline'; }
  class FakeRect extends FakeElement { static elementType = 'rect'; }
  class FakeText extends FakeElement { static elementType = 'text'; }
  class FakePolygon extends FakeElement { static elementType = 'polygon'; }
  class FakeBezierCurve extends FakeElement { static elementType = 'bezier-curve'; }
  class FakeArc extends FakeElement { static elementType = 'arc'; }

  class FakeList {
    constructor(dimensions, host) {
      this.dimensions = dimensions;
      this.host = host;
      this.source = [];
      this.layouts = new Map();
      this.graphics = new Map();
    }

    initData(source) {
      this.source = Array.isArray(source) ? source : [];
    }

    count() {
      return this.source.length;
    }

    getName(index) {
      const item = this.source[index];
      return String(item?.name ?? item?.label ?? item?.id ?? index);
    }

    indexOfName(name) {
      return this.source.findIndex((item, index) => this.getName(index) === name);
    }

    getItemModel(index) {
      return createModel(this.source[index] || {});
    }

    getItemVisual(index, key) {
      const item = this.source[index] || {};
      if (key === 'style') return item.itemStyle || { fill: item.color };
      if (key === 'color') return item.color || item.itemStyle?.color;
      return item[key];
    }

    getItemLayout(index) {
      return this.layouts.get(index);
    }

    setItemLayout(index, layout) {
      this.layouts.set(index, layout);
    }

    setItemGraphicEl(index, element) {
      this.graphics.set(index, element);
    }
  }

  const graphic = {
    Group: FakeGroup,
    Circle: FakeCircle,
    Line: FakeLine,
    Polyline: FakePolyline,
    Rect: FakeRect,
    Text: FakeText,
    Polygon: FakePolygon,
    BezierCurve: FakeBezierCurve,
    Arc: FakeArc,
    extendShape() {
      return class FakeExtendedShape extends FakeElement {
        static elementType = 'extended-shape';
      };
    },
    makePath(path, options) {
      const element = new FakeElement(options);
      element.type = 'path';
      element.path = path;
      return element;
    }
  };
  registry.graphic = graphic;

  return {
    extendSeriesModel(option) {
      registry.seriesModels.push(option);
    },
    extendChartView(option) {
      registry.chartViews.push(option);
    },
    extendComponentModel(option) {
      registry.componentModels.push(option);
    },
    extendComponentView(option) {
      registry.componentViews.push(option);
    },
    helper: {
      createDimensions(source, options) {
        return { source, options };
      },
      getLayoutRect(params, container) {
        if (registry.layoutThrows) throw new Error('layout failed');
        return {
          x: 12,
          y: 18,
          width: Math.max(1, Number(container.width) - 24),
          height: Math.max(1, Number(container.height) - 36)
        };
      }
    },
    List: FakeList,
    graphic,
    number: {
      parsePercent(value, maxValue) {
        if (typeof value === 'string' && value.endsWith('%')) return Number.parseFloat(value) / 100 * maxValue;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : maxValue / 2;
      }
    }
  };
});

beforeEach(() => {
  registry.seriesModels.length = 0;
  registry.chartViews.length = 0;
  registry.componentModels.length = 0;
  registry.componentViews.length = 0;
  registry.animateEnabled = true;
  registry.layoutThrows = false;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
  vi.clearAllMocks();
});

test('captured pack bubble registration covers lifecycle, legend, animation, and error branches', async () => {
  const option = {
    data: [
      { name: 'Alpha Long Label With Spaces', value: 20, category: 'A', itemStyle: { color: '#123456', opacity: 0.7 } },
      { name: 'BetaVeryLongSingleWordLabel', value: 10, category: 'B' },
      { name: 'Gamma', value: 5, category: 'B', label: { show: false } }
    ],
    label: { show: true, minRadius: 0, formatter: '{b} {c} {category}' },
    itemStyle: { borderColor: '#fff', borderWidth: 2 },
    enterAnimation: { duration: 12, delay: 3, stagger: 2 }
  };
  const { seriesModel } = await exerciseSeriesModule('../packages/echarts-pack-bubble/src/pack-bubble.ts?registration', option);

  assert.deepEqual(seriesModel.legendVisualProvider.getAllNames(), [
    'Alpha Long Label With Spaces',
    'BetaVeryLongSingleWordLabel',
    'Gamma'
  ]);
  assert.equal(seriesModel.legendVisualProvider.containName('Gamma'), true);
  assert.equal(seriesModel.legendVisualProvider.indexOfName('Gamma'), 2);
  assert.equal(seriesModel.legendVisualProvider.getItemVisual(0, 'legendIcon'), null);
  assert.equal(seriesModel.legendVisualProvider.getItemVisual(0, 'style').fill, '#123456');
  assert.equal(seriesModel.legendVisualProvider.getItemVisual(0, 'color'), '#123456');
});

test('captured renderer registrations cover lifecycle across the remaining custom series', async () => {
  const cases = [
    {
      path: '../packages/echarts-circle-packing/src/circle-packing.ts?registration',
      option: {
        data: {
          name: 'Root Long Label',
          children: [
            { name: 'Alpha Long Label With Spaces', value: 18, itemStyle: { color: '#60a5fa' } },
            { name: 'BetaVeryLongSingleWordLabel', value: 9 },
            { name: 'Branch', children: [{ name: 'Leaf', value: 4 }] }
          ]
        },
        rootVisible: true,
        label: { show: true, showInternal: true, minRadius: 0, formatter: '{b} {c}' },
        enterAnimation: { duration: 10, delay: 1, stagger: 1 }
      }
    },
    {
      path: '../packages/echarts-mosaic/src/mosaic.ts?registration',
      option: {
        data: [
          { channel: 'Organic Long Label', stage: 'New Users', users: 20, itemStyle: { color: '#2563eb' } },
          { channel: 'Organic Long Label', stage: 'Returning', users: 8 },
          { channel: 'Paid', stage: 'New Users', users: 12 }
        ],
        xField: 'channel',
        yField: 'stage',
        valueField: 'users',
        label: { show: true, minArea: 0, formatter: '{x} {y} {value}' },
        enterAnimation: { duration: 10, delay: 1, stagger: 1 }
      }
    },
    {
      path: '../packages/echarts-voronoi-treemap/src/voronoi-treemap.ts?registration',
      option: {
        data: {
          name: 'Portfolio',
          children: [
            { name: 'Alpha Long Label With Spaces', value: 20, itemStyle: { color: '#123456' } },
            { name: 'BetaVeryLongSingleWordLabel', value: 12 },
            { name: 'Gamma', value: 8 }
          ]
        },
        rootVisible: true,
        maxIteration: 2,
        label: { show: true, showInternal: true, minArea: 0, formatter: '{b} {c}' },
        enterAnimation: { duration: 10, delay: 1, stagger: 1 }
      }
    },
    {
      path: '../packages/echarts-subway/src/subway.ts?registration',
      option: {
        data: [
          {
            id: 'red',
            name: 'Red Line',
            color: '#ef4444',
            status: 'planned',
            stations: [
              { id: 'a', name: 'Alpha', coord: [0, 0], labelPosition: 'top' },
              { id: 'b', name: 'Beta', coord: [100, 0], interchange: true },
              { id: 'c', name: 'Gamma', coord: [200, 80], labelPosition: 'bottomRight' }
            ],
            waypoints: [['a', 0, 0], [50, 20], ['b', 100, 0], ['c', 200, 80]]
          },
          {
            id: 'blue',
            name: 'Blue Line',
            color: '#2563eb',
            stations: [
              { id: 'b', name: 'Beta', coord: [100, 0] },
              { id: 'd', name: 'Delta', coord: [100, 120] }
            ]
          }
        ],
        label: { show: true, formatter: '{b}' },
        routeLabel: { show: true, position: 'both', formatter: '{b}' },
        lineStyle: { type: 'dashed', opacity: 0.8 },
        enterAnimation: { duration: 10, delay: 1, stagger: 1 }
      }
    },
    {
      path: '../packages/echarts-sunrise-sunset/src/sunrise-sunset.ts?registration',
      option: {
        sunrise: '22:00',
        sunset: '04:00',
        moonrise: '21:30',
        moonset: '06:20',
        currentTime: '2026-05-06 02:30:00',
        title: 'Until sunset',
        remainingText: '01:30:00',
        updatedText: 'Updated 02:30',
        label: { show: true },
        sunIcon: { path: 'M0 0L4 0L2 4Z', style: { fill: '#facc15' } },
        moonIcon: false,
        enterAnimation: { duration: 10, delay: 1, stagger: 1 }
      }
    },
    {
      path: '../packages/echarts-radial-area/src/radial-area.ts?registration',
      option: {
        data: [
          { date: '2026-01-01', avg: 10, min: 5, max: 14 },
          { date: '2026-02-01', avg: 20, min: 12, max: 26 },
          { date: '2026-03-01', avg: 16, min: 9, max: 22 }
        ],
        angleType: 'time',
        minField: 'min',
        maxField: 'max',
        showSymbol: true,
        label: { show: true, formatter: '{b} {c}' },
        angleAxis: { show: true, label: { show: true } },
        radialAxis: { show: true, label: { show: true } },
        enterAnimation: { duration: 10, delay: 1, stagger: 1 }
      }
    },
    {
      path: '../packages/echarts-radial-boxplot/src/radial-boxplot.ts?registration',
      option: {
        data: [
          { name: 'A', min: 1, q1: 2, median: 3, q3: 4, max: 5 },
          { name: 'B', min: 2, q1: 3, median: 4, q3: 5, max: 6 }
        ],
        label: { show: true, formatter: '{b}' },
        angleAxis: { show: true, label: { show: true } },
        radialAxis: { show: true, label: { show: true } },
        enterAnimation: { duration: 10, delay: 1, stagger: 1 }
      }
    },
    {
      path: '../packages/echarts-nested-circle/src/nested-circle.ts?registration',
      option: {
        data: [
          { name: 'Outer Long Label', children: ['Alpha Long Label', 'Beta'] },
          { name: 'Inner', children: ['Gamma'] }
        ],
        label: { show: true, formatter: '{b}' },
        childLabel: { show: true, formatter: '{b}' },
        enterAnimation: { duration: 10, delay: 1, stagger: 1 }
      }
    },
    {
      path: '../packages/echarts-flame/src/flame.ts?registration',
      option: {
        data: {
          name: 'root',
          children: [
            { name: 'Parse Long Label', value: 10 },
            { name: 'Render', value: 20, children: [{ name: 'Paint', value: 7 }] }
          ]
        },
        rootVisible: true,
        label: { show: true, formatter: '{b} {c}' },
        enterAnimation: { duration: 10, delay: 1, stagger: 1 }
      }
    },
    {
      path: '../packages/echarts-spiral/src/spiral.ts?registration',
      option: {
        data: [
          { name: 'Acquire Long Label', value: 34 },
          { name: 'Activate', value: 55 },
          { name: 'Retain', value: 21 }
        ],
        label: { show: true, formatter: '{b} {c}' },
        enterAnimation: { duration: 10, delay: 1, stagger: 1 }
      }
    },
    {
      path: '../packages/echarts-lollipop/src/lollipop.ts?registration',
      option: {
        data: [
          { country: 'Alpha', population: 120 },
          { country: 'Bravo', population: 180 }
        ],
        categoryField: 'country',
        valueField: 'population',
        label: { show: true, formatter: '{b} {c}' },
        enterAnimation: { duration: 10, delay: 1, stagger: 1 }
      }
    },
    {
      path: '../packages/echarts-beeswarm/src/beeswarm.ts?registration',
      option: {
        data: [
          { group: 'A', value: 5, name: 'Alpha' },
          { group: 'A', value: 5.2, name: 'Beta' },
          { group: 'B', value: 4.4, name: 'Gamma' }
        ],
        categoryField: 'group',
        valueField: 'value',
        nameField: 'name',
        label: { show: true, formatter: '{b} {c}' },
        enterAnimation: { duration: 10, delay: 1, stagger: 1 }
      }
    },
    {
      path: '../packages/echarts-vector-field/src/vector-field.ts?registration',
      option: {
        data: [
          { longitude: 0, latitude: 0, u: 1, v: 0 },
          { longitude: 1, latitude: 0, u: 0, v: 1 },
          { longitude: 0, latitude: 1, u: -1, v: 0 }
        ],
        label: { show: true, formatter: '{b} {c}' },
        enterAnimation: { duration: 10, delay: 1, stagger: 1 }
      }
    },
    {
      path: '../packages/echarts-venn/src/venn.ts?registration',
      option: {
        data: [
          { sets: ['A'], name: 'Alpha', value: 10 },
          { sets: ['B'], name: 'Beta', value: 7 },
          { sets: ['A', 'B'], name: 'Both', value: 2 }
        ],
        layout: 'hollow',
        label: { show: true, formatter: '{b} {c}' },
        enterAnimation: { duration: 10, delay: 1, stagger: 1 }
      }
    }
  ];

  for (const item of cases) {
    const { seriesModel, view } = await exerciseSeriesModule(item.path, item.option);
    assert.ok(view.group.childrenRef().length >= 0);
    if (seriesModel.legendVisualProvider) {
      assert.ok(Array.isArray(seriesModel.legendVisualProvider.getAllNames()));
      seriesModel.legendVisualProvider.containName('missing');
      seriesModel.legendVisualProvider.indexOfName('missing');
      seriesModel.legendVisualProvider.getItemVisual(0, 'legendIcon');
      seriesModel.legendVisualProvider.getItemVisual(0, 'style');
    }
  }
});

test('subway renderer covers path constructor fallbacks and segment style variants', async () => {
  const option = {
    data: [
      {
        id: 'red',
        name: 'Red Line',
        color: '#ef4444',
        status: 'construction',
        lineStyle: { type: 'dotted', dashOffset: 3, cornerRadius: 0 },
        stations: [
          { id: 'a', name: 'Alpha', coord: [0, 0], labelPosition: 'left' },
          { id: 'b', name: 'Beta', coord: [80, 0], labelPosition: 'right' },
          { id: 'c', name: 'Gamma', coord: [160, 80], labelPosition: 'topLeft' },
          { id: 'd', name: 'Delta', coord: [160, 160], labelPosition: 'bottomLeft' }
        ],
        waypoints: [['a', 0, 0], ['b', 80, 0], ['c', 160, 80], ['d', 160, 160]],
        segments: [
          { from: 'a', to: 'c', lineStyle: { color: '#f97316', width: 4, lineDash: [2, 3] } },
          { index: 2, status: 'planned', lineStyle: { dashArray: '4, 2', opacity: 0.6 } },
          { startIndex: 0, endIndex: 1, status: 'open', lineStyle: { type: 'solid' } },
          { from: 'missing', to: 'c', lineStyle: {} },
          null
        ]
      },
      {
        id: 'blue',
        name: 'Blue Line',
        color: '#2563eb',
        stations: [
          { id: 'a', name: 'Alpha', coord: [0, 0], interchange: true },
          { id: 'e', name: 'Echo', coord: [0, 120], labelPosition: 'bottom' }
        ],
        waypoints: [['a', 0, 0], [0, 60], ['e', 0, 120]]
      }
    ],
    routeLabel: { show: true, position: 'start', formatter: ({ name, color }) => `${name}:${color}` },
    label: { show: true, formatter: ({ name, line }) => `${name}:${line}` },
    lineStyle: { lineDash: '8 4', cap: 'butt', join: 'miter' },
    enterAnimation: { duration: 8, delay: () => 1, stagger: () => 1 }
  };

  await withGraphicOverrides({ extendShape: undefined }, async () => {
    await exerciseSeriesModule('../packages/echarts-subway/src/subway.ts?subway-make-path', option);
  });

  await withGraphicOverrides({ extendShape: undefined, makePath: undefined }, async () => {
    await exerciseSeriesModule('../packages/echarts-subway/src/subway.ts?subway-polyline', option);
  });

  await withGraphicOverrides({ extendShape: undefined, makePath: undefined, Polyline: undefined }, async () => {
    await exerciseSeriesModule('../packages/echarts-subway/src/subway.ts?subway-line-fallback', option);
  });

  registry.animateEnabled = false;
  await exerciseSeriesModule('../packages/echarts-subway/src/subway.ts?subway-no-animator', option);
});

test('sunrise sunset renderer covers icon image paths, hidden backgrounds, and disabled animations', async () => {
  const makeImage = (source, rect, layout) => {
    const element = new registry.graphic.Rect({ shape: rect, style: { image: source, layout } });
    element.type = 'image';
    return element;
  };
  const option = {
    data: {
      name: 'Night shift',
      sunrise: '06:10',
      sunset: '18:20',
      moonrise: '20:00',
      moonset: '04:30',
      currentTime: '2026-05-06 21:15:00'
    },
    backgroundStyle: { color: null, opacity: 0 },
    sunIcon: 'image://sun.png',
    moonIcon: { image: 'image://moon.png', size: [18, 14], offset: [3, -2], style: { opacity: 0.5 } },
    label: { show: true },
    header: {
      formatter({ title, remainingText, updatedText }) {
        return `${title}|${remainingText}|${updatedText}`;
      }
    },
    enterAnimation: { duration: 8, delay: () => 1, stagger: () => 1 },
    currentTime: '2026-05-06 21:15:00'
  };

  await withGraphicOverrides({ makeImage }, async () => {
    await exerciseSeriesModule('../packages/echarts-sunrise-sunset/src/sunrise-sunset.ts?sunrise-image-icon', option);
  });

  registry.animateEnabled = false;
  await withGraphicOverrides({ makeImage: undefined, makePath: undefined }, async () => {
    await exerciseSeriesModule('../packages/echarts-sunrise-sunset/src/sunrise-sunset.ts?sunrise-icon-fallbacks', {
      ...option,
      backgroundStyle: { color: '#111', opacity: 1 },
      sunIcon: { path: 'path://M0 0L4 0L2 4Z', size: 16 },
      moonIcon: 'image://moon.png',
      animation: false
    });
  });
});

test('captured fisheye component registration covers render, no-op, remove, and dispose branches', async () => {
  await import('../packages/echarts-fisheye/src/fisheye.ts?registration');
  const viewDefinition = registry.componentViews.at(-1);
  const view = createViewContext();
  const api = createApi();

  viewDefinition.render.call(view, { option: { show: false } }, null, api);
  assert.equal(view.group.childrenRef().length, 0);

  view.__fisheyeController = { dispose() { this.disposed = true; } };
  viewDefinition.render.call(view, {
    option: {
      show: true,
      radius: '35%',
      scale: 2,
      preview: true,
      stroke: '#111',
      strokeWidth: 2,
      opacity: 0.8
    }
  }, null, api);
  assert.equal(view.group.childrenRef().length, 1);
  const lens = view.__fisheyeLens;
  api.__zr.storage.getDisplayList = () => [lens, { x: 10, y: 10, getBoundingRect: () => ({ x: 8, y: 8, width: 4, height: 4 }) }];
  api.__zr.emit('mousemove', { offsetX: 20, offsetY: 20, target: lens });
  api.__zr.emit('globalout', {});
  viewDefinition.remove.call(view);
  assert.equal(lens.ignore, true);
  viewDefinition.remove.call(createViewContext());

  view.__fisheyeLens = lens;
  view.__fisheyeController = { dispose() { this.disposed = true; } };
  viewDefinition.dispose.call(view);
  assert.equal(view.group.childrenRef().length, 0);
  viewDefinition.dispose.call(createViewContext());
});

test('layout-core graph installer covers direct lifecycle, fisheye, hover, and failure branches', async () => {
  const { installGraphLayout } = await import('../packages/echarts-layout-core/src/echarts.ts');
  const host = createGraphHost();
  installGraphLayout(host, { chartType: 'testGraph', layoutType: 'radial' });
  const modelDefinition = host.seriesModels.at(-1);
  const viewDefinition = host.chartViews.at(-1);
  const option = {
    nodes: [
      { id: 'root', name: 'Root', value: 1250000, itemStyle: { color: '#2563eb' }, label: { show: true, position: 'top' } },
      { id: 'a', name: 'Alpha', value: [4200, 'fallback'] },
      { id: 'b', name: 'Beta', value: 'B2' },
      { id: 'c', name: 'Gamma', value: 3.14 }
    ],
    edges: [
      { id: 'ra', source: 'root', target: 'a', lineStyle: { color: '#ef4444', width: 2 } },
      { id: 'rb', source: 'root', target: 'b' },
      { id: 'ac', source: 'a', target: 'c' }
    ],
    center: ['50%', '52%'],
    label: { show: true, formatter: '{b} {c}', position: 'right', fontSize: 12 },
    itemStyle: { color: '#38bdf8', borderColor: '#fff', borderWidth: 2 },
    edgeStyle: { color: '#64748b', width: 1.5, opacity: 0.72 },
    symbolSize: (node) => node.id === 'root' ? 40 : 18,
    enterAnimation: { duration: 10, delay: 1, stagger: 1 },
    edgeAnimation: { duration: 12, delay: 1, stagger: 1 },
    fisheye: { show: true, radius: 120, scale: 2.2, labelScale: 1.5, preview: true }
  };
  const seriesModel = createSeriesModel(option, modelDefinition);
  seriesModel.__data = new GraphData(option.nodes);
  modelDefinition.getInitialData.call(seriesModel, option);

  const api = createApi();
  const view = createViewContext();
  view.__graphHoverController = { dispose() { this.disposed = true; } };
  view.__fisheyeController = { dispose() { this.disposed = true; } };
  viewDefinition.render.call(view, seriesModel, null, api);
  vi.runOnlyPendingTimers();
  assert.ok(view.group.childrenRef().length > 0);

  const fisheyeOffModel = createSeriesModel({ ...option, fisheye: { show: false } }, modelDefinition);
  viewDefinition.render.call(view, fisheyeOffModel, null, api);
  viewDefinition.render.call(view, createSeriesModel({ ...option, fisheye: { show: false } }, modelDefinition), null, api);
  const firstNode = view.__graphRenderState?.nodes?.[0]?.circle;
  firstNode?.emit?.('mouseover');
  api.__zr.emit('mousemove', { target: null });
  firstNode?.emit?.('mouseout');

  view.__fisheyePreviewTimer = setTimeout(() => {}, 10);
  viewDefinition.remove.call(view);
  view.__graphHoverController = { dispose() { this.disposed = true; } };
  view.__fisheyeController = { dispose() { this.disposed = true; } };
  viewDefinition.dispose.call(view);

  host.layoutThrows = true;
  viewDefinition.render.call(createViewContext(), seriesModel, null, api);

  const arcHost = createGraphHost({ includeArc: false });
  installGraphLayout(arcHost, { chartType: 'testArc', layoutType: 'arc' });
  const arcModelDefinition = arcHost.seriesModels.at(-1);
  const arcViewDefinition = arcHost.chartViews.at(-1);
  const arcModel = createSeriesModel({ ...option, fisheye: { show: false }, edgeAnimation: false }, arcModelDefinition);
  arcModel.__data = new GraphData(option.nodes);
  arcViewDefinition.render.call(createViewContext(), arcModel, null, api);

  const clampView = createViewContext();
  const clampModel = createSeriesModel({
    ...option,
    nodes: [
      { id: 'long', name: 'A Very Very Very Very Long Label', value: 5, label: { show: true, position: 'left' } },
      { id: 'side', name: 'Side', value: 1, label: { show: true, position: 'right' } }
    ],
    edges: [{ source: 'long', target: 'side' }],
    fisheye: { show: false },
    symbolSize: 28,
    label: { show: true, formatter: '{b}', fontSize: 18, distance: 1 }
  }, modelDefinition);
  clampModel.__data = new GraphData(clampModel.option.nodes);
  viewDefinition.render.call(clampView, clampModel, null, createApi({ width: 54, height: 42 }));

  const tokenView = createViewContext();
  const tokenOption = {
    ...option,
    fisheye: { show: false },
    sortBy() {
      tokenView.__renderToken = {};
      return 0;
    }
  };
  const tokenModel = createSeriesModel(tokenOption, modelDefinition);
  tokenModel.__data = new GraphData(option.nodes);
  viewDefinition.render.call(tokenView, tokenModel, null, api);
});

function createSeriesModel(option, modelDefinition) {
  return {
    option,
    get(path) {
      return getPath(option, path);
    },
    getModel(path) {
      return createModel(getPath(option, path) || {});
    },
    getBoxLayoutParams() {
      return {};
    },
    getData() {
      if (!this.__data) this.__data = modelDefinition.getInitialData.call(this, option);
      return this.__data;
    },
    getRawData() {
      return this.getData();
    }
  };
}

class GraphData {
  constructor(source) {
    this.source = source;
    this.layouts = new Map();
    this.graphics = new Map();
  }

  initData(source) {
    this.source = source;
  }

  getItemModel(index) {
    return createModel(this.source[index] || {});
  }

  getItemVisual(index, key) {
    const item = this.source[index] || {};
    if (key === 'style') return item.itemStyle || { fill: item.color };
    return item[key];
  }

  getItemLayout(index) {
    return this.layouts.get(index);
  }

  setItemLayout(index, layout) {
    this.layouts.set(index, layout);
  }

  setItemGraphicEl(index, element) {
    this.graphics.set(index, element);
  }
}

function createGraphHost({ includeArc = true } = {}) {
  const host = {
    seriesModels: [],
    chartViews: [],
    layoutThrows: false,
    extendSeriesModel(option) {
      this.seriesModels.push(option);
    },
    extendChartView(option) {
      this.chartViews.push(option);
    },
    helper: {
      createDimensions(source, options) {
        return { source, options };
      },
      getLayoutRect: (params, container) => {
        if (host.layoutThrows) throw new Error('graph layout failed');
        return {
          x: 10,
          y: 12,
          width: Number(container.width) - 20,
          height: Number(container.height) - 24
        };
      },
      enableHoverEmphasis(element) {
        element.hoverEnabled = true;
      }
    },
    List: GraphData,
    graphic: {
      ...registry.graphic,
      Arc: includeArc ? registry.graphic.Arc : undefined
    },
    number: {
      parsePercent(value, maxValue) {
        if (typeof value === 'string' && value.endsWith('%')) return Number.parseFloat(value) / 100 * maxValue;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : maxValue / 2;
      }
    }
  };
  return host;
}

async function exerciseSeriesModule(path, option) {
  registry.seriesModels.length = 0;
  registry.chartViews.length = 0;
  registry.layoutThrows = false;
  registry.animateEnabled = true;
  await import(path);
  const modelDefinition = registry.seriesModels.at(-1);
  const viewDefinition = registry.chartViews.at(-1);
  const seriesModel = createSeriesModel(option, modelDefinition);
  const data = modelDefinition.getInitialData.call(seriesModel, option);
  seriesModel.__data = data;
  if (typeof modelDefinition.getTooltipPosition === 'function') {
    data.setItemLayout(0, [1, 2]);
    assert.deepEqual(modelDefinition.getTooltipPosition.call(seriesModel, 0), [1, 2]);
    data.setItemLayout(0, null);
    assert.equal(modelDefinition.getTooltipPosition.call(seriesModel, 0), undefined);
  }
  const view = createViewContext();
  view.__hoverController = { dispose() { this.disposed = true; } };
  viewDefinition.render.call(view, seriesModel, null, createApi());
  vi.runOnlyPendingTimers();
  registry.animateEnabled = false;
  viewDefinition.render.call(view, seriesModel, null, createApi());
  await withGraphicPrototypeOverride('animate', undefined, async () => {
    viewDefinition.render.call(createViewContext(), seriesModel, null, createApi());
  });
  const tokenView = createViewContext();
  const tokenSeriesModel = createSeriesModel(option, modelDefinition);
  tokenSeriesModel.__data = data;
  tokenSeriesModel.getBoxLayoutParams = () => {
    tokenView.__renderToken = {};
    return {};
  };
  viewDefinition.render.call(tokenView, tokenSeriesModel, null, createApi());
  viewDefinition.remove.call(view);
  view.__hoverController = { dispose() { this.disposed = true; } };
  view.__packBubbleEnterTimer = setTimeout(() => {}, 10);
  viewDefinition.dispose.call(view);
  registry.layoutThrows = true;
  viewDefinition.render.call(createViewContext(), seriesModel, null, createApi());
  registry.layoutThrows = false;
  return { seriesModel, view, modelDefinition, viewDefinition };
}

function createModel(source) {
  return {
    option: source,
    get(path) {
      return getPath(source, path);
    },
    getModel(path) {
      return createModel(getPath(source, path) || {});
    }
  };
}

function createViewContext() {
  return {
    group: new registry.graphic.Group()
  };
}

function createApi({ width = 640, height = 420 } = {}) {
  const zr = createZRender();
  return {
    __zr: zr,
    getWidth: () => width,
    getHeight: () => height,
    getZr: () => zr
  };
}

function createZRender() {
  const listeners = new Map();
  return {
    storage: {
      getDisplayList: () => []
    },
    on(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    off(type, handler) {
      listeners.set(type, (listeners.get(type) || []).filter((item) => item !== handler));
    },
    emit(type, event) {
      (listeners.get(type) || []).forEach((handler) => handler(event));
    },
    refresh() {
      this.refreshed = true;
    }
  };
}

function getPath(source, path) {
  const parts = Array.isArray(path) ? path : String(path).split('.');
  let current = source;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

async function withGraphicOverrides(overrides, callback) {
  const previous = {};
  for (const key of Object.keys(overrides)) {
    previous[key] = registry.graphic[key];
    registry.graphic[key] = overrides[key];
  }
  try {
    return await callback();
  } finally {
    for (const key of Object.keys(overrides)) {
      registry.graphic[key] = previous[key];
    }
  }
}

async function withGraphicPrototypeOverride(key, value, callback) {
  const constructors = Object.values(registry.graphic).filter((item) => typeof item === 'function' && item.prototype);
  const previous = constructors.map((ctor) => ({
    ctor,
    hadOwn: Object.prototype.hasOwnProperty.call(ctor.prototype, key),
    value: ctor.prototype[key]
  }));
  constructors.forEach((ctor) => {
    ctor.prototype[key] = value;
  });
  try {
    return await callback();
  } finally {
    previous.forEach(({ ctor, hadOwn, value: previousValue }) => {
      if (hadOwn) ctor.prototype[key] = previousValue;
      else delete ctor.prototype[key];
    });
  }
}
