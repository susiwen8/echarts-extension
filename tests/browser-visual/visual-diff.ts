import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import pixelmatch from 'pixelmatch';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

import { browserVisualCases } from './cases.ts';
import { writeBrowserVisualReportPage } from './report-page.ts';
import { stitchPngs } from './screenshot-stitch.ts';
import { resolveScreenshotSelector } from './visual-target.ts';

const root = path.resolve(import.meta.dirname, '../..');
const pagesDir = path.join(root, '.pages');
const resultDir = path.join(root, 'test-results/browser-visual');
const shouldUpdate = process.env.UPDATE_BROWSER_VISUAL_SNAPSHOTS === '1' || process.argv.includes('--update');
const skipBuild = process.env.SKIP_BROWSER_VISUAL_BUILD === '1';
const maxDiffPixels = Number.parseInt(process.env.BROWSER_VISUAL_MAX_DIFF_PIXELS || '50', 10);
const pixelThreshold = Number.parseFloat(process.env.BROWSER_VISUAL_PIXEL_THRESHOLD || '0.1');
const caseFilter = process.env.BROWSER_VISUAL_CASE;
const allowedRemoteDataHosts = new Set([
  'assets.antv.antgroup.com',
  'gw.alipayobjects.com',
  'raw.githubusercontent.com'
]);

const selectedCases = caseFilter
  ? browserVisualCases.filter((visualCase) => visualCase.name.includes(caseFilter))
  : browserVisualCases;

if (selectedCases.length === 0) {
  throw new Error(`No browser visual cases matched BROWSER_VISUAL_CASE=${caseFilter}`);
}

if (!skipBuild) {
  await run('npm', ['run', 'pages:build']);
}

await mkdir(resultDir, { recursive: true });

const server = await startStaticServer(pagesDir);
const baseUrl = `http://127.0.0.1:${server.port}`;
const browser = await chromium.launch({ headless: true });
const report = [];
const failures = [];

try {
  const context = await browser.newContext({
    colorScheme: 'light',
    deviceScaleFactor: 1,
    viewport: { width: 1280, height: 900 }
  });

  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith(baseUrl) || isAllowedRemoteDataUrl(url)) {
      await route.continue();
    } else {
      await route.abort();
    }
  });

  for (const visualCase of selectedCases) {
    const result = await runVisualCase(context, visualCase, baseUrl);
    report.push(result);
    if (!result.ok) failures.push(result);
  }
} finally {
  await browser.close();
  await server.close();
}

await writeFile(path.join(resultDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
const reportPagePath = await writeBrowserVisualReportPage(report, { rootDir: root, resultDir });

if (failures.length > 0) {
  console.error(`Browser visual diff report written: ${relative(reportPagePath)}`);
  const details = failures
    .map((failure) => `- ${failure.name}: ${failure.message}`)
    .join('\n');
  throw new Error(`Browser visual diff failed:\n${details}`);
}

for (const result of report) {
  console.log(
    shouldUpdate
      ? `Updated browser visual example screenshot: ${result.snapshotPath}`
      : `Browser visual example screenshot matched: ${result.snapshotPath}`
  );
}

async function runVisualCase(context, visualCase, baseUrl) {
  const page = await context.newPage();
  const snapshotPath = resolveExampleScreenshotPath(visualCase);
  const actualPath = path.join(resultDir, `${visualCase.name}.actual.png`);
  const diffPath = path.join(resultDir, `${visualCase.name}.diff.png`);

  try {
    await rm(actualPath, { force: true });
    await rm(diffPath, { force: true });

    await page.goto(`${baseUrl}${visualCase.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForSelector(visualCase.readySelector, { state: 'visible', timeout: 15000 });
    if (visualCase.disableAnimations !== false) {
      await disableAnimationControls(page);
    }
    await page.waitForTimeout(visualCase.waitAfterRenderMs ?? 1400);

    const screenshotTarget = await screenshotVisualTarget(page, visualCase);
    const screenshot = screenshotTarget.screenshot;

    if (shouldUpdate) {
      await mkdir(path.dirname(snapshotPath), { recursive: true });
      await writeFile(snapshotPath, screenshot);
      return {
        name: visualCase.name,
        ok: true,
        screenshotSelector: screenshotTarget.selector,
        snapshotPath: relative(snapshotPath),
        url: `${baseUrl}${visualCase.path}`,
        updated: true
      };
    }

    await writeFile(actualPath, screenshot);

    if (!(await exists(snapshotPath))) {
      return {
        name: visualCase.name,
        ok: false,
        actualPath: relative(actualPath),
        message: `missing example screenshot ${relative(snapshotPath)}; run npm run test:visual:browser:update`,
        screenshotSelector: screenshotTarget.selector,
        snapshotPath: relative(snapshotPath),
        url: `${baseUrl}${visualCase.path}`
      };
    }

    const expected = PNG.sync.read(await readFile(snapshotPath));
    const actual = PNG.sync.read(screenshot);
    if (actual.width !== expected.width || actual.height !== expected.height) {
      const dimensionDiff = createImageDiff(expected, actual);
      await writeFile(diffPath, PNG.sync.write(dimensionDiff.diff));
      return {
        name: visualCase.name,
        ok: false,
        actualPath: relative(actualPath),
        diffPath: relative(diffPath),
        diffPixels: dimensionDiff.diffPixels,
        message: `size changed from ${expected.width}x${expected.height} to ${actual.width}x${actual.height}`,
        screenshotSelector: screenshotTarget.selector,
        snapshotPath: relative(snapshotPath),
        url: `${baseUrl}${visualCase.path}`
      };
    }

    const { diff, diffPixels } = createImageDiff(expected, actual);
    const allowedDiffPixels = visualCase.maxDiffPixels ?? maxDiffPixels;

    if (diffPixels > allowedDiffPixels) {
      await writeFile(diffPath, PNG.sync.write(diff));
      return {
        name: visualCase.name,
        ok: false,
        actualPath: relative(actualPath),
        diffPath: relative(diffPath),
        diffPixels,
        maxDiffPixels: allowedDiffPixels,
        message: `${diffPixels} pixels differ; expected at most ${allowedDiffPixels}`,
        screenshotSelector: screenshotTarget.selector,
        snapshotPath: relative(snapshotPath),
        url: `${baseUrl}${visualCase.path}`
      };
    }

    return {
      name: visualCase.name,
      ok: true,
      actualPath: relative(actualPath),
      diffPixels,
      maxDiffPixels: allowedDiffPixels,
      screenshotSelector: screenshotTarget.selector,
      snapshotPath: relative(snapshotPath),
      url: `${baseUrl}${visualCase.path}`
    };
  } finally {
    await page.close();
  }
}

function createImageDiff(expected, actual) {
  const width = Math.max(expected.width, actual.width);
  const height = Math.max(expected.height, actual.height);
  const expectedImage = expected.width === width && expected.height === height
    ? expected
    : padImage(expected, width, height);
  const actualImage = actual.width === width && actual.height === height
    ? actual
    : padImage(actual, width, height);
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(expectedImage.data, actualImage.data, diff.data, width, height, {
    threshold: pixelThreshold
  });

  return { diff, diffPixels };
}

function padImage(image, width, height) {
  const padded = new PNG({ width, height });
  fillPng(padded, 255, 255, 255, 255);
  copyPng(image, padded);
  return padded;
}

function fillPng(image, red, green, blue, alpha) {
  for (let index = 0; index < image.data.length; index += 4) {
    image.data[index] = red;
    image.data[index + 1] = green;
    image.data[index + 2] = blue;
    image.data[index + 3] = alpha;
  }
}

function copyPng(source, target) {
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const sourceIndex = (y * source.width + x) * 4;
      const targetIndex = (y * target.width + x) * 4;
      target.data[targetIndex] = source.data[sourceIndex];
      target.data[targetIndex + 1] = source.data[sourceIndex + 1];
      target.data[targetIndex + 2] = source.data[sourceIndex + 2];
      target.data[targetIndex + 3] = source.data[sourceIndex + 3];
    }
  }
}

function resolveExampleScreenshotPath(visualCase) {
  return path.join(root, 'visual-baseline', `${visualBaselineName(visualCase.path)}.png`);
}

function visualBaselineName(casePath) {
  const pagePath = casePath.replace(/^\/+/, '');
  if (!pagePath.startsWith('docs/packages/')) {
    throw new Error(`Browser visual baselines must come from docs package examples: ${casePath}`);
  }

  const relative = pagePath.slice('docs/packages/'.length);
  const parts = relative.split('/').filter(Boolean);
  const packageName = parts[0];
  const lastPart = parts.at(-1) || '';
  const pageName = lastPart.endsWith('.html') ? path.parse(lastPart).name : 'index';
  return pageName === 'index' ? packageName : `${packageName}-${pageName}`;
}

async function screenshotVisualTarget(page, visualCase) {
  const selector = resolveScreenshotSelector(visualCase);
  const locator = page.locator(selector);
  const count = await locator.count();
  if (count === 0) {
    throw new Error(`No browser visual screenshot target matched ${selector}`);
  }

  const regions = [];
  for (let index = 0; index < count; index += 1) {
    const target = locator.nth(index);
    const box = await target.boundingBox();
    if (box && box.width > 0 && box.height > 0) {
      regions.push({ box, index });
    }
  }

  if (regions.length === 0) {
    throw new Error(`Browser visual screenshot target ${selector} has no visible region`);
  }

  if (regions.length === 1) {
    return {
      screenshot: await locator.nth(regions[0].index).screenshot({ animations: 'disabled' }),
      selector
    };
  }

  const orderedRegions = sortRegionsByPosition(regions);
  const screenshots = [];
  for (const region of orderedRegions) {
    const buffer = await locator.nth(region.index).screenshot({ animations: 'disabled' });
    screenshots.push(PNG.sync.read(buffer));
  }

  const stitched = stitchPngs(screenshots, {
    columns: inferColumnCount(orderedRegions)
  });
  return {
    screenshot: PNG.sync.write(stitched),
    selector
  };
}

function sortRegionsByPosition(regions) {
  return regions.slice().sort((left, right) => {
    if (Math.abs(left.box.y - right.box.y) > 8) return left.box.y - right.box.y;
    return left.box.x - right.box.x;
  });
}

function inferColumnCount(regions) {
  const firstRowY = regions[0]?.box.y ?? 0;
  return Math.max(1, regions.filter((region) => Math.abs(region.box.y - firstRowY) <= 8).length);
}

async function disableAnimationControls(page) {
  const playbackButtons = page.locator('.demo-control-playback-button[data-playing="true"]');
  const playbackCount = await playbackButtons.count();
  for (let index = 0; index < playbackCount; index += 1) {
    await playbackButtons.nth(index).click({ force: true });
  }

  const controls = page.locator('[data-control-id="animationEnabled"]');
  const count = await controls.count();
  if (count === 0) return;

  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    if (await control.isChecked()) {
      await control.uncheck({ force: true });
    }
  }

  await page.waitForTimeout(180);
}

function startStaticServer(rootDir) {
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
      let pathname = decodeURIComponent(requestUrl.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';

      let filePath = path.resolve(rootDir, `.${pathname}`);
      if (!isInsideRoot(filePath, rootDir)) {
        response.writeHead(403).end('Forbidden');
        return;
      }

      const fileStat = await stat(filePath);
      if (fileStat.isDirectory()) filePath = path.join(filePath, 'index.html');

      response.writeHead(200, { 'content-type': contentType(filePath) });
      response.end(await readFile(filePath));
    } catch {
      response.writeHead(404).end('Not found');
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      resolve({
        close: () => new Promise((closeResolve, closeReject) => {
          server.close((error) => (error ? closeReject(error) : closeResolve()));
        }),
        port: server.address().port
      });
    });
  });
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      stdio: 'inherit'
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
      }
    });
  });
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function isInsideRoot(filePath, rootDir) {
  const relativePath = path.relative(rootDir, filePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function contentType(filePath) {
  const extension = path.extname(filePath);
  if (extension === '.html') return 'text/html; charset=utf-8';
  if (extension === '.js') return 'text/javascript; charset=utf-8';
  if (extension === '.css') return 'text/css; charset=utf-8';
  if (extension === '.svg') return 'image/svg+xml';
  if (extension === '.json' || extension === '.map') return 'application/json; charset=utf-8';
  if (extension === '.png') return 'image/png';
  return 'application/octet-stream';
}

function isAllowedRemoteDataUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && allowedRemoteDataHosts.has(parsed.hostname);
  } catch {
    return false;
  }
}

function relative(filePath) {
  return path.relative(root, filePath);
}
