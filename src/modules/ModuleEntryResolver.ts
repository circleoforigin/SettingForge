import type { ModuleDefinition } from './ModuleDefinition';

const moduleProtocol = 'settingforge-module:';

export function resolveModuleEntry(
  module: ModuleDefinition,
  isDevelopment: boolean
): string | undefined {
  if (isDevelopment) return module.devUrl;
  if (!module.productionEntry) return undefined;

  const entry = module.productionEntry.replace(/^\/+/, '');
  return `${moduleProtocol}//${module.id}/${entry}`;
}
