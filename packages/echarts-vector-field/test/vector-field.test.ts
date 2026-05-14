import assert from 'node:assert/strict';
import * as echarts from 'echarts';
import { test } from 'vitest';

import { __test__ as vectorFieldRenderer } from '../src/vector-field.ts';
import {
  layoutVectorField,
  normalizeVectorFieldData,
  resolveVectorFieldLayout
} from '../src/layout.ts';

const windSample = [
  { longitude: 0.125, latitude: 45.125, u: -2.3278859, v: -2.0757618 },
  { longitude: 0.375, latitude: 45.125, u: -2.418542, v: -2.1568856 },
  { longitude: 0.125, latitude: 45.375, u: -2.1537428, v: -1.8844506 },
  { longitude: 0.375, latitude: 45.375, u: -2.2439163, v: -1.9845597 }
];

test('normalizes AntV wind object records into vector tuples', () => {
  const points = normalizeVectorFieldData(windSample);

  assert.equal(points.length, 4);
  assert.deepEqual(points[0].coord, [0.125, 45.125]);
  assert.equal(points[0].u, -2.3278859);
  assert.equal(points[0].v, -2.0757618);
  assert.equal(Number(points[0].magnitude.toFixed(4)), 3.1189);
});

test('lays out wind vectors with north-up coordinates and stable arrow geometry', () => {
  const layout = layoutVectorField(windSample, {
    width: 240,
    height: 160,
    padding: 20,
    minLength: 6,
    maxLength: 24,
    arrowHeadLength: 5,
    invertY: true
  });

  assert.deepEqual(layout.xExtent, [0.125, 0.375]);
  assert.deepEqual(layout.yExtent, [45.125, 45.375]);
  assert.equal(layout.items.length, 4);
  assert.equal(layout.items[0].x, 20);
  assert.equal(layout.items[0].y, 140);
  assert.ok(layout.items[0].endX < layout.items[0].startX, 'negative u points left');
  assert.ok(layout.items[0].endY > layout.items[0].startY, 'negative v points down when north is up');
  assert.equal(Number(layout.items[0].length.toFixed(2)), 23.1);
  assert.equal(Number(layout.items[0].headLeftX.toFixed(2)), 13.3);
  assert.equal(Number(layout.items[0].headRightY.toFixed(2)), 146.31);
});

test('resolves series-style options and filters unusable vectors', () => {
  const layout = resolveVectorFieldLayout({
    data: [
      [10, 50, 3, 4],
      { x: 12, y: 52, u: 'bad', v: 1 },
      { lng: 14, lat: 54, u: -1, v: 0 }
    ],
    width: 300,
    height: 180,
    layoutOptions: {
      xExtent: [8, 16],
      yExtent: [48, 56]
    },
    padding: 30,
    maxLength: 20
  });

  assert.equal(layout.items.length, 2);
  assert.deepEqual(layout.xExtent, [8, 16]);
  assert.deepEqual(layout.yExtent, [48, 56]);
  assert.deepEqual(
    layout.items.map((item) => item.dataIndex),
    [0, 2]
  );
});

test('formats wind hover tooltip with vector component data', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 360,
    height: 240
  });

  try {
    chart.setOption({
      animation: false,
      series: [
        {
          type: 'vectorField',
          data: windSample,
          samplingStep: 1
        }
      ]
    });

    const seriesModel = chart.getModel().getSeriesByIndex(0) as unknown as {
      formatTooltip(dataIndex: number, multipleSeries?: boolean, dataType?: string | null): unknown;
    };
    const tooltip = seriesModel.formatTooltip(0, false, null) as {
      header?: unknown;
      blocks?: Array<{ name?: unknown; value?: unknown; noValue?: boolean }>;
    };

    assert.equal(tooltip.header, '0.125, 45.125');
    assert.deepEqual(
      tooltip.blocks?.map((block) => [block.name, block.value, block.noValue]),
      [
        ['longitude', 0.125, false],
        ['latitude', 45.125, false],
        ['u', -2.3278859, false],
        ['v', -2.0757618, false],
        ['speed', 3.1189, false]
      ]
    );
  } finally {
    chart.dispose();
  }
});

test('formats fallback tooltip headers for sparse vector data', () => {
  assert.equal(createFallbackTooltipHeader([{ name: 'Named wind' }], 0, 4), 'Named wind');
  assert.equal(createFallbackTooltipHeader([{ longitude: 1 }], 0, 4), 'Vector 1');
  assert.equal(createFallbackTooltipHeader([{ longitude: 1 }], -1, 4), 'Vector 4');
  assert.equal(createFallbackTooltipHeader(undefined, 1, 4), 'Vector 2');
});

test('covers vector tooltip fallback branches', () => {
  const sparseTooltip = vectorFieldRenderer.formatVectorFieldTooltip(
    createTooltipSeriesModel({
      data: [{ longitude: 'bad' }],
      fields: { xField: '', yField: 42 },
      count: 3
    }),
    1
  ) as { header?: unknown; blocks?: unknown[] };
  assert.equal(sparseTooltip.header, 'Vector 2');
  assert.deepEqual(sparseTooltip.blocks, []);

  const missingOptionTooltip = vectorFieldRenderer.formatVectorFieldTooltip(
    createTooltipSeriesModel({ option: null, count: 2 }),
    -1
  ) as { header?: unknown; blocks?: unknown[] };
  assert.equal(missingOptionTooltip.header, 'Vector 2');
  assert.deepEqual(missingOptionTooltip.blocks, []);

  assert.deepEqual(vectorFieldRenderer.readTooltipFieldOptions(createTooltipSeriesModel({
    fields: { xField: 'lng', yField: 'lat', uField: 'east', vField: 'north' }
  })), {
    xField: 'lng',
    yField: 'lat',
    uField: 'east',
    vField: 'north'
  });
  assert.equal(vectorFieldRenderer.readTooltipFieldName(createTooltipSeriesModel({ fields: { xField: '' } }), 'xField', 'x'), 'x');
  assert.equal(vectorFieldRenderer.readTooltipFieldName(createTooltipSeriesModel({ fields: { xField: 1 } }), 'xField', 'x'), 'x');
});

test('covers vector tooltip marker and value formatting fallbacks', () => {
  assert.equal(vectorFieldRenderer.readTooltipMarkerColor(createTooltipSeriesModel({
    itemLineStyle: { color: '#111111' }
  }), 0), '#111111');
  assert.equal(vectorFieldRenderer.readTooltipMarkerColor(createTooltipSeriesModel({
    itemStyle: { color: '#222222' }
  }), 0), '#222222');
  assert.equal(vectorFieldRenderer.readTooltipMarkerColor(createTooltipSeriesModel({
    lineStyle: { color: '#333333' }
  }), 0), '#333333');
  assert.equal(vectorFieldRenderer.readTooltipMarkerColor(createTooltipSeriesModel({
    visualStyle: { stroke: '#444444' }
  }), 0), '#444444');
  assert.equal(vectorFieldRenderer.readTooltipMarkerColor(createTooltipSeriesModel({
    visualStyle: { fill: '#555555' }
  }), 0), '#555555');
  assert.equal(vectorFieldRenderer.readTooltipMarkerColor(createTooltipSeriesModel({ count: 1 }), -1), '#2563eb');
  assert.equal(vectorFieldRenderer.readTooltipMarkerColor(createTooltipSeriesModel({ count: 1 }), 3), '#7c3aed');

  assert.deepEqual(vectorFieldRenderer.createTooltipBlock('empty', null, '#000000', 0), {
    type: 'nameValue',
    markerType: 'subItem',
    markerColor: '#000000',
    name: 'empty',
    value: null,
    noValue: true,
    dataIndex: 0
  });
  assert.equal(vectorFieldRenderer.isEmptyTooltipValue(undefined), true);
  assert.equal(vectorFieldRenderer.isEmptyTooltipValue(''), true);
  assert.equal(vectorFieldRenderer.isEmptyTooltipValue(Number.NaN), true);
  assert.equal(vectorFieldRenderer.isEmptyTooltipValue('ok'), false);
  assert.equal(vectorFieldRenderer.isEmptyTooltipValue(1), false);
  assert.equal(vectorFieldRenderer.roundTooltipNumber(Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY);
  assert.equal(vectorFieldRenderer.formatTooltipNumber(Number.POSITIVE_INFINITY), 'Infinity');
});

function createFallbackTooltipHeader(data: unknown, dataIndex: number, count: number): string {
  return vectorFieldRenderer.fallbackTooltipHeader({
    option: data === undefined ? undefined : { data },
    getData: () => ({
      count: () => count
    })
  } as never, dataIndex);
}

function createTooltipSeriesModel({
  option = {},
  data = windSample,
  fields = {},
  lineStyle = {},
  itemLineStyle = {},
  itemStyle = {},
  visualStyle = {},
  count = Array.isArray(data) ? data.length : 0
}: {
  option?: { data?: unknown } | null;
  data?: unknown;
  fields?: Record<string, unknown>;
  lineStyle?: Record<string, unknown>;
  itemLineStyle?: Record<string, unknown>;
  itemStyle?: Record<string, unknown>;
  visualStyle?: Record<string, unknown>;
  count?: number;
} = {}) {
  const modelOption = option === null ? null : { ...option, data };
  return {
    option: modelOption,
    get(path: string | string[]) {
      if (path === 'lineStyle') return lineStyle;
      if (typeof path === 'string') return fields[path];
      return undefined;
    },
    getData: () => ({
      count: () => count,
      getItemModel: () => ({
        get(path: string | string[]) {
          if (path === 'lineStyle') return itemLineStyle;
          if (path === 'itemStyle') return itemStyle;
          return undefined;
        }
      }),
      getItemVisual: () => visualStyle
    })
  } as never;
}
