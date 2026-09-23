import type {
  CommandDefinition,
  EventDefinition,
  HostRequestMessage,
  QueryDefinition,
} from '@settingforge/module-sdk';

import {
  hostEventBroker,
} from '../events/HostEventBroker';

import {
  moduleRegistry,
} from '../modules/registry';

import {
  capabilityRegistry,
} from './CapabilityRegistry';

type RegisterRequestHandler = (
  type: string,
  handler: (
    message: HostRequestMessage
  ) => Promise<unknown>
) => () => void;

interface CapabilityRegistrationPayload {
  events?: EventDefinition[];
  commands?: CommandDefinition[];
  queries?: QueryDefinition[];
}

function readDefinitions(
  payload: unknown
): CapabilityRegistrationPayload {
  if (
    !payload ||
    typeof payload !== 'object'
  ) {
    throw new Error(
      'Capability registration payload is missing.'
    );
  }

  const registration =
    payload as CapabilityRegistrationPayload;

  for (
    const [kind, definitions]
    of [
      ['events', registration.events],
      ['commands', registration.commands],
      ['queries', registration.queries],
    ] as const
  ) {
    if (
      definitions !== undefined &&
      !Array.isArray(definitions)
    ) {
      throw new Error(
        `Capability registration "${kind}" must be an array.`
      );
    }

    for (const definition of definitions ?? []) {
      if (
        !definition ||
        typeof definition !== 'object' ||
        typeof definition.id !== 'string' ||
        !definition.id ||
        typeof definition.label !== 'string' ||
        !definition.label
      ) {
        throw new Error(
          `Capability registration contains an invalid ${kind} definition.`
        );
      }
    }
  }

  return registration;
}

export function sendCapabilityCatalogTo(
  moduleId: string
): boolean {
  return hostEventBroker.sendToModule(
    moduleId,
    'capabilities.updated',
    {
      events:
        capabilityRegistry.getEvents(),
      commands:
        capabilityRegistry.getCommands(),
      queries:
        capabilityRegistry.getQueries(),
    }
  );
}

export function registerCapabilityHostService(
  registerRequestHandler: RegisterRequestHandler
): () => void {
  const unregisterRequest =
    registerRequestHandler(
      'capabilities.register',
      async (request) => {
        const module =
          moduleRegistry.get(
            request.sourceModuleId
          );

        if (!module) {
          throw new Error(
            `Module "${request.sourceModuleId}" is not registered.`
          );
        }

        const registration =
          readDefinitions(request.payload);

        capabilityRegistry.registerModule({
          moduleId: module.id,
          moduleName: module.name,
          events: registration.events,
          commands: registration.commands,
          queries: registration.queries,
        });

        return {
          registered: true,
        };
      }
    );

  const unsubscribe =
    capabilityRegistry.subscribe(() => {
      hostEventBroker.broadcast(
        'capabilities.updated',
        {
          events:
            capabilityRegistry.getEvents(),
          commands:
            capabilityRegistry.getCommands(),
          queries:
            capabilityRegistry.getQueries(),
        }
      );
    });

  return () => {
    unsubscribe();
    unregisterRequest();
  };
}