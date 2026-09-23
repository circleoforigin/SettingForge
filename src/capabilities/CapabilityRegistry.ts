import type {
  CommandDefinition,
  EventDefinition,
  QueryDefinition,
  RegisteredCommandDefinition,
  RegisteredEventDefinition,
  RegisteredQueryDefinition,
} from '@settingforge/module-sdk';

export interface ModuleCapabilityRegistration {
  moduleId: string;
  moduleName: string;
  events?: EventDefinition[];
  commands?: CommandDefinition[];
  queries?: QueryDefinition[];
}

type CapabilityRegistryListener =
  () => void;

function cloneEvents(
  definitions: RegisteredEventDefinition[]
): RegisteredEventDefinition[] {
  return definitions.map((definition) => ({
    ...definition,
    fields:
      definition.fields?.map((field) => ({
        ...field,
      })),
  }));
}

function cloneCommands(
  definitions: RegisteredCommandDefinition[]
): RegisteredCommandDefinition[] {
  return definitions.map((definition) => ({
    ...definition,
    input:
      definition.input?.map((field) => ({
        ...field,
      })),
    output:
      definition.output?.map((field) => ({
        ...field,
      })),
  }));
}

function cloneQueries(
  definitions: RegisteredQueryDefinition[]
): RegisteredQueryDefinition[] {
  return definitions.map((definition) => ({
    ...definition,
    input:
      definition.input?.map((field) => ({
        ...field,
      })),
    output:
      definition.output?.map((field) => ({
        ...field,
      })),
  }));
}

export class CapabilityRegistry {
  private readonly events =
    new Map<string, RegisteredEventDefinition>();

  private readonly commands =
    new Map<string, RegisteredCommandDefinition>();

  private readonly queries =
    new Map<string, RegisteredQueryDefinition>();

  private readonly listeners =
    new Set<CapabilityRegistryListener>();

  registerModule(
    registration: ModuleCapabilityRegistration
  ): void {
    this.validateRegistration(registration);

    this.removeModuleCapabilities(
      registration.moduleId,
      false
    );

    for (const definition of registration.events ?? []) {
      this.events.set(definition.id, {
        ...definition,
        fields:
          definition.fields?.map((field) => ({
            ...field,
          })),
        moduleId: registration.moduleId,
        moduleName: registration.moduleName,
      });
    }

    for (const definition of registration.commands ?? []) {
      this.commands.set(definition.id, {
        ...definition,
        input:
          definition.input?.map((field) => ({
            ...field,
          })),
        output:
          definition.output?.map((field) => ({
            ...field,
          })),
        moduleId: registration.moduleId,
        moduleName: registration.moduleName,
      });
    }

    for (const definition of registration.queries ?? []) {
      this.queries.set(definition.id, {
        ...definition,
        input:
          definition.input?.map((field) => ({
            ...field,
          })),
        output:
          definition.output?.map((field) => ({
            ...field,
          })),
        moduleId: registration.moduleId,
        moduleName: registration.moduleName,
      });
    }

    this.notify();
  }

  getEvent(
    id: string
  ): RegisteredEventDefinition | undefined {
    const definition = this.events.get(id);

    return definition
      ? cloneEvents([definition])[0]
      : undefined;
  }

  getCommand(
    id: string
  ): RegisteredCommandDefinition | undefined {
    const definition = this.commands.get(id);

    return definition
      ? cloneCommands([definition])[0]
      : undefined;
  }

  getQuery(
    id: string
  ): RegisteredQueryDefinition | undefined {
    const definition = this.queries.get(id);

    return definition
      ? cloneQueries([definition])[0]
      : undefined;
  }

  getEvents(): RegisteredEventDefinition[] {
    return cloneEvents(
      Array.from(this.events.values())
    ).sort((left, right) =>
      left.id.localeCompare(right.id)
    );
  }

  getCommands(): RegisteredCommandDefinition[] {
    return cloneCommands(
      Array.from(this.commands.values())
    ).sort((left, right) =>
      left.id.localeCompare(right.id)
    );
  }

  getQueries(): RegisteredQueryDefinition[] {
    return cloneQueries(
      Array.from(this.queries.values())
    ).sort((left, right) =>
      left.id.localeCompare(right.id)
    );
  }

  getEventsByModule(
    moduleId: string
  ): RegisteredEventDefinition[] {
    return this.getEvents().filter(
      (definition) =>
        definition.moduleId === moduleId
    );
  }

  getCommandsByModule(
    moduleId: string
  ): RegisteredCommandDefinition[] {
    return this.getCommands().filter(
      (definition) =>
        definition.moduleId === moduleId
    );
  }

  getQueriesByModule(
    moduleId: string
  ): RegisteredQueryDefinition[] {
    return this.getQueries().filter(
      (definition) =>
        definition.moduleId === moduleId
    );
  }

  unregisterModule(
    moduleId: string
  ): void {
    if (
      this.removeModuleCapabilities(
        moduleId,
        false
      )
    ) {
      this.notify();
    }
  }

  subscribe(
    listener: CapabilityRegistryListener
  ): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private validateRegistration(
    registration: ModuleCapabilityRegistration
  ): void {
    const incoming = new Map<
      string,
      'event' | 'command' | 'query'
    >();

    const validate = (
      id: string,
      kind: 'event' | 'command' | 'query'
    ) => {
      if (!id) {
        throw new Error(
          `Module "${registration.moduleId}" registered a ${kind} without an ID.`
        );
      }

      const incomingKind = incoming.get(id);

      if (incomingKind) {
        throw new Error(
          `Capability "${id}" is registered as both ${incomingKind} and ${kind}.`
        );
      }

      incoming.set(id, kind);

      const existing =
        this.events.get(id) ??
        this.commands.get(id) ??
        this.queries.get(id);

      if (
        existing &&
        existing.moduleId !== registration.moduleId
      ) {
        throw new Error(
          `Capability "${id}" is already registered by module "${existing.moduleId}".`
        );
      }
    };

    for (const definition of registration.events ?? []) {
      validate(definition.id, 'event');
    }

    for (const definition of registration.commands ?? []) {
      validate(definition.id, 'command');
    }

    for (const definition of registration.queries ?? []) {
      validate(definition.id, 'query');
    }
  }

  private removeModuleCapabilities(
    moduleId: string,
    notify: boolean
  ): boolean {
    let changed = false;

    for (const [id, definition] of this.events) {
      if (definition.moduleId === moduleId) {
        this.events.delete(id);
        changed = true;
      }
    }

    for (const [id, definition] of this.commands) {
      if (definition.moduleId === moduleId) {
        this.commands.delete(id);
        changed = true;
      }
    }

    for (const [id, definition] of this.queries) {
      if (definition.moduleId === moduleId) {
        this.queries.delete(id);
        changed = true;
      }
    }

    if (changed && notify) {
      this.notify();
    }

    return changed;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const capabilityRegistry =
  new CapabilityRegistry();