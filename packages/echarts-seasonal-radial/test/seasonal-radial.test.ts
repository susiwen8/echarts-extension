import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as echarts from 'echarts';
import { test } from 'vitest';

import { __test__ as rendererInternals } from '../src/seasonal-radial.ts';
import {
  __test__ as layoutInternals,
  layoutSeasonalRadial,
  resolveSeasonalRadialLayout
} from '../src/layout.ts';

const solarData = [
  { country: 'Spain', year: 2023, month: 'Jan.', value: 1.9 },
  { country: 'Spain', year: 2023, month: 'Feb.', value: 2.4 },
  { country: 'Spain', year: 2023, month: 'Mar.', value: 3.4 },
  { country: 'Spain', year: 2023, month: 'Apr.', value: 4.9 },
  { country: 'Spain', year: 2023, month: 'May', value: 5.8 },
  { country: 'Spain', year: 2023, month: 'June', value: 5.0 },
  { country: 'Spain', year: 2023, month: 'July', value: 4.5 },
  { country: 'Spain', year: 2023, month: 'Aug.', value: 4.1 },
  { country: 'Spain', year: 2023, month: 'Sep.', value: 3.1 },
  { country: 'Spain', year: 2023, month: 'Oct.', value: 2.3 },
  { country: 'Spain', year: 2023, month: 'Nov.', value: 1.8 },
  { country: 'Spain', year: 2023, month: 'Dec.', value: 1.7 },
  { country: 'Spain', year: 2025, month: 'Jan.', value: 2.2 },
  { country: 'Spain', year: 2025, month: 'Feb.', value: 3.1 },
  { country: 'Spain', year: 2025, month: 'Mar.', value: 4.4 },
  { country: 'Spain', year: 2025, month: 'Apr.', value: 6.2 },
  { country: 'Spain', year: 2025, month: 'May', value: 6.8 },
  { country: 'Spain', year: 2025, month: 'June', value: 6.0 },
  { country: 'Spain', year: 2025, month: 'July', value: 5.1 },
  { country: 'Spain', year: 2025, month: 'Aug.', value: 4.6 },
  { country: 'Spain', year: 2025, month: 'Sep.', value: 3.6 },
  { country: 'Germany', year: 2025, month: 'Jan.', value: 2.4 },
  { country: 'Germany', year: 2025, month: 'Feb.', value: 4.1 },
  { country: 'Germany', year: 2025, month: 'Mar.', value: 7.2 },
  { country: 'Germany', year: 2025, month: 'Apr.', value: 10.1 },
  { country: 'Germany', year: 2025, month: 'May', value: 10.4 },
  { country: 'Germany', year: 2025, month: 'June', value: 9.2 },
  { country: 'Germany', year: 2025, month: 'July', value: 8.4 },
  { country: 'Germany', year: 2025, month: 'Aug.', value: 7.0 },
  { country: 'Germany', year: 2025, month: 'Sep.', value: 5.1 }
];

test('does not depend on external layout packages', () => {
  const packageJson = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  );

  assert.equal(packageJson.dependencies?.d3, undefined);
  assert.equal(packageJson.dependencies?.['@antv/layout'], undefined);
});

test('computes small-multiple polar tracks by group and year', () => {
  const first = layoutSeasonalRadial(solarData, {
    width: 1120,
    height: 620,
    groupField: 'country',
    yearField: 'year',
    monthField: 'month',
    valueField: 'value',
    groups: ['Spain', 'Germany'],
    months: ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'],
    min: 0,
    max: 10,
    tickCount: 3,
    highlightYear: 2025
  });
  const second = layoutSeasonalRadial(solarData, {
    width: 1120,
    height: 620,
    groupField: 'country',
    yearField: 'year',
    monthField: 'month',
    valueField: 'value',
    groups: ['Spain', 'Germany'],
    months: ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'],
    min: 0,
    max: 10,
    tickCount: 3,
    highlightYear: 2025
  });

  assert.deepEqual(first, second);
  assert.deepEqual(first.groups.map((panel) => panel.name), ['Spain', 'Germany']);
  assert.deepEqual(first.monthLabels.map((label) => label.name), [
    'Jan.',
    'Feb.',
    'Mar.',
    'Apr.',
    'May',
    'June',
    'July',
    'Aug.',
    'Sep.',
    'Oct.',
    'Nov.',
    'Dec.'
  ]);
  assert.deepEqual(first.ticks.map((tick) => tick.value), [0, 5, 10]);

  const spain = first.groups[0];
  const germany = first.groups[1];
  assert.equal(spain.tracks.length, 2);
  assert.equal(germany.tracks.length, 1);
  assert.equal(spain.tracks[1].year, '2025');
  assert.equal(spain.tracks[1].highlighted, true);
  assert.equal(germany.tracks[0].highlighted, true);
  assert.equal(spain.tracks[0].points.length, 12);
  assert.equal(spain.tracks[0].closedPoints.length, 13);
  assert.equal(spain.tracks[1].points.length, 9);
  assert.equal(spain.tracks[1].closedPoints.length, 9);
  assert.deepEqual(
    spain.tracks[1].points.map((point) => point.month),
    first.monthLabels.slice(0, 9).map((label) => label.name)
  );
  assert.ok(spain.centerX < first.width / 2, 'Spain panel is laid out on the left');
  assert.ok(germany.centerX > first.width / 2, 'Germany panel is laid out on the right');
  assert.equal(Math.round(spain.monthLabels[0].x), Math.round(spain.centerX));
  assert.ok(spain.monthLabels[0].y < spain.centerY, 'January appears at the top');
  assert.ok(spain.monthLabels[3].x > spain.centerX, 'April appears at the right');

  const spainMay2025 = spain.tracks[1].points[4];
  assert.equal(spainMay2025.value, 6.8);
  assert.ok(spainMay2025.r > spain.innerRadius);
  assert.ok(spainMay2025.r < spain.outerRadius);
  assert.equal(spain.tracks[1].label?.text, '2025');
  assert.equal(spain.tracks[1].label?.point.month, 'Sep.');
});

test('supports array rows and explicit dimensions', () => {
  const result = resolveSeasonalRadialLayout({
    data: [
      ['A', 2024, 1, 2],
      ['A', 2024, 2, 4],
      ['A', 2025, 1, 3],
      ['A', 2025, 2, 5]
    ],
    dimensions: ['region', 'period', 'monthNo', 'amount'],
    groupField: 'region',
    yearField: 'period',
    monthField: 'monthNo',
    valueField: 'amount',
    months: [1, 2],
    width: 320,
    height: 260,
    min: 0,
    max: 5,
    highlightYear: 'latest',
    tickCount: 2
  });

  assert.deepEqual(result.monthLabels.map((label) => label.value), [1, 2]);
  assert.deepEqual(result.groups[0].tracks.map((track) => track.year), ['2024', '2025']);
  assert.equal(result.groups[0].tracks[1].highlighted, true);
});

test('maps configured fields into ECharts data for tooltip hover values', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 760,
    height: 420
  });

  try {
    chart.setOption({
      series: [
        {
          type: 'seasonalRadial',
          data: solarData,
          groupField: 'country',
          yearField: 'year',
          monthField: 'month',
          valueField: 'value'
        }
      ]
    });

    const seriesModel = chart.getModel().getSeriesByIndex(0);
    const data = seriesModel.getData();

    assert.equal(data.getName(0), 'Spain 2023 Jan.');
    assert.equal(data.get('value', 0), 1.9);
    assert.equal(data.getName(23), 'Germany 2025 Mar.');
    assert.equal(data.get('value', 23), 7.2);
    assert.ok(Array.isArray((seriesModel as never as { getTooltipPosition(index: number): unknown }).getTooltipPosition(0)));
  } finally {
    chart.dispose();
  }
});

test('renders reference-style axes, tracks, and latest-year labels in SVG', () => {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width: 1120,
    height: 620
  });

  try {
    chart.setOption({
      backgroundColor: '#000',
      series: [
        {
          type: 'seasonalRadial',
          data: solarData,
          groupField: 'country',
          yearField: 'year',
          monthField: 'month',
          valueField: 'value',
          groups: ['Spain', 'Germany'],
          min: 0,
          max: 10,
          highlightYear: 2025,
          lineStyle: {
            color: '#c99a2d'
          }
        }
      ]
    });

    const svg = chart.renderToSVGString();
    assert.match(svg, /Spain/);
    assert.match(svg, /Germany/);
    assert.match(svg, /Jan\./);
    assert.match(svg, /2025/);
    assert.match(svg, /#e5c65a/i);
  } finally {
    chart.dispose();
  }
});

test('covers seasonal radial layout fallback branches', () => {
  const {
    angleForMonth,
    cleanNumber,
    clamp,
    clampRadius,
    createPanelGeometries,
    createPlotRect,
    createSeriesDataItem,
    createTicks,
    finiteNumber,
    firstBoolean,
    labelPlacement,
    monthKey,
    niceStep,
    normalizeCategories,
    normalizeDimensions,
    normalizeItems,
    normalizePadding,
    parseCenter,
    parseRadius,
    projectRadius,
    readField,
    readFieldOption,
    readHighlightYear,
    readPaddingOption,
    readRadiusOption,
    readTuple,
    resolveGroups,
    resolveHighlightYear,
    resolveMonths,
    resolveValueExtent,
    sortYears,
    stringifyName
  } = layoutInternals;

  assert.equal(resolveSeasonalRadialLayout({
    data: null as never
  }).groups.length, 0);
  assert.equal(resolveSeasonalRadialLayout({
    data: [['North', '2024', 'Jan.', 4]],
    layoutOptions: {
      width: 320,
      height: 220,
      padding: 8,
      panelGap: 12,
      center: ['50%', '50%'],
      radius: ['10%', '60%'],
      innerRadius: '10%',
      outerRadius: '70%',
      startAngle: 0,
      clockwise: false,
      closed: false,
      dimensions: ['region', 'period', 'monthNo', 'amount'],
      groupField: 'region',
      yearField: 'period',
      monthField: 'monthNo',
      valueField: 'amount',
      groups: ['North'],
      months: ['Jan.'],
      min: 0,
      max: 5,
      tickCount: 2,
      nice: false,
      highlightYear: false
    }
  }).groups[0].tracks[0].closedPoints.length, 1);
  assert.equal(resolveSeasonalRadialLayout({
    data: [{ region: 'North', period: '2024', monthNo: 'Jan.', amount: 4 }],
    layout: {
      width: 320,
      height: 220,
      padding: 8,
      panelGap: 12,
      center: ['50%', '50%'],
      radius: ['10%', '60%'],
      startAngle: 0,
      clockwise: false,
      closed: false,
      groupField: 'region',
      yearField: 'period',
      monthField: 'monthNo',
      valueField: 'amount',
      nameField: 'period',
      groups: ['North'],
      months: ['Jan.'],
      min: 0,
      max: 5,
      tickCount: 2,
      nice: false,
      highlightYear: '2024'
    }
  }).groups[0].tracks[0].highlighted, true);

  assert.deepEqual(normalizePadding(12), { top: 12, right: 12, bottom: 12, left: 12 });
  assert.deepEqual(normalizePadding({ top: 'bad', right: 4, bottom: -1, left: 2 }), {
    top: 72,
    right: 4,
    bottom: 0,
    left: 2
  });
  assert.equal(readPaddingOption(8), 8);
  assert.equal(readPaddingOption('bad'), undefined);
  assert.deepEqual(readPaddingOption({ top: '1', right: 'x', bottom: 3, left: 4 }), {
    top: 1,
    right: undefined,
    bottom: 3,
    left: 4
  });
  assert.deepEqual(normalizeDimensions(['a', 1, 'b']), ['a', 'b']);
  assert.equal(normalizeDimensions([1, 2]), undefined);
  assert.deepEqual(normalizeCategories(['A', 2, null]), ['A', 2]);
  assert.equal(readField(['A', 2025], 1, undefined, 0, []), 2025);
  assert.equal(readField(['A', 2025], 'year', ['group', 'year'], 0, []), 2025);
  assert.equal(readField(['A'], 'missing', undefined, -1, []), undefined);
  assert.equal(readField({ amount: 5 }, 'value', undefined, 0, ['amount']), 5);
  assert.equal(readField(null, 'value', undefined, 0, []), undefined);
  assert.equal(readFieldOption('x'), 'x');
  assert.equal(readFieldOption(false), undefined);
  assert.equal(readHighlightYear(false), false);
  assert.equal(readHighlightYear('latest'), 'latest');
  assert.equal(readHighlightYear({}), undefined);
  assert.deepEqual(readTuple(['10%', 20], undefined), ['10%', 20]);
  assert.deepEqual(readTuple(['10%', {}], [0, 1]), [0, 1]);
  assert.equal(readRadiusOption('25%'), '25%');
  assert.equal(readRadiusOption({}), undefined);
  assert.equal(parseRadius('50%', 100, 0), 50);
  assert.equal(parseRadius('bad', 100, 7), 7);
  assert.equal(parseCenter('25%', 200, 10), 60);
  assert.equal(parseCenter('bad', 200, 10), 110);
  assert.equal(clampRadius(Number.NaN, 3, 8), 3);
  assert.equal(clamp(9, 0, 4), 4);
  assert.equal(angleForMonth(0, 0, 90, true), 90);
  assert.equal(angleForMonth(1, 4, 90, false), 180);
  assert.deepEqual(labelPlacement(90), { align: 'center', verticalAlign: 'bottom' });
  assert.deepEqual(labelPlacement(180), { align: 'right', verticalAlign: 'middle' });
  assert.deepEqual(labelPlacement(270), { align: 'center', verticalAlign: 'top' });
  assert.equal(projectRadius(3, { min: 1, max: 1 }, 2, 8), 8);
  assert.deepEqual(createTicks(0, 10, 1), [0, 10]);
  assert.equal(niceStep(0), 1);
  assert.equal(niceStep(1.2), 2);
  assert.equal(niceStep(3), 5);
  assert.equal(niceStep(8), 10);
  assert.equal(firstBoolean(null, false, true), false);
  assert.equal(firstBoolean(null, 'x'), undefined);
  assert.equal(monthKey(' Jan. '), 'jan.');
  assert.equal(stringifyName(null), '');
  assert.match(stringifyName(new Date('2025-01-01T00:00:00.000Z')), /2025-01-01/);
  assert.equal(finiteNumber('3', 0), 3);
  assert.equal(finiteNumber('x', 6), 6);
  assert.equal(cleanNumber(1e-12), 0);
  assert.deepEqual(sortYears(['B', 'A', '2024', '2023']), ['2023', '2024', 'A', 'B']);

  const normalized = normalizeItems([
    { region: 'North', period: 'B', monthNo: 1, amount: 4, id: 'n-b-1' },
    { region: 'North', period: 'A', monthNo: 2, amount: 4 },
    { region: 'South', period: 'A', monthNo: '', amount: 2 },
    { region: 'South', period: 'A', monthNo: 1, amount: Number.NaN }
  ], {
    groupField: 'region',
    yearField: 'period',
    monthField: 'monthNo',
    valueField: 'amount'
  });
  assert.equal(normalized.length, 2);
  assert.equal(createSeriesDataItem(normalized[0]).name, 'North B 1');
  assert.deepEqual(resolveGroups(normalized as never, { groups: ['North', 'Missing'] }), ['North']);
  assert.deepEqual(resolveMonths([], {}).map((month) => month.name).slice(0, 2), ['Jan.', 'Feb.']);
  assert.equal(resolveHighlightYear(normalized.map((item) => ({ ...item, monthIndex: 0 })) as never, { highlightYear: null }), null);
  assert.equal(resolveHighlightYear(normalized.map((item) => ({ ...item, monthIndex: 0 })) as never, { highlightYear: 'A' }), 'A');
  assert.deepEqual(resolveValueExtent([], { min: Number.NaN, max: Number.NaN }), { min: -0.5, max: 0.5 });
  assert.deepEqual(resolveValueExtent([{ value: 5 }] as never, { min: 10, max: 0, nice: false }), { min: 0, max: 10 });
  assert.deepEqual(resolveValueExtent([{ value: 5 }] as never, { min: 5, max: 5, nice: false }), { min: 2.5, max: 7.5 });

  const plot = createPlotRect(300, 200, { top: 10, right: 20, bottom: 30, left: 40 });
  const geometries = createPanelGeometries(2, plot, {
    center: ['25%', '50%'],
    radius: ['20%', '60%'],
    panelGap: 10
  });
  assert.equal(geometries.length, 2);
  assert.ok(geometries[0].innerRadius < geometries[0].outerRadius);
});

test('covers seasonal radial renderer helper branches', () => {
  const ecData = new WeakMap<object, Record<string, unknown>>();
  const host = createSeasonalHost(ecData);
  const group = new SeasonalGraphicGroup();
  const layout = layoutSeasonalRadial(solarData, {
    width: 620,
    height: 360,
    groups: ['Spain'],
    months: ['Jan.', 'Feb.', 'Mar.'],
    min: 0,
    max: 10,
    highlightYear: 2025
  });
  const panel = layout.groups[0];
  const highlightedTrack = panel.tracks.find((track) => track.highlighted);
  assert.ok(highlightedTrack);

  const data = createSeasonalSeriesData(40);
  const seriesModel = createSeasonalSeriesModel(data, {
    angleAxis: {
      show: true,
      label: { show: true, formatter: (value: unknown) => `m:${value}` },
      splitLine: { show: true, lineStyle: { type: 'dotted' } }
    },
    grid: { show: true },
    groupLabel: { show: true, formatter: '{value}' },
    highlightLineStyle: { color: '#fff', width: 2, opacity: 1 },
    highlightSymbol: true,
    itemStyle: { color: '#f00', borderColor: '#0f0', borderWidth: '3', opacity: '0.5' },
    lineStyle: { type: [2, 'x', 4] },
    radialAxis: {
      show: true,
      label: { show: true, formatter: '{value}' },
      splitLine: { show: true, lineStyle: { color: '#999' } }
    },
    showSymbol: true,
    silent: true,
    symbolSize: '10',
    yearLabel: { show: true, formatter: (value: unknown) => value }
  });

  rendererInternals.drawGrid(host as never, group as never, seriesModel as never, layout as never);
  rendererInternals.drawTrack(host as never, group as never, seriesModel as never, highlightedTrack as never);
  rendererInternals.drawTrackHitTargets(host as never, group as never, seriesModel as never, highlightedTrack as never, {
    x: 5,
    y: 7,
    width: 620,
    height: 360
  });
  rendererInternals.drawTrackSymbols(host as never, group as never, seriesModel as never, highlightedTrack as never);
  rendererInternals.drawYearLabel(host as never, group as never, seriesModel as never, highlightedTrack as never);
  assert.ok(group.children.length > 0);
  assert.ok(data.layouts.some(Boolean));

  const hiddenModel = createSeasonalSeriesModel(data, {
    angleAxis: { show: false, label: { show: false }, splitLine: { show: false } },
    grid: { show: false },
    groupLabel: { show: false },
    radialAxis: { show: false, label: { show: false }, splitLine: { show: false } },
    showSymbol: false,
    highlightSymbol: false,
    yearLabel: { show: false }
  });
  rendererInternals.drawGrid(host as never, group as never, hiddenModel as never, layout as never);
  rendererInternals.drawGroupLabel(host as never, group as never, createSeasonalSeriesModel(data, { groupLabel: { show: true, formatter: () => null } }) as never, panel as never);
  rendererInternals.drawRadialRings(host as never, group as never, panel as never, createSeasonalModel({ color: null, width: 0, opacity: 1 }) as never);
  rendererInternals.drawAngleSpokes(host as never, group as never, panel as never, createSeasonalModel({ color: null, width: 1, opacity: 0 }) as never);
  rendererInternals.drawRadialLabels(host as never, group as never, panel as never, createSeasonalModel({ show: false }) as never);
  rendererInternals.drawMonthLabels(host as never, group as never, panel as never, createSeasonalModel({ formatter: '{value}' }) as never);
  rendererInternals.drawTrack(host as never, group as never, hiddenModel as never, { ...highlightedTrack, closedPoints: [] } as never);
  rendererInternals.drawTrack(host as never, group as never, createSeasonalSeriesModel(data, { historyLineStyle: { color: null, width: 0, opacity: 1 }, lineStyle: {} }) as never, { ...highlightedTrack, highlighted: false } as never);
  rendererInternals.drawTrackSymbols(host as never, group as never, hiddenModel as never, highlightedTrack as never);
  rendererInternals.drawYearLabel(host as never, group as never, createSeasonalSeriesModel(data, { yearLabel: { show: true, formatter: () => null } }) as never, highlightedTrack as never);
  rendererInternals.drawYearLabel(host as never, group as never, hiddenModel as never, {
    ...highlightedTrack,
    label: {
      text: 'Hidden',
      point: highlightedTrack.points[0],
      x: highlightedTrack.points[0].x,
      y: highlightedTrack.points[0].y
    }
  } as never);
  rendererInternals.bindTooltipData({ helper: {} } as never, seriesModel as never, {} as never, highlightedTrack.points[0] as never);

  assert.deepEqual(rendererInternals.readLineDash([1, 'x', 2]), [1, 2]);
  assert.deepEqual(rendererInternals.readLineDash('dashed'), [6, 6]);
  assert.deepEqual(rendererInternals.readLineDash('dotted'), [1.5, 5]);
  assert.equal(rendererInternals.readLineDash('solid'), null);
  assert.equal(rendererInternals.formatAxisLabel((value: unknown) => value == null ? null : `#${value}`, null), '');
  assert.equal(rendererInternals.formatAxisLabel(undefined, 'A'), 'A');
  assert.equal(rendererInternals.polarPoint(0, 0, 10, 0).x, 10);
  assert.equal(rendererInternals.finiteNumber('bad', 9), 9);
});

test('animates seasonal radial tracks, symbols, and year labels on enter', () => {
  const ecData = new WeakMap<object, Record<string, unknown>>();
  const host = createSeasonalHost(ecData);
  const group = new SeasonalGraphicGroup();
  const layout = layoutSeasonalRadial(solarData, {
    width: 620,
    height: 360,
    groups: ['Spain'],
    months: ['Jan.', 'Feb.', 'Mar.'],
    min: 0,
    max: 10,
    highlightYear: 2025
  });
  const highlightedTrack = layout.groups[0].tracks.find((track) => track.highlighted);
  assert.ok(highlightedTrack);

  const data = createSeasonalSeriesData(40);
  const seriesModel = createSeasonalSeriesModel(data, {
    enterAnimation: {
      duration: 500,
      delay: 10,
      stagger: 5,
      easing: 'linear'
    },
    highlightLineStyle: { color: '#fff', width: 2, opacity: 1 },
    highlightSymbol: true,
    itemStyle: { color: '#f00', borderColor: '#0f0', borderWidth: 2, opacity: 0.8 },
    lineStyle: {},
    showSymbol: false,
    symbolSize: 10,
    yearLabel: { show: true }
  });

  rendererInternals.drawTrack(host as never, group as never, seriesModel as never, highlightedTrack as never);
  rendererInternals.drawTrackSymbols(host as never, group as never, seriesModel as never, highlightedTrack as never);
  rendererInternals.drawYearLabel(host as never, group as never, seriesModel as never, highlightedTrack as never);

  const line = group.children.find((child) => Array.isArray(child.shape?.points));
  assert.ok(line);
  assert.ok(line.animations.some((animation) => (
    animation.key === 'style'
    && animation.duration === 500
    && animation.easing === 'linear'
    && animation.target.strokePercent === 1
  )));

  const symbol = group.children.find((child) => child.style?.fill === '#f00');
  assert.ok(symbol);
  assert.ok(symbol.animations.some((animation) => (
    animation.key === 'shape'
    && animation.target.r === 5
  )));

  const label = group.children.find((child) => child.style?.text === highlightedTrack.label?.text);
  assert.ok(label);
  assert.ok(label.animations.some((animation) => (
    animation.key === 'style'
    && animation.target.opacity === 1
  )));

  const disabledGroup = new SeasonalGraphicGroup();
  const disabledModel = createSeasonalSeriesModel(data, {
    animation: false,
    highlightLineStyle: { color: '#fff', width: 2, opacity: 1 },
    lineStyle: {}
  });
  rendererInternals.drawTrack(host as never, disabledGroup as never, disabledModel as never, highlightedTrack as never);
  const disabledLine = disabledGroup.children.find((child) => Array.isArray(child.shape?.points));
  assert.ok(disabledLine);
  assert.equal(disabledLine.animations.length, 0);
});

test('staggers seasonal radial track enter animation by visible track order', () => {
  const ecData = new WeakMap<object, Record<string, unknown>>();
  const host = createSeasonalHost(ecData);
  const group = new SeasonalGraphicGroup();
  const layout = layoutSeasonalRadial(solarData, {
    width: 620,
    height: 360,
    groups: ['Spain', 'Germany'],
    months: ['Jan.', 'Feb.', 'Mar.'],
    min: 0,
    max: 10,
    highlightYear: 2025
  });
  const data = createSeasonalSeriesData(40);
  const seriesModel = createSeasonalSeriesModel(data, {
    enterAnimation: {
      duration: 500,
      delay: 10,
      stagger: 5,
      easing: 'linear'
    },
    highlightLineStyle: { color: '#fff', width: 2, opacity: 1 },
    historyLineStyle: { color: '#777', width: 1, opacity: 1 },
    highlightSymbol: true,
    itemStyle: { color: '#f00', borderColor: '#0f0', borderWidth: 2, opacity: 0.8 },
    lineStyle: {},
    showSymbol: false,
    symbolSize: 10,
    yearLabel: { show: true }
  });

  rendererInternals.drawTracks(host as never, group as never, seriesModel as never, layout as never, {
    x: 0,
    y: 0,
    width: 620,
    height: 360
  });

  const lineDelays = group.children
    .filter((child) => Array.isArray(child.shape?.points))
    .map((line) => line.animations.find((animation) => animation.key === 'style')?.delay);

  assert.deepEqual(lineDelays, [10, 15, 20]);
});

test('reads seasonal radial animation defaults from plain objects', () => {
  assert.deepEqual(
    rendererInternals.trackEnterAnimationIndex({
      points: [{ dataIndex: 9 }]
    } as never),
    9
  );
  assert.equal(
    rendererInternals.trackEnterAnimationIndex({
      points: []
    } as never),
    0
  );
  assert.deepEqual(rendererInternals.asRecord({ value: 3 }), { value: 3 });
  assert.deepEqual(rendererInternals.asRecord(null), {});
});

test('applies seasonal animation target values directly without an animator', () => {
  const element = {
    shape: { x: 1 },
    style: { opacity: 0.2 }
  };
  const animation = {
    enabled: true,
    duration: 180,
    delay: 12,
    easing: 'linear'
  } as const;

  rendererInternals.animateGraphicProperty(
    element as never,
    'shape',
    animation,
    { x: 4, y: 5 }
  );

  assert.deepEqual(element.shape, { x: 4, y: 5 });
  assert.deepEqual(element.style, { opacity: 0.2 });
});

test('covers seasonal radial animation option and branch fallbacks', () => {
  const data = createSeasonalSeriesData(1);
  const model = createSeasonalSeriesModel(data, {
    animation: true,
    enterAnimation: {
      duration: 240,
      delay: 12,
      easing: 'linear'
    }
  });

  assert.deepEqual(
    rendererInternals.readEnterAnimation(model as never, 1, { show: false }),
    { enabled: false, duration: 0, delay: 0, easing: 'cubicOut' }
  );
  assert.deepEqual(
    rendererInternals.readEnterAnimation(model as never, 1, { enabled: false }),
    { enabled: false, duration: 0, delay: 0, easing: 'cubicOut' }
  );
  assert.equal(rendererInternals.resolveAnimationNumber((value, index) => `${String(index)}`, { value: 10 }, 3, 9), 3);
});

test('covers seasonal radial animation helper branches without animator or enabled paths', () => {
  const noAnimatorStyle = {
    shape: { points: [[0, 0]] },
    style: { strokePercent: 1 }
  };
  const disabled = { enabled: false, duration: 200, delay: 10, easing: 'linear' } as const;
  const enabled = { enabled: true, duration: 200, delay: 10, easing: 'linear' } as const;

  rendererInternals.applyPathEnterAnimation(noAnimatorStyle as never, enabled);
  assert.deepEqual(noAnimatorStyle.style, { strokePercent: 1 });
  rendererInternals.applyPathEnterAnimation(noAnimatorStyle as never, disabled);
  assert.equal(noAnimatorStyle.style?.strokePercent, 1);

  const pathWithDefaultStyle = new SeasonalGraphicElement();
  rendererInternals.applyPathEnterAnimation(pathWithDefaultStyle as never, enabled);
  assert.equal(pathWithDefaultStyle.style?.strokePercent, 1);

  const circleNoAnimator = { shape: { r: 3 }, style: { opacity: 0.5 } };
  rendererInternals.applyCircleEnterAnimation(circleNoAnimator as never, 16, enabled);
  assert.equal(circleNoAnimator.shape?.r, 3);
  assert.equal(circleNoAnimator.style?.opacity, 0.5);
  rendererInternals.applyCircleEnterAnimation(circleNoAnimator as never, 16, disabled);
  assert.equal(circleNoAnimator.shape?.r, 3);

  const circleWithDefaults = new SeasonalGraphicElement();
  rendererInternals.applyCircleEnterAnimation(circleWithDefaults as never, 17, enabled);
  assert.equal(circleWithDefaults.shape?.r, 17);
  assert.equal(circleWithDefaults.style?.opacity, 1);

  const fadeNoAnimator = { style: { opacity: 0.4 } };
  rendererInternals.applyFadeEnterAnimation(fadeNoAnimator as never, enabled);
  assert.equal(fadeNoAnimator.style?.opacity, 0.4);
  rendererInternals.applyFadeEnterAnimation(fadeNoAnimator as never, disabled);
  assert.equal(fadeNoAnimator.style?.opacity, 0.4);

  const fadeWithDefaultStyle = new SeasonalGraphicElement();
  rendererInternals.applyFadeEnterAnimation(fadeWithDefaultStyle as never, enabled);
  assert.equal(fadeWithDefaultStyle.style?.opacity, 1);

  const missingShape: Record<string, Record<string, unknown>> = {};
  rendererInternals.animateGraphicProperty(
    missingShape as never,
    'shape',
    enabled,
    { x: 3, y: 4 }
  );
  assert.equal('shape' in missingShape, false);
});

interface SeasonalAnimationRecord {
  key: string;
  duration: number;
  target: Record<string, unknown>;
  delay?: number;
  easing?: string;
}

class SeasonalFakeAnimator {
  private readonly record: SeasonalAnimationRecord = {
    key: this.key,
    duration: 0,
    target: {}
  };

  constructor(
    private readonly element: SeasonalGraphicElement,
    private readonly key: string
  ) {}

  when(duration: number, target: Record<string, unknown>) {
    this.record.duration = duration;
    this.record.target = { ...target };
    Object.assign(this.element[this.key] || (this.element[this.key] = {}), target);
    return this;
  }

  delay(duration: number) {
    this.record.delay = duration;
    return this;
  }

  start(easing?: string) {
    this.record.easing = easing;
    this.element.animations.push(this.record);
  }
}

class SeasonalGraphicElement {
  [key: string]: unknown;
  shape?: Record<string, unknown>;
  style?: Record<string, unknown>;
  animations: SeasonalAnimationRecord[] = [];

  constructor(options: Record<string, unknown> = {}) {
    Object.assign(this, options);
  }

  animate(key: string) {
    return new SeasonalFakeAnimator(this, key);
  }
}

class SeasonalGraphicGroup {
  children: SeasonalGraphicElement[] = [];
  x?: number;
  y?: number;

  add(element: SeasonalGraphicElement) {
    this.children.push(element);
  }

  removeAll() {
    this.children = [];
  }
}

function createSeasonalHost(ecData: WeakMap<object, Record<string, unknown>>) {
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
      Circle: SeasonalGraphicElement,
      Line: SeasonalGraphicElement,
      Polyline: SeasonalGraphicElement,
      Text: SeasonalGraphicElement
    }
  };
}

function createSeasonalSeriesData(count: number) {
  return {
    layouts: [] as Array<[number, number] | undefined>,
    graphicEls: [] as Array<SeasonalGraphicElement | undefined>,
    count: () => count,
    getItemLayout(index: number) {
      return this.layouts[index];
    },
    setItemLayout(index: number, layout: [number, number]) {
      this.layouts[index] = layout;
    },
    setItemGraphicEl(index: number, element: SeasonalGraphicElement) {
      this.graphicEls[index] = element;
    }
  };
}

function createSeasonalSeriesModel(data: ReturnType<typeof createSeasonalSeriesData>, values: Record<string, unknown>) {
  return {
    seriesIndex: 3,
    getData: () => data,
    get(path: string | string[]) {
      return readSeasonalPath(values, path);
    },
    getModel(path: string | string[]) {
      return createSeasonalModel(asRecord(readSeasonalPath(values, path)));
    }
  };
}

function createSeasonalModel(values: Record<string, unknown>) {
  return {
    get(path: string | string[]) {
      return readSeasonalPath(values, path);
    },
    getModel(path: string | string[]) {
      return createSeasonalModel(asRecord(readSeasonalPath(values, path)));
    }
  };
}

function readSeasonalPath(values: Record<string, unknown>, path: string | string[]) {
  if (!Array.isArray(path)) return values[path];
  return path.reduce<unknown>((current, key) => asRecord(current)[key], values);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
