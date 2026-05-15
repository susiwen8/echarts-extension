import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(rootDir, 'docs');
const templatesDir = path.join(docsDir, 'templates');
const repositoryUrl = 'https://github.com/susiwen8/echarts-extension';

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
const layoutCoreMarkupByLocale = {
  en: await loadLayoutCoreMarkup('en'),
  zh: await loadLayoutCoreMarkup('zh')
};
const staleFiles = [];

for (const templatePath of templateFiles) {
  const current = await readFile(templatePath, 'utf8');
  for (const locale of outputLocalesForTemplate(templatePath)) {
    const outputPath = outputPathForTemplate(templatePath, locale);
    const next = await transformDocsHtml(templatePath, current, locale);

    if (shouldCheck) {
      if (shouldCompareOutput) await collectStaleOutput(outputPath, next, staleFiles);
    } else {
      await mkdir(path.dirname(outputPath), { recursive: true });
      await writeFile(outputPath, next);
    }
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

function outputLocalesForTemplate(templatePath) {
  const relative = templateRelativePath(templatePath);
  return isLocalizedDocsTemplate(relative) ? ['en', 'zh'] : ['en'];
}

function isLocalizedDocsTemplate(relative) {
  return relative === 'index.tpl' || relative.startsWith('packages/');
}

function outputPathForTemplate(templatePath, locale = 'en') {
  const extension = locale === 'zh' ? '.zh.html' : '.html';
  const relative = templateRelativePath(templatePath).replace(/\.tpl$/, extension);
  return path.join(outputDir, relative);
}

async function transformDocsHtml(filePath, html, locale = 'en') {
  const relativeTemplatePath = templateRelativePath(filePath);
  if (relativeTemplatePath === 'packages/echarts-layout-core/index.tpl') {
    html = injectLayoutCoreMarkup(html, locale);
  }

  const exampleName = readBodyDataset(html, 'example');
  if (exampleName && html.includes('../../shared/demo-runner.js')) {
    html = await injectStandardDemoPayload(html, exampleName);
  }

  const largeExampleName = readBodyDataset(html, 'large-example');
  if (largeExampleName) {
    html = injectLargeDemoPayload(html, largeExampleName);
  }

  if (isLocalizedDocsTemplate(relativeTemplatePath)) {
    html = localizeDocsHtml(relativeTemplatePath, html, locale);
  }

  html = injectRepositoryLink(html);
  return injectThemeScript(relativeTemplatePath, html);
}

function injectRepositoryLink(html) {
  if (html.includes(`href="${repositoryUrl}"`)) return html;

  return html.replace(/(<nav class="demo-links"[^>]*>)([\s\S]*?)(\s*<\/nav>)/, (match, open, links, close) => {
    const indent = links.match(/\n(\s*)<a\b/)?.[1] || '        ';
    const link = `<a class="demo-link--github" href="${repositoryUrl}" target="_blank" rel="noreferrer">GitHub</a>`;
    return `${open}${links}\n${indent}${link}${close}`;
  });
}

function injectThemeScript(relativeTemplatePath, html) {
  if (html.includes('theme-toggle.js')) return html;
  const scriptPath = relativeTemplatePath.startsWith('packages/')
    ? '../../shared/theme-toggle.js?v=theme-1'
    : './shared/theme-toggle.js?v=theme-1';
  return html.replace(
    /(\n\s*<\/head>)/,
    `\n  <script src="${scriptPath}"></script>$1`
  );
}

function injectLayoutCoreMarkup(html, locale = 'en') {
  const markup = layoutCoreMarkupByLocale[locale] || layoutCoreMarkupByLocale.en;
  const ariaLabel = locale === 'zh' ? '布局示例' : 'Layout examples';
  const nextSection = `<section id="layouts" class="layout-grid" aria-label="${ariaLabel}">\n${indent(markup, 6)}\n    </section>`;
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

async function loadLayoutCoreMarkup(locale = 'en') {
  const moduleUrl = `${pathToFileURL(path.join(docsDir, 'shared/layout-core-example.js')).href}?ssg=${Date.now()}`;
  const module = await import(moduleUrl);
  if (typeof module.createLayoutCardsMarkup !== 'function') {
    throw new Error('layout-core-example.js must export createLayoutCardsMarkup().');
  }
  return module.createLayoutCardsMarkup(locale);
}

function localizeDocsHtml(relativeTemplatePath, html, locale) {
  const relativeHtmlPath = relativeTemplatePath.replace(/\.tpl$/, '.html');
  if (locale === 'en') return localizeEnglishDocsHtml(relativeHtmlPath, html);

  html = html.replace(/<html lang="en">/, '<html lang="zh-CN">');
  html = localizeChineseText(html);
  html = localizeChineseLinks(relativeHtmlPath, html);
  html = localizeChineseTitle(relativeHtmlPath, html);
  html = normalizeGalleryNavigation(relativeHtmlPath, html, 'zh');
  html = injectLocaleSwitch(relativeHtmlPath, html, 'zh');
  return html;
}

function localizeEnglishDocsHtml(relativeHtmlPath, html) {
  html = normalizeGalleryNavigation(relativeHtmlPath, html, 'en');
  return injectLocaleSwitch(relativeHtmlPath, html, 'en');
}

function localizeChineseText(html) {
  const replacements = new Map([
    ['ECharts Extension Examples', 'ECharts Extension 示例'],
    ['Examples', '示例'],
    ['Package demos and visual regression cases for the extension charts.', '扩展图表的示例和视觉回归用例。'],
    ['Arc', '弧线图'],
    ['Beeswarm', '蜂群图'],
    ['Cause and Effect Diagram', '因果图'],
    ['Circle Packing', '圆形打包图'],
    ['Concentric', '同心布局'],
    ['Fisheye', '鱼眼交互'],
    ['Flame', '火焰图'],
    ['Fractal Explorer', '分形浏览器'],
    ['Grid', '网格布局'],
    ['Layout Core', '布局核心'],
    ['Lollipop', '棒棒糖图'],
    ['MDS', 'MDS 布局'],
    ['Mosaic', '马赛克图'],
    ['Nested Circle', '嵌套圆图'],
    ['Organization Chart', '组织结构图'],
    ['Pack Bubble', '打包气泡图'],
    ['Radial Area', '径向区域图'],
    ['Radial Boxplot', '径向箱线图'],
    ['Radial', '径向布局'],
    ['Sequence Diagram', '时序图'],
    ['Smith Chart', '史密斯圆图'],
    ['Spiral Heatmap', '螺旋热力图'],
    ['Subway', '地铁线路图'],
    ['Sunrise Sunset', '日出日落图'],
    ['Vector Field', '向量场'],
    ['Bubble Venn', '气泡韦恩图'],
    ['Hollow Venn', '空心韦恩图'],
    ['Venn Cases', '韦恩图示例'],
    ['Voronoi Treemap', 'Voronoi 树图'],
    ['Large Data', '大数据'],
    ['Large Sequence Diagram', '大规模时序图'],
    ['Ordered graph nodes are connected with animated arced edge paths.', '有序图节点通过带动画的弧形边连接。'],
    ['Individual values are packed into category lanes without overlapping points.', '单个数值被排列到分类轨道中，点位互不重叠。'],
    ['Fishbone diagram for mapping root causes around a single effect.', '用于围绕单一结果梳理根因的鱼骨图。'],
    ['Hierarchical values are packed into nested circles without external layout dependencies.', '层级数值被打包到嵌套圆中，不依赖外部布局库。'],
    ['High-degree graph nodes sit closer to the center.', '度数更高的图节点会更靠近中心。'],
    ['Reusable magnifier interaction for standard and custom ECharts charts.', '适用于标准和自定义 ECharts 图表的可复用放大镜交互。'],
    ['Hierarchical values are laid out as a profile flame graph.', '层级数值以性能剖析火焰图的形式展开。'],
    ['Wheel to zoom and drag to pan; each view is recomputed from the complex plane.', '滚轮缩放、拖拽平移，每个视图都会从复平面重新计算。'],
    ['Graph nodes are placed into a deterministic grid, with optional cluster/value sorting and overlap-safe cells.', '图节点放入确定性的网格，可按集群或数值排序，并保持单元格不重叠。'],
    ['Direct layout API output for radial, concentric, grid, MDS, and arc graph cases.', '直接展示 radial、concentric、grid、MDS 和 arc 图布局 API 的输出。'],
    ['Category values are drawn as stems from a baseline with circular endpoints.', '分类数值以从基线伸出的茎线和圆形端点呈现。'],
    ['Graph distance constraints are projected into a two-dimensional view.', '图距离约束被投影到二维视图中。'],
    ['Category totals size each column while subcategories split the vertical area.', '分类总量决定列宽，子分类继续切分纵向区域。'],
    ['Bottom-aligned nested circles show roadmap layers and labels.', '底部对齐的嵌套圆展示路线图层级和标签。'],
    ['Nested or flat reporting structures are drawn as compact hierarchy cards with orthogonal links.', '嵌套或扁平的汇报结构会绘制成紧凑的层级卡片，并用正交连线连接。'],
    ['Value-sized circles are packed into a compact, non-overlapping bubble chart.', '按数值定大小的圆被打包成紧凑且不重叠的气泡图。'],
    ['Monthly values are drawn as radial lines with inner and outer range bands.', '月度数值以径向线和内外范围带呈现。'],
    ['Five-number summaries are drawn as radial boxes with whiskers and median arcs.', '五数概括以径向箱体、须线和中位数弧线呈现。'],
    ['Graph nodes are arranged around a root-focused radial layout.', '图节点围绕根节点聚焦的径向布局排列。'],
    ['UML lifelines with ordered messages, fragments, notes, create/destroy lifecycles, and activation bars.', '展示 UML 生命线、有序消息、片段、注释、创建/销毁生命周期和激活条。'],
    ['Normalized load impedances are mapped into the reflection coefficient plane.', '归一化负载阻抗被映射到反射系数平面。'],
    ['Ordered values are rendered as segments on one spiral path, with color intensity mapped from each value.', '有序数值沿一条螺旋路径渲染为分段，并用颜色强度映射数值。'],
    ['A schematic route map with transfer stations, parallel route markers, planned lines, and construction extensions.', '包含换乘站、并行线路标记、规划线路和建设延伸段的示意线路图。'],
    ['Sun and moon event times are projected onto a dark path display.', '太阳和月亮事件时间被投影到深色路径显示中。'],
    ['Wind components are rendered as north-up arrows over longitude and latitude.', '风向分量以经纬度上的北向箭头呈现。'],
    ['Value-sized translucent circles provide a compact bubble-style case.', '按数值定大小的半透明圆提供紧凑的气泡式示例。'],
    ['Three-set outlines expose the set and intersection label regions.', '三个集合的轮廓展示集合与交集标签区域。'],
    ['Open the hollow or bubble Venn example.', '打开空心或气泡韦恩图示例。'],
    ['Weighted cells recursively divide hierarchy into organic polygon regions.', '带权单元递归切分层级，形成自然的多边形区域。'],
    ['Canvas performance case with generated graph data up to one million raw rows.', '使用最多一百万行生成图数据的 Canvas 性能示例。'],
    ['Canvas performance case with generated beeswarm points up to one million raw rows.', '使用最多一百万行生成蜂群点数据的 Canvas 性能示例。'],
    ['Canvas performance case with generated hierarchical data up to one million raw rows.', '使用最多一百万行生成层级数据的 Canvas 性能示例。'],
    ['Canvas performance case with generated flame graph data up to one million raw rows.', '使用最多一百万行生成火焰图数据的 Canvas 性能示例。'],
    ['Canvas performance case with generated lollipop categories up to one million raw rows.', '使用最多一百万行生成棒棒糖分类数据的 Canvas 性能示例。'],
    ['Sampled MDS performance case with generated source data up to one million raw rows.', '使用最多一百万行生成源数据的 MDS 采样性能示例。'],
    ['Million-row aggregate performance case for dense mosaic layouts.', '面向密集马赛克布局的百万行聚合性能示例。'],
    ['Canvas performance case with generated nested-circle data up to one million raw rows.', '使用最多一百万行生成嵌套圆数据的 Canvas 性能示例。'],
    ['Canvas performance case with generated bubble data up to one million raw rows.', '使用最多一百万行生成气泡数据的 Canvas 性能示例。'],
    ['Canvas performance case with generated radial range data up to one million raw rows.', '使用最多一百万行生成径向范围数据的 Canvas 性能示例。'],
    ['Canvas performance case with generated boxplot categories up to one million raw rows.', '使用最多一百万行生成箱线图分类数据的 Canvas 性能示例。'],
    ['A longer message list for browser performance smoke testing.', '用于浏览器性能冒烟测试的更长消息列表。'],
    ['Canvas performance case with generated impedance samples in the reflection coefficient plane.', '在反射系数平面中使用生成阻抗样本的 Canvas 性能示例。'],
    ['Canvas performance case with generated spiral segments up to one million raw rows.', '使用最多一百万行生成螺旋分段数据的 Canvas 性能示例。'],
    ['Canvas performance case with generated subway routes up to one million raw rows.', '使用最多一百万行生成地铁线路数据的 Canvas 性能示例。'],
    ['Data parsing performance case with generated daily events up to one million raw rows.', '使用最多一百万行生成每日事件的数据解析性能示例。'],
    ['Canvas performance case with generated vector grids up to one million raw rows.', '使用最多一百万行生成向量网格数据的 Canvas 性能示例。'],
    ['Sampled Voronoi treemap performance case with generated source data up to one million raw rows.', '使用最多一百万行生成源数据的 Voronoi 树图采样性能示例。'],
    ['Bubble Venn performance case with generated items up to one million raw rows.', '使用最多一百万行生成条目的气泡韦恩图性能示例。'],
    ['Data', '数据'],
    ['Add data', '添加数据'],
    ['Dataset', '数据集'],
    ['0 lines added', '已添加 0 行'],
    ['Complete option', '完整配置'],
    ['Option', '配置'],
    ['All examples', '全部示例'],
    ['Options', '配置项'],
    ['Large data', '大数据'],
    ['Standard example', '标准示例'],
    ['Bubble case', '气泡示例'],
    ['Hollow case', '空心示例']
  ]);

  for (const [source, target] of replacements) {
    html = replaceTextNodes(html, source, target);
  }

  return html
    .replace(/aria-label="Example navigation"/g, 'aria-label="示例导航"')
    .replace(/aria-label="Documentation navigation"/g, 'aria-label="文档导航"')
    .replace(/aria-label="Examples"/g, 'aria-label="示例"')
    .replace(/aria-label="Venn examples"/g, 'aria-label="韦恩图示例"')
    .replace(/aria-label="Chart option"/g, 'aria-label="图表配置"')
    .replaceAll('`${messageCount} messages, ${dynamicDslLines.length} dynamic DSL lines`', '`${messageCount} 条消息，${dynamicDslLines.length} 行动态 DSL`')
    .replaceAll('`${messageCount} messages`', '`${messageCount} 条消息`')
    .replaceAll('`${dynamicDslLines.length} lines added`', '`已添加 ${dynamicDslLines.length} 行`')
    .replaceAll('`${dynamicDslLines.length} lines added${canAdd ? \'\' : \' · full\'}`', '`已添加 ${dynamicDslLines.length} 行${canAdd ? \'\' : \' · 已满\'}`')
    .replaceAll("'Append another message group to the sequence diagram'", "'向时序图追加一组消息'")
    .replaceAll("'The current chart height is full. Enlarge the window before adding more data.'", "'当前图表高度已满，请放大窗口后再添加数据。'");
}

function replaceTextNodes(html, source, target) {
  const tags = ['title', 'h1', 'h2', 'h3', 'p', 'a', 'button', 'span', 'summary'];
  for (const tag of tags) {
    const pattern = new RegExp(`(<${tag}\\b[^>]*>)${escapeRegExp(source)}(<\\/${tag}>)`, 'g');
    html = html.replace(pattern, `$1${target}$2`);
  }
  return html;
}

function localizeChineseLinks(relativeHtmlPath, html) {
  if (relativeHtmlPath === 'index.html') {
    return html
      .replace(/href="\.\/packages\/([^"/]+)\/"/g, 'href="./packages/$1/index.zh.html"')
      .replace(/href="\.\/packages\/echarts-venn\/hollow\.html"/g, 'href="./packages/echarts-venn/hollow.zh.html"')
      .replace(/href="\.\/packages\/echarts-venn\/bubble\.html"/g, 'href="./packages/echarts-venn/bubble.zh.html"');
  }

  return html
    .replace(/content="0; url=\.\/hollow\.html"/g, 'content="0; url=./hollow.zh.html"')
    .replace(/href="\.\.\/\.\.\/"/g, 'href="../../index.zh.html"')
    .replace(/href="\.\.\/\.\.\/options\.html#/g, 'href="../../options.zh.html#')
    .replace(/href="\.\/large\.html"/g, 'href="./large.zh.html"')
    .replace(/href="\.\/hollow\.html"/g, 'href="./hollow.zh.html"')
    .replace(/href="\.\/bubble\.html"/g, 'href="./bubble.zh.html"')
    .replace(/href="\.\/"/g, 'href="./index.zh.html"');
}

function localizeChineseTitle(relativeHtmlPath, html) {
  if (relativeHtmlPath === 'index.html') {
    return html.replace(/<title>[\s\S]*?<\/title>/, '<title>ECharts Extension 示例</title>');
  }

  const packageName = relativeHtmlPath.split('/')[1] || 'ECharts Extension';
  const heading = readFirstTagText(html, 'h1');
  const title = heading ? `${packageName} ${heading}示例` : `${packageName} 示例`;
  return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
}

function normalizeGalleryNavigation(relativeHtmlPath, html, locale) {
  if (relativeHtmlPath !== 'index.html') return html;
  if (locale === 'zh') {
    return html
      .replace(/<a href="\.\/options\.html">配置项<\/a>/, '<a href="./options.zh.html">配置项</a>')
      .replace(/<a href="\.\/options\.zh\.html">中文配置<\/a>/, '<a href="./" lang="en">English</a>');
  }
  return html.replace(/<a href="\.\/options\.zh\.html">中文配置<\/a>/, '<a href="./index.zh.html" lang="zh-CN">中文</a>');
}

function injectLocaleSwitch(relativeHtmlPath, html, locale) {
  if (relativeHtmlPath === 'index.html') return html;
  const href = locale === 'zh' ? englishHrefFor(relativeHtmlPath) : chineseHrefFor(relativeHtmlPath);
  const label = locale === 'zh' ? 'English' : '中文';
  const lang = locale === 'zh' ? 'en' : 'zh-CN';
  if (html.includes(`href="${href}"`) && html.includes(`>${label}</a>`)) return html;

  return html.replace(/(<nav class="demo-links"[^>]*>)([\s\S]*?)(\s*<\/nav>)/, (match, open, links, close) => {
    const indent = links.match(/\n(\s*)<a\b/)?.[1] || '        ';
    return `${open}${links}\n${indent}<a href="${href}" lang="${lang}">${label}</a>${close}`;
  });
}

function chineseHrefFor(relativeHtmlPath) {
  const fileName = path.posix.basename(relativeHtmlPath);
  return fileName === 'index.html' ? './index.zh.html' : `./${fileName.replace(/\.html$/, '.zh.html')}`;
}

function englishHrefFor(relativeHtmlPath) {
  const fileName = path.posix.basename(relativeHtmlPath);
  return fileName === 'index.html' ? './' : `./${fileName}`;
}

function readFirstTagText(html, tag) {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([^<]*)<\\/${tag}>`));
  return match ? match[1].trim() : '';
}

function templateRelativePath(filePath) {
  return path.relative(templatesDir, filePath).split(path.sep).join('/');
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

function escapeHtml(value) {
  return escapeAttribute(value);
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
