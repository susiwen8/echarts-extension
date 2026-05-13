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
});

function generatedHtmlFiles() {
  return globSync('**/*.html', { cwd: generatedDocsDir })
    .map((fileName) => path.join(generatedDocsDir, fileName))
    .sort();
}
