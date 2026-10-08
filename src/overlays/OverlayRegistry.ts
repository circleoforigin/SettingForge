import type { HostEventMessage } from '../events/HostMessage';
import type { OverlayDefinition } from './OverlayDefinition';

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