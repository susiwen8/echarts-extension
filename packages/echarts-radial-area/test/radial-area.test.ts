import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'vitest';

import * as echarts from 'echarts';
import '@echarts-extension/radial-area';

import {
  layoutRadialArea,
  resolveRadialAreaLayout
} from '../src/layout.ts';
import { __test__ as radialAreaViewTest } from '../src/radial-area.ts';

const seasonalData = [
  { month: 'January', value: 50, min: 42, max: 64 },
  { month: 'April', value: 70, min: 58, max: 80 },
  { month: 'July', value: 60, min: 50, max: 74 },
  { month: 'October', value: 40, min: 34, max: 52 }
];

const seasonalWeatherData = JSON.parse(
  readFileSync(new URL('../../../tests/visual/fixtures/seasonal-weather.json', import.meta.url), 'utf8')
) as Array<Record<string, unknown>>;

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
});

test('computes deterministic clockwise radial area geometry', () => {
  const first = layoutRadialArea(seasonalData, {
    width: 400,
    height: 400,
    padding: 20,
    innerRadius: '40%',
    outerRadius: '90%',
    angleField: 'month',
    angleType: 'category',
    valueField: 'value',
    minField: 'min',
    maxField: 'max',
    min: 20,
    max: 80,
    tickCount: 4,
    startAngle: 90,
    clockwise: true
  });
  const second = layoutRadialArea(seasonalData, {
    width: 400,
    height: 400,
    padding: 20,
    innerRadius: '40%',
    outerRadius: '90%',
    angleField: 'month',
    angleType: 'category',
    valueField: 'value',
    minField: 'min',
    maxField: 'max',
    min: 20,
    max: 80,
    tickCount: 4,
    startAngle: 90,
    clockwise: true
  });

  assert.deepEqual(first, second);
  assert.equal(first.centerX, 200);
  assert.equal(first.centerY, 200);
  assert.equal(first.innerRadius, 72);
  assert.equal(first.outerRadius, 162);
  assert.deepEqual(first.radialTicks.map((tick) => tick.value), [20, 40, 60, 80]);
  assert.deepEqual(first.points.map((point) => point.name), ['January', 'April', 'July', 'October']);

  const [january, april, july, october] = first.points;
  assert.equal(Math.round(january.x), 200);
  assert.equal(Math.round(january.y), 83);
  assert.equal(Math.round(april.x), 347);
  assert.equal(Math.round(april.y), 200);
  assert.equal(Math.round(july.x), 200);
  assert.equal(Math.round(july.y), 332);
  assert.equal(Math.round(october.x), 98);
  assert.equal(Math.round(october.y), 200);

  assert.equal(first.rangePolygon.length, 10);
  assert.ok(first.rangePolygon[0].radius > first.rangePolygon.at(-1).radius);
  first.rangePolygon.forEach((point) => {
    assert.ok(Number.isFinite(point.x), `${point.name} x`);
    assert.ok(Number.isFinite(point.y), `${point.name} y`);
    assert.ok(Number.isFinite(point.radius), `${point.name} radius`);
  });
});

test('closes the range band across the final-to-first category interval', () => {
  const result = layoutRadialArea(seasonalData, {
    width: 400,
    height: 400,
    padding: 20,
    innerRadius: '40%',
    outerRadius: '90%',
    angleField: 'month',
    angleType: 'category',
    valueField: 'value',
    minField: 'min',
    maxField: 'max',
    min: 20,
    max: 80,
    startAngle: 90,
    clockwise: true,
    closed: true
  });

  assert.equal(result.rangePolygon.length, 10);
  assert.equal(result.rangePolygon[4].name, 'January');
  assert.equal(result.rangePolygon[4].radius, result.rangePolygon[0].radius);
  assert.equal(result.rangePolygon[5].name, 'January');
  assert.equal(result.rangePolygon[5].radius, result.points[0].minRadius);
  assert.equal(result.rangePolygon[6].name, 'October');
  assert.equal(result.rangePolygon.at(-1).name, 'January');
});

test('renders the range area below axes and the line above axes', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 320,
    height: 320
  });

  try {
    chart.setOption({
      animation: false,
      series: [
        {
          type: 'radialArea',
          data: seasonalData,
          width: '100%',
          height: '100%',
          padding: 30,
          angleField: 'month',
          angleType: 'category',
          valueField: 'value',
          minField: 'min',
          maxField: 'max',
          min: 20,
          max: 80,
          radialAxis: {
            show: true,
            label: { show: false },
            splitLine: {
              show: true,
              lineStyle: {
                color: '#111111',
                width: 1,
                type: 'solid',
                opacity: 1
              }
            }
          },
          angleAxis: {
            show: true,
            label: { show: false },
            splitLine: {
              show: true,
              lineStyle: {
                color: '#222222',
                width: 1,
                type: 'solid',
                opacity: 1
              }
            }
          },
          rangeAreaStyle: {
            show: true,
            color: '#fedcba',
            opacity: 1
          },
          areaStyle: { show: false },
          lineStyle: {
            color: '#13579b',
            width: 2,
            opacity: 1
          },
          showSymbol: false
        }
      ]
    });

    const svg = chart.renderToSVGString();
    const rangeAreaIndex = svg.indexOf('<polygon');
    const radialAxisIndex = svg.indexOf('<circle');
    const lineIndex = svg.indexOf('<polyline');

    assert.notEqual(rangeAreaIndex, -1, 'range area polygon should render');
    assert.notEqual(radialAxisIndex, -1, 'radial axis split circles should render');
    assert.notEqual(lineIndex, -1, 'series line should render');
    assert.ok(rangeAreaIndex < radialAxisIndex, 'range area should render below the axes');
    assert.ok(radialAxisIndex < lineIndex, 'series line should render above the axes');
  } finally {
    chart.dispose();
  }
});

test('formats seasonal weather tooltip fields without falling back to a missing value dimension', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 360,
    height: 360
  });
  const firstRow = seasonalWeatherData[0];

  try {
    chart.setOption({
      animation: false,
      series: [
        {
          type: 'radialArea',
          data: seasonalWeatherData.slice(0, 8),
          angleField: 'date',
          angleType: 'time',
          valueField: 'avg',
          minField: 'minmin',
          maxField: 'maxmax',
          min: 20,
          max: 90
        }
      ]
    });

    const seriesModel = chart.getModel().getSeriesByIndex(0) as unknown as {
      formatTooltip(dataIndex: number, multipleSeries?: boolean, dataType?: string | null): unknown;
    };
    const tooltip = seriesModel.formatTooltip(0, false, null);
    const blocks = collectNameValueBlocks(tooltip);

    assert.equal((tooltip as { header?: unknown }).header, firstRow.date);
    assert.deepEqual(blocks.map((block) => block.name), ['minmin', 'maxmax', 'min', 'max', 'avg']);
    ['minmin', 'maxmax', 'min', 'max', 'avg'].forEach((field) => {
      const block = blocks.find((item) => item.name === field);
      assert.ok(block, `${field} should be present in tooltip`);
      assert.equal(block?.value, firstRow[field]);
      assert.notEqual(block?.value, '-');
    });
  } finally {
    chart.dispose();
  }
});

test('formats tooltip array rows, missing raw rows, and absent option fallbacks', () => {
  const arrayTooltip = radialAreaViewTest.formatRadialAreaTooltip(createTooltipSeriesModel({
    data: [['Station A', '2026-01-01', 2, 8, 5]],
    dimensions: ['name', 'date', 'min', 42, 'max', 'avg'],
    nameField: 'name',
    angleField: 'date',
    minField: 'min',
    maxField: 'max',
    valueField: 'avg'
  }, {
    visualStyle: { fill: '#ffaa00' }
  }) as never, 0);
  const arrayBlocks = collectNameValueBlocks(arrayTooltip);

  assert.equal((arrayTooltip as { header?: unknown }).header, 'Station A');
  assert.deepEqual(arrayBlocks.map((block) => block.name), ['min', 'max', 'avg']);
  assert.deepEqual(arrayBlocks.map((block) => block.value), [2, 8, 5]);
  assert.ok(arrayBlocks.every((block) => block.markerColor === '#ffaa00'));

  const configuredFallback = radialAreaViewTest.formatRadialAreaTooltip(createTooltipSeriesModel({
    data: [],
    angleField: 'date',
    minField: 'low',
    maxField: 'high',
    valueField: 'mean'
  }, {
    getName: (index) => `row-${index}`,
    visualStyle: { stroke: '#336699' }
  }) as never, 0);
  const configuredBlocks = collectNameValueBlocks(configuredFallback);

  assert.equal((configuredFallback as { header?: unknown }).header, 'row-0');
  assert.deepEqual(configuredBlocks.map((block) => block.name), ['low', 'high', 'mean']);
  assert.ok(configuredBlocks.every((block) => block.value === undefined && block.noValue === true));
  assert.ok(configuredBlocks.every((block) => block.markerColor === '#336699'));

  const emptyOptionTooltip = radialAreaViewTest.formatRadialAreaTooltip(createTooltipSeriesModel(undefined) as never, 0);
  const emptyOptionBlocks = collectNameValueBlocks(emptyOptionTooltip);

  assert.equal((emptyOptionTooltip as { header?: unknown }).header, '');
  assert.deepEqual(emptyOptionBlocks.map((block) => block.name), ['value']);
  assert.ok(emptyOptionBlocks.every((block) => block.markerColor === '#3f86bd'));
});

test('resolves tooltip marker color through the complete fallback order', () => {
  const markerColor = (
    option: Record<string, unknown> | undefined,
    config?: TooltipSeriesModelConfig
  ) => radialAreaViewTest.readTooltipMarkerColor(createTooltipSeriesModel(option, config) as never, 0);

  assert.equal(markerColor({}, { itemStyle: { color: '#item' } }), '#item');
  assert.equal(markerColor({}, { visualStyle: { fill: '#visual-fill' } }), '#visual-fill');
  assert.equal(markerColor({}, { visualStyle: { stroke: '#visual-stroke' } }), '#visual-stroke');
  assert.equal(markerColor({ itemStyle: { color: '#series-item' } }), '#series-item');
  assert.equal(markerColor({ lineStyle: { color: '#series-line' } }), '#series-line');
  assert.equal(markerColor({}, { itemStyle: { color: { type: 'linear' } } }), '#3f86bd');
  assert.equal(markerColor({}, {}), '#3f86bd');
});

test('reads raw tooltip fields from arrays and invalid rows', () => {
  assert.equal(radialAreaViewTest.readRawField(['north', 42], 1, undefined), 42);
  assert.equal(radialAreaViewTest.readRawField(['north', 42], 'name', ['name', 'value']), 'north');
  assert.equal(radialAreaViewTest.readRawField(['north', 42], 'name', undefined), undefined);
  assert.equal(radialAreaViewTest.readRawField(['north', 42], 'missing', ['name', 'value']), undefined);
  assert.equal(radialAreaViewTest.readRawField(null, 'value', undefined), undefined);
});

test('uses a radial hover guide line as the item trigger and reveals it on hover', () => {
  const host = createTestGraphicHost();
  const group = new TestGraphicGroup();
  const data = createTestSeriesData();
  const seriesModel = createTestSeriesModel(data);
  const layout = resolveRadialAreaLayout({
    data: seasonalWeatherData.slice(0, 4),
    width: 320,
    height: 320,
    padding: 30,
    angleField: 'date',
    angleType: 'time',
    valueField: 'avg',
    minField: 'minmin',
    maxField: 'maxmax',
    min: 20,
    max: 90
  });

  const hoverItems = radialAreaViewTest.drawSymbols(host as never, group as never, seriesModel as never, layout, {
    x: 10,
    y: 20,
    width: 320,
    height: 320
  });

  const hitLine = data.graphicElements.get(0);
  assert.equal(hitLine?.type, 'line');
  assert.equal(hoverItems[0].triggerElements?.[0], hitLine);
  assert.equal(hitLine?.shape.x1, layout.centerX);
  assert.equal(hitLine?.shape.y1, layout.centerY);
  assert.ok(Number(hitLine?.style.lineWidth) >= 10, 'radial trigger should be wide enough to hover away from the point');

  const guideLine = group.children.find((element) => (
    element.type === 'line'
    && element !== hitLine
    && element.shape.x1 === hitLine?.shape.x1
    && element.shape.y1 === hitLine?.shape.y1
    && element.shape.x2 === hitLine?.shape.x2
    && element.shape.y2 === hitLine?.shape.y2
  ));
  assert.ok(guideLine, 'a visible hover guide line should be created for the trigger');
  assert.equal(guideLine?.style.opacity, 0);

  hitLine?.trigger('mouseover');
  assert.ok(Number(guideLine?.style.opacity) > 0, 'hovering the trigger should reveal the guide line');

  hitLine?.trigger('mouseout');
  assert.equal(guideLine?.style.opacity, 0);
});

test('keeps radial hit lines when hover indicators are hidden or visually disabled', () => {
  const host = createTestGraphicHost();
  const group = new TestGraphicGroup();
  const data = createTestSeriesData();
  const seriesModel = createTestSeriesModel(data);
  seriesModel.option.hoverIndicator.show = false;
  const layout = resolveRadialAreaLayout({
    data: seasonalWeatherData.slice(0, 4),
    width: 320,
    height: 320,
    padding: 30,
    angleField: 'date',
    angleType: 'time',
    valueField: 'avg',
    minField: 'minmin',
    maxField: 'maxmax',
    min: 20,
    max: 90
  });

  const hoverItems = radialAreaViewTest.drawSymbols(host as never, group as never, seriesModel as never, layout, {
    x: 10,
    y: 20,
    width: 320,
    height: 320
  });

  assert.equal(hoverItems.length, layout.points.length);
  assert.ok(group.children.every((element) => element.style.stroke === 'rgba(0,0,0,0)'));

  const ends = {
    inner: { x: layout.centerX, y: layout.centerY },
    outer: { x: layout.centerX, y: layout.centerY - layout.outerRadius }
  };
  assert.equal(radialAreaViewTest.createHoverIndicatorLine(
    host as never,
    createTestModel({ lineStyle: { width: 0, opacity: 1 } }) as never,
    ends
  ), null);
  assert.equal(radialAreaViewTest.createHoverIndicatorLine(
    host as never,
    createTestModel({ lineStyle: { width: 1, opacity: 0 } }) as never,
    ends
  ), null);
});

test('sets graphic style by merging when no setter is available', () => {
  const element = {
    style: {
      opacity: 0.1,
      fill: '#abcdef'
    }
  };

  radialAreaViewTest.setGraphicStyle(element as never, {
    opacity: 0.8,
    stroke: '#123456'
  });

  assert.deepEqual(element.style, {
    opacity: 0.8,
    fill: '#abcdef',
    stroke: '#123456'
  });
});

test('sets graphic shape through attr when the element delegates shape mutation', () => {
  const calls: Array<[unknown, unknown]> = [];
  const shape = { x1: 1, y1: 2, x2: 3, y2: 4 };
  const element = {
    attr(key: unknown, value: unknown): void {
      calls.push([key, value]);
    }
  };

  radialAreaViewTest.setGraphicShape(element as never, shape);

  assert.deepEqual(calls, [['shape', shape]]);
});

test('sets graphic style through attr when the element delegates style mutation', () => {
  const calls: Array<[unknown, unknown]> = [];
  const style = { opacity: 0.75, stroke: '#223344' };
  const element = {
    attr(key: unknown, value: unknown): void {
      calls.push([key, value]);
    }
  };

  radialAreaViewTest.setGraphicStyle(element as never, style);

  assert.deepEqual(calls, [['style', style]]);
});

test('supports array rows, dimensions, and explicit category order', () => {
  const result = resolveRadialAreaLayout({
    data: [
      ['October', 40, 34, 52],
      ['January', 50, 42, 64],
      ['July', 60, 50, 74],
      ['April', 70, 58, 80]
    ],
    dimensions: ['month', 'mean', 'low', 'high'],
    angleField: 'month',
    angleType: 'category',
    valueField: 'mean',
    minField: 'low',
    maxField: 'high',
    categories: ['January', 'April', 'July', 'October'],
    width: 300,
    height: 300,
    min: 20,
    max: 80
  });

  assert.deepEqual(
    result.points.map((point) => point.name),
    ['January', 'April', 'July', 'October']
  );
  assert.deepEqual(result.angleLabels.map((label) => label.name), ['January', 'April', 'July', 'October']);
});

test('sorts temporal data by time and keeps empty ranges out of the band', () => {
  const result = resolveRadialAreaLayout({
    data: [
      { time: '2000-07-01', value: 55 },
      { time: '2000-01-01', value: 44, low: 36, high: 56 },
      { time: '2000-04-01', value: 62, low: 52, high: 71 }
    ],
    angleField: 'time',
    angleType: 'time',
    valueField: 'value',
    minField: 'low',
    maxField: 'high',
    width: 320,
    height: 320
  });

  assert.deepEqual(
    result.points.map((point) => point.name),
    ['2000-01-01', '2000-04-01', '2000-07-01']
  );
  assert.equal(result.rangePolygon.length, 4);
  assert.ok(result.valueExtent.min <= 36);
  assert.ok(result.valueExtent.max >= 71);
});

function collectNameValueBlocks(
  fragment: unknown
): Array<{ name?: unknown; value?: unknown; markerColor?: unknown; noValue?: unknown }> {
  if (!fragment || typeof fragment !== 'object') return [];
  const record = fragment as {
    type?: string;
    blocks?: unknown[];
    name?: unknown;
    value?: unknown;
    markerColor?: unknown;
    noValue?: unknown;
  };
  if (record.type === 'nameValue') return [record];
  if (!Array.isArray(record.blocks)) return [];
  return record.blocks.flatMap((block) => collectNameValueBlocks(block));
}

type TooltipSeriesModelConfig = {
  itemStyle?: Record<string, unknown>;
  visualStyle?: Record<string, unknown>;
  getName?: (index: number) => string;
};

function createTooltipSeriesModel(
  option: Record<string, unknown> | undefined,
  config: TooltipSeriesModelConfig = {}
) {
  const data = {
    initData: () => undefined,
    count: () => Array.isArray(option?.data) ? option.data.length : 0,
    getItemModel: () => createTestModel({ itemStyle: config.itemStyle || {} }),
    getName: config.getName,
    getItemLayout: () => undefined,
    getItemVisual: (_dataIndex: number, key: string) => (key === 'style' ? config.visualStyle || {} : undefined),
    setItemLayout: () => undefined,
    setItemGraphicEl: () => undefined
  };

  return {
    option,
    getBoxLayoutParams: () => ({}),
    getData: () => data,
    get: (key: string) => option?.[key],
    getModel: (key: string | string[]) => createTestModel(Array.isArray(key)
      ? key.reduce<unknown>((current, item) => (
        current && typeof current === 'object'
          ? (current as Record<string, unknown>)[item]
          : undefined
      ), option)
      : option?.[key])
  };
}

class TestGraphicElement {
  readonly type: string;
  shape: Record<string, unknown>;
  style: Record<string, unknown>;
  silent?: boolean;
  invisible?: boolean;
  z2?: number;
  cursor?: string;
  private readonly handlers = new Map<string, Array<() => void>>();

  constructor(type: string, options: {
    shape?: Record<string, unknown>;
    style?: Record<string, unknown>;
    silent?: boolean;
    invisible?: boolean;
    z2?: number;
  }) {
    this.type = type;
    this.shape = { ...options.shape };
    this.style = { ...options.style };
    this.silent = options.silent;
    this.invisible = options.invisible;
    this.z2 = options.z2;
  }

  on(eventName: string, handler: () => void): void {
    const handlers = this.handlers.get(eventName) || [];
    handlers.push(handler);
    this.handlers.set(eventName, handlers);
  }

  setStyle(style: Record<string, unknown>): void {
    this.style = {
      ...this.style,
      ...style
    };
  }

  trigger(eventName: string): void {
    (this.handlers.get(eventName) || []).forEach((handler) => handler());
  }
}

class TestGraphicGroup {
  readonly children: TestGraphicElement[] = [];
  x = 0;
  y = 0;

  add(element: TestGraphicElement): void {
    this.children.push(element);
  }

  removeAll(): void {
    this.children.length = 0;
  }
}

function createTestGraphicHost() {
  return {
    graphic: {
      Circle: class extends TestGraphicElement {
        constructor(options: ConstructorParameters<typeof TestGraphicElement>[1]) {
          super('circle', options);
        }
      },
      Line: class extends TestGraphicElement {
        constructor(options: ConstructorParameters<typeof TestGraphicElement>[1]) {
          super('line', options);
        }
      }
    }
  };
}

function createTestSeriesData() {
  return {
    graphicElements: new Map<number, TestGraphicElement>(),
    count: () => seasonalWeatherData.length,
    getItemModel: () => createTestModel({}),
    getItemLayout: () => undefined,
    getItemVisual: () => ({}),
    setItemLayout: () => undefined,
    setItemGraphicEl(dataIndex: number, element: TestGraphicElement): void {
      this.graphicElements.set(dataIndex, element);
    }
  };
}

function createTestSeriesModel(data: ReturnType<typeof createTestSeriesData>) {
  const option = {
    showSymbol: false,
    symbolSize: 5,
    silent: false,
    itemStyle: {
      color: '#3f86bd',
      borderColor: '#ffffff',
      borderWidth: 1.5,
      opacity: 1
    },
    hoverIndicator: {
      show: true,
      lineStyle: {
        color: '#365f7f',
        width: 1.4,
        opacity: 0.84
      }
    }
  };
  return {
    option,
    getData: () => data,
    get: (key: string) => option[key as keyof typeof option],
    getModel: (key: string) => createTestModel(option[key as keyof typeof option])
  };
}

function createTestModel(values: unknown) {
  const record = values && typeof values === 'object' && !Array.isArray(values)
    ? values as Record<string, unknown>
    : {};
  return {
    get: (path: string | string[]) => {
      if (Array.isArray(path)) {
        return path.reduce<unknown>((current, key) => (
          current && typeof current === 'object'
            ? (current as Record<string, unknown>)[key]
            : undefined
        ), record);
      }
      return record[path];
    },
    getModel: (path: string | string[]) => createTestModel(Array.isArray(path)
      ? path.reduce<unknown>((current, key) => (
        current && typeof current === 'object'
          ? (current as Record<string, unknown>)[key]
          : undefined
      ), record)
      : record[path])
  };
}
