import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as echarts from 'echarts';
import { test } from 'vitest';

import { __test__ as rendererInternals } from '../src/error-chart.ts';
import {
  __test__ as layoutInternals,
  layoutErrorChart,
  resolveErrorChartLayout
} from '../src/layout.ts';

const surveyData = [
  { month: 'Jan', duration: 28, low: 18, high: 40 },
  { month: 'Feb', duration: 54, lowerError: 10, upperError: 8 },
  { month: 'Mar', duration: 88, low: 76, high: 100 }
];

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
  assert.equal(packageJson.dependencies?.d3, undefined);
});

test('computes deterministic column error bars with absolute and relative ranges', () => {
  const first = layoutErrorChart(surveyData, {
    variant: 'column',
    width: 520,
    height: 340,
    padding: { top: 24, right: 32, bottom: 58, left: 64 },
    categoryField: 'month',
    valueField: 'duration',
    min: 0,
    max: 120,
    baseline: 0,
    tickCount: 5
  });
  const second = layoutErrorChart(surveyData, {
    variant: 'column',
    width: 520,
    height: 340,
    padding: { top: 24, right: 32, bottom: 58, left: 64 },
    categoryField: 'month',
    valueField: 'duration',
    min: 0,
    max: 120,
    baseline: 0,
    tickCount: 5
  });

  assert.deepEqual(first, second);
  assert.equal(first.variant, 'column');
  assert.deepEqual(first.categories, ['Jan', 'Feb', 'Mar']);
  assert.deepEqual(first.valueExtent, { min: 0, max: 120 });
  assert.deepEqual(first.valueTicks.map((tick) => tick.value), [0, 30, 60, 90, 120]);

  const [jan, feb, mar] = first.points;
  assert.equal(jan.lower, 18);
  assert.equal(jan.upper, 40);
  assert.equal(feb.lower, 44);
  assert.equal(feb.upper, 62);
  assert.ok(jan.lowerY > jan.y, 'lower error projects below the value');
  assert.ok(jan.upperY < jan.y, 'upper error projects above the value');
  assert.ok(mar.x > jan.x, 'later categories move right');
  assert.equal(jan.baseY, first.plot.bottom);
});

test('supports horizontal bar orientation from the same data shape', () => {
  const result = resolveErrorChartLayout({
    data: surveyData,
    variant: 'bar',
    width: 460,
    height: 320,
    padding: 40,
    categoryField: 'month',
    valueField: 'duration',
    min: 0,
    max: 120,
    baseline: 0
  });

  const jan = result.points[0];
  assert.equal(result.variant, 'bar');
  assert.equal(result.orientation, 'horizontal');
  assert.equal(jan.baseX, result.plot.left);
  assert.ok(jan.x > jan.baseX, 'positive bars extend right');
  assert.ok(jan.lowerX < jan.x, 'lower error projects left of value');
  assert.ok(jan.upperX > jan.x, 'upper error projects right of value');
});

test('computes scatter x and y error ranges on two numeric axes', () => {
  const result = layoutErrorChart([
    { name: 'A', x: 10, y: 30, xLow: 8, xHigh: 13, yLow: 24, yHigh: 42 },
    { name: 'B', x: 24, y: 52, xMinus: 4, xPlus: 6, yMinus: 8, yPlus: 10 }
  ], {
    variant: 'scatter',
    width: 420,
    height: 300,
    padding: { top: 20, right: 30, bottom: 46, left: 54 },
    xMin: 0,
    xMax: 40,
    min: 0,
    max: 80,
    tickCount: 5
  });

  assert.equal(result.variant, 'scatter');
  assert.equal(result.orientation, 'cartesian');
  assert.deepEqual(result.xExtent, { min: 0, max: 40 });
  assert.deepEqual(result.valueExtent, { min: 0, max: 80 });
  assert.equal(result.points[0].xLower, 8);
  assert.equal(result.points[0].xUpper, 13);
  assert.equal(result.points[1].xLower, 20);
  assert.equal(result.points[1].xUpper, 30);
  assert.ok(result.points[0].xLowerX < result.points[0].x);
  assert.ok(result.points[0].xUpperX > result.points[0].x);
  assert.ok(result.points[0].lowerY > result.points[0].y);
  assert.ok(result.points[0].upperY < result.points[0].y);
});

test('treats scatter variants as cartesian point error charts', () => {
  const result = layoutErrorChart([
    { name: 'Dress', x: 680, y: 790, xMinus: 18, xPlus: 12, yMinus: 30, yPlus: 34 }
  ], {
    variant: 'scatter',
    xMin: 0,
    xMax: 800,
    min: 0,
    max: 900
  });

  assert.equal(result.variant, 'scatter');
  assert.equal(result.orientation, 'cartesian');
  assert.equal(result.points[0].xValue, 680);
  assert.equal(result.points[0].value, 790);
  assert.ok(result.points[0].xLowerX < result.points[0].x);
  assert.ok(result.points[0].xUpperX > result.points[0].x);
  assert.ok(result.points[0].lowerY > result.points[0].y);
  assert.ok(result.points[0].upperY < result.points[0].y);
  assert.equal(result.orientation, 'cartesian');
});

test('maps configured fields into ECharts data for tooltip hover values', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 480,
    height: 320
  });

  try {
    chart.setOption({
      series: [
        {
          type: 'errorChart',
          data: surveyData,
          categoryField: 'month',
          valueField: 'duration',
          lowField: 'low',
          highField: 'high',
          lowerErrorField: 'lowerError',
          upperErrorField: 'upperError'
        }
      ]
    });

    const seriesModel = chart.getModel().getSeriesByIndex(0);
    const data = seriesModel.getData();

    assert.equal(data.getName(0), 'Jan');
    assert.equal(data.get('value', 0), 28);
    assert.equal(data.get('lower', 0), 18);
    assert.equal(data.get('upper', 0), 40);
    assert.equal(data.getName(1), 'Feb');
    assert.equal(data.get('lower', 1), 44);
    assert.equal(data.get('upper', 1), 62);
    assert.ok(Array.isArray((seriesModel as never as { getTooltipPosition(index: number): unknown }).getTooltipPosition(0)));
  } finally {
    chart.dispose();
  }
});

test('binds rendered error elements to tooltip data indexes', () => {
  const ecData = new WeakMap<object, Record<string, unknown>>();
  const host = createTooltipBindingHost(ecData);
  const group = new TestGraphicGroup();
  const data = createTooltipSeriesData();
  const seriesModel = createTooltipSeriesModel(data);
  const layout = {
    variant: 'column',
    points: [
      {
        id: 'jan',
        name: 'Jan',
        category: 'Jan',
        categoryValue: 'Jan',
        value: 28,
        lower: 18,
        upper: 40,
        x: 30,
        y: 60,
        baseX: 30,
        baseY: 120,
        lowerX: 30,
        lowerY: 82,
        upperX: 30,
        upperY: 44,
        xValue: 0,
        xLower: 0,
        xUpper: 0,
        xLowerX: 30,
        xUpperX: 30,
        dataIndex: 0,
        raw: surveyData[0]
      }
    ]
  };

  const hoverItems = rendererInternals.drawSeries(host as never, group as never, seriesModel as never, layout as never, {
    x: 8,
    y: 12,
    width: 180,
    height: 160
  });

  assert.equal(hoverItems.length, 1);
  assert.deepEqual(data.layout, [38, 72]);

  const triggerElements = hoverItems[0].triggerElements || [];
  assert.ok(triggerElements.length >= 3);
  triggerElements.forEach((element) => {
    assert.deepEqual(ecData.get(element), {
      dataIndex: 0,
      dataType: 'errorChart',
      seriesIndex: 4,
      ssrType: 'chart'
    });
  });
});

test('covers layout fallback branches for sparse and mixed error chart data', () => {
  const {
    cleanNumber,
    createCategoryLabel,
    createPlotRect,
    createTicks,
    createValueTick,
    finiteNumber,
    normalizeCategories,
    normalizeDimensions,
    normalizeFinalExtent,
    normalizePadding,
    niceStep,
    orderByCategory,
    projectCategoryX,
    projectCategoryY,
    readErrorRange,
    readField,
    readFieldOption,
    readOrientationOption,
    readPaddingOption,
    readVariant,
    readVariantOption,
    resolveCategories,
    resolveNumericExtent,
    resolveOrientation,
    stringifyName,
    unique
  } = layoutInternals;
  const plot = createPlotRect(100, 80, { top: 10, right: 10, bottom: 10, left: 10 });

  assert.equal(resolveErrorChartLayout({
    data: null as never
  }).points.length, 0);
  assert.equal(resolveErrorChartLayout({
    data: [{ month: 'A', duration: 3, low: 2, high: 4 }],
    layoutOptions: {
      width: 180,
      height: 120,
      padding: 8,
      variant: 'bar',
      orientation: 'horizontal',
      categoryField: 'month',
      valueField: 'duration',
      lowField: 'low',
      highField: 'high',
      min: 0,
      max: 5,
      baseline: 0,
      tickCount: 2,
      nice: false
    }
  }).orientation, 'horizontal');
  assert.equal(resolveErrorChartLayout({
    data: [{ x: 1, y: 2, xLow: 0, xHigh: 3, yLow: 1, yHigh: 4 }],
    layout: {
      width: 180,
      height: 120,
      padding: 8,
      variant: 'scatter',
      xField: 'x',
      yField: 'y',
      xLowField: 'xLow',
      xHighField: 'xHigh',
      yLowField: 'yLow',
      yHighField: 'yHigh',
      xMin: 0,
      xMax: 4,
      min: 0,
      max: 5
    }
  }).variant, 'scatter');

  assert.deepEqual(normalizePadding(6), { top: 6, right: 6, bottom: 6, left: 6 });
  assert.deepEqual(normalizePadding(undefined), { top: 48, right: 48, bottom: 48, left: 48 });
  assert.deepEqual(readPaddingOption({ top: '1', right: 'x', bottom: 3, left: 4 }), {
    top: 1,
    right: undefined,
    bottom: 3,
    left: 4
  });
  assert.equal(readPaddingOption('bad'), undefined);
  assert.deepEqual(normalizeDimensions(['a', 2, 'b']), ['a', 'b']);
  assert.deepEqual(normalizeCategories(['A', 2, null]), ['A', '2', '']);
  assert.equal(readField(['A', 2], 'value', ['name', 'value'], 0, []), 2);
  assert.equal(readField(['A', 2], 1, undefined, 0, []), 2);
  assert.equal(readField(['A'], 'missing', undefined, -1, []), undefined);
  assert.equal(readField({ total: 7 }, 'missing', undefined, 0, ['total']), 7);
  assert.equal(readField({ total: 7 }, 0, undefined, 0, []), undefined);
  assert.equal(readField(null, 'value', undefined, 0, []), undefined);
  assert.deepEqual(readErrorRange({ value: 10, low: 12, high: 4 }, {}, undefined, 10, {
    lowIndex: 1,
    highIndex: 2,
    lowNames: ['low'],
    highNames: ['high'],
    minusNames: ['minus'],
    plusNames: ['plus']
  }), { lower: 4, upper: 12 });
  assert.deepEqual(readErrorRange({ value: 10, minus: 2, plus: 3 }, {}, undefined, 10, {
    lowIndex: 1,
    highIndex: 2,
    lowNames: ['low'],
    highNames: ['high'],
    minusNames: ['minus'],
    plusNames: ['plus']
  }), { lower: 8, upper: 13 });
  assert.deepEqual(layoutErrorChart([{ month: 'Bad', duration: Number.NaN }], {
    categoryField: 'month',
    valueField: 'duration'
  }).points, []);
  assert.deepEqual(layoutErrorChart([{ x: Number.NaN, y: 1 }], {
    variant: 'scatter'
  }).points, []);
  assert.deepEqual(resolveCategories([
    { category: 'B', dataIndex: 1 },
    { category: 'A', dataIndex: 0 }
  ] as never, { categories: ['A'] }), ['A']);
  assert.deepEqual(orderByCategory([
    { category: 'B', dataIndex: 0 },
    { category: 'A', dataIndex: 1 }
  ] as never, ['A', 'B']).map((item) => item.category), ['A', 'B']);
  assert.deepEqual(resolveNumericExtent([], undefined, undefined, 3, true), { min: 0, max: 1 });
  assert.deepEqual(resolveNumericExtent([5], undefined, undefined, 3, false), { min: 4, max: 6 });
  assert.deepEqual(resolveNumericExtent([2, 8], 10, 0, 3, true), { min: 0, max: 10 });
  assert.deepEqual(normalizeFinalExtent(4, 4), { min: 4, max: 5 });
  assert.deepEqual(createTicks(0, 10, 1), [0, 10]);
  assert.equal(createValueTick(5, 'horizontal', { min: 0, max: 10 }, plot).x, 50);
  assert.equal(createCategoryLabel('A', 0, 1, 'vertical', plot).x, 50);
  assert.equal(createCategoryLabel('A', 0, 1, 'horizontal', plot).y, 40);
  assert.equal(projectCategoryX(0, 1, plot), 50);
  assert.equal(projectCategoryY(0, 1, plot), 40);
  assert.equal(readVariant('scatter'), 'scatter');
  assert.equal(readVariant('bad'), 'column');
  assert.equal(readVariantOption('scatter'), 'scatter');
  assert.equal(readVariantOption('line'), 'line');
  assert.equal(readVariantOption('bad'), undefined);
  assert.equal(resolveOrientation('bar', undefined), 'horizontal');
  assert.equal(resolveOrientation('scatter', undefined), 'cartesian');
  assert.equal(resolveOrientation('column', 'horizontal'), 'horizontal');
  assert.equal(readOrientationOption('vertical'), 'vertical');
  assert.equal(readOrientationOption('bad'), undefined);
  assert.equal(readFieldOption(1), 1);
  assert.equal(readFieldOption(false), undefined);
  assert.deepEqual(unique(['a', 'a', 'b']), ['a', 'b']);
  assert.equal(stringifyName(42), '42');
  assert.equal(stringifyName(null), '');
  assert.equal(finiteNumber('12', 0), 12);
  assert.equal(finiteNumber('bad', 9), 9);
  assert.equal(cleanNumber(-0), 0);
});

test('covers renderer helpers for hidden axes, scatter, bar, labels, and animations', () => {
  const ecData = new WeakMap<object, Record<string, unknown>>();
  const host = createTooltipBindingHost(ecData);
  const group = new TestGraphicGroup();
  const baseLayout = layoutErrorChart([
    { month: 'A', duration: 5, low: 3, high: 8 },
    { month: 'B', duration: 8, low: 6, high: 10 }
  ], {
    variant: 'line',
    width: 220,
    height: 180,
    padding: 20,
    categoryField: 'month',
    valueField: 'duration',
    min: 0,
    max: 10,
    baseline: 0
  });
  const data = createRenderSeriesData(4);
  const seriesModel = createRenderSeriesModel(data, {
    animation: true,
    animationDelay: (item: unknown, index: number) => index + 1,
    animationDuration: 12,
    animationEasing: 'linear',
    barWidth: null,
    capWidth: 10,
    enterAnimation: { stagger: 3 },
    label: { show: true, formatter: '{b}:{c}:{lower}:{upper}:{category}' },
    lineStyle: { type: 'dotted' },
    silent: true,
    symbolSize: 6
  });

  rendererInternals.drawAxes(host as never, group as never, seriesModel as never, {
    ...baseLayout,
    variant: 'scatter',
    orientation: 'cartesian',
    xTicks: baseLayout.valueTicks,
    categoryLabels: []
  } as never);
  const hoverItems = rendererInternals.drawSeries(host as never, group as never, seriesModel as never, baseLayout as never, {
    x: 2,
    y: 4,
    width: 220,
    height: 180
  });
  assert.equal(hoverItems.length, 2);
  assert.ok(group.children.length > 0);
  assert.deepEqual(rendererInternals.drawSeries(host as never, group as never, seriesModel as never, {
    ...baseLayout,
    points: [{ ...baseLayout.points[0], dataIndex: 99 }]
  } as never, {
    x: 0,
    y: 0,
    width: 220,
    height: 180
  }), []);

  const barLayout = layoutErrorChart([{ month: 'A', duration: 5, low: 3, high: 8 }], {
    variant: 'bar',
    width: 220,
    height: 180,
    padding: 20,
    categoryField: 'month',
    valueField: 'duration'
  });
  const bar = rendererInternals.createHorizontalBar(host as never, seriesModel as never, data as never, createTooltipModel({}) as never, barLayout.points[0] as never, barLayout as never);
  assert.equal(bar.shape?.height, rendererInternals.readBandWidth(seriesModel as never, barLayout as never));
  assert.equal(rendererInternals.drawErrorBars(host as never, group as never, seriesModel as never, createTooltipModel({}) as never, barLayout.points[0] as never, barLayout as never).length, 3);
  assert.equal(rendererInternals.createHitElement(host as never, seriesModel as never, barLayout.points[0] as never, barLayout as never).shape?.height, 42);
  assert.equal(rendererInternals.drawSeries(host as never, group as never, seriesModel as never, barLayout as never, {
    x: 0,
    y: 0,
    width: 220,
    height: 180
  }).length, 1);

  const scatterLayout = layoutErrorChart([{ name: 'S', x: 1, y: 2, xLow: 0, xHigh: 3, yLow: 1, yHigh: 4 }], {
    variant: 'scatter',
    width: 220,
    height: 180,
    padding: 20,
    xMin: 0,
    xMax: 4,
    min: 0,
    max: 5
  });
  assert.equal(rendererInternals.drawErrorBars(host as never, group as never, seriesModel as never, createTooltipModel({}) as never, scatterLayout.points[0] as never, scatterLayout as never).length, 6);
  assert.ok(rendererInternals.drawSymbol(host as never, group as never, seriesModel as never, data as never, createTooltipModel({}) as never, scatterLayout.points[0] as never, rendererInternals.readEnterAnimation(seriesModel as never, 0)));
  const zeroSymbolModel = createRenderSeriesModel(data, { animation: false, symbolSize: 0 });
  assert.equal(rendererInternals.drawSymbol(host as never, group as never, zeroSymbolModel as never, data as never, createTooltipModel({}) as never, scatterLayout.points[0] as never, rendererInternals.disabledEnterAnimation()), null);

  const hiddenModel = createTooltipModel({
    show: false,
    splitLine: { show: false },
    axisLine: { show: false },
    label: { show: false }
  });
  rendererInternals.drawSplitLines(host as never, group as never, hiddenModel as never, baseLayout.valueTicks as never);
  rendererInternals.drawAxisLine(host as never, group as never, hiddenModel as never, baseLayout as never, 'left');
  rendererInternals.drawValueAxisLabels(host as never, group as never, hiddenModel as never, baseLayout as never);
  rendererInternals.drawXValueAxisLabels(host as never, group as never, hiddenModel as never, scatterLayout as never);
  rendererInternals.drawCategoryAxisLabels(host as never, group as never, hiddenModel as never, baseLayout as never);

  const namedAxisModel = createTooltipModel({
    name: 'Value',
    nameTextStyle: { color: '#111', fontSize: '13', fontWeight: 700 },
    label: { show: true, formatter: (value: unknown) => `v${value}` }
  });
  rendererInternals.drawValueAxisLabels(host as never, group as never, namedAxisModel as never, baseLayout as never);
  rendererInternals.drawValueAxisLabels(host as never, group as never, namedAxisModel as never, barLayout as never);
  rendererInternals.drawXValueAxisLabels(host as never, group as never, namedAxisModel as never, scatterLayout as never);
  const xNameGroup = new TestGraphicGroup();
  rendererInternals.drawXValueAxisLabels(host as never, xNameGroup as never, createTooltipModel({
    name: 'Cost',
    nameTextStyle: { color: '#222', fontSize: '14', fontWeight: 650 },
    label: { show: true }
  }) as never, scatterLayout as never);
  assert.ok(xNameGroup.children.some((element) => element.style?.text === 'Cost'));
  rendererInternals.drawCategoryAxisLabels(host as never, group as never, createTooltipModel({ label: { show: true, rotate: 45 } }) as never, baseLayout as never);
  rendererInternals.drawPointLabels(host as never, group as never, seriesModel as never, baseLayout.points as never, new Map());
  rendererInternals.drawPointLabels(host as never, group as never, createRenderSeriesModel(data, {
    label: { show: true },
    animation: false
  }) as never, baseLayout.points as never, new Map([[baseLayout.points[0].dataIndex, { elements: [] } as never]]));
  const hiddenLabelData = {
    ...data,
    getItemModel: () => createTooltipModel({ label: { show: false } })
  };
  rendererInternals.drawPointLabels(host as never, group as never, createRenderSeriesModel(hiddenLabelData, {
    label: { show: true },
    animation: false
  }) as never, baseLayout.points as never, new Map());

  const animatedElement: Record<string, unknown> = {
    shape: {},
    animate: () => ({
      when: (_duration: number, target: Record<string, unknown>) => ({
        delay: (_delay: number) => ({
          start: (_easing: string) => Object.assign(animatedElement.shape as object, target)
        }),
        start: (_easing: string) => Object.assign(animatedElement.shape as object, target)
      })
    })
  };
  rendererInternals.applyCircleEnterAnimation(animatedElement as never, 5, { enabled: true, duration: 10, delay: 1, easing: 'linear' });
  assert.equal((animatedElement.shape as Record<string, unknown>).r, 5);
  rendererInternals.applyCircleEnterAnimation({ shape: { r: 3 } } as never, 5, rendererInternals.disabledEnterAnimation());
  rendererInternals.applyRectEnterAnimation({ shape: {} } as never, barLayout.points[0] as never, barLayout as never, { enabled: true, duration: 10, delay: 0, easing: 'linear' });
  rendererInternals.applyFadeEnterAnimation({ style: { opacity: 'bad' } } as never, { enabled: true, duration: 10, delay: 0, easing: 'linear' });
  assert.deepEqual(rendererInternals.readLineDash([1, 'x', 2]), [1, 2]);
  assert.deepEqual(rendererInternals.readLineDash('dashed'), [5, 6]);
  assert.deepEqual(rendererInternals.readLineDash('dotted'), [1.5, 5]);
  assert.equal(rendererInternals.formatAxisLabel((value: unknown) => `#${value}`, 3), '#3');
  assert.equal(rendererInternals.formatLabel((params: { name: string }) => params.name, baseLayout.points[0] as never), 'A');
  assert.equal(rendererInternals.formatLabel(null, baseLayout.points[0] as never), 5);
  assert.equal(rendererInternals.resolveAnimationNumber((item: unknown, index: number) => index * 2, null, 3, 0), 6);
  assert.equal(rendererInternals.resolveAnimationEasing(''), 'cubicOut');
  assert.equal(rendererInternals.readEnterAnimation(createRenderSeriesModel(data, {
    animation: true,
    enterAnimation: { show: false }
  }) as never, 0).enabled, false);
  rendererInternals.addHoverElement(undefined, {} as never);
  const hoverItem = { elements: [] as unknown[] };
  rendererInternals.addHoverElement(hoverItem as never, { id: 'label' } as never);
  assert.equal(hoverItem.elements.length, 1);
  assert.equal(rendererInternals.stringifySeriesName(''), '');
  assert.equal(rendererInternals.stringifySeriesName('abc'), 'abc');
  assert.equal(layoutInternals.niceStep(0.1), 0.1);
  assert.equal(rendererInternals.stringifySeriesName(7), '7');
  assert.equal(rendererInternals.finiteNumber('2', 0), 2);
  assert.equal(rendererInternals.finiteNumber('x', 4), 4);
  assert.deepEqual(rendererInternals.asRecord([]), {});
});

test('reveals lines and delays bar error lines during enter animation', () => {
  const host = createTooltipBindingHost(new WeakMap<object, Record<string, unknown>>());
  const data = createRenderSeriesData(3);
  const seriesModel = createRenderSeriesModel(data, {
    animation: true,
    animationDuration: 24,
    animationEasing: 'linear',
    barWidth: 12,
    capWidth: 8,
    enterAnimation: { duration: 24, delay: 0, stagger: 100 },
    errorBarStyle: { width: 1.4 },
    itemStyle: {},
    lineStyle: {},
    silent: false,
    symbolSize: 6
  });
  const lineLayout = layoutErrorChart([
    { month: 'A', duration: 3, low: 2, high: 4 },
    { month: 'B', duration: 5, low: 3, high: 8 },
    { month: 'C', duration: 8, low: 6, high: 9 }
  ], {
    variant: 'line',
    width: 260,
    height: 180,
    padding: 20,
    categoryField: 'month',
    valueField: 'duration',
    min: 0,
    max: 10,
    baseline: 0
  });
  const lineGroup = new TestGraphicGroup();

  rendererInternals.drawSeries(host as never, lineGroup as never, seriesModel as never, lineLayout as never, {
    x: 0,
    y: 0,
    width: 260,
    height: 180
  });

  const line = lineGroup.children.find((element) => Array.isArray(element.shape?.points));
  assert.deepEqual(line?.shape?.points, lineLayout.points.map((point) => [point.x, point.y]));
  assert.equal(line?.clipPath?.shape?.x, lineLayout.plot.left);
  assert.equal(line?.clipPath?.shape?.y, lineLayout.plot.top);
  assert.equal(line?.clipPath?.shape?.width, 0);
  assert.equal(line?.clipPath?.shape?.height, lineLayout.plot.height);
  assert.deepEqual(line?.clipPath?.animations[0]?.target, {
    width: lineLayout.plot.width
  });
  assert.equal(line?.clipPath?.animations[0]?.duration, 24);
  assert.equal(line?.clipPath?.animations[0]?.delay, 0);
  const symbols = lineGroup.children.filter((element) => element.shape?.cx != null);
  assert.deepEqual(symbols.map((symbol) => symbol.animations[0]?.delay), [0, 12, 24]);

  const columnLayout = layoutErrorChart([{ month: 'A', duration: 5, low: 3, high: 8 }], {
    variant: 'column',
    width: 220,
    height: 180,
    padding: 20,
    categoryField: 'month',
    valueField: 'duration',
    min: 0,
    max: 10,
    baseline: 0
  });
  const columnPoint = columnLayout.points[0];
  const columnBar = rendererInternals.createColumnBar(host as never, seriesModel as never, data as never, createTooltipModel({}) as never, columnPoint as never, columnLayout as never);

  rendererInternals.applyRectEnterAnimation(columnBar as never, columnPoint as never, columnLayout as never, { enabled: true, duration: 24, delay: 0, easing: 'linear' });

  assert.equal(columnBar.shape?.y, columnPoint.baseY);
  assert.equal(columnBar.shape?.height, 0);
  assert.deepEqual(columnBar.animations[0]?.target, {
    y: Math.min(columnPoint.y, columnPoint.baseY),
    height: Math.max(1, Math.abs(columnPoint.baseY - columnPoint.y))
  });

  const barLayout = layoutErrorChart([{ month: 'A', duration: 5, low: 3, high: 8 }], {
    variant: 'bar',
    width: 220,
    height: 180,
    padding: 20,
    categoryField: 'month',
    valueField: 'duration',
    min: 0,
    max: 10,
    baseline: 0
  });
  const barPoint = barLayout.points[0];
  const horizontalBar = rendererInternals.createHorizontalBar(host as never, seriesModel as never, data as never, createTooltipModel({}) as never, barPoint as never, barLayout as never);

  rendererInternals.applyRectEnterAnimation(horizontalBar as never, barPoint as never, barLayout as never, { enabled: true, duration: 24, delay: 0, easing: 'linear' });

  assert.equal(horizontalBar.shape?.x, barPoint.baseX);
  assert.equal(horizontalBar.shape?.width, 0);
  assert.deepEqual(horizontalBar.animations[0]?.target, {
    x: Math.min(barPoint.x, barPoint.baseX),
    width: Math.max(1, Math.abs(barPoint.x - barPoint.baseX))
  });

  const group = new TestGraphicGroup();
  rendererInternals.drawSeries(host as never, group as never, seriesModel as never, columnLayout as never, {
    x: 0,
    y: 0,
    width: 220,
    height: 180
  });

  const errorLines = group.children.filter((element) => element.shape?.x1 != null && element.shape?.x2 != null);
  assert.equal(errorLines.length, 3);
  assert.ok(errorLines.every((element) => element.style?.opacity === 0));
  assert.ok(errorLines.every((element) => element.animations.some((animation) => animation.key === 'style')));
  assert.ok(errorLines.every((element) => element.animations.find((animation) => animation.key === 'style')?.delay === 24));

  const horizontalGroup = new TestGraphicGroup();
  rendererInternals.drawSeries(host as never, horizontalGroup as never, seriesModel as never, barLayout as never, {
    x: 0,
    y: 0,
    width: 220,
    height: 180
  });
  const horizontalErrorLines = horizontalGroup.children.filter((element) => element.shape?.x1 != null && element.shape?.x2 != null);
  assert.equal(horizontalErrorLines.length, 3);
  assert.ok(horizontalErrorLines.every((element) => element.style?.opacity === 0));
  assert.ok(horizontalErrorLines.every((element) => element.animations.find((animation) => animation.key === 'style')?.delay === 24));
});

test('delays line-symbol animation by vertical line-reveal ratio', () => {
  const ecData = new WeakMap<object, Record<string, unknown>>();
  const host = createTooltipBindingHost(ecData);
  const group = new TestGraphicGroup();
  const layout = layoutErrorChart([
    { month: 'Start', duration: 0 },
    { month: 'End', duration: 100 }
  ], {
    variant: 'line',
    width: 220,
    height: 180,
    padding: 20,
    categoryField: 'month',
    valueField: 'duration',
    min: 0,
    max: 100,
    orientation: 'vertical',
    baseline: 0
  });
  const data = createRenderSeriesData(2);
  const seriesModel = createRenderSeriesModel(data, {
    animation: true,
    enterAnimation: {
      duration: 140,
      delay: 0,
      stagger: 0,
      easing: 'linear'
    }
  });

  rendererInternals.drawSeries(host as never, group as never, seriesModel as never, layout as never, {
    x: 0,
    y: 0,
    width: 220,
    height: 180
  });

  const symbols = group.children.filter((element) => element.shape?.cx != null);
  assert.equal(symbols.length, 2);
  assert.equal(symbols[0].animations[0]?.target.r, 4);
  assert.equal(symbols[0].animations[0]?.delay, 0);
  assert.equal(symbols[1].animations[0]?.delay, 140);
});

test('delays line-symbol animation by horizontal line-reveal ratio', () => {
  const ecData = new WeakMap<object, Record<string, unknown>>();
  const host = createTooltipBindingHost(ecData);
  const group = new TestGraphicGroup();
  const layout = layoutErrorChart([
    { month: 'Start', duration: 0 },
    { month: 'End', duration: 100 }
  ], {
    variant: 'line',
    width: 220,
    height: 180,
    padding: 20,
    categoryField: 'month',
    valueField: 'duration',
    min: 0,
    max: 100,
    orientation: 'horizontal',
    baseline: 0
  });
  const data = createRenderSeriesData(2);
  const seriesModel = createRenderSeriesModel(data, {
    animation: true,
    enterAnimation: {
      duration: 200,
      delay: 0,
      stagger: 0,
      easing: 'linear'
    }
  });

  rendererInternals.drawSeries(host as never, group as never, seriesModel as never, layout as never, {
    x: 0,
    y: 0,
    width: 220,
    height: 180
  });

  const symbols = group.children.filter((element) => element.shape?.cx != null);
  assert.equal(symbols.length, 2);
  assert.equal(symbols[1].animations[0]?.delay, 200);
});

test('skips line point animation when animation is disabled', () => {
  const ecData = new WeakMap<object, Record<string, unknown>>();
  const host = createTooltipBindingHost(ecData);
  const group = new TestGraphicGroup();
  const layout = layoutErrorChart([
    { month: 'Start', duration: 20 },
    { month: 'End', duration: 80 }
  ], {
    variant: 'line',
    width: 220,
    height: 180,
    padding: 20,
    categoryField: 'month',
    valueField: 'duration',
    min: 0,
    max: 100,
    baseline: 0
  });
  const data = createRenderSeriesData(2);
  const seriesModel = createRenderSeriesModel(data, {
    animation: false,
    enterAnimation: {
      duration: 120,
      delay: 10,
      easing: 'linear'
    }
  });

  rendererInternals.drawSeries(host as never, group as never, seriesModel as never, layout as never, {
    x: 0,
    y: 0,
    width: 220,
    height: 180
  });

  const symbols = group.children.filter((element) => element.shape?.cx != null);
  assert.equal(symbols.length, 2);
  assert.equal(symbols[0].animations.length, 0);
});

test('animates column rectangles for vertical and horizontal branches', () => {
  const shape = new TestGraphicElement();
  const row = { y: 10, baseY: 4 } as never;
  const columnLayout = { orientation: 'vertical', plot: { left: 0, top: 0, width: 100, height: 20 } } as never;
  const lineLayout = { orientation: 'horizontal', plot: { left: 0, top: 0, width: 100, height: 20 } } as never;
  const animation = { enabled: true, duration: 20, delay: 0, easing: 'linear' } as const;

  rendererInternals.applyRectEnterAnimation(shape as never, row as never, columnLayout as never, animation);
  assert.equal(shape.shape?.y, 4);
  assert.deepEqual(shape.shape, { y: 4, height: 0 });
  assert.equal(shape.shape?.height, 0);
  assert.equal(shape.animations.length, 1);
  assert.deepEqual(shape.animations[0].target, { y: 4, height: 6 });

  const shapeHorizontal = new TestGraphicElement();
  const rowHorizontal = { x: 12, baseX: 4 } as never;
  rendererInternals.applyRectEnterAnimation(shapeHorizontal as never, rowHorizontal as never, lineLayout as never, animation);
  assert.equal(shapeHorizontal.shape?.x, 4);
  assert.equal(shapeHorizontal.shape?.width, 0);
  assert.deepEqual(shapeHorizontal.shape, { x: 4, width: 0 });
  assert.equal(shapeHorizontal.shape?.height, undefined);
  assert.equal(shapeHorizontal.animations.length, 1);
  assert.deepEqual(shapeHorizontal.animations[0].target, { x: 4, width: 8 });
});

test('renders x-axis name text using style fallback values', () => {
  const host = createTooltipBindingHost(new WeakMap<object, Record<string, unknown>>());
  const group = new TestGraphicGroup();
  const layout = layoutErrorChart([{ month: 'A', duration: 12 }], {
    variant: 'scatter',
    width: 220,
    height: 140,
    padding: 20,
    xMin: 0,
    xMax: 20,
    min: 0,
    max: 20
  });

  const axisModel = createTooltipModel({
    name: 'Cost Axis',
    nameTextStyle: {
      color: '#334155',
      fontSize: '16',
      fontWeight: 700
    },
    label: { show: true }
  });
  rendererInternals.drawXValueAxisLabels(host as never, group as never, axisModel as never, layout as never);

  const text = group.children.find((element) => element.style?.text === 'Cost Axis');
  assert.ok(text);
  assert.equal(text?.style?.fill, '#334155');
  assert.equal(text?.style?.fontSize, 16);
  assert.equal(text?.style?.fontWeight, 700);
});

test('renders x-axis name fallback text style when nameTextStyle is empty', () => {
  const host = createTooltipBindingHost(new WeakMap<object, Record<string, unknown>>());
  const group = new TestGraphicGroup();
  const layout = layoutErrorChart([{ month: 'A', duration: 12 }], {
    variant: 'scatter',
    width: 220,
    height: 140,
    padding: 20,
    xMin: 0,
    xMax: 20,
    min: 0,
    max: 20
  });

  rendererInternals.drawXValueAxisLabels(host as never, group as never, createTooltipModel({
    name: 'Fallback Axis',
    label: { show: true }
  }) as never, layout as never);

  const text = group.children.find((element) => element.style?.text === 'Fallback Axis');
  assert.ok(text);
  assert.equal(text?.style?.fill, '#64748b');
  assert.equal(text?.style?.fontWeight, 600);
});

class TestGraphicElement {
  [key: string]: unknown;
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  clipPath?: TestGraphicElement;
  silent?: boolean;
  z2?: number;
  animations: Array<{
    key: string;
    duration: number;
    target: Record<string, unknown>;
    delay?: number;
    easing?: string;
  }> = [];

  constructor(options: Record<string, unknown> = {}) {
    Object.assign(this, options);
  }

  animate(key: string) {
    return {
      when: (duration: number, target: Record<string, unknown>) => {
        const record = { key, duration, target, delay: 0 };
        this.animations.push(record);
        return {
          delay: (delay: number) => {
            record.delay = delay;
          },
          start: (easing: string) => {
            record.easing = easing;
          }
        };
      }
    };
  }

  setClipPath(clipPath: TestGraphicElement) {
    this.clipPath = clipPath;
  }
}

class TestGraphicGroup {
  children: TestGraphicElement[] = [];

  add(element: TestGraphicElement) {
    this.children.push(element);
  }
}

function createTooltipBindingHost(ecData: WeakMap<object, Record<string, unknown>>) {
  return {
    helper: {
      getECData(element: object) {
        let data = ecData.get(element);
        if (!data) {
          data = {};
          ecData.set(element, data);
        }
        return data;
      }
    },
    graphic: {
      Circle: TestGraphicElement,
      Line: TestGraphicElement,
      Polyline: TestGraphicElement,
      Rect: TestGraphicElement,
      Text: TestGraphicElement
    }
  };
}

function createTooltipSeriesData() {
  return {
    dataType: 'errorChart',
    layout: undefined as [number, number] | undefined,
    graphicEl: undefined as TestGraphicElement | undefined,
    count: () => 1,
    getItemModel: () => createTooltipModel({}),
    getItemVisual: () => ({}),
    setItemLayout(_dataIndex: number, layout: [number, number]) {
      this.layout = layout;
    },
    setItemGraphicEl(_dataIndex: number, element: TestGraphicElement) {
      this.graphicEl = element;
    }
  };
}

function createRenderSeriesData(count: number) {
  return {
    dataType: 'errorChart',
    layouts: [] as Array<[number, number] | undefined>,
    graphicEls: [] as Array<TestGraphicElement | undefined>,
    count: () => count,
    getItemModel: () => createTooltipModel({}),
    getItemVisual: () => ({ fill: '#abc' }),
    setItemLayout(index: number, layout: [number, number]) {
      this.layouts[index] = layout;
    },
    setItemGraphicEl(index: number, element: TestGraphicElement) {
      this.graphicEls[index] = element;
    }
  };
}

function createTooltipSeriesModel(data: ReturnType<typeof createTooltipSeriesData>) {
  return {
    seriesIndex: 4,
    getData: () => data,
    get(path: string) {
      const values: Record<string, unknown> = {
        animation: false,
        barWidth: 22,
        capWidth: 14,
        enterAnimation: false,
        errorBarStyle: { color: '#2563eb', width: 1.4 },
        label: { show: true },
        lineStyle: {},
        silent: false,
        symbolSize: 8
      };
      return values[path];
    },
    getModel(path: string) {
      if (path === 'label') return createTooltipModel({ show: true, formatter: '{c}' });
      return createTooltipModel({});
    }
  };
}

function createRenderSeriesModel(data: ReturnType<typeof createRenderSeriesData>, values: Record<string, unknown>) {
  return {
    seriesIndex: 8,
    getData: () => data,
    get(path: string | string[]) {
      return readModelPath(values, path);
    },
    getModel(path: string | string[]) {
      return createTooltipModel(asRecord(readModelPath(values, path)));
    }
  };
}

function createTooltipModel(values: Record<string, unknown>) {
  return {
    get(path: string | string[]) {
      return readModelPath(values, path);
    },
    getModel(path: string | string[]) {
      return createTooltipModel(asRecord(readModelPath(values, path)));
    }
  };
}

function readModelPath(values: Record<string, unknown>, path: string | string[]) {
  if (!Array.isArray(path)) return values[path];
  return path.reduce<unknown>((current, key) => asRecord(current)[key], values);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
