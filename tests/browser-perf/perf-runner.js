import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from 'playwright';

import { browserPerfCases } from './cases.js';

const root = path.resolve(import.meta.dirname, '../..');
const resultDir = path.join(root, 'test-results/browser-perf');
const skipBuild = process.env.SKIP_BROWSER_PERF_BUILD === '1';
const caseFilter = process.env.BROWSER_PERF_CASE;
const profile = process.env.BROWSER_PERF_PROFILE || 'smoke';
const count = readCount(profile);
const budgetMs = Number.parseFloat(process.env.BROWSER_PERF_BUDGET_MS || '1000');
const enforceBudget = process.env.BROWSER_PERF_ENFORCE_BUDGET === '1';
const measureUpdate = process.env.BROWSER_PERF_MEASURE_UPDATE === '1' || process.env.BROWSER_PERF_PHASE === 'update';

const selectedCases = caseFilter
  ? browserPerfCases.filter((perfCase) => perfCase.name.includes(caseFilter))
  : browserPerfCases;

if (selectedCases.length === 0) {
  throw new Error(`No browser perf cases matched BROWSER_PERF_CASE=${caseFilter}`);
}

await mkdir(resultDir, { recursive: true });

const buildStart = now();
if (!skipBuild) {
  await run('npm', ['run', 'build']);
}
const buildMs = now() - buildStart;

const server = await startStaticServer(root);
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
    if (url.startsWith(baseUrl)) {
      await route.continue();
    } else {
      await route.abort();
    }
  });

  for (const perfCase of selectedCases) {
    const result = await runPerfCase(context, perfCase, baseUrl);
    report.push(result);
    if (!result.ok) failures.push(result);
  }
} finally {
  await browser.close();
  await server.close();
}

const summary = {
  profile,
  count,
  budgetMs,
  enforceBudget,
  measureUpdate,
  buildMs: roundMs(buildMs),
  generatedAt: new Date().toISOString(),
  cases: report
};

await writeFile(path.join(resultDir, 'latest.json'), `${JSON.stringify(summary, null, 2)}\n`);

report.forEach((result) => {
  if (!result.steps) {
    console.log(`${result.name}: failed | ${result.message}`);
    return;
  }
  const status = result.overBudget ? 'over budget' : 'within budget';
  console.log([
    `${result.name}: ${result.steps.totalMs}ms ${result.phase || 'run'} total (${status})`,
    `raw=${result.rawCount}`,
    `rendered=${result.renderCount}`,
    `data=${result.steps.dataMs}ms`,
    `setOption=${result.steps.setOptionMs}ms`,
    `firstFrame=${result.steps.firstFrameMs}ms`,
    `finished=${result.steps.finishedMs}ms`,
    `inspect=${result.steps.inspectMs}ms`
  ].join(' | '));
});

if (failures.length > 0) {
  const details = failures
    .map((failure) => `- ${failure.name}: ${failure.message}`)
    .join('\n');
  throw new Error(`Browser perf failed:\n${details}`);
}

async function runPerfCase(context, perfCase, baseUrl) {
  const page = await context.newPage();
  const url = `${baseUrl}${perfCase.path}?count=${count}`;
  const startedAt = now();
  const pageErrors = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  try {
    await gotoWithRetry(page, url);
    await page.waitForSelector(perfCase.readySelector, { state: 'visible', timeout: 30000 });
    const initialResult = await page.evaluate((expression) => {
      const ready = Function(`return ${expression}`)();
      return Promise.resolve(ready);
    }, perfCase.resultExpression);
    const result = measureUpdate
      ? await page.evaluate(() => window.__ECHARTS_EXTENSION_PERF__?.run?.())
      : initialResult;
    const elapsedMs = now() - startedAt;
    const overBudget = result.steps.totalMs > budgetMs;
    const ok = pageErrors.length === 0 && (!enforceBudget || !overBudget);
    return {
      ...result,
      name: perfCase.name,
      url,
      measuredPhase: measureUpdate ? 'update' : 'initial',
      initialResult: measureUpdate ? initialResult : undefined,
      navigationMs: roundMs(elapsedMs),
      buildMs: roundMs(buildMs),
      budgetMs,
      overBudget,
      ok,
      message: pageErrors.length
        ? pageErrors.join('; ')
        : enforceBudget && overBudget
          ? `${result.steps.totalMs}ms total exceeded ${budgetMs}ms budget`
          : ''
    };
  } catch (error) {
    return {
      name: perfCase.name,
      url,
      ok: false,
      message: error.message,
      pageErrors
    };
  } finally {
    await page.close();
  }
}

function readCount(selectedProfile) {
  const explicit = Number.parseInt(process.env.BROWSER_PERF_COUNT || '', 10);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  if (selectedProfile === 'stress') return 1000000;
  if (selectedProfile === 'nightly') return 100000;
  return 300;
}

async function gotoWithRetry(page, url) {
  try {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
  } catch (firstError) {
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
    } catch (secondError) {
      secondError.message = `${secondError.message}\nFirst attempt: ${firstError.message}`;
      throw secondError;
    }
  }
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

function isInsideRoot(filePath, rootDir) {
  const relativePath = path.relative(rootDir, filePath);
  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
}

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

function now() {
  return performance.now();
}

function roundMs(value) {
  return Math.round(value * 10) / 10;
}
