import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { globSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let generatedDocsDir = '';

function readDoc(filePath: string) {
  return readFileSync(filePath, 'utf8');
}

function readEmbeddedJson(html: string, markerAttribute: string) {
  const match = html.match(new RegExp(`<script type="application/json" ${markerAttribute}\\b[^>]*>([\\s\\S]*?)<\\/script>`));
  expect(match).toBeTruthy();
  return JSON.parse(match![1]);
}

describe('docs SSG pages', () => {
  beforeAll(() => {
    generatedDocsDir = mkdtempSync(path.join(tmpdir(), 'echarts-docs-ssg-'));
    execFileSync(process.execPath, [
      'scripts/sync-docs-ssg.mjs',
      '--out',
      generatedDocsDir
    ], {
      cwd: rootDir,
      env: {
        ...process.env,
        ECHARTS_DOCS_SSG_OFFLINE: '1'
      },
      stdio: 'pipe'
    });
  }, 30000);

  afterAll(() => {
    if (generatedDocsDir) rmSync(generatedDocsDir, { recursive: true, force: true });
  });

  it('embeds initial standard demo payloads instead of loading demo-data at runtime', () => {
    const standardPages = generatedHtmlFiles().filter((filePath) => {
      const html = readDoc(filePath);
      return /data-example="/.test(html) && html.includes('shared/demo-runner.js');
    });

    expect(standardPages.length).toBeGreaterThan(20);
    for (const filePath of standardPages) {
      const html = readDoc(filePath);
      expect(html, filePath).toContain('type="application/json" data-demo-payload');
      expect(html, filePath).not.toContain('shared/demo-data.js');
      const payload = readEmbeddedJson(html, 'data-demo-payload');
      const dataKeys = Object.keys(payload.data || {});
      expect(dataKeys.length, filePath).toBeGreaterThan(0);
      expect(dataKeys.length, filePath).toBeLessThanOrEqual(2);
    }
  });

  it('embeds fisheye demo data and control defaults for the form-driven example', () => {
    const html = readDoc(path.join(generatedDocsDir, 'packages/echarts-fisheye/index.html'));
    const payload = readEmbeddedJson(html, 'data-demo-payload');

    expect(html).toContain('data-example="fisheye"');
    expect(payload.exampleName).toBe('fisheye');
    expect(payload.data.fisheyeScatter.length).toBeGreaterThan(100);
    expect(payload.controlValues.fisheyeRadius).toBe(170);
    expect(payload.controlValues.dotScale).toBe(0.42);
  });

  it('embeds initial large demo payloads in large data pages', () => {
    const largePages = generatedHtmlFiles().filter((filePath) => {
      const html = readDoc(filePath);
      return /data-large-example="/.test(html);
    });

    expect(largePages.length).toBeGreaterThan(20);
    for (const filePath of largePages) {
      const html = readDoc(filePath);
      expect(html, filePath).toContain('type="application/json" data-large-demo-payload');
      const payload = readEmbeddedJson(html, 'data-large-demo-payload');
      expect(payload.prepared?.option, filePath).toBeTruthy();
      expect(payload.prepared?.payload?.data, filePath).toBeUndefined();
    }
  });

  it('pre-renders layout core example cards', () => {
    const html = readDoc(path.join(generatedDocsDir, 'packages/echarts-layout-core/index.html'));

    expect(html).toContain('id="layout-radial"');
    expect(html).toContain('class="layout-card"');
    expect(html).toContain('<svg');
  });

  it('links every package example to its options section', () => {
    const packagePages = generatedHtmlFiles().filter((filePath) => {
      return path.relative(generatedDocsDir, filePath).startsWith(`packages${path.sep}`);
    });

    expect(packagePages.length).toBeGreaterThan(80);
    for (const filePath of packagePages) {
      const relativePath = path.relative(generatedDocsDir, filePath);
      const packageName = relativePath.split(path.sep)[1];
      const html = readDoc(filePath);
      const isChinesePage = relativePath.endsWith('.zh.html');
      const optionsPage = isChinesePage ? 'options.zh.html' : 'options.html';
      const optionsLabel = isChinesePage ? '配置项' : 'Options';
      expect(html, relativePath).toContain(`href="../../${optionsPage}#${packageName}"`);
      expect(html, relativePath).toContain(`>${optionsLabel}</a>`);
    }
  });

  it('adds the project GitHub link to generated page navigation', () => {
    const githubLink = 'href="https://github.com/susiwen8/echarts-extension"';
    const galleryHtml = readDoc(path.join(generatedDocsDir, 'index.html'));
    const packageHtml = readDoc(path.join(generatedDocsDir, 'packages/echarts-radial-boxplot/index.html'));
    const chinesePackageHtml = readDoc(path.join(generatedDocsDir, 'packages/echarts-radial-boxplot/index.zh.html'));

    expect(galleryHtml).toContain(githubLink);
    expect(packageHtml).toContain(`${githubLink} target="_blank" rel="noreferrer">GitHub</a>`);
    expect(chinesePackageHtml).toContain(`${githubLink} target="_blank" rel="noreferrer">GitHub</a>`);
  });

  it('generates localized Chinese example pages with language switches', () => {
    const englishHtml = readDoc(path.join(generatedDocsDir, 'packages/echarts-radial-boxplot/index.html'));
    const chineseHtml = readDoc(path.join(generatedDocsDir, 'packages/echarts-radial-boxplot/index.zh.html'));
    const chineseLargeHtml = readDoc(path.join(generatedDocsDir, 'packages/echarts-radial-boxplot/large.zh.html'));
    const chineseGalleryHtml = readDoc(path.join(generatedDocsDir, 'index.zh.html'));

    expect(englishHtml).toContain('href="./index.zh.html" lang="zh-CN">中文</a>');
    expect(chineseHtml).toContain('<html lang="zh-CN">');
    expect(chineseHtml).toContain('<h1>径向箱线图</h1>');
    expect(chineseHtml).toContain('五数概括以径向箱体、须线和中位数弧线呈现。');
    expect(chineseHtml).toContain('href="../../index.zh.html">全部示例</a>');
    expect(chineseHtml).toContain('href="../../options.zh.html#echarts-radial-boxplot">配置项</a>');
    expect(chineseHtml).toContain('href="./large.zh.html">大数据</a>');
    expect(chineseHtml).toContain('href="./" lang="en">English</a>');
    expect(chineseLargeHtml).toContain('href="./index.zh.html">标准示例</a>');
    expect(chineseLargeHtml).toContain('href="./large.html" lang="en">English</a>');
    expect(chineseGalleryHtml).toContain('<title>ECharts Extension 示例</title>');
    expect(chineseGalleryHtml).toContain('href="./packages/echarts-radial-boxplot/index.zh.html"');
    expect(chineseGalleryHtml).toContain('href="./options.zh.html">配置项</a>');
    expect(chineseGalleryHtml).toContain('href="./" lang="en">English</a>');
  });
});

function generatedHtmlFiles() {
  return globSync('**/*.html', { cwd: generatedDocsDir })
    .map((fileName) => path.join(generatedDocsDir, fileName))
    .sort();
}
