import type {
  ActionDefinition,
  ActionDelivery,
  ActionFieldDefinition,
  ActionFieldType,
} from '@settingforge/module-sdk';
import type { HostRequestMessage } from '../events/HostMessage';
import { hostEventBroker } from '../events/HostEventBroker';
import { moduleRegistry } from '../modules/registry';
import { actionRegistry } from './ActionRegistry';
import { actionStateStore } from './ActionStateStore';

type RegisterRequestHandler = (
  type: string,
  handler: (message: HostRequestMessage) => Promise<unknown>
) => () => void;

const ACTION_FIELD_TYPES = new Set<ActionFieldType>([
  'string',
  'number',
  'boolean',
]);

const ACTION_DELIVERIES = new Set<ActionDelivery>([
  'transient',
  'state',
]);

function readActionFields(
  actionId: string,
  value: unknown
): ActionFieldDefinition[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new Error(`Action "${actionId}" fields must be an array.`);
  }

  const keys = new Set<string>();
  return value.map((fieldValue) => {
    if (!fieldValue || typeof fieldValue !== 'object') {
      throw new Error(`Action "${actionId}" has an invalid field.`);
    }

    const field = fieldValue as Partial<ActionFieldDefinition>;
    if (typeof field.key !== 'string' || !field.key) {
      throw new Error(`Action "${actionId}" has a field without a key.`);
    }
    if (keys.has(field.key)) {
      throw new Error(
        `Action "${actionId}" registers field "${field.key}" twice.`
      );
    }
    keys.add(field.key);

    if (typeof field.label !== 'string' || !field.label) {
      throw new Error(
        `Action "${actionId}" field "${field.key}" requires a label.`
      );
    }
    if (!ACTION_FIELD_TYPES.has(field.type as ActionFieldType)) {
      throw new Error(
        `Action "${actionId}" field "${field.key}" has an invalid type.`
      );
    }

    return {
      key: field.key,
      label: field.label,
      type: field.type as ActionFieldType,
    };
  });
}

function readActionDefinitions(payload: unknown): ActionDefinition[] {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Action registration payload is missing.');
  }

  const actions = (payload as { actions?: unknown }).actions;
  if (!Array.isArray(actions)) {
    throw new Error('Action registration requires an actions array.');
  }

  return actions.map((value) => {
    if (!value || typeof value !== 'object') {
      throw new Error('Every Action definition must be an object.');
    }

    const action = value as Partial<ActionDefinition>;
    if (typeof action.id !== 'string' || !action.id) {
      throw new Error('Every Action requires an ID.');
    }
    if (typeof action.label !== 'string' || !action.label) {
      throw new Error(`Action "${action.id}" requires a label.`);
    }
    if (action.description !== undefined &&
        typeof action.description !== 'string') {
      throw new Error(`Action "${action.id}" has an invalid description.`);
    }
    if (action.delivery !== undefined &&
        !ACTION_DELIVERIES.has(action.delivery)) {
      throw new Error(`Action "${action.id}" has an invalid delivery.`);
    }

    return {
      id: action.id,
      label: action.label,
      description: action.description,
      fields: readActionFields(action.id, action.fields),
      delivery: action.delivery,
    };
  });
}

export function sendActionCatalogTo(moduleId: string): boolean {
  return hostEventBroker.sendToModule(moduleId, 'actions.updated', {
    actions: actionRegistry.getAll(),
  });
}

export function sendRetainedActionStateTo(moduleId: string): void {
  for (const message of actionStateStore.getForModule(moduleId)) {
    hostEventBroker.sendEventToModule(moduleId, message);
  }
}

export function registerActionHostService(
  registerRequestHandler: RegisterRequestHandler
): () => void {
  const unregisterRequest = registerRequestHandler(
    'actions.register',
    async (request) => {
      const module = moduleRegistry.get(request.sourceModuleId);
      if (!module) {
        throw new Error(
          `Module "${request.sourceModuleId}" is not registered.`
        );
      }

      actionRegistry.registerModuleActions(
        module.id,
        module.name,
        readActionDefinitions(request.payload)
      );
    }
  );

  const unsubscribe = actionRegistry.subscribe((actions) => {
    actionStateStore.synchronize(actions);
    hostEventBroker.broadcast('actions.updated', { actions });
  });

  return () => {
    unsubscribe();
    unregisterRequest();
  };
}
