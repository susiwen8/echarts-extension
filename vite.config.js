import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

const echartsRuntimeId = 'echarts/lib/echarts';

export default defineConfig(({ mode }) => {
  const packageDir = process.cwd();
  const packageJson = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
  const packageName = packageJson.name;
  const isProduction = mode === 'production';

  return {
    root: packageDir,
    publicDir: false,
    plugins: [resolveTypeScriptJsImports()],
    build: {
      outDir: path.join(packageDir, 'dist'),
      emptyOutDir: isProduction,
      sourcemap: true,
      minify: isProduction ? 'oxc' : false,
      lib: {
        entry: path.join(packageDir, 'index.ts'),
        name: toGlobalName(packageName),
        formats: ['umd'],
        fileName: () => `${packageName}${isProduction ? '.min' : ''}.js`
      },
      rolldownOptions: {
        external: [echartsRuntimeId],
        output: {
          globals: {
            [echartsRuntimeId]: 'echarts'
          }
        }
      }
    }
  };
});

function resolveTypeScriptJsImports() {
  return {
    name: 'resolve-typescript-js-imports',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !source.startsWith('.') || !source.endsWith('.js')) return null;

      const importerPath = importer.split('?')[0];
      const tsPath = path.resolve(path.dirname(importerPath), `${source.slice(0, -3)}.ts`);

      return existsSync(tsPath) ? tsPath : null;
    }
  };
}

function toGlobalName(packageName) {
  return packageName
    .replace(/^@[^/]+\//, '')
    .split(/[^A-Za-z0-9_$]+/)
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part : capitalize(part)))
    .join('');
}

function capitalize(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}
