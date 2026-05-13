import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { resolvePublishPlan } from './npm-publish-plan.mjs';

export function createPublishArgs(pkg, { dryRun = false, provenance = true, rootDir = process.cwd() } = {}) {
  const args = ['publish', path.resolve(rootDir, pkg.dir)];
  if (provenance) args.push('--provenance');
  if (pkg.name.startsWith('@')) args.push('--access', 'public');
  if (dryRun) args.push('--dry-run');

  return args;
}

export function publishPackages({
  dryRun = false,
  provenance = true,
  requestedPackages = process.env.REQUESTED_PACKAGES ?? 'all',
  rootDir = process.cwd()
} = {}) {
  if (!dryRun && !process.env.NODE_AUTH_TOKEN) {
    throw new Error('NODE_AUTH_TOKEN is required to publish packages to npm.');
  }

  const plan = resolvePublishPlan({ requestedPackages, rootDir });
  for (const pkg of plan.packages) {
    const args = createPublishArgs(pkg, { dryRun, provenance, rootDir });

    console.log(`Publishing ${pkg.name}@${pkg.version} from ${pkg.dir}`);
    const result = spawnSync('npm', args, {
      cwd: rootDir,
      env: process.env,
      stdio: 'inherit'
    });

    if (result.status !== 0) {
      throw new Error(`npm publish failed for ${pkg.name}@${pkg.version}.`);
    }
  }
}

function parseArgs(argv) {
  const args = {
    dryRun: false,
    provenance: true,
    requestedPackages: process.env.REQUESTED_PACKAGES ?? 'all',
    rootDir: process.cwd()
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--provenance') {
      args.provenance = true;
    } else if (arg === '--packages') {
      args.requestedPackages = argv[++index];
    } else if (arg === '--root') {
      args.rootDir = argv[++index];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function runCli() {
  publishPackages(parseArgs(process.argv.slice(2)));
}

if (import.meta.url === pathToFileURL(fileURLToPath(import.meta.url)).href && process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
