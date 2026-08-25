import type { EventDefinition } from './EventDefinition';

export interface RegisteredEventDefinition
  extends EventDefinition {
  moduleId: string;
  moduleName: string;
}

export class EventRegistry {
  private readonly events =
    new Map<string, RegisteredEventDefinition>();

  registerModuleEvents(
    moduleId: string,
    moduleName: string,
    definitions: EventDefinition[]
  ): void {
    for (const definition of definitions) {
      const existing =
        this.events.get(definition.type);

      if (
        existing &&
        existing.moduleId !== moduleId
      ) {
        throw new Error(
          `Event "${definition.type}" is already registered by module "${existing.moduleId}".`
        );
      }

      this.events.set(
        definition.type,
        {
          ...definition,
          moduleId,
          moduleName,
        }
      );
    }
  }

  get(
    type: string
  ): RegisteredEventDefinition | undefined {
    return this.events.get(type);
  }

  getAll(): RegisteredEventDefinition[] {
    return Array.from(
      this.events.values()
    );
  }

  getPublic(): RegisteredEventDefinition[] {
    return this.getAll().filter(
      (event) =>
        event.visibility === 'public'
    );
  }

  getPublicByModule(
    moduleId: string
  ): RegisteredEventDefinition[] {
    return this.getPublic().filter(
      (event) =>
        event.moduleId === moduleId
    );
  }
}

export const eventRegistry =
  new EventRegistry();