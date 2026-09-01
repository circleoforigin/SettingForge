import type { RegisteredActionDefinition } from '@settingforge/module-sdk';
import type { HostEventMessage } from '../events/HostMessage';

function cloneMessage(message: HostEventMessage): HostEventMessage {
  return structuredClone(message);
}

export class ActionStateStore {
  private readonly states = new Map<string, HostEventMessage>();

  retain(message: HostEventMessage): void {
    this.states.set(message.type, cloneMessage(message));
  }

  synchronize(actions: RegisteredActionDefinition[]): void {
    const stateActionIds = new Set(
      actions
        .filter((action) => action.delivery === 'state')
        .map((action) => action.id)
    );

    for (const actionId of this.states.keys()) {
      if (!stateActionIds.has(actionId)) this.states.delete(actionId);
    }
  }

  getForModule(moduleId: string): HostEventMessage[] {
    return Array.from(this.states.values())
      .filter((message) => message.sourceModuleId !== moduleId)
      .sort((left, right) => left.type.localeCompare(right.type))
      .map(cloneMessage);
  }
}

export const actionStateStore = new ActionStateStore();
