import type { HostEventMessage } from '../events/HostMessage';
import type { OverlayDefinition } from './OverlayDefinition';
import { capabilityRegistry } from '../capabilities/CapabilityRegistry';

type Subscribe =
  (
    type: string,
    handler: (message: HostEventMessage) => void
  ) => () => void;

export class OverlayRegistry
{
  private overlays = new Map<string, OverlayDefinition>();

  register(overlay: OverlayDefinition): void
  {
    this.overlays.set(overlay.id, overlay);
  }

  get(id: string): OverlayDefinition | undefined
  {
    return this.overlays.get(id);
  }

  getAll(): OverlayDefinition[]
  {
    return Array.from(this.overlays.values());
  }

  registerCapabilities(): () => void
{
  const registeredIds: string[] = [];

  for (const overlay of this.overlays.values())
  {
    const capabilities =
      overlay.capabilities;

    if (!capabilities)
    {
      continue;
    }

    const providerId =
      `overlay:${overlay.id}`;

    capabilityRegistry.registerModule({
      moduleId: providerId,
      moduleName: overlay.name,

      events:
        capabilities.events,

      commands:
        capabilities.commands,

      queries:
        capabilities.queries,
    });

    registeredIds.push(providerId);
  }

  return () =>
  {
    for (const providerId of registeredIds)
    {
      capabilityRegistry.unregisterModule(
        providerId
      );
    }
  };
}

  subscribeEvents(subscribe: Subscribe): () => void
  {
    const unsubscribers: (() => void)[] = [];

    for (const overlay of this.overlays.values())
    {
      for (const event of overlay.events ?? [])
      {
        unsubscribers.push(
          subscribe(
            event.type,
            event.handle
          )
        );
      }
    }

    return () =>
    {
      for (const unsubscribe of unsubscribers)
      {
        unsubscribe();
      }
    };
  }
}