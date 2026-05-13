import { appendFileSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_ALLOWLIST_PATH = '.github/npm-publish-allowlist.json';

export function parseRequestedPackages(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw.toLowerCase() === 'all') return null;

  if (raw.startsWith('[')) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
      throw new Error('Requested packages JSON must be an array of package names.');
    }
    return unique(parsed.map((item) => item.trim()).filter(Boolean), 'requested packages');
  }

  return unique(raw.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean), 'requested packages');
}

export function resolvePublishPlan({
  rootDir = process.cwd(),
  allowlistPath = DEFAULT_ALLOWLIST_PATH,
  requestedPackages = process.env.REQUESTED_PACKAGES ?? 'all'
} = {}) {
  const absoluteRoot = path.resolve(rootDir);
  const allowlist = readAllowlist(path.join(absoluteRoot, allowlistPath));
  const workspacePackages = readWorkspacePackages(absoluteRoot);
  const requested = parseRequestedPackages(requestedPackages) ?? allowlist;

  for (const packageName of requested) {
    if (!allowlist.includes(packageName)) {
      throw new Error(`${packageName} is not in ${allowlistPath}; refusing to publish it.`);
    }
  }

  return {
    allowlistPath,
    packages: requested.map((packageName) => {
      const workspacePackage = workspacePackages.get(packageName);
      if (!workspacePackage) {
        throw new Error(`${packageName} is allowlisted but does not exist in npm workspaces.`);
      }
      if (workspacePackage.private) {
        throw new Error(`${packageName} is a private package; refusing to publish it.`);
      }

      return {
        name: workspacePackage.name,
        version: workspacePackage.version,
        dir: toPosixPath(path.relative(absoluteRoot, workspacePackage.dir))
      };
    })
  };
}

export function formatGithubOutput(plan) {
  const packageNames = plan.packages.map((pkg) => pkg.name);
  const packageDirs = plan.packages.map((pkg) => pkg.dir);

  return [
    `package_count=${plan.packages.length}`,
    `package_names=${JSON.stringify(packageNames)}`,
    `package_dirs=${JSON.stringify(packageDirs)}`,
    `package_plan=${JSON.stringify(plan)}`
  ].join('\n');
}

function readAllowlist(filePath) {
  const allowlist = JSON.parse(readFileSync(filePath, 'utf8'));
  if (!Array.isArray(allowlist) || allowlist.some((item) => typeof item !== 'string')) {
    throw new Error(`${DEFAULT_ALLOWLIST_PATH} must be a JSON array of package names.`);
  }

  return unique(allowlist.map((item) => item.trim()).filter(Boolean), DEFAULT_ALLOWLIST_PATH);
}

function readWorkspacePackages(rootDir) {
  const rootPackageJson = readJson(path.join(rootDir, 'package.json'));
  const workspacePatterns = Array.isArray(rootPackageJson.workspaces)
    ? rootPackageJson.workspaces
    : rootPackageJson.workspaces?.packages ?? [];
  const packages = new Map();

  for (const packageDir of expandWorkspacePatterns(rootDir, workspacePatterns)) {
    const packageJsonPath = path.join(packageDir, 'package.json');
    if (!existsSync(packageJsonPath)) continue;

    const packageJson = readJson(packageJsonPath);
    if (!packageJson.name) {
      throw new Error(`${toPosixPath(path.relative(rootDir, packageJsonPath))} is missing a package name.`);
    }
    if (packages.has(packageJson.name)) {
      throw new Error(`Duplicate workspace package name: ${packageJson.name}.`);
    }

    packages.set(packageJson.name, {
      dir: packageDir,
      name: packageJson.name,
      private: packageJson.private === true,
      version: packageJson.version
    });
  }

  return packages;
}

function expandWorkspacePatterns(rootDir, patterns) {
  const packageDirs = [];

  for (const pattern of patterns) {
    if (typeof pattern !== 'string') continue;
    if (pattern.endsWith('/*')) {
      const parentDir = path.join(rootDir, pattern.slice(0, -2));
      if (!existsSync(parentDir)) continue;

      for (const entry of readdirSync(parentDir).sort()) {
        const packageDir = path.join(parentDir, entry);
        if (statSync(packageDir).isDirectory()) packageDirs.push(packageDir);
      }
    } else {
      const packageDir = path.join(rootDir, pattern);
      if (existsSync(packageDir) && statSync(packageDir).isDirectory()) packageDirs.push(packageDir);
    }
  }

  return packageDirs;
}

function unique(values, label) {
  const seen = new Set();
  const uniqueValues = [];

  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label} entry: ${value}.`);
    seen.add(value);
    uniqueValues.push(value);
  }

  return uniqueValues;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function parseArgs(argv) {
  const args = {
    allowlistPath: DEFAULT_ALLOWLIST_PATH,
    githubOutput: false,
    requestedPackages: process.env.REQUESTED_PACKAGES ?? 'all',
    rootDir: process.cwd()
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--github-output') {
      args.githubOutput = true;
    } else if (arg === '--packages') {
      args.requestedPackages = argv[++index];
    } else if (arg === '--allowlist') {
      args.allowlistPath = argv[++index];
    } else if (arg === '--root') {
      args.rootDir = argv[++index];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function runCli() {
  const args = parseArgs(process.argv.slice(2));
  const plan = resolvePublishPlan(args);

  if (args.githubOutput) {
    const output = formatGithubOutput(plan);
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
    console.log(output);
  } else {
    console.log(JSON.stringify(plan, null, 2));
  }
}

if (import.meta.url === pathToFileURL(fileURLToPath(import.meta.url)).href && process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
