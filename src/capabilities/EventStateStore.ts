import type {
  HostEventMessage,
  RegisteredEventDefinition,
} from '@settingforge/module-sdk';

function cloneMessage(
  message: HostEventMessage
): HostEventMessage {
  return structuredClone(message);
}

export class EventStateStore {
  private readonly states =
    new Map<string, HostEventMessage>();

  retain(
    message: HostEventMessage
  ): void {
    this.states.set(
      message.type,
      cloneMessage(message)
    );
  }

  synchronize(
    events: RegisteredEventDefinition[]
  ): void {
    const stateEventIds =
      new Set(
        events
          .filter(
            (event) =>
              event.delivery === 'state'
          )
          .map(
            (event) => event.id
          )
      );

    for (
      const eventId
      of this.states.keys()
    ) {
      if (
        !stateEventIds.has(eventId)
      ) {
        this.states.delete(eventId);
      }
    }
  }

  getForModule(
    moduleId: string
  ): HostEventMessage[] {
    return Array.from(
      this.states.values()
    )
      .filter(
        (message) =>
          message.sourceModuleId !==
          moduleId
      )
      .sort(
        (left, right) =>
          left.type.localeCompare(
            right.type
          )
      )
      .map(cloneMessage);
  }
}

export const eventStateStore =
  new EventStateStore();