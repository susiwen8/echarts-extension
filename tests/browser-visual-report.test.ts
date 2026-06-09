import assert from 'node:assert/strict';
import { test } from 'vitest';

import { createBrowserVisualReportHtml } from './browser-visual/report-page.ts';

test('browser visual report page shows baseline, actual, and diff assets', () => {
  const html = createBrowserVisualReportHtml([
    {
      name: 'echarts-radial',
      ok: false,
      actualPath: 'test-results/browser-visual/echarts-radial.actual.png',
      diffPath: 'test-results/browser-visual/echarts-radial.diff.png',
      diffPixels: 42,
      maxDiffPixels: 10,
      message: '42 pixels differ; expected at most 10',
      screenshotSelector: '#chart canvas, #chart svg',
      snapshotPath: 'visual-baseline/echarts-radial.png',
      url: 'http://127.0.0.1:1234/docs/packages/echarts-radial/'
    },
    {
      name: 'echarts-size-change',
      ok: false,
      actualPath: 'test-results/browser-visual/echarts-size-change.actual.png',
      message: 'size changed from 816x665 to 852x792',
      screenshotSelector: '#chart canvas, #chart svg',
      snapshotPath: 'visual-baseline/echarts-size-change.png',
      url: 'http://127.0.0.1:1234/docs/packages/echarts-size-change/'
    }
  ]);

  assert.match(html, /Browser Visual Diff/);
  assert.match(html, /2 failed/);
  assert.match(html, /visual-baseline\/echarts-radial\.png/);
  assert.match(html, /test-results\/browser-visual\/echarts-radial\.actual\.png/);
  assert.match(html, /test-results\/browser-visual\/echarts-radial\.diff\.png/);
  assert.match(html, /size changed from 816x665 to 852x792/);
});

test('browser visual report page escapes report text', () => {
  const html = createBrowserVisualReportHtml([
    {
      name: '<script>alert(1)</script>',
      ok: false,
      actualPath: 'test-results/browser-visual/unsafe.actual.png',
      message: 'changed < unexpectedly & loudly',
      screenshotSelector: '#chart',
      snapshotPath: 'visual-baseline/unsafe.png',
      url: 'http://127.0.0.1:1234/example'
    }
  ]);

  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /changed &lt; unexpectedly &amp; loudly/);
  assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
});
