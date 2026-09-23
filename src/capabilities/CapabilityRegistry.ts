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

function cloneEvent(
  definition: RegisteredEventDefinition
): RegisteredEventDefinition {
  return {
    ...definition,
    fields:
      definition.fields?.map(
        (field) => ({
          ...field,
        })
      ),
  };
}

function cloneCommand(
  definition: RegisteredCommandDefinition
): RegisteredCommandDefinition {
  return {
    ...definition,
    input:
      definition.input?.map(
        (field) => ({
          ...field,
        })
      ),
    output:
      definition.output?.map(
        (field) => ({
          ...field,
        })
      ),
  };
}

function cloneQuery(
  definition: RegisteredQueryDefinition
): RegisteredQueryDefinition {
  return {
    ...definition,
    input:
      definition.input?.map(
        (field) => ({
          ...field,
        })
      ),
    output:
      definition.output?.map(
        (field) => ({
          ...field,
        })
      ),
  };
}

export class CapabilityRegistry {
  private readonly events =
    new Map<
      string,
      Map<
        string,
        RegisteredEventDefinition
      >
    >();

  private readonly commands =
    new Map<
      string,
      Map<
        string,
        RegisteredCommandDefinition
      >
    >();

  private readonly queries =
    new Map<
      string,
      Map<
        string,
        RegisteredQueryDefinition
      >
    >();

  private readonly listeners =
    new Set<CapabilityRegistryListener>();

  registerModule(
    registration:
      ModuleCapabilityRegistration
  ): void {
    this.validateRegistration(
      registration
    );

    this.removeModuleCapabilities(
      registration.moduleId,
      false
    );

    for (
      const definition
      of registration.events ?? []
    ) {
      this.setProvider(
        this.events,
        definition.id,
        registration.moduleId,
        {
          ...definition,
          fields:
            definition.fields?.map(
              (field) => ({
                ...field,
              })
            ),
          moduleId:
            registration.moduleId,
          moduleName:
            registration.moduleName,
        }
      );
    }

    for (
      const definition
      of registration.commands ?? []
    ) {
      this.setProvider(
        this.commands,
        definition.id,
        registration.moduleId,
        {
          ...definition,
          input:
            definition.input?.map(
              (field) => ({
                ...field,
              })
            ),
          output:
            definition.output?.map(
              (field) => ({
                ...field,
              })
            ),
          moduleId:
            registration.moduleId,
          moduleName:
            registration.moduleName,
        }
      );
    }

    for (
      const definition
      of registration.queries ?? []
    ) {
      this.setProvider(
        this.queries,
        definition.id,
        registration.moduleId,
        {
          ...definition,
          input:
            definition.input?.map(
              (field) => ({
                ...field,
              })
            ),
          output:
            definition.output?.map(
              (field) => ({
                ...field,
              })
            ),
          moduleId:
            registration.moduleId,
          moduleName:
            registration.moduleName,
        }
      );
    }

    this.notify();
  }

  getEvent(
    id: string,
    moduleId?: string
  ): RegisteredEventDefinition | undefined {
    const definition =
      this.getProvider(
        this.events,
        id,
        moduleId
      );

    return definition
      ? cloneEvent(definition)
      : undefined;
  }

  getCommand(
    id: string,
    moduleId?: string
  ): RegisteredCommandDefinition | undefined {
    const definition =
      this.getProvider(
        this.commands,
        id,
        moduleId
      );

    return definition
      ? cloneCommand(definition)
      : undefined;
  }

  getQuery(
    id: string,
    moduleId?: string
  ): RegisteredQueryDefinition | undefined {
    const definition =
      this.getProvider(
        this.queries,
        id,
        moduleId
      );

    return definition
      ? cloneQuery(definition)
      : undefined;
  }

  getEventProviders(
    id: string
  ): RegisteredEventDefinition[] {
    return Array.from(
      this.events.get(id)?.values() ?? []
    )
      .map(cloneEvent)
      .sort(
        (left, right) =>
          left.moduleId.localeCompare(
            right.moduleId
          )
      );
  }

  getCommandProviders(
    id: string
  ): RegisteredCommandDefinition[] {
    return Array.from(
      this.commands.get(id)?.values() ?? []
    )
      .map(cloneCommand)
      .sort(
        (left, right) =>
          left.moduleId.localeCompare(
            right.moduleId
          )
      );
  }

  getQueryProviders(
    id: string
  ): RegisteredQueryDefinition[] {
    return Array.from(
      this.queries.get(id)?.values() ?? []
    )
      .map(cloneQuery)
      .sort(
        (left, right) =>
          left.moduleId.localeCompare(
            right.moduleId
          )
      );
  }

  getEvents():
    RegisteredEventDefinition[] {
    return this.flatten(
      this.events
    )
      .map(cloneEvent)
      .sort(this.compareCapabilities);
  }

  getCommands():
    RegisteredCommandDefinition[] {
    return this.flatten(
      this.commands
    )
      .map(cloneCommand)
      .sort(this.compareCapabilities);
  }

  getQueries():
    RegisteredQueryDefinition[] {
    return this.flatten(
      this.queries
    )
      .map(cloneQuery)
      .sort(this.compareCapabilities);
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
    registration:
      ModuleCapabilityRegistration
  ): void {
    const incoming =
      new Map<
        string,
        'event' | 'command' | 'query'
      >();

    const validate = (
      id: string,
      kind:
        | 'event'
        | 'command'
        | 'query'
    ) => {
      if (!id) {
        throw new Error(
          `Module "${registration.moduleId}" registered a ${kind} without an ID.`
        );
      }

      const incomingKind =
        incoming.get(id);

      if (incomingKind) {
        throw new Error(
          `Capability "${id}" is registered as both ${incomingKind} and ${kind}.`
        );
      }

      incoming.set(
        id,
        kind
      );

      const otherKind =
        kind === 'event'
          ? (
              this.commands.has(id) ||
              this.queries.has(id)
            )
          : kind === 'command'
            ? (
                this.events.has(id) ||
                this.queries.has(id)
              )
            : (
                this.events.has(id) ||
                this.commands.has(id)
              );

      if (otherKind) {
        throw new Error(
          `Capability "${id}" is already registered as a different capability kind.`
        );
      }
    };

    for (
      const definition
      of registration.events ?? []
    ) {
      validate(
        definition.id,
        'event'
      );
    }

    for (
      const definition
      of registration.commands ?? []
    ) {
      validate(
        definition.id,
        'command'
      );
    }

    for (
      const definition
      of registration.queries ?? []
    ) {
      validate(
        definition.id,
        'query'
      );
    }
  }

  private setProvider<T>(
    registry:
      Map<string, Map<string, T>>,
    capabilityId: string,
    moduleId: string,
    definition: T
  ): void {
    let providers =
      registry.get(capabilityId);

    if (!providers) {
      providers =
        new Map<string, T>();

      registry.set(
        capabilityId,
        providers
      );
    }

    providers.set(
      moduleId,
      definition
    );
  }

  private getProvider<T>(
    registry:
      Map<string, Map<string, T>>,
    capabilityId: string,
    moduleId?: string
  ): T | undefined {
    const providers =
      registry.get(capabilityId);

    if (!providers) {
      return undefined;
    }

    if (moduleId) {
      return providers.get(moduleId);
    }

    return providers
      .values()
      .next()
      .value;
  }

  private flatten<T>(
    registry:
      Map<string, Map<string, T>>
  ): T[] {
    const definitions: T[] = [];

    for (
      const providers
      of registry.values()
    ) {
      definitions.push(
        ...providers.values()
      );
    }

    return definitions;
  }

  private removeModuleCapabilities(
    moduleId: string,
    notify: boolean
  ): boolean {
    let changed = false;

    changed =
      this.removeProvider(
        this.events,
        moduleId
      ) || changed;

    changed =
      this.removeProvider(
        this.commands,
        moduleId
      ) || changed;

    changed =
      this.removeProvider(
        this.queries,
        moduleId
      ) || changed;

    if (
      changed &&
      notify
    ) {
      this.notify();
    }

    return changed;
  }

  private removeProvider<T>(
    registry:
      Map<string, Map<string, T>>,
    moduleId: string
  ): boolean {
    let changed = false;

    for (
      const [
        capabilityId,
        providers,
      ]
      of registry
    ) {
      if (
        providers.delete(moduleId)
      ) {
        changed = true;
      }

      if (
        providers.size === 0
      ) {
        registry.delete(
          capabilityId
        );
      }
    }

    return changed;
  }

  private compareCapabilities<
    T extends {
      id: string;
      moduleId: string;
    }
  >(
    left: T,
    right: T
  ): number {
    const idComparison =
      left.id.localeCompare(
        right.id
      );

    if (idComparison !== 0) {
      return idComparison;
    }

    return left.moduleId.localeCompare(
      right.moduleId
    );
  }

  private notify(): void {
    for (
      const listener
      of this.listeners
    ) {
      listener();
    }
  }
}

export const capabilityRegistry =
  new CapabilityRegistry();