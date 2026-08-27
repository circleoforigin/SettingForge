import type {
  ModuleDefinition,
} from './ModuleDefinition';

import {
  moduleRegistry,
} from './registry';

import {
  hostEventBroker,
} from '../events/HostEventBroker';

export type ModulePresenceState =
  | 'enabled'
  | 'starting'
  | 'ready'
  | 'stopped';

export interface ModuleCapabilitySet {
  events?: string[];
  actions?: string[];
}

export interface ModulePresence {
  id: string;
  name: string;
  version: string;
  state: ModulePresenceState;
  capabilities: ModuleCapabilitySet;
}

export class ModulePresenceService {
  private readonly modules =
    new Map<string, ModulePresence>();

  enableModule(
    moduleId: string
  ): ModulePresence {
    const definition =
      this.requireModule(
        moduleId
      );

    const presence: ModulePresence = {
      id:
        definition.id,

      name:
        definition.name,

      version:
        definition.version,

      state:
        'starting',

      capabilities: {
        events:
          definition.events.map(
            (event) =>
              event.type
          ),

        actions:
          [],
      },
    };

    this.modules.set(
      moduleId,
      presence
    );

    hostEventBroker.broadcast(
      'module.added',
      {
        module:
          presence,
      }
    );

    return presence;
  }

  markReady(
    moduleId: string,
    capabilities?: ModuleCapabilitySet
  ): ModulePresence {
    const existing =
      this.modules.get(
        moduleId
      );

    const definition =
      this.requireModule(
        moduleId
      );

    const presence: ModulePresence = {
      id:
        definition.id,

      name:
        definition.name,

      version:
        definition.version,

      state:
        'ready',

      capabilities: {
        events:
          capabilities?.events ??
          existing?.capabilities.events ??
          definition.events.map(
            (event) =>
              event.type
          ),

        actions:
          capabilities?.actions ??
          existing?.capabilities.actions ??
          [],
      },
    };

    this.modules.set(
      moduleId,
      presence
    );

    hostEventBroker.broadcast(
      'module.ready',
      {
        module:
          presence,
      }
    );

    return presence;
  }

  removeModule(
    moduleId: string
  ): void {
    const existing =
      this.modules.get(
        moduleId
      );

    if (!existing) {
      return;
    }

    this.modules.delete(
      moduleId
    );

    hostEventBroker.broadcast(
      'module.removed',
      {
        module:
          existing,
      }
    );
  }

  markStopped(
    moduleId: string
  ): void {
    const existing =
      this.modules.get(
        moduleId
      );

    if (!existing) {
      return;
    }

    const stopped: ModulePresence = {
      ...existing,
      state:
        'stopped',
    };

    this.modules.set(
      moduleId,
      stopped
    );

    hostEventBroker.broadcast(
      'module.stopped',
      {
        module:
          stopped,
      }
    );
  }

  sendSnapshotTo(
    moduleId: string
  ): boolean {
    return hostEventBroker
      .sendToModule(
        moduleId,
        'modules.snapshot',
        {
          modules:
            this.getActiveModules(),
        }
      );
  }

  getActiveModules(): ModulePresence[] {
    return Array.from(
      this.modules.values()
    ).filter(
      (module) =>
        module.state !==
        'stopped'
    );
  }

  get(
    moduleId: string
  ): ModulePresence | undefined {
    return this.modules.get(
      moduleId
    );
  }

  private requireModule(
    moduleId: string
  ): ModuleDefinition {
    const definition =
      moduleRegistry.get(
        moduleId
      );

    if (!definition) {
      throw new Error(
        `Module "${moduleId}" is not registered.`
      );
    }

    return definition;
  }
}

export const modulePresenceService =
  new ModulePresenceService();