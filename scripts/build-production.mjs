import { cp, mkdir, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const hostRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const projectsRoot = path.resolve(hostRoot, '..');
const npmCli = process.env.npm_execpath;
const sdkRoot = process.env.SETTINGFORGE_SDK_DIR ||
  path.join(projectsRoot, 'SettingForge-SDK');

const modules = [
  {
    id: 'sacscape',
    sourceRoot: process.env.SETTINGFORGE_SACSCAPE_DIR ||
      path.join(projectsRoot, 'Soundforge'),
  },
  {
    id: 'regions',
    sourceRoot: process.env.SETTINGFORGE_REGIONS_DIR ||
      path.join(projectsRoot, 'Regions'),
  },
];

function runBuild(projectRoot) {
  if (!npmCli) {
    throw new Error('Run this production build through npm.');
  }

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [npmCli, 'run', 'build'], {
      cwd: projectRoot,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Build failed in ${projectRoot}.`));
    });
  });
}

await runBuild(sdkRoot);

for (const module of modules) {
  await runBuild(module.sourceRoot);
}

await runBuild(hostRoot);

const modulesOutput = path.join(hostRoot, 'dist', 'modules');
await rm(modulesOutput, { recursive: true, force: true });
await mkdir(modulesOutput, { recursive: true });

for (const module of modules) {
  const source = path.join(module.sourceRoot, 'dist');
  const destination = path.join(modulesOutput, module.id);
  await cp(source, destination, { recursive: true });
}

console.log(`Production modules staged in ${modulesOutput}.`);
