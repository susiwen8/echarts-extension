import { defineConfig } from 'vitest/config';
import path from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: {
      '@echarts-extension/layout-core': path.join(root, 'packages/echarts-layout-core/src/index.ts'),
      '@echarts-extension/arc': path.join(root, 'packages/echarts-arc/index.ts'),
      '@echarts-extension/beeswarm': path.join(root, 'packages/echarts-beeswarm/index.ts'),
      '@echarts-extension/cause-effect': path.join(root, 'packages/echarts-cause-effect/index.ts'),
      '@echarts-extension/circle-packing': path.join(root, 'packages/echarts-circle-packing/index.ts'),
      '@echarts-extension/concentric': path.join(root, 'packages/echarts-concentric/index.ts'),
      '@echarts-extension/fisheye': path.join(root, 'packages/echarts-fisheye/index.ts'),
      '@echarts-extension/fractal': path.join(root, 'packages/echarts-fractal/index.ts'),
      '@echarts-extension/flame': path.join(root, 'packages/echarts-flame/index.ts'),
      '@echarts-extension/grid': path.join(root, 'packages/echarts-grid/index.ts'),
      '@echarts-extension/lollipop': path.join(root, 'packages/echarts-lollipop/index.ts'),
      '@echarts-extension/mds': path.join(root, 'packages/echarts-mds/index.ts'),
      '@echarts-extension/mosaic': path.join(root, 'packages/echarts-mosaic/index.ts'),
      '@echarts-extension/nested-circle': path.join(root, 'packages/echarts-nested-circle/index.ts'),
      '@echarts-extension/organization-chart': path.join(root, 'packages/echarts-organization-chart/index.ts'),
      '@echarts-extension/pack-bubble': path.join(root, 'packages/echarts-pack-bubble/index.ts'),
      '@echarts-extension/radial': path.join(root, 'packages/echarts-radial/index.ts'),
      '@echarts-extension/radial-area': path.join(root, 'packages/echarts-radial-area/index.ts'),
      '@echarts-extension/radial-boxplot': path.join(root, 'packages/echarts-radial-boxplot/index.ts'),
      '@echarts-extension/sequence-diagram': path.join(root, 'packages/echarts-sequence-diagram/index.ts'),
      '@echarts-extension/spiral': path.join(root, 'packages/echarts-spiral/index.ts'),
      '@echarts-extension/smith': path.join(root, 'packages/echarts-smith/index.ts'),
      '@echarts-extension/subway': path.join(root, 'packages/echarts-subway/index.ts'),
      '@echarts-extension/sunrise-sunset': path.join(root, 'packages/echarts-sunrise-sunset/index.ts'),
      '@echarts-extension/vector-field': path.join(root, 'packages/echarts-vector-field/index.ts'),
      '@echarts-extension/venn': path.join(root, 'packages/echarts-venn/index.ts'),
      '@echarts-extension/voronoi-treemap': path.join(root, 'packages/echarts-voronoi-treemap/index.ts')
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
