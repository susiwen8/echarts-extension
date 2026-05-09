import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import * as echarts from 'echarts';

import 'echarts-radial';
import 'echarts-radial-area';
import 'echarts-radial-boxplot';
import 'echarts-concentric';
import 'echarts-mds';
import 'echarts-arc';
import 'echarts-venn';
import 'echarts-nested-circle';
import 'echarts-mosaic';
import 'echarts-subway';
import 'echarts-flame';
import 'echarts-sunrise-sunset';
import 'echarts-lollipop';

export const snapshotPath = path.resolve('tests/visual/__snapshots__/graph-layouts.svg');
export const actualPath = path.resolve('test-results/visual/graph-layouts.actual.svg');
export const radialAreaSnapshotPath = path.resolve('tests/visual/__snapshots__/radial-area.svg');
export const radialAreaActualPath = path.resolve('test-results/visual/radial-area.actual.svg');
export const radialBoxplotSnapshotPath = path.resolve('tests/visual/__snapshots__/radial-boxplot.svg');
export const radialBoxplotActualPath = path.resolve('test-results/visual/radial-boxplot.actual.svg');
export const vennSnapshotPath = path.resolve('tests/visual/__snapshots__/venn.svg');
export const vennActualPath = path.resolve('test-results/visual/venn.actual.svg');
export const nestedCircleSnapshotPath = path.resolve('tests/visual/__snapshots__/nested-circle.svg');
export const nestedCircleActualPath = path.resolve('test-results/visual/nested-circle.actual.svg');
export const mosaicSnapshotPath = path.resolve('tests/visual/__snapshots__/mosaic.svg');
export const mosaicActualPath = path.resolve('test-results/visual/mosaic.actual.svg');
export const subwaySnapshotPath = path.resolve('tests/visual/__snapshots__/subway.svg');
export const subwayActualPath = path.resolve('test-results/visual/subway.actual.svg');
export const flameSnapshotPath = path.resolve('tests/visual/__snapshots__/flame.svg');
export const flameActualPath = path.resolve('test-results/visual/flame.actual.svg');
export const sunriseSunsetSnapshotPath = path.resolve('tests/visual/__snapshots__/sunrise-sunset.svg');
export const sunriseSunsetActualPath = path.resolve('test-results/visual/sunrise-sunset.actual.svg');
export const lollipopSnapshotPath = path.resolve('tests/visual/__snapshots__/lollipop.svg');
export const lollipopActualPath = path.resolve('test-results/visual/lollipop.actual.svg');

const graph = {
  data: [
    { id: 'root', name: 'Root', value: 10, itemStyle: { color: '#2454a6' } },
    { id: 'alpha', name: 'Alpha', value: 7, itemStyle: { color: '#3c7d5a' } },
    { id: 'beta', name: 'Beta', value: 6, itemStyle: { color: '#d0872f' } },
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
};

const seasonalWeatherData = JSON.parse(
  readFileSync(new URL('./fixtures/seasonal-weather.json', import.meta.url), 'utf8')
);

const radialBoxplotData = [
  { name: 'Oceania', min: 1, q1: 8, median: 13, q3: 21, max: 24, itemStyle: { color: '#2f83ed' } },
  { name: 'East Europe', min: 4, q1: 9, median: 12, q3: 15, max: 19, itemStyle: { color: '#28c3c7' } },
  { name: 'Australia', min: 8, q1: 13, median: 16, q3: 20, max: 26, itemStyle: { color: '#fb8b50' } },
  { name: 'South America', min: 7, q1: 11, median: 14, q3: 22, max: 28, itemStyle: { color: '#c973ee' } },
  { name: 'North Africa', min: 6, q1: 11, median: 15, q3: 18, max: 23, itemStyle: { color: '#7566f1' } },
  { name: 'North America', min: 9, q1: 15, median: 22, q3: 28, max: 31, itemStyle: { color: '#64c933' } },
  { name: 'West Europe', min: 6, q1: 11, median: 14, q3: 18, max: 24, itemStyle: { color: '#c89b2f' } },
  { name: 'West Africa', min: 1, q1: 5, median: 8, q3: 12, max: 16, itemStyle: { color: '#f070be' } }
];

const panels = [
  {
    id: 'radial',
    title: 'Radial',
    x: 20,
    y: 20,
    series: {
      type: 'radial',
      layout: {
        center: ['50%', '52%'],
        unitRadius: 72,
        linkDistance: 110,
        preventOverlap: true,
        nodeSize: 22,
        sortBy: 'data'
      }
    }
  },
  {
    id: 'concentric',
    title: 'Concentric',
    x: 544,
    y: 20,
    series: {
      type: 'concentric',
      layout: {
        center: ['50%', '52%'],
        nodeSize: 28,
        maxLevelDiff: 1,
        sortBy: 'degree',
        preventOverlap: true
      }
    }
  },
  {
    id: 'mds',
    title: 'MDS',
    x: 20,
    y: 388,
    series: {
      type: 'mds',
      layout: {
        center: ['50%', '52%'],
        linkDistance: 76
      }
    }
  },
  {
    id: 'arc',
    title: 'Arc',
    x: 544,
    y: 388,
    series: {
      type: 'arc',
      symbolSize: 18,
      label: {
        show: true,
        position: 'bottom',
        fontSize: 11,
        color: '#374151'
      },
      layout: {
        nodeSep: 45,
        nodeSize: 18
      }
    }
  }
];

const hollowVennData = [
  { name: 'A', sets: ['A'], value: 100, itemStyle: { color: '#5b8ff9' } },
  { name: 'B', sets: ['B'], value: 96, itemStyle: { color: '#61d9a3' } },
  { name: 'C', sets: ['C'], value: 82, itemStyle: { color: '#f6bd16' } },
  { name: 'A&B', sets: ['A', 'B'], value: 34 },
  { name: 'A&C', sets: ['A', 'C'], value: 24 },
  { name: 'B&C', sets: ['B', 'C'], value: 20 },
  { name: 'A&B&C', sets: ['A', 'B', 'C'], value: 12 }
];

const bubbleVennData = [
  { name: 'Radiohead', value: 100, itemStyle: { color: '#74a9cf' } },
  { name: 'Kanye West', value: 64, itemStyle: { color: '#f29c9f' } },
  { name: 'The Beatles', value: 58, itemStyle: { color: '#82c66f' } },
  { name: 'Pink Floyd', value: 44, itemStyle: { color: '#b195d2' } },
  { name: 'Muse', value: 32, itemStyle: { color: '#f2c75c' } },
  { name: 'Massive Attack', value: 23, itemStyle: { color: '#6fc7c3' } },
  { name: 'Portishead', value: 18, itemStyle: { color: '#d78bca' } }
];

const vennPanels = [
  {
    id: 'hollow',
    title: 'Hollow Venn',
    x: 20,
    y: 20,
    option: {
      legend: {
        data: hollowVennData.map((item) => item.name),
        top: 4,
        left: 'center',
        itemWidth: 12,
        itemHeight: 8,
        textStyle: {
          color: '#374151',
          fontSize: 11
        }
      },
      series: [
        {
          type: 'venn',
          layout: 'hollow',
          top: 44,
          width: '84%',
          height: '68%',
          data: hollowVennData,
          hollowStyle: {
            borderWidth: 6,
            opacity: 0.9
          },
          label: {
            show: true,
            fontSize: 12,
            color: '#111827',
            fontWeight: 650
          }
        }
      ]
    }
  },
  {
    id: 'bubble',
    title: 'Bubble Venn',
    x: 544,
    y: 20,
    option: {
      series: [
        {
          type: 'venn',
          layout: 'bubble',
          width: '92%',
          height: '86%',
          padding: 18,
          minRadius: 18,
          maxRadius: 76,
          data: bubbleVennData,
          itemStyle: {
            opacity: 0.6,
            borderColor: '#ffffff',
            borderWidth: 1.4
          },
          label: {
            show: true,
            fontSize: 11,
            color: '#1f2937',
            fontWeight: 650
          }
        }
      ]
    }
  }
];

const nestedCircleData = [
  {
    name: 'Mathematics & Statistics',
    children: [
      'Probability Theory',
      'Linear Algebra',
      'Descriptive Statistics',
      'Hypothesis Testing',
      'Inferential Statistics',
      'Calculus'
    ],
    itemStyle: { color: '#d7e7ff' }
  },
  {
    name: 'Python',
    children: ['Syntax', 'Data Types', 'Control Structures', 'Pandas', 'NumPy', 'Data Visualization', 'Scikit-Learn'],
    itemStyle: { color: '#c5d4fb' }
  },
  {
    name: 'SQL',
    children: ['Joins, Subqueries', 'Window Functions', 'Indexing', 'Optimization', 'Database Management', 'Query Optimization'],
    itemStyle: { color: '#adbef5' }
  },
  {
    name: 'Data Wrangling',
    children: ['Data Cleaning', 'Data Transformation', 'Handling missing values', 'Data Normalization', 'Data Merging & Joining'],
    itemStyle: { color: '#98aaf0' }
  },
  {
    name: 'Data Visualization',
    children: ['Bokey', 'Plotly', 'Seaborn', 'Taipy', 'Tableau', 'PowerBI', 'Looker', 'Matplotlib'],
    itemStyle: { color: '#8195e9' }
  },
  {
    name: 'Machine Learning',
    children: ['Supervised Learning', 'Unsupervised Learning', 'K-Means Clustering', 'Hierarchical Clustering', 'Model Evaluation'],
    itemStyle: { color: '#687de2' }
  },
  {
    name: 'Soft Skills',
    children: ['Critical Thinking', 'Problem-solving Skills', 'Communication Skills', 'Collaboration and Teamwork', 'Presentation Skills'],
    itemStyle: { color: '#526adb' }
  }
];

const mosaicData = [
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
];

const lollipopData = [
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
];

const flameData = JSON.parse(
  readFileSync(new URL('./fixtures/partition.json', import.meta.url), 'utf8')
);

const subwayRoutes = [
  {
    id: 'line1',
    name: '1号线',
    color: '#d51f2a',
    stations: [
      { id: 'xianghu', name: '湘湖', coord: [360, 470], labelPosition: 'left' },
      { id: 'binhe', name: '滨和路', coord: [360, 420], labelPosition: 'right' },
      { id: 'jinjiang', name: '近江', coord: [360, 365], labelPosition: 'right' },
      { id: 'chengzhan', name: '城站', coord: [325, 320], labelPosition: 'left' },
      { id: 'longxiangqiao', name: '龙翔桥', coord: [285, 275], labelPosition: 'left' },
      { id: 'fengqi', name: '凤起路', coord: [245, 225], labelPosition: 'bottom' },
      { id: 'wulin', name: '武林广场', coord: [245, 175], labelPosition: 'left' },
      { id: 'wenhua', name: '西湖文化广场', coord: [245, 130], labelPosition: 'left' },
      { id: 'coach', name: '客运中心', coord: [390, 130], labelPosition: 'bottom' },
      { id: 'jiubao', name: '九堡', coord: [500, 130], labelPosition: 'bottom' },
      { id: 'linping', name: '临平', coord: [560, 70], labelPosition: 'right' }
    ],
    waypoints: [
      ['xianghu', 360, 470],
      ['binhe', 360, 420],
      ['jinjiang', 360, 365],
      ['chengzhan', 325, 320],
      ['longxiangqiao', 285, 275],
      ['fengqi', 245, 225],
      ['wulin', 245, 175],
      ['wenhua', 245, 130],
      [390, 130],
      ['coach', 390, 130],
      ['jiubao', 500, 130],
      [560, 130],
      ['linping', 560, 70]
    ],
    segments: [
      { from: 'jiubao', to: 'linping', status: 'construction' }
    ]
  },
  {
    id: 'line2',
    name: '2号线',
    color: '#f5a623',
    stations: [
      { id: 'liangzhu', name: '良渚', coord: [100, 115], labelPosition: 'top' },
      { id: 'sandun', name: '三墩', coord: [150, 150], labelPosition: 'top' },
      { id: 'wulinmen', name: '武林门', coord: [205, 225], labelPosition: 'left' },
      { id: 'fengqi', name: '凤起路', coord: [245, 225] },
      { id: 'qingchun', name: '庆春广场', coord: [310, 260], labelPosition: 'bottom' },
      { id: 'jinjiang', name: '近江', coord: [360, 365] },
      { id: 'qianjiang', name: '钱江路', coord: [405, 330], labelPosition: 'right' },
      { id: 'renmin', name: '人民广场', coord: [455, 440], labelPosition: 'right' },
      { id: 'chaoyang', name: '朝阳', coord: [455, 500], labelPosition: 'right' }
    ],
    waypoints: [
      ['liangzhu', 100, 115],
      ['sandun', 150, 150],
      [150, 225],
      ['wulinmen', 205, 225],
      ['fengqi', 245, 225],
      ['qingchun', 310, 260],
      ['jinjiang', 360, 365],
      ['qianjiang', 405, 330],
      [455, 380],
      ['renmin', 455, 440],
      ['chaoyang', 455, 500]
    ]
  },
  {
    id: 'line4',
    name: '4号线',
    color: '#18a849',
    stations: [
      { id: 'pengbu', name: '彭埠', coord: [430, 95], labelPosition: 'top' },
      { id: 'east', name: '火车东站', coord: [360, 95], labelPosition: 'top' },
      { id: 'xintang', name: '新塘', coord: [360, 175], labelPosition: 'right' },
      { id: 'qianjiang', name: '钱江路', coord: [405, 330] },
      { id: 'civic', name: '市民中心', coord: [385, 305], labelPosition: 'right' },
      { id: 'jinjiang', name: '近江', coord: [360, 365] },
      { id: 'fuxing', name: '复兴路', coord: [330, 420], labelPosition: 'left' }
    ],
    waypoints: [
      ['pengbu', 430, 95],
      ['east', 360, 95],
      ['xintang', 360, 175],
      ['civic', 385, 305],
      ['qianjiang', 405, 330],
      ['jinjiang', 360, 365],
      ['fuxing', 330, 420]
    ]
  },
  {
    id: 'line7',
    name: '规划线',
    color: '#8e44ad',
    status: 'planned',
    stations: [
      { id: 'future-west', name: '规划西', coord: [155, 360], labelPosition: 'left' },
      { id: 'civic', name: '市民中心', coord: [385, 305] },
      { id: 'airport', name: '机场', coord: [600, 210], labelPosition: 'right' }
    ],
    waypoints: [
      ['future-west', 155, 360],
      [235, 360],
      ['civic', 385, 305],
      [500, 260],
      ['airport', 600, 210]
    ]
  }
];

export async function readSnapshot(filePath = snapshotPath) {
  return normalizeSvg(await readFile(filePath, 'utf8'));
}

export async function writeSnapshot(svg, filePath = snapshotPath) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, normalizeSvg(svg));
}

export async function writeActual(svg, filePath = actualPath) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, normalizeSvg(svg));
}

export function renderFixture() {
  const panelSvgs = panels.map((panel) => renderPanel(panel)).join('\n');
  return normalizeSvg(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="760" viewBox="0 0 1080 760" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="760" fill="#f6f7fb"/>
${panelSvgs}
</svg>
`);
}

export function renderRadialAreaFixture() {
  const baseSeries = {
    type: 'radialArea',
    top: 52,
    width: '94%',
    height: '88%',
    padding: 34,
    angleField: 'date',
    angleType: 'time',
    valueField: 'avg',
    min: 20,
    max: 90,
    tickCount: 5,
    innerRadius: '36%',
    outerRadius: '91%',
    data: seasonalWeatherData,
    angleAxis: {
      show: false,
      label: {
        show: false
      },
      splitLine: {
        show: false
      }
    }
  };

  return normalizeSvg(renderOption({
    animation: false,
    backgroundColor: '#ffffff',
    title: {
      text: 'Radial Range Area',
      left: 'center',
      top: 16,
      textStyle: {
        color: '#111827',
        fontSize: 22,
        fontWeight: 700
      }
    },
    series: [
      {
        ...baseSeries,
        minField: 'minmin',
        maxField: 'maxmax',
        radialAxis: {
          label: {
            color: '#9aa0a6',
            fontSize: 14
          },
          splitLine: {
            lineStyle: {
              color: '#dce3ec',
              width: 1,
              opacity: 0.76,
              type: 'dashed'
            }
          }
        },
        angleAxis: {
          show: false,
          label: {
            show: false,
            color: '#9aa0a6',
            fontSize: 12
          },
          splitLine: {
            show: false,
            lineStyle: {
              color: '#dce3ec',
              width: 1,
              opacity: 0.5,
              type: 'dashed'
            }
          }
        },
        rangeAreaStyle: {
          color: '#e8eff7',
          opacity: 0.98
        },
        lineStyle: {
          color: '#3f86bd',
          width: 0,
          opacity: 0
        }
      },
      {
        ...baseSeries,
        grid: {
          show: false
        },
        radialAxis: {
          show: false
        },
        minField: 'min',
        maxField: 'max',
        rangeAreaStyle: {
          color: '#c9dceb',
          opacity: 0.82
        },
        lineStyle: {
          color: '#3f86bd',
          width: 2.2
        },
        showSymbol: false,
        itemStyle: {
          color: '#3f86bd',
          borderColor: '#ffffff',
          borderWidth: 1.3
        }
      }
    ]
  }, 720, 720));
}

export function renderRadialBoxplotFixture() {
  return normalizeSvg(renderOption({
    animation: false,
    backgroundColor: '#ffffff',
    title: {
      text: 'Radial Boxplot',
      left: 'center',
      top: 16,
      textStyle: {
        color: '#111827',
        fontSize: 22,
        fontWeight: 700
      }
    },
    series: [
      {
        type: 'radialBoxplot',
        top: 52,
        width: '94%',
        height: '88%',
        padding: 42,
        innerRadius: '18%',
        outerRadius: '82%',
        categoryField: 'name',
        categories: radialBoxplotData.map((item) => item.name),
        min: 0,
        max: 32,
        tickCount: 7,
        boxWidth: 0.58,
        capWidth: 0.34,
        data: radialBoxplotData,
        radialAxis: {
          label: {
            color: '#9aa0a6',
            fontSize: 13
          },
          splitLine: {
            lineStyle: {
              color: '#d8dee8',
              width: 1,
              opacity: 0.62,
              type: 'dashed'
            }
          }
        },
        angleAxis: {
          label: {
            color: '#8d949e',
            fontSize: 14,
            rotate: 'tangential'
          },
          splitLine: {
            show: false
          }
        },
        itemStyle: {
          opacity: 0.96,
          borderColor: '#111111',
          borderWidth: 1.2
        },
        whiskerLineStyle: {
          color: '#111111',
          width: 1.2
        },
        medianLineStyle: {
          color: '#111111',
          width: 1.2
        },
        capLineStyle: {
          color: '#111111',
          width: 1.2
        }
      }
    ]
  }, 720, 720));
}

export function renderVennFixture() {
  const panelSvgs = vennPanels.map((panel) => renderOptionPanel(panel)).join('\n');
  return normalizeSvg(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="392" viewBox="0 0 1080 392" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="392" fill="#f6f7fb"/>
${panelSvgs}
</svg>
`);
}

export function renderNestedCircleFixture() {
  return normalizeSvg(renderOption({
    animation: false,
    backgroundColor: '#ffffff',
    title: {
      text: 'Data Scientist Roadmap',
      left: 'center',
      top: 18,
      textStyle: {
        color: '#111827',
        fontSize: 24,
        fontWeight: 700
      }
    },
    series: [
      {
        type: 'nestedCircle',
        top: 72,
        width: '94%',
        height: '86%',
        padding: 8,
        centerRadiusRatio: 0.29,
        minRingThickness: 24,
        data: nestedCircleData,
        ringStyle: {
          borderColor: 'rgba(30, 58, 138, 0.42)',
          borderWidth: 1,
          opacity: 0.98
        },
        titleLabel: {
          show: true,
          color: '#0f172a',
          fontSize: 18,
          fontWeight: 750,
          lineHeight: 22
        },
        label: {
          show: true,
          color: '#111827',
          fontSize: 9,
          fontWeight: 500,
          lineHeight: 11
        }
      }
    ]
  }, 960, 1000));
}

export function renderMosaicFixture() {
  return normalizeSvg(renderOption({
    animation: false,
    backgroundColor: '#ffffff',
    title: {
      text: 'Acquisition Cohorts',
      left: 'center',
      top: 16,
      textStyle: {
        color: '#111827',
        fontSize: 22,
        fontWeight: 700
      }
    },
    series: [
      {
        type: 'mosaic',
        top: 56,
        width: '90%',
        height: '82%',
        padding: 10,
        gap: 3,
        xField: 'channel',
        yField: 'stage',
        valueField: 'users',
        yCategories: ['New', 'Returning', 'Dormant'],
        data: mosaicData,
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 1.5,
          opacity: 0.94
        },
        label: {
          show: true,
          color: '#172033',
          fontSize: 12,
          fontWeight: 650,
          formatter: '{x}\n{y}: {c}'
        }
      }
    ]
  }, 720, 460));
}

export function renderLollipopFixture() {
  return normalizeSvg(renderOption({
    animation: false,
    backgroundColor: '#141414',
    title: {
      text: '2024',
      left: 'center',
      top: 10,
      textStyle: {
        color: '#aaaab0',
        fontSize: 20,
        fontWeight: 600
      }
    },
    series: [
      {
        type: 'lollipop',
        top: 42,
        width: '92%',
        height: '84%',
        padding: { top: 12, right: 34, bottom: 88, left: 88 },
        categoryField: 'country',
        valueField: 'population',
        categories: lollipopData.map((item) => item.country),
        min: 0,
        max: 2000,
        baseline: 0,
        tickCount: 5,
        symbolSize: 13,
        data: lollipopData,
        valueAxis: {
          name: 'Population',
          label: {
            color: '#d7d7dc',
            fontSize: 15,
            formatter: formatMillions
          },
          splitLine: {
            lineStyle: {
              color: '#303033',
              width: 1,
              opacity: 1
            }
          },
          axisLine: {
            lineStyle: {
              color: '#eeeeee',
              width: 1.2,
              opacity: 1
            }
          },
          nameTextStyle: {
            color: '#aeb0b5',
            fontSize: 15,
            fontWeight: 600
          }
        },
        categoryAxis: {
          label: {
            color: '#d7d7dc',
            fontSize: 15,
            rotate: 45
          }
        },
        stemStyle: {
          color: '#1aa8f2',
          width: 1.4,
          opacity: 0.95
        },
        itemStyle: {
          color: '#2db5ff',
          borderColor: '#2db5ff',
          borderWidth: 0
        }
      }
    ]
  }, 980, 540));
}

export function renderSubwayFixture() {
  return normalizeSvg(renderOption({
    animation: false,
    backgroundColor: '#ffffff',
    title: {
      text: 'Hangzhou Subway Schematic',
      left: 'center',
      top: 16,
      textStyle: {
        color: '#111827',
        fontSize: 22,
        fontWeight: 700
      }
    },
    series: [
      {
        type: 'subway',
        top: 56,
        width: '92%',
        height: '84%',
        padding: 34,
        lineWidth: 9,
        stationRadius: 4,
        interchangeRadius: 8,
        data: subwayRoutes,
        label: {
          show: true,
          color: '#151b2b',
          fontSize: 10,
          fontWeight: 600
        },
        routeLabel: {
          show: true,
          position: 'end',
          fontSize: 12,
          fontWeight: 800
        },
        stationStyle: {
          color: '#ffffff',
          borderWidth: 2
        },
        interchangeStyle: {
          color: '#ffffff',
          borderColor: '#1f2937',
          borderWidth: 3
        }
      }
    ]
  }, 820, 560));
}

export function renderFlameFixture() {
  return normalizeSvg(renderOption({
    animation: false,
    backgroundColor: '#ffffff',
    title: {
      text: 'Kernel Profile Flame Graph',
      left: 'center',
      top: 16,
      textStyle: {
        color: '#111827',
        fontSize: 22,
        fontWeight: 700
      }
    },
    series: [
      {
        type: 'flame',
        top: 58,
        width: '94%',
        height: '84%',
        padding: 4,
        gap: 0.8,
        orient: 'up',
        sort: false,
        rootVisible: false,
        data: flameData,
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 1.2,
          opacity: 0.96
        },
        label: {
          show: true,
          color: '#172033',
          fontSize: 9,
          fontWeight: 650,
          formatter: '{b}'
        }
      }
    ]
  }, 960, 620));
}

export function renderSunriseSunsetFixture() {
  return normalizeSvg(renderOption({
    animation: false,
    series: [
      {
        type: 'sunriseSunset',
        sunrise: '05:12',
        sunset: '18:39',
        moonrise: '22:08',
        moonset: '07:59',
        currentTime: '2026-05-05 10:47:33',
        title: '距离日落还剩',
        remainingText: '07:51:27',
        updatedText: '更新于10:46',
        enterAnimation: false,
        padding: 216,
        moonStartRatio: 0.28,
        moonEndRatio: 0.72,
        titleLabel: {
          fontSize: 46,
          fontWeight: 650
        },
        remainingLabel: {
          fontSize: 78,
          fontWeight: 300
        },
        updatedLabel: {
          fontSize: 34
        },
        eventLabel: {
          fontSize: 36
        }
      }
    ]
  }, 1260, 795));
}

function renderPanel(panel) {
  const chartSvg = renderChart(panel.series);
  return `  <g id="panel-${panel.id}">
    <rect x="${panel.x}" y="${panel.y}" width="516" height="352" rx="8" fill="#fff" stroke="#d8dee9"/>
    <line x1="${panel.x}" y1="${panel.y + 38}" x2="${panel.x + 516}" y2="${panel.y + 38}" stroke="#e5e7eb"/>
    <text x="${panel.x + 14}" y="${panel.y + 24}" fill="#374151" font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14" font-weight="650">${panel.title}</text>
    <svg x="${panel.x}" y="${panel.y + 38}" width="516" height="314" viewBox="0 0 516 314">
${indent(innerSvg(chartSvg), 6)}
    </svg>
  </g>`;
}

function renderChart(seriesPatch) {
  return renderOption({
    animation: false,
    backgroundColor: '#ffffff',
    series: [
      {
        ...graph,
        symbolSize: 22,
        label: {
          show: true,
          position: 'right',
          fontSize: 11,
          color: '#374151'
        },
        edgeStyle: {
          color: '#8a94a6',
          width: 1.25,
          opacity: 0.62
        },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 1.5
        },
        ...seriesPatch
      }
    ]
  });
}

function renderOptionPanel(panel) {
  const chartSvg = renderOption({
    animation: false,
    backgroundColor: '#ffffff',
    ...panel.option
  });
  return `  <g id="panel-${panel.id}">
    <rect x="${panel.x}" y="${panel.y}" width="516" height="352" rx="8" fill="#fff" stroke="#d8dee9"/>
    <line x1="${panel.x}" y1="${panel.y + 38}" x2="${panel.x + 516}" y2="${panel.y + 38}" stroke="#e5e7eb"/>
    <text x="${panel.x + 14}" y="${panel.y + 24}" fill="#374151" font-family="system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="14" font-weight="650">${panel.title}</text>
    <svg x="${panel.x}" y="${panel.y + 38}" width="516" height="314" viewBox="0 0 516 314">
${indent(innerSvg(chartSvg), 6)}
    </svg>
  </g>`;
}

function renderOption(option, width = 516, height = 314) {
  const chart = echarts.init(null, null, {
    renderer: 'svg',
    ssr: true,
    width,
    height
  });

  chart.setOption(option);

  const svg = chart.renderToSVGString();
  chart.dispose();
  return svg;
}

function formatMillions(value) {
  return `${Number(value).toLocaleString('en-US')}M`;
}

function innerSvg(svg) {
  return svg
    .replace(/^<svg\b[^>]*>/, '')
    .replace(/<\/svg>$/, '')
    .trim();
}

function indent(value, spaces) {
  const prefix = ' '.repeat(spaces);
  return value
    .split('\n')
    .map((line) => (line ? `${prefix}${line}` : ''))
    .join('\n');
}

function normalizeSvg(svg) {
  const zrenderClassMap = new Map();
  let zrenderClassIndex = 0;

  return `${svg
    .replace(/\r\n/g, '\n')
    .replace(/<\?xml version="1\.0" encoding="UTF-8"\?>\n/g, '<?xml version="1.0" encoding="UTF-8"?>\n')
    .replace(/\bzr\d+-cls-\d+\b/g, (className) => {
      if (!zrenderClassMap.has(className)) {
        zrenderClassMap.set(className, `zr-cls-${zrenderClassIndex}`);
        zrenderClassIndex += 1;
      }
      return zrenderClassMap.get(className);
    })
    .trim()}\n`;
}
