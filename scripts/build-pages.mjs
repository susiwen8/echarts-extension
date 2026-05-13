import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(rootDir, '.pages');
const packagesDir = path.join(rootDir, 'packages');

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await copyRequired('favicon.svg');
await copyRequired('docs');
await copyRequired('node_modules/echarts/dist/echarts.min.js');
await writeFile(path.join(outputDir, '.nojekyll'), '');
await writeRootRedirect();

for (const packageName of packageNamesWithBuilds()) {
  await copyRequired(
    `packages/${packageName}/dist`,
    `packages/${packageName}/dist`
  );
}

console.log(`Built GitHub Pages example artifact at ${path.relative(rootDir, outputDir)}`);

export async function copyRequired(source, destination = source) {
  const sourcePath = path.join(rootDir, source);
  const destinationPath = path.join(outputDir, destination);

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing required Pages asset: ${source}`);
  }

  await mkdir(path.dirname(destinationPath), { recursive: true });
  await cp(sourcePath, destinationPath, { recursive: true, filter: shouldCopy });
}

export function packageNamesWithBuilds() {
  return readdirSync(packagesDir)
    .filter((entry) => {
      const packageDir = path.join(packagesDir, entry);
      return statSync(packageDir).isDirectory()
        && existsSync(path.join(packageDir, 'package.json'))
        && packageHasBuild(entry);
    })
    .sort();
}

export function packageHasBuild(packageName) {
  const packageJson = JSON.parse(
    readFileSync(path.join(packagesDir, packageName, 'package.json'), 'utf8')
  );

  return Boolean(packageJson.scripts?.build);
}

export async function writeRootRedirect() {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=./docs/">
  <link rel="canonical" href="./docs/">
  <title>ECharts Extension Examples</title>
  <script>location.replace('./docs/');</script>
</head>
<body>
  <p><a href="./docs/">Open ECharts Extension examples</a></p>
</body>
</html>
`;

  await writeFile(path.join(outputDir, 'index.html'), html);
}

export function shouldCopy(sourcePath) {
  return path.basename(sourcePath) !== '.DS_Store';
}
