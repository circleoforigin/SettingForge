import type { ModuleDefinition } from './ModuleDefinition';

export class ModuleRegistry {
  private readonly modules = new Map<string, ModuleDefinition>();

  register(module: ModuleDefinition): void {
    this.modules.set(module.id, module);
  }

  get(id: string): ModuleDefinition | undefined {
    return this.modules.get(id);
  }

  getAll(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }
}