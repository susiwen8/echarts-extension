<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>@echarts-extension/layout-core example</title>
  <link rel="icon" href="data:,">
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      min-height: 100vh;
      margin: 0;
      color: #172033;
      background: #f5f7fb;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .demo-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 24px;
      padding: 28px clamp(18px, 4vw, 48px);
      background: #fbfcff;
      border-bottom: 1px solid #d9e0ea;
    }

    .demo-header h1 {
      margin: 4px 0 0;
      font-size: clamp(30px, 4vw, 52px);
      line-height: 1;
      font-weight: 760;
      letter-spacing: 0;
    }

    .eyebrow {
      margin: 0;
      color: #248f6a;
      font-size: 13px;
      font-weight: 760;
      text-transform: uppercase;
    }

    .demo-header p:last-child {
      max-width: 720px;
      margin: 12px 0 0;
      color: #647085;
      font-size: 16px;
      line-height: 1.5;
    }

    .demo-links a {
      display: inline-flex;
      align-items: center;
      min-height: 40px;
      padding: 0 14px;
      border: 1px solid #d9e0ea;
      border-radius: 8px;
      background: #fff;
      color: #1f2a3d;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
    }

    .layout-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(260px, 1fr));
      gap: 18px;
      width: min(1120px, calc(100% - 36px));
      margin: 28px auto 60px;
    }

    .layout-card {
      min-height: 330px;
      overflow: hidden;
      border: 1px solid #d9e0ea;
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 18px 44px rgba(23, 32, 51, 0.1);
    }

    .layout-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 0;
      padding: 14px 16px;
      border-bottom: 1px solid #d9e0ea;
    }

    .layout-card h2 {
      margin: 0;
      color: #26344d;
      font-size: 15px;
      letter-spacing: 0;
    }

    .layout-card__tools {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 8px;
    }

    .layout-card__zoom {
      min-width: 42px;
      color: #163f9f;
      font-size: 12px;
      font-weight: 780;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .layout-card__button {
      min-height: 30px;
      padding: 0 10px;
      border: 1px solid #bdc8d8;
      border-radius: 6px;
      background: #ffffff;
      color: #26344d;
      font: inherit;
      font-size: 12px;
      font-weight: 760;
      white-space: nowrap;
      cursor: pointer;
    }

    .layout-card__button:hover {
      border-color: #8198c7;
      color: #163f9f;
    }

    .layout-card__button--primary {
      border-color: #315fc0;
      background: #3f6fd8;
      color: #ffffff;
    }

    .layout-card__button--primary:hover {
      border-color: #214aa3;
      color: #ffffff;
      background: #315fc0;
    }

    .layout-card__event {
      overflow: hidden;
      padding: 8px 16px;
      border-bottom: 1px solid #d9e0ea;
      color: #647085;
      font-size: 12px;
      font-weight: 650;
      line-height: 1.35;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .layout-card__visual {
      height: 286px;
    }

    .layout-card svg {
      display: block;
      width: 100%;
      height: 286px;
      cursor: grab;
      touch-action: none;
    }

    .layout-card svg.is-panning {
      cursor: grabbing;
    }

    .layout-node circle,
    .layout-edge {
      transition: stroke 160ms ease, stroke-width 160ms ease, filter 160ms ease;
    }

    .layout-node:hover circle,
    .layout-node.is-hovered circle {
      stroke: #111827;
      stroke-width: 3;
      filter: drop-shadow(0 4px 8px rgba(23, 32, 51, 0.24));
    }

    .layout-edge:hover,
    .layout-edge.is-hovered {
      stroke: #3f6fd8;
      stroke-width: 2.4;
    }

    @media (max-width: 760px) {
      .demo-header {
        align-items: flex-start;
        flex-direction: column;
      }

      .layout-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <main class="gallery-shell">
    <header class="demo-header">
      <div>
        <p class="eyebrow">@echarts-extension/layout-core</p>
        <h1>Layout Core</h1>
        <p>Direct layout API output for radial, concentric, grid, MDS, and arc graph cases.</p>
      </div>
      <nav class="demo-links" aria-label="Example navigation">
        <a href="../../">All examples</a>
      </nav>
    </header>
    <section id="layouts" class="layout-grid" aria-label="Layout examples"></section>
  </main>
  <script type="module" src="../../shared/layout-core-example.js?v=ssg-1"></script>
</body>
</html>
