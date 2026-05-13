import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(rootDir, 'docs');
const templatesDir = path.join(docsDir, 'templates');

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);
const shouldCheck = args.has('--check');
const outputDirArg = readArgValue(rawArgs, '--out');
const outputDir = path.resolve(rootDir, outputDirArg || 'docs');
const shouldCompareOutput = shouldCheck && Boolean(outputDirArg);
const shouldUseOfflineData = process.env.ECHARTS_DOCS_SSG_OFFLINE === '1' || (shouldCheck && !shouldCompareOutput);

if (args.has('--help')) {
  console.log(`Usage:
  node scripts/sync-docs-ssg.mjs
  node scripts/sync-docs-ssg.mjs --out .pages/docs
  node scripts/sync-docs-ssg.mjs --check
  node scripts/sync-docs-ssg.mjs --out .pages/docs --check

Generates static HTML from docs/templates. Standard examples embed their initial data in HTML, large examples embed their initial prepared option, and the layout-core page pre-renders its layout cards.
Default --check validates that templates can generate without writing ignored HTML files. When --out is provided, --check compares the generated HTML with that output directory.
`);
  process.exit(0);
}

const templateFiles = await listTemplateFiles(templatesDir);
const demoApi = loadDemoApi();
const largeApi = loadLargeApi();
const layoutCoreMarkup = await loadLayoutCoreMarkup();
const staleFiles = [];

for (const templatePath of templateFiles) {
  const outputPath = outputPathForTemplate(templatePath);
  const current = await readFile(templatePath, 'utf8');
  const next = await transformDocsHtml(templatePath, current);

  if (shouldCheck) {
    if (shouldCompareOutput) await collectStaleOutput(outputPath, next, staleFiles);
  } else {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, next);
  }
}

if (shouldCheck) {
  if (staleFiles.length) {
    throw new Error(`Docs SSG pages are stale. Regenerate the checked output directory. Stale: ${staleFiles.join(', ')}`);
  }
  console.log(shouldCompareOutput ? 'Docs SSG pages are in sync.' : 'Docs SSG templates can generate pages.');
} else {
  console.log('Generated SSG payloads for docs pages.');
}

async function listTemplateFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listTemplateFiles(filePath);
    if (!entry.isFile() || !entry.name.endsWith('.tpl')) return [];
    const relative = path.relative(templatesDir, filePath);
    return ['options.tpl', 'options.zh.tpl'].includes(relative) ? [] : [filePath];
  }));
  return files.flat().sort();
}

async function collectStaleOutput(outputPath, nextContent, staleFiles) {
  let currentContent = '';
  try {
    currentContent = await readFile(outputPath, 'utf8');
  } catch {
    staleFiles.push(path.relative(rootDir, outputPath));
    return;
  }
  if (currentContent !== nextContent) staleFiles.push(path.relative(rootDir, outputPath));
}

function outputPathForTemplate(templatePath) {
  const relative = path.relative(templatesDir, templatePath).replace(/\.tpl$/, '.html');
  return path.join(outputDir, relative);
}

async function transformDocsHtml(filePath, html) {
  if (path.relative(templatesDir, filePath) === path.join('packages', 'echarts-layout-core', 'index.tpl')) {
    html = injectLayoutCoreMarkup(html);
  }

  const exampleName = readBodyDataset(html, 'example');
  if (exampleName && html.includes('../../shared/demo-runner.js')) {
    html = await injectStandardDemoPayload(html, exampleName);
  }

  const largeExampleName = readBodyDataset(html, 'large-example');
  if (largeExampleName) {
    html = injectLargeDemoPayload(html, largeExampleName);
  }

  return html;
}

function injectLayoutCoreMarkup(html) {
  const nextSection = `<section id="layouts" class="layout-grid" aria-label="Layout examples">\n${indent(layoutCoreMarkup, 6)}\n    </section>`;
  return html.replace(
    /<section id="layouts" class="layout-grid" aria-label="Layout examples">[\s\S]*?<\/section>/,
    nextSection
  ).replace(/layout-core-example\.js\?v=[A-Za-z0-9_.-]+/g, 'layout-core-example.js?v=ssg-1');
}

function readArgValue(values, name) {
  const index = values.indexOf(name);
  if (index < 0) return '';
  const value = values[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

async function injectStandardDemoPayload(html, exampleName) {
  const entry = demoApi.registry[exampleName];
  if (!entry) throw new Error(`Unknown standard docs example: ${exampleName}`);

  const initialData = await loadStandardExampleData(exampleName);
  const payload = {
    exampleName,
    data: pickStandardExampleData(entry, initialData),
    controlValues: demoApi.createControlState(entry.controls || [])
  };

  const payloadScript = createJsonScript('data-demo-payload', 'data-example-name', exampleName, payload, 2);
  html = removeJsonScript(html, 'data-demo-payload');
  html = html.replace(/\n\s*<script src="\.\.\/\.\.\/shared\/demo-data\.js[^"]*"><\/script>/g, '');
  return insertBeforeScript(html, '../../shared/demo-runner.js', payloadScript);
}

function injectLargeDemoPayload(html, caseName) {
  const definition = largeApi.cases[caseName];
  if (!definition) throw new Error(`Unknown large docs example: ${caseName}`);

  const count = definition.defaultCount;
  const seed = 0;
  const prepared = largeApi.createLargeOption(caseName, count, seed);
  const payload = {
    caseName,
    count,
    seed,
    prepared: {
      payload: omitDataFromLargePayload(prepared.payload),
      option: prepared.option,
      timings: prepared.timings
    }
  };

  const payloadScript = createJsonScript('data-large-demo-payload', 'data-case-name', caseName, payload, detectScriptIndent(html));
  html = removeJsonScript(html, 'data-large-demo-payload');
  return insertBeforeScript(html, '../../shared/large-data.js', payloadScript);
}

function readBodyDataset(html, key) {
  const bodyMatch = html.match(/<body\b[^>]*>/i);
  if (!bodyMatch) return '';
  const match = bodyMatch[0].match(new RegExp(`data-${escapeRegExp(key)}="([^"]+)"`));
  return match ? decodeHtmlAttribute(match[1]) : '';
}

function createJsonScript(markerAttribute, nameAttribute, name, payload, spaces = 2) {
  const prefix = ' '.repeat(spaces);
  return `${prefix}<script type="application/json" ${markerAttribute} ${nameAttribute}="${escapeAttribute(name)}">${safeJson(payload)}</script>`;
}

function removeJsonScript(html, markerAttribute) {
  const pattern = new RegExp(`\\n\\s*<script type="application/json" ${markerAttribute}\\b[\\s\\S]*?<\\/script>`, 'g');
  return html.replace(pattern, '');
}

function insertBeforeScript(html, scriptPath, payloadScript) {
  const pattern = new RegExp(`(\\n\\s*<script src="${escapeRegExp(scriptPath)}[^"]*"><\\/script>)`);
  if (!pattern.test(html)) {
    throw new Error(`Unable to locate ${scriptPath} script tag.`);
  }
  return html.replace(pattern, `\n${payloadScript}$1`);
}

function detectScriptIndent(html) {
  const match = html.match(/\n(\s*)<script src="\.\.\/\.\.\/shared\/large-data\.js/);
  return match ? match[1].length : 2;
}

function loadDemoApi() {
  const context = createVmContext();
  runVmFile(context, path.join(docsDir, 'shared/demo-data.js'));
  runVmFile(context, path.join(docsDir, 'shared/demo-runner.js'));
  return context.window.EChartsExtensionExamples;
}

function loadLargeApi() {
  const context = createVmContext();
  runVmFile(context, path.join(docsDir, 'shared/demo-data.js'));
  runVmFile(context, path.join(docsDir, 'shared/demo-runner.js'));
  runVmFile(context, path.join(docsDir, 'shared/large-data.js'));
  return context.window.EChartsExtensionLargeData;
}

function createVmContext() {
  const document = {
    addEventListener() {},
    querySelector() {
      return null;
    }
  };
  const window = {
    document,
    console,
    location: { search: '' },
    performance: { now: () => 0 },
    setTimeout() {},
    clearTimeout() {},
    requestAnimationFrame(callback) {
      if (typeof callback === 'function') callback();
    }
  };
  window.window = window;
  const context = { window, document, console };
  if (!shouldUseOfflineData && typeof fetch === 'function') {
    context.fetch = (url, options = {}) => fetch(url, {
      ...options,
      signal: options.signal || createFetchTimeoutSignal()
    });
    window.fetch = context.fetch;
  }
  context.globalThis = context;
  vm.createContext(context);
  return context;
}

function createFetchTimeoutSignal() {
  return typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
    ? AbortSignal.timeout(15000)
    : undefined;
}

function runVmFile(context, filePath) {
  vm.runInContext(readFileSync(filePath), context, { filename: filePath });
}

async function loadLayoutCoreMarkup() {
  const moduleUrl = `${pathToFileURL(path.join(docsDir, 'shared/layout-core-example.js')).href}?ssg=${Date.now()}`;
  const module = await import(moduleUrl);
  if (typeof module.createLayoutCardsMarkup !== 'function') {
    throw new Error('layout-core-example.js must export createLayoutCardsMarkup().');
  }
  return module.createLayoutCardsMarkup();
}

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function cloneJsonValue(value) {
  return JSON.parse(JSON.stringify(value));
}

async function loadStandardExampleData(exampleName) {
  if (shouldUseOfflineData || typeof demoApi.loadExampleData !== 'function') {
    return cloneJsonValue(demoApi.data || {});
  }
  const data = await demoApi.loadExampleData(exampleName);
  return cloneJsonValue(data || {});
}

function pickStandardExampleData(entry, sourceData) {
  const keys = new Set();
  const recordingData = new Proxy({}, {
    get(_target, key) {
      if (typeof key === 'string') keys.add(key);
      return sourceData[key];
    },
    has(_target, key) {
      return key in sourceData;
    },
    ownKeys() {
      return Reflect.ownKeys(sourceData);
    },
    getOwnPropertyDescriptor(_target, key) {
      return Object.prototype.hasOwnProperty.call(sourceData, key)
        ? { enumerable: true, configurable: true }
        : undefined;
    }
  });

  entry.option(recordingData);

  return [...keys].sort().reduce((data, key) => {
    if (Object.prototype.hasOwnProperty.call(sourceData, key)) {
      data[key] = sourceData[key];
    }
    return data;
  }, {});
}

function omitDataFromLargePayload(payload) {
  const { data: _data, ...meta } = payload || {};
  return meta;
}

function indent(value, spaces) {
  const prefix = ' '.repeat(spaces);
  return value.split('\n').map((line) => line ? `${prefix}${line}` : line).join('\n');
}

function escapeAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function decodeHtmlAttribute(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
