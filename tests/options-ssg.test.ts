import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(rootDir, 'docs');
let generatedDocsDir = '';

function readDoc(fileName: string) {
  const baseDir = fileName === 'options.js' ? docsDir : generatedDocsDir;
  return readFileSync(path.join(baseDir, fileName), 'utf8');
}

describe('options docs SSG output', () => {
  beforeAll(() => {
    generatedDocsDir = mkdtempSync(path.join(tmpdir(), 'echarts-options-ssg-'));
    execFileSync(process.execPath, [
      'scripts/sync-options-from-readmes.mjs',
      '--out',
      generatedDocsDir
    ], { cwd: rootDir, stdio: 'pipe' });
  });

  afterAll(() => {
    if (generatedDocsDir) rmSync(generatedDocsDir, { recursive: true, force: true });
  });

  it('pre-renders English navigation and option rows', () => {
    const html = readDoc('options.html');

    expect(html).toContain('data-option-target="echarts-layout-core"');
    expect(html).toContain('id="echarts-layout-core"');
    expect(html).toContain('data-option-name="input"');
    expect(html).toContain('<code>input.data</code>');
    expect(html).not.toContain('Loading option reference');
  });

  it('pre-renders Chinese navigation and localized option rows', () => {
    const html = readDoc('options.zh.html');

    expect(html).toContain('data-option-target="echarts-layout-core"');
    expect(html).toContain('布局核心');
    expect(html).toContain('href="./index.zh.html">示例</a>');
    expect(html).toContain('href="./packages/echarts-radial-boxplot/index.zh.html">示例</a>');
    expect(html).toContain('href="./packages/echarts-venn/hollow.zh.html">空心示例</a>');
    expect(html).toContain('href="./packages/echarts-venn/bubble.zh.html">气泡示例</a>');
    expect(html).not.toContain('href="./packages/echarts-radial-boxplot/">示例</a>');
    expect(html).not.toContain('href="./packages/echarts-venn/hollow.html">空心示例</a>');
    expect(html).toContain('data-option-name="input"');
    expect(html).toContain('汇总图布局输入数据和连线配置');
    expect(html).not.toContain('正在加载配置项文档');
  });

  it('keeps the browser interaction script free of generated option data', () => {
    const script = readDoc('options.js');

    expect(script).not.toMatch(/const\s+optionReferences\s*=/);
    expect(script).not.toContain('Generated from package README option tables');
  });
});
