import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: import.meta.dirname,
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js', 'packages/*/test/**/*.test.js'],
    exclude: ['tests/browser-visual/**', 'node_modules/**', 'dist/**', 'lib/**'],
    fileParallelism: false,
    testTimeout: 30000
  }
});
