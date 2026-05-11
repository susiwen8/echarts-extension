import { defineConfig } from 'vitest/config';
import path from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: {
      '@echarts-extension/layout-core': path.join(root, 'packages/echarts-layout-core/src/index.ts'),
      'echarts-arc': path.join(root, 'packages/echarts-arc/index.ts'),
      'echarts-beeswarm': path.join(root, 'packages/echarts-beeswarm/index.ts'),
      'echarts-circle-packing': path.join(root, 'packages/echarts-circle-packing/index.ts'),
      'echarts-concentric': path.join(root, 'packages/echarts-concentric/index.ts'),
      'echarts-fisheye': path.join(root, 'packages/echarts-fisheye/index.ts'),
      'echarts-flame': path.join(root, 'packages/echarts-flame/index.ts'),
      'echarts-grid': path.join(root, 'packages/echarts-grid/index.ts'),
      'echarts-lollipop': path.join(root, 'packages/echarts-lollipop/index.ts'),
      'echarts-mds': path.join(root, 'packages/echarts-mds/index.ts'),
      'echarts-mosaic': path.join(root, 'packages/echarts-mosaic/index.ts'),
      'echarts-nested-circle': path.join(root, 'packages/echarts-nested-circle/index.ts'),
      'echarts-pack-bubble': path.join(root, 'packages/echarts-pack-bubble/index.ts'),
      'echarts-radial': path.join(root, 'packages/echarts-radial/index.ts'),
      'echarts-radial-area': path.join(root, 'packages/echarts-radial-area/index.ts'),
      'echarts-radial-boxplot': path.join(root, 'packages/echarts-radial-boxplot/index.ts'),
      'echarts-spiral': path.join(root, 'packages/echarts-spiral/index.ts'),
      'echarts-smith': path.join(root, 'packages/echarts-smith/index.ts'),
      'echarts-subway': path.join(root, 'packages/echarts-subway/index.ts'),
      'echarts-sunrise-sunset': path.join(root, 'packages/echarts-sunrise-sunset/index.ts'),
      'echarts-vector-field': path.join(root, 'packages/echarts-vector-field/index.ts'),
      'echarts-venn': path.join(root, 'packages/echarts-venn/index.ts'),
      'echarts-voronoi-treemap': path.join(root, 'packages/echarts-voronoi-treemap/index.ts')
    }
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'packages/*/test/**/*.test.ts'],
    exclude: ['tests/browser-visual/**', 'node_modules/**', 'dist/**', 'lib/**'],
    fileParallelism: false,
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      all: true,
      include: [
        'packages/*/src/**/*.ts',
        'packages/*/index.ts'
      ],
      exclude: [
        'node_modules/**',
        'packages/*/dist/**',
        'packages/*/lib/**',
        'packages/*/test/**',
        'tests/**',
        'test-results/**',
        '.pages/**',
        'videos/**'
      ],
      reporter: ['text', 'json-summary'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100
      }
    }
  }
});
