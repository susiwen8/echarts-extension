(function (root) {
  const remoteUrls = {
    concentricGraph: 'https://gw.alipayobjects.com/os/basement_prod/8dacf27e-e1bc-4522-b6d3-4b6d9b9ed7df.json',
    radialGraph: 'https://assets.antv.antgroup.com/g6/radial.json',
    gridGraph: 'https://assets.antv.antgroup.com/g6/cluster.json',
    mdsGraph: 'https://assets.antv.antgroup.com/g6/cluster.json',
    flame: 'https://raw.githubusercontent.com/antvis/G2/refs/heads/v5/__tests__/data/partition.json',
    radialArea: 'https://assets.antv.antgroup.com/g2/seasonal-weather.json',
    wind: 'https://gw.alipayobjects.com/os/antfincdn/F5VcgnqRku/wind.json'
  };

  const data = {
    graph: {
      data: [
        { id: 'root', name: 'Root', value: 10, itemStyle: { color: '#2454a6' } },
        { id: 'alpha', name: 'Alpha', value: 7, itemStyle: { color: '#248f6a' } },
        { id: 'beta', name: 'Beta', value: 6, itemStyle: { color: '#c77725' } },
        { id: 'gamma', name: 'Gamma', value: 5, itemStyle: { color: '#9c4f97' } },
        { id: 'delta', name: 'Delta', value: 4, itemStyle: { color: '#5f6fb4' } },
        { id: 'epsilon', name: 'Epsilon', value: 3, itemStyle: { color: '#c4554d' } },
        { id: 'zeta', name: 'Zeta', value: 2, itemStyle: { color: '#4b8f8c' } }
      ],
      links: [
        { source: 'root', target: 'alpha' },
        { source: 'root', target: 'beta' },
        { source: 'root', target: 'gamma' },
        { source: 'alpha', target: 'delta' },
        { source: 'alpha', target: 'epsilon' },
        { source: 'beta', target: 'zeta' },
        { source: 'gamma', target: 'epsilon' }
      ]
    },
    radialArea: [
      { date: '2000-01-01T00:00:00.000Z', avg: 42, min: 34, max: 49, minmin: 28, maxmax: 56 },
      { date: '2000-02-01T00:00:00.000Z', avg: 45, min: 36, max: 52, minmin: 31, maxmax: 58 },
      { date: '2000-03-01T00:00:00.000Z', avg: 52, min: 42, max: 60, minmin: 36, maxmax: 66 },
      { date: '2000-04-01T00:00:00.000Z', avg: 58, min: 49, max: 67, minmin: 42, maxmax: 72 },
      { date: '2000-05-01T00:00:00.000Z', avg: 64, min: 55, max: 73, minmin: 50, maxmax: 80 },
      { date: '2000-06-01T00:00:00.000Z', avg: 69, min: 60, max: 79, minmin: 54, maxmax: 84 },
      { date: '2000-07-01T00:00:00.000Z', avg: 72, min: 63, max: 82, minmin: 57, maxmax: 88 },
      { date: '2000-08-01T00:00:00.000Z', avg: 71, min: 62, max: 81, minmin: 56, maxmax: 87 },
      { date: '2000-09-01T00:00:00.000Z', avg: 65, min: 56, max: 74, minmin: 50, maxmax: 80 },
      { date: '2000-10-01T00:00:00.000Z', avg: 56, min: 47, max: 65, minmin: 40, maxmax: 71 },
      { date: '2000-11-01T00:00:00.000Z', avg: 48, min: 39, max: 56, minmin: 33, maxmax: 62 },
      { date: '2000-12-01T00:00:00.000Z', avg: 43, min: 35, max: 50, minmin: 29, maxmax: 57 }
    ],
    radialBoxplot: [
      { name: 'Oceania', min: 1, q1: 8, median: 13, q3: 21, max: 24, itemStyle: { color: '#2f83ed' } },
      { name: 'East Europe', min: 4, q1: 9, median: 12, q3: 15, max: 19, itemStyle: { color: '#28c3c7' } },
      { name: 'Australia', min: 8, q1: 13, median: 16, q3: 20, max: 26, itemStyle: { color: '#fb8b50' } },
      { name: 'South America', min: 7, q1: 11, median: 14, q3: 22, max: 28, itemStyle: { color: '#c973ee' } },
      { name: 'North Africa', min: 6, q1: 11, median: 15, q3: 18, max: 23, itemStyle: { color: '#7566f1' } },
      { name: 'North America', min: 9, q1: 15, median: 22, q3: 28, max: 31, itemStyle: { color: '#64c933' } },
      { name: 'West Europe', min: 6, q1: 11, median: 14, q3: 18, max: 24, itemStyle: { color: '#c89b2f' } },
      { name: 'West Africa', min: 1, q1: 5, median: 8, q3: 12, max: 16, itemStyle: { color: '#f070be' } }
    ],
    hollowVenn: [
      { name: 'A', sets: ['A'], value: 100, itemStyle: { color: '#5b8ff9' } },
      { name: 'B', sets: ['B'], value: 96, itemStyle: { color: '#61d9a3' } },
      { name: 'C', sets: ['C'], value: 82, itemStyle: { color: '#f6bd16' } },
      { name: 'A&B', sets: ['A', 'B'], value: 34 },
      { name: 'A&C', sets: ['A', 'C'], value: 24 },
      { name: 'B&C', sets: ['B', 'C'], value: 20 },
      { name: 'A&B&C', sets: ['A', 'B', 'C'], value: 12 }
    ],
    bubbleVenn: [
      { name: 'Radiohead', value: 100, itemStyle: { color: '#74a9cf' } },
      { name: 'Kanye West', value: 64, itemStyle: { color: '#f29c9f' } },
      { name: 'The Beatles', value: 58, itemStyle: { color: '#82c66f' } },
      { name: 'Pink Floyd', value: 44, itemStyle: { color: '#b195d2' } },
      { name: 'Muse', value: 32, itemStyle: { color: '#f2c75c' } },
      { name: 'Massive Attack', value: 23, itemStyle: { color: '#6fc7c3' } },
      { name: 'Portishead', value: 18, itemStyle: { color: '#d78bca' } }
    ],
    packBubble: createPackBubbleData(),
    circlePacking: {
      name: 'Product Suite',
      itemStyle: { color: '#e6eefb' },
      children: [
        {
          name: 'Core Experience',
          itemStyle: { color: '#7aa5e8' },
          children: [
            { name: 'Editor', value: 38, itemStyle: { color: '#5f8fda' } },
            { name: 'Search', value: 32, itemStyle: { color: '#4a7ed0' } },
            { name: 'Sync', value: 22, itemStyle: { color: '#8db5ef' } },
            { name: 'Files', value: 18, itemStyle: { color: '#b6cef5' } }
          ]
        },
        {
          name: 'Growth',
          itemStyle: { color: '#82c7a2' },
          children: [
            { name: 'Campaigns', value: 30, itemStyle: { color: '#52ad79' } },
            { name: 'Referrals', value: 20, itemStyle: { color: '#6fc590' } },
            { name: 'Activation', value: 18, itemStyle: { color: '#a5dcb8' } }
          ]
        },
        {
          name: 'Platform',
          itemStyle: { color: '#dda55f' },
          children: [
            { name: 'API', value: 28, itemStyle: { color: '#c98230' } },
            { name: 'Billing', value: 18, itemStyle: { color: '#e3b16e' } },
            { name: 'Auth', value: 16, itemStyle: { color: '#efc88f' } }
          ]
        },
        {
          name: 'Insights',
          itemStyle: { color: '#bc83cf' },
          children: [
            { name: 'Reports', value: 24, itemStyle: { color: '#a865bf' } },
            { name: 'Forecasts', value: 15, itemStyle: { color: '#cd9cda' } },
            { name: 'Exports', value: 12, itemStyle: { color: '#dec0e8' } }
          ]
        }
      ]
    },
    nestedCircle: [
      { name: 'Math', children: ['Probability', 'Algebra', 'Calculus'], itemStyle: { color: '#d7e7ff' } },
      { name: 'Python', children: ['Pandas', 'NumPy', 'Scikit-Learn'], itemStyle: { color: '#c5d4fb' } },
      { name: 'SQL', children: ['Joins', 'Windows', 'Optimization'], itemStyle: { color: '#adbef5' } },
      { name: 'Visualization', children: ['Plotly', 'Tableau', 'Matplotlib'], itemStyle: { color: '#8195e9' } },
      { name: 'Machine Learning', children: ['Supervised', 'Clustering', 'Evaluation'], itemStyle: { color: '#687de2' } }
    ],
    mosaic: [
      { channel: 'Organic', stage: 'New', users: 42, itemStyle: { color: '#7fb3d5' } },
      { channel: 'Organic', stage: 'Returning', users: 30, itemStyle: { color: '#59a14f' } },
      { channel: 'Organic', stage: 'Dormant', users: 12, itemStyle: { color: '#f2b447' } },
      { channel: 'Paid', stage: 'New', users: 28, itemStyle: { color: '#7fb3d5' } },
      { channel: 'Paid', stage: 'Returning', users: 18, itemStyle: { color: '#59a14f' } },
      { channel: 'Paid', stage: 'Dormant', users: 24, itemStyle: { color: '#f2b447' } },
      { channel: 'Referral', stage: 'New', users: 12, itemStyle: { color: '#7fb3d5' } },
      { channel: 'Referral', stage: 'Returning', users: 26, itemStyle: { color: '#59a14f' } },
      { channel: 'Referral', stage: 'Dormant', users: 6, itemStyle: { color: '#f2b447' } },
      { channel: 'Social', stage: 'New', users: 18, itemStyle: { color: '#7fb3d5' } },
      { channel: 'Social', stage: 'Returning', users: 9, itemStyle: { color: '#59a14f' } },
      { channel: 'Social', stage: 'Dormant', users: 15, itemStyle: { color: '#f2b447' } }
    ],
    voronoiTreemap: {
      name: 'Product Portfolio',
      children: [
        {
          name: 'Core Platform',
          itemStyle: { color: '#4f7cac' },
          children: [
            { name: 'Search', value: 48 },
            { name: 'Ads', value: 32 },
            { name: 'Maps', value: 20 }
          ]
        },
        {
          name: 'Growth',
          itemStyle: { color: '#d7655b' },
          children: [
            { name: 'Cloud', value: 34 },
            { name: 'AI Studio', value: 26 },
            { name: 'Commerce', value: 18 }
          ]
        },
        {
          name: 'Consumer',
          itemStyle: { color: '#5aa469' },
          children: [
            { name: 'Video', value: 28 },
            { name: 'Music', value: 16 },
            { name: 'Games', value: 12 }
          ]
        },
        { name: 'Labs', value: 24, itemStyle: { color: '#e5a93d' } }
      ]
    },
    subway: [
      {
        id: 'line1',
        name: 'Line 1',
        color: '#d51f2a',
        stations: [
          { id: 'lake', name: 'Lake', coord: [60, 280], labelPosition: 'left' },
          { id: 'market', name: 'Market', coord: [150, 220], labelPosition: 'top' },
          { id: 'central', name: 'Central', coord: [250, 220] },
          { id: 'harbor', name: 'Harbor', coord: [350, 220], labelPosition: 'bottom' },
          { id: 'airport', name: 'Airport', coord: [470, 120], labelPosition: 'right' },
          { id: 'terminal', name: 'Terminal', coord: [540, 120], labelPosition: 'right' }
        ],
        waypoints: [
          ['lake', 60, 280],
          ['market', 150, 220],
          ['central', 250, 220],
          ['harbor', 350, 220],
          [470, 220],
          ['airport', 470, 120],
          ['terminal', 540, 120]
        ],
        segments: [
          { from: 'harbor', to: 'airport', status: 'construction' }
        ]
      },
      {
        id: 'line2',
        name: 'Line 2',
        color: '#f5a623',
        stations: [
          { id: 'north', name: 'North', coord: [250, 70], labelPosition: 'top' },
          { id: 'central', name: 'Central', coord: [250, 220] },
          { id: 'museum', name: 'Museum', coord: [320, 310], labelPosition: 'right' },
          { id: 'south', name: 'South', coord: [320, 400], labelPosition: 'right' }
        ],
        waypoints: [
          ['north', 250, 70],
          ['central', 250, 220],
          ['museum', 320, 310],
          ['south', 320, 400]
        ]
      },
      {
        id: 'line3',
        name: 'Line 3',
        color: '#18a849',
        stations: [
          { id: 'west', name: 'West', coord: [90, 120], labelPosition: 'top' },
          { id: 'central', name: 'Central', coord: [250, 220] },
          { id: 'garden', name: 'Garden', coord: [390, 310], labelPosition: 'bottom' }
        ],
        waypoints: [
          ['west', 90, 120],
          [170, 120],
          ['central', 250, 220],
          ['garden', 390, 310]
        ]
      },
      {
        id: 'line4',
        name: 'Express',
        color: '#00a6a6',
        stations: [
          { id: 'harbor', name: 'Harbor', coord: [350, 220] },
          { id: 'airport', name: 'Airport', coord: [470, 120] },
          { id: 'tech', name: 'Tech Park', coord: [560, 70], labelPosition: 'right' }
        ],
        waypoints: [
          ['harbor', 350, 220],
          [470, 220],
          ['airport', 470, 120],
          ['tech', 560, 70]
        ]
      },
      {
        id: 'line5',
        name: 'Future Line',
        color: '#8e44ad',
        status: 'planned',
        stations: [
          { id: 'future-west', name: 'Future West', coord: [90, 390], labelPosition: 'left' },
          { id: 'civic', name: 'Civic', coord: [300, 360], labelPosition: 'bottom' },
          { id: 'future-east', name: 'Future East', coord: [520, 330], labelPosition: 'right' }
        ],
        waypoints: [
          ['future-west', 90, 390],
          [190, 390],
          ['civic', 300, 360],
          [410, 330],
          ['future-east', 520, 330]
        ]
      }
    ],
    flame: {
      name: 'root',
      children: [
        {
          name: 'render',
          children: [
            { name: 'layout', value: 34 },
            { name: 'paint', value: 22 },
            { name: 'labels', value: 12 }
          ]
        },
        {
          name: 'events',
          children: [
            { name: 'hover', value: 18 },
            { name: 'resize', value: 10 }
          ]
        },
        {
          name: 'data',
          children: [
            { name: 'parse', value: 15 },
            { name: 'normalize', value: 17 }
          ]
        }
      ]
    },
    sunriseSunset: [
      {
        name: '2026-05-05',
        value: 0,
        sunrise: '05:12',
        sunset: '18:39',
        moonrise: '22:08',
        moonset: '07:59',
        currentTime: '2026-05-05 10:47:33',
        updatedAt: '2026-05-05 10:47:33',
        remainingText: '07:51:27',
        updatedText: 'Updated 10:46',
        title: 'Until sunset'
      }
    ],
    lollipop: [
      { country: 'India', population: 1441, itemStyle: { color: '#2db5ff' } },
      { country: 'China', population: 1425, itemStyle: { color: '#2db5ff' } },
      { country: 'United States', population: 342, itemStyle: { color: '#2db5ff' } },
      { country: 'Indonesia', population: 278, itemStyle: { color: '#2db5ff' } },
      { country: 'Pakistan', population: 245, itemStyle: { color: '#2db5ff' } },
      { country: 'Nigeria', population: 229, itemStyle: { color: '#2db5ff' } },
      { country: 'Brazil', population: 217, itemStyle: { color: '#2db5ff' } },
      { country: 'Bangladesh', population: 174, itemStyle: { color: '#2db5ff' } },
      { country: 'Russia', population: 144, itemStyle: { color: '#2db5ff' } },
      { country: 'Ethiopia', population: 129, itemStyle: { color: '#2db5ff' } }
    ],
    spiral: createSpiralData(),
    beeswarm: [
      { team: 'Design', score: 62, name: 'D-01', itemStyle: { color: '#0f766e' } },
      { team: 'Design', score: 64, name: 'D-02', itemStyle: { color: '#0f766e' } },
      { team: 'Design', score: 66, name: 'D-03', itemStyle: { color: '#0f766e' } },
      { team: 'Design', score: 70, name: 'D-04', itemStyle: { color: '#0f766e' } },
      { team: 'Design', score: 74, name: 'D-05', itemStyle: { color: '#0f766e' } },
      { team: 'Design', score: 77, name: 'D-06', itemStyle: { color: '#0f766e' } },
      { team: 'Engineering', score: 68, name: 'E-01', itemStyle: { color: '#2563eb' } },
      { team: 'Engineering', score: 69, name: 'E-02', itemStyle: { color: '#2563eb' } },
      { team: 'Engineering', score: 71, name: 'E-03', itemStyle: { color: '#2563eb' } },
      { team: 'Engineering', score: 72, name: 'E-04', itemStyle: { color: '#2563eb' } },
      { team: 'Engineering', score: 73, name: 'E-05', itemStyle: { color: '#2563eb' } },
      { team: 'Engineering', score: 78, name: 'E-06', itemStyle: { color: '#2563eb' } },
      { team: 'Engineering', score: 82, name: 'E-07', itemStyle: { color: '#2563eb' } },
      { team: 'Operations', score: 52, name: 'O-01', itemStyle: { color: '#b45309' } },
      { team: 'Operations', score: 55, name: 'O-02', itemStyle: { color: '#b45309' } },
      { team: 'Operations', score: 56, name: 'O-03', itemStyle: { color: '#b45309' } },
      { team: 'Operations', score: 58, name: 'O-04', itemStyle: { color: '#b45309' } },
      { team: 'Operations', score: 62, name: 'O-05', itemStyle: { color: '#b45309' } },
      { team: 'Support', score: 46, name: 'S-01', itemStyle: { color: '#be123c' } },
      { team: 'Support', score: 49, name: 'S-02', itemStyle: { color: '#be123c' } },
      { team: 'Support', score: 50, name: 'S-03', itemStyle: { color: '#be123c' } },
      { team: 'Support', score: 51, name: 'S-04', itemStyle: { color: '#be123c' } },
      { team: 'Support', score: 54, name: 'S-05', itemStyle: { color: '#be123c' } },
      { team: 'Support', score: 59, name: 'S-06', itemStyle: { color: '#be123c' } }
    ],
    wind: createFallbackWind()
  };

  root.EChartsExtensionExamples = root.EChartsExtensionExamples || {};
  root.EChartsExtensionExamples.data = data;
  root.EChartsExtensionExamples.remoteUrls = remoteUrls;

  function createPackBubbleData() {
    const colors = {
      Asia: '#81439a',
      Europe: '#2f80b7',
      Africa: '#238c48',
      'North America': '#a64a2b',
      'South America': '#4c6384',
      Oceania: '#9c9417'
    };
    const countries = [
      ['China', 1412, 'Asia'],
      ['India', 1408, 'Asia'],
      ['USA', 335, 'North America'],
      ['Indonesia', 281, 'Asia'],
      ['Pakistan', 252, 'Asia'],
      ['Nigeria', 236, 'Africa'],
      ['Brazil', 212, 'South America'],
      ['Bangladesh', 173, 'Asia'],
      ['Russia', 146, 'Europe'],
      ['Mexico', 130, 'North America'],
      ['Japan', 124, 'Asia'],
      ['Ethiopia', 132, 'Africa'],
      ['Philippines', 115, 'Asia'],
      ['Egypt', 114, 'Africa'],
      ['Vietnam', 101, 'Asia'],
      ['Germany', 84, 'Europe'],
      ['Turkey', 85, 'Europe'],
      ['Iran', 90, 'Asia'],
      ['Thailand', 72, 'Asia'],
      ['United Kingdom', 69, 'Europe'],
      ['France', 68, 'Europe'],
      ['Italy', 59, 'Europe'],
      ['South Africa', 63, 'Africa'],
      ['Tanzania', 69, 'Africa'],
      ['Myanmar', 55, 'Asia'],
      ['Kenya', 56, 'Africa'],
      ['Korea', 52, 'Asia'],
      ['Colombia', 52, 'South America'],
      ['Spain', 48, 'Europe'],
      ['Argentina', 46, 'South America'],
      ['Algeria', 46, 'Africa'],
      ['Sudan', 50, 'Africa'],
      ['Ukraine', 37, 'Europe'],
      ['Canada', 40, 'North America'],
      ['Poland', 38, 'Europe'],
      ['Morocco', 38, 'Africa'],
      ['Saudi Arabia', 37, 'Asia'],
      ['Malaysia', 34, 'Asia'],
      ['Peru', 34, 'South America'],
      ['Australia', 27, 'Oceania'],
      ['Taiwan', 24, 'Asia']
    ];
    const extra = Array.from({ length: 58 }, (_, index) => {
      const category = ['Europe', 'Asia', 'Africa', 'North America', 'South America'][index % 5];
      return {
        name: `Region ${index + 1}`,
        value: 7 + ((index * 17) % 31),
        category,
        itemStyle: { color: colors[category] }
      };
    });

    return countries
      .map(([name, value, category]) => ({
        name,
        value,
        category,
        itemStyle: { color: colors[category] }
      }))
      .concat(extra);
  }

  function createFallbackWind() {
    const rows = 11;
    const cols = 17;
    const items = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const longitude = Number((col * 0.25).toFixed(3));
        const latitude = Number((45 + row * 0.25).toFixed(3));
        const dx = col - (cols - 1) / 2;
        const dy = row - (rows - 1) / 2;
        items.push({
          longitude,
          latitude,
          u: Number((-dy * 0.36 + Math.cos(col * 0.55) * 0.42).toFixed(4)),
          v: Number((dx * 0.28 + Math.sin(row * 0.6) * 0.36).toFixed(4))
        });
      }
    }
    return items;
  }

  function createSpiralData() {
    return Array.from({ length: 92 }, (_, index) => {
      const seasonal = Math.sin(index * 0.38) * 18;
      const pulse = index % 17 === 0 ? 30 : index % 11 === 0 ? 18 : 0;
      const drift = (index / 91) * 26;
      return {
        name: `Segment ${index + 1}`,
        value: Math.round(38 + seasonal + pulse + drift)
      };
    });
  }
})(window);
