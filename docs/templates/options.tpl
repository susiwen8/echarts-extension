<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ECharts Extension Options</title>
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="./shared/demo-page.css?v=interactions-4">
  <script src="./shared/theme-toggle.js?v=theme-1"></script>
  <style>
    html {
      height: 100%;
      overflow: hidden;
    }

    .options-page {
      height: 100vh;
      overflow: hidden;
      background: #f5f7fb;
    }

    .options-page .gallery-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      min-height: 0;
      overflow: hidden;
    }

    .options-page .demo-header {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 8px clamp(18px, 3vw, 32px);
    }

    .options-page .demo-header > div {
      min-width: 0;
    }

    .options-page .demo-header h1 {
      margin-top: 2px;
      font-size: clamp(20px, 2vw, 28px);
      line-height: 1.05;
    }

    .options-page .eyebrow {
      font-size: 11px;
    }

    .options-page .lede {
      display: none;
    }

    .options-page .demo-links a {
      min-height: 32px;
      padding: 0 10px;
      border-radius: 6px;
      font-size: 12px;
    }

    .options-layout {
      display: grid;
      grid-template-columns: minmax(190px, 240px) minmax(0, 1fr);
      gap: 18px;
      flex: 1;
      width: min(1360px, calc(100% - 36px));
      min-height: 0;
      margin: 12px auto;
    }

    .options-search {
      display: grid;
      flex: 1 1 360px;
      gap: 6px;
      width: 100%;
      max-width: 620px;
      margin-left: auto;
    }

    .options-search__meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .options-search__label {
      color: #172033;
      font-size: 12px;
      font-weight: 780;
      text-transform: uppercase;
    }

    .options-search__field {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      align-items: center;
    }

    .options-search__field input {
      width: 100%;
      min-width: 0;
      height: 34px;
      border: 1px solid #cad4e5;
      border-radius: 6px;
      color: #172033;
      font: 12.5px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 0 12px;
    }

    .options-search__field input:focus {
      border-color: #8fa6d4;
      outline: 3px solid #e7eefc;
    }

    .options-search__field button {
      height: 34px;
      border: 1px solid #cad4e5;
      border-radius: 6px;
      background: #f7f9fd;
      color: #26344d;
      cursor: pointer;
      font-size: 12px;
      font-weight: 760;
      padding: 0 12px;
    }

    .options-search__field button:hover,
    .options-search__field button:focus-visible {
      border-color: #8fa6d4;
      background: #eef3ff;
      outline: none;
    }

    .options-search__status {
      margin: 0;
      color: var(--muted);
      font-size: 12px;
      font-weight: 720;
      text-align: right;
    }

    .options-nav {
      display: grid;
      align-self: stretch;
      min-height: 0;
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 8px 28px rgba(23, 32, 51, 0.06);
    }

    .options-nav a {
      padding: 10px 12px;
      border-bottom: 1px solid var(--line);
      color: #26344d;
      font-size: 12px;
      font-weight: 740;
      text-decoration: none;
    }

    .options-nav a:hover {
      color: #163f9f;
      background: #f7f9fd;
    }

    .options-nav a[aria-current="true"] {
      color: #0f327d;
      background: #edf3ff;
      box-shadow: inset 3px 0 0 #1f5fcc;
    }

    .options-nav a:last-child {
      border-bottom: 0;
    }

    .options-list {
      display: block;
      height: 100%;
      min-width: 0;
      min-height: 0;
      overflow: auto;
    }

    .option-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-width: 0;
      min-height: 0;
      max-height: 100%;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #ffffff;
      box-shadow: var(--shadow);
    }

    .option-card[hidden] {
      display: none;
    }

    .option-card__header {
      display: grid;
      grid-template-columns: minmax(220px, 0.8fr) minmax(300px, 1fr);
      align-items: start;
      gap: 14px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--line);
      background: #fbfcff;
    }

    .option-card__summary {
      min-width: 0;
    }

    .option-card h2 {
      margin: 0;
      color: #172033;
      font-size: 18px;
      line-height: 1.2;
      letter-spacing: 0;
    }

    .option-card__meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 720;
    }

    .option-card__meta a {
      color: #163f9f;
      text-decoration: none;
    }

    .option-card__meta a:hover {
      text-decoration: underline;
    }

    .option-table-wrap {
      flex: 1;
      width: 100%;
      min-height: 0;
      overflow: auto;
    }

    .option-table {
      width: 100%;
      min-width: 780px;
      border-collapse: collapse;
      table-layout: fixed;
      color: #26344d;
      font-size: 13px;
      line-height: 1.5;
    }

    .option-table th,
    .option-table td {
      padding: 11px 14px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
      text-align: left;
    }

    .option-table th {
      background: #f7f9fd;
      color: #172033;
      font-size: 12px;
      font-weight: 780;
      text-transform: uppercase;
    }

    .option-table th:nth-child(1),
    .option-table td:nth-child(1) {
      width: 28%;
    }

    .option-table th:nth-child(2),
    .option-table td:nth-child(2) {
      width: 42%;
    }

    .option-table th:nth-child(3),
    .option-table td:nth-child(3) {
      width: 30%;
    }

    .option-table tr:last-child td {
      border-bottom: 0;
    }

    .option-table__row--nested td {
      background: #fbfcff;
    }

    .option-table__row--expandable .option-table__name {
      cursor: pointer;
    }

    .option-table__name-content {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      min-width: 0;
    }

    .option-toggle,
    .option-toggle-spacer {
      flex: 0 0 18px;
      width: 18px;
      height: 18px;
      margin-top: 1px;
    }

    .option-toggle {
      display: inline-grid;
      place-items: center;
      border: 1px solid #cad4e5;
      border-radius: 4px;
      background: #ffffff;
      color: #163f9f;
      cursor: pointer;
      font: 700 13px/1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      padding: 0;
    }

    .option-toggle:hover,
    .option-toggle:focus-visible {
      border-color: #8fa6d4;
      background: #f2f6ff;
      outline: none;
    }

    .options-page--searching .option-toggle {
      visibility: hidden;
    }

    .option-table__row--search-match td {
      background: #fff8e6;
    }

    .option-table__row--level-1 .option-table__name {
      padding-left: 28px;
    }

    .option-table__row--level-2 .option-table__name {
      padding-left: 42px;
    }

    .option-table__row--level-3 .option-table__name {
      padding-left: 56px;
    }

    .option-table code {
      color: #163f9f;
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      overflow-wrap: anywhere;
      white-space: normal;
    }

    .option-table__row--nested code {
      color: #2f5a85;
    }

    .option-table__values {
      color: #41506a;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .option-status {
      min-height: 42px;
      padding: 12px 16px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 720;
    }

    html[data-theme="dark"] .options-page {
      background: var(--bg);
    }

    html[data-theme="dark"] .options-search__label,
    html[data-theme="dark"] .option-card h2,
    html[data-theme="dark"] .option-table th {
      color: var(--ink);
    }

    html[data-theme="dark"] .options-search__field input,
    html[data-theme="dark"] .options-search__field button,
    html[data-theme="dark"] .options-nav,
    html[data-theme="dark"] .option-card,
    html[data-theme="dark"] .option-toggle {
      background: var(--panel);
      color: var(--ink);
      border-color: var(--line);
    }

    html[data-theme="dark"] .options-search__field input:focus {
      border-color: var(--blue);
      outline-color: var(--field-focus);
    }

    html[data-theme="dark"] .options-search__field button:hover,
    html[data-theme="dark"] .options-search__field button:focus-visible,
    html[data-theme="dark"] .option-toggle:hover,
    html[data-theme="dark"] .option-toggle:focus-visible {
      border-color: var(--blue);
      background: var(--blue-soft);
      color: var(--blue-strong);
    }

    html[data-theme="dark"] .options-nav a,
    html[data-theme="dark"] .option-table,
    html[data-theme="dark"] .option-table__values {
      color: var(--ink-soft);
    }

    html[data-theme="dark"] .options-nav a:hover,
    html[data-theme="dark"] .options-nav a[aria-current="true"] {
      color: var(--blue-strong);
      background: var(--blue-soft);
    }

    html[data-theme="dark"] .option-card__header,
    html[data-theme="dark"] .option-table th,
    html[data-theme="dark"] .option-table__row--nested td {
      background: var(--panel-soft);
    }

    html[data-theme="dark"] .option-table__row--search-match td {
      background: #3b2c12;
    }

    html[data-theme="dark"] .option-card__meta a,
    html[data-theme="dark"] .option-table code,
    html[data-theme="dark"] .option-table__row--nested code {
      color: var(--blue-strong);
    }

    @media (max-width: 900px) {
      .options-layout {
        grid-template-columns: 1fr;
        grid-template-rows: minmax(80px, 24%) minmax(0, 1fr);
        gap: 12px;
      }

      .option-card__header {
        grid-template-columns: 1fr;
      }

      .options-search {
        max-width: none;
        margin-left: 0;
      }

      .options-search__field {
        grid-template-columns: minmax(0, 1fr) auto;
      }

      .options-nav {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }

      .options-nav a {
        border-right: 1px solid var(--line);
      }
    }

    @media (max-width: 560px) {
      .options-page .demo-header {
        align-items: center;
        gap: 10px;
        padding: 8px 14px;
      }

      .options-page .demo-header h1 {
        font-size: 22px;
      }

      .options-page .lede {
        display: none;
      }

      .options-layout {
        width: calc(100% - 20px);
        margin: 10px auto;
      }

      .options-search__field {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body class="options-page">
  <main class="gallery-shell">
    <header class="demo-header">
      <div>
        <p class="eyebrow">ECharts Extension</p>
        <h1>Package Options</h1>
        <p class="lede">Option names, descriptions, and accepted values for each package chart.</p>
      </div>
      <nav class="demo-links" aria-label="Documentation navigation">
        <a href="./">Examples</a>
        <a href="./options.zh.html">中文</a>
        <a class="demo-link--github" href="https://github.com/susiwen8/echarts-extension" target="_blank" rel="noreferrer">GitHub</a>
      </nav>
    </header>

    <section class="options-layout" aria-label="Package chart options">
      <nav id="options-nav" class="options-nav" aria-label="Package options navigation">
        <!-- OPTIONS_NAV:START -->
        <!-- OPTIONS_NAV:END -->
      </nav>
      <div id="options-list" class="options-list">
        <!-- OPTIONS_LIST:START -->
        <!-- OPTIONS_LIST:END -->
      </div>
    </section>
  </main>
  <script defer src="./options.js?v=options-ssg-2"></script>
</body>
</html>
