import type {
  HostEventMessage,
  RegisteredEventDefinition,
} from '@settingforge/module-sdk';

function cloneMessage(
  message: HostEventMessage
): HostEventMessage {
  return structuredClone(
    message
  );
}

function stateKey(
  sourceModuleId: string,
  type: string
): string {
  return (
    `${sourceModuleId}\u0000${type}`
  );
}

export class EventStateStore {
  private readonly states =
    new Map<
      string,
      HostEventMessage
    >();

  retain(
    message: HostEventMessage
  ): void {
    this.states.set(
      stateKey(
        message.sourceModuleId,
        message.type
      ),
      cloneMessage(
        message
      )
    );
  }

  synchronize(
    events:
      RegisteredEventDefinition[]
  ): void {
    const stateEventKeys =
      new Set(
        events
          .filter(
            (event) =>
              event.delivery ===
              'state'
          )
          .map(
            (event) =>
              stateKey(
                event.moduleId,
                event.id
              )
          )
      );

    for (
      const key
      of this.states.keys()
    ) {
      if (
        !stateEventKeys.has(
          key
        )
      ) {
        this.states.delete(
          key
        );
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
        (left, right) => {
          const typeOrder =
            left.type.localeCompare(
              right.type
            );

          if (
            typeOrder !== 0
          ) {
            return typeOrder;
          }

          return (
            left.sourceModuleId
              .localeCompare(
                right.sourceModuleId
              )
          );
        }
      )
      .map(
        cloneMessage
      );
  }
}

export const eventStateStore =
  new EventStateStore();