<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>echarts-fisheye example</title>
  <link rel="icon" href="../../../favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../../shared/demo-page.css?v=interactions-4">
</head>
<body class="demo-page">
  <main class="demo-shell">
    <header class="demo-header">
      <div>
        <p class="eyebrow">echarts-fisheye</p>
        <h1>Fisheye</h1>
        <p>Reusable magnifier interaction for standard and custom ECharts charts.</p>
      </div>
      <nav class="demo-links" aria-label="Example navigation">
        <a href="../../">All examples</a>
        <a href="../../options.html#echarts-fisheye">Options</a>
      </nav>
    </header>
    <section class="demo-stage"><div class="chart-frame"><div id="chart"></div></div></section>
  </main>
  <script src="../../../node_modules/echarts/dist/echarts.min.js"></script>
  <script src="../../../packages/echarts-fisheye/dist/echarts-fisheye.js"></script>
  <script>
    const chart = echarts.init(document.getElementById('chart'));
    const points = Array.from({ length: 90 }, (_, index) => {
      const ring = 1 + (index % 9);
      const angle = index * 0.68;
      return [
        Math.cos(angle) * ring + (index % 5) * 0.35,
        Math.sin(angle) * ring + Math.floor(index / 12) * 0.18,
        8 + (index % 7) * 4
      ];
    });

    chart.setOption({
      animation: false,
      fisheye: {
        show: true,
        radius: 150,
        scale: 2.6,
        stroke: 'rgba(31, 41, 55, 0.86)',
        strokeWidth: 3
      },
      grid: {
        left: 36,
        right: 28,
        top: 28,
        bottom: 30
      },
      xAxis: {
        show: false,
        min: -10,
        max: 12
      },
      yAxis: {
        show: false,
        min: -9,
        max: 10
      },
      series: [
        {
          type: 'scatter',
          symbolSize: (value) => value[2],
          data: points,
          itemStyle: {
            color: '#2f83ed',
            opacity: 0.82,
            borderColor: '#ffffff',
            borderWidth: 1
          }
        }
      ]
    });

    window.addEventListener('resize', () => chart.resize());
  </script>
</body>
</html>
