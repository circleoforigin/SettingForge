import type {
  ActionDefinition,
  RegisteredActionDefinition,
} from '@settingforge/module-sdk';

type ActionRegistryListener =
  (actions: RegisteredActionDefinition[]) => void;

export class ActionRegistry {
  private readonly actions =
    new Map<string, RegisteredActionDefinition>();

  private readonly listeners =
    new Set<ActionRegistryListener>();

  registerModuleActions(
    moduleId: string,
    moduleName: string,
    definitions: ActionDefinition[]
  ): void {
    const incomingIds = new Set<string>();

    for (const definition of definitions) {
      if (incomingIds.has(definition.id)) {
        throw new Error(`Action "${definition.id}" is registered twice.`);
      }
      incomingIds.add(definition.id);

      const existing = this.actions.get(definition.id);
      if (existing && existing.moduleId !== moduleId) {
        throw new Error(
          `Action "${definition.id}" is already registered by ` +
          `module "${existing.moduleId}".`
        );
      }
    }

    for (const action of this.getByModule(moduleId)) {
      this.actions.delete(action.id);
    }

    for (const definition of definitions) {
      this.actions.set(definition.id, {
        ...definition,
        fields: definition.fields?.map((field) => ({ ...field })),
        moduleId,
        moduleName,
      });
    }

    this.notify();
  }

  get(id: string): RegisteredActionDefinition | undefined {
    return this.actions.get(id);
  }

  getAll(): RegisteredActionDefinition[] {
    return Array.from(this.actions.values())
      .map((action) => ({
        ...action,
        fields: action.fields?.map((field) => ({ ...field })),
      }))
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  getByModule(moduleId: string): RegisteredActionDefinition[] {
    return this.getAll().filter((action) => action.moduleId === moduleId);
  }

  unregisterModule(moduleId: string): void {
    let changed = false;
    for (const action of this.getByModule(moduleId)) {
      this.actions.delete(action.id);
      changed = true;
    }
    if (changed) this.notify();
  }

  subscribe(listener: ActionRegistryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const actions = this.getAll();
    for (const listener of this.listeners) listener(actions);
  }
}

export const actionRegistry = new ActionRegistry();
