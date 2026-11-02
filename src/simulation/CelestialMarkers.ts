import type {
  SimulationTime,
} from './SimulationClockService';

export type CelestialMarkerLifetime =
  | 'recurring'
  | 'temporary';

export interface CelestialMarker
{
  id: string;

  /**
   * User-facing name, such as:
   * Sunrise, Selune Rise, Three Moons Aligned.
   */
  name: string;

  /**
   * Identifies the originating celestial body,
   * or null for calendar and multi-body events.
   */
  bodyId: string | null;

  /**
   * Recurring markers are calculated dynamically.
   * Temporary markers represent one specific event.
   */
  lifetime: CelestialMarkerLifetime;

  /**
   * The resolved timestamp for temporary markers.
   * Recurring markers do not store a target time.
   */
  targetTime?: SimulationTime;
}

type CelestialMarkerListener = (
  markers: CelestialMarker[]
) => void;

export class CelestialMarkerRegistry
{
  private markers =
    new Map<string, CelestialMarker>();

  private listeners =
    new Set<CelestialMarkerListener>();

  getMarkers(): CelestialMarker[]
  {
    return Array.from(
      this.markers.values()
    ).map(
      (marker) => structuredClone(marker)
    );
  }

  getMarker(
    markerId: string
  ): CelestialMarker | undefined
  {
    const marker =
      this.markers.get(markerId);

    return marker
      ? structuredClone(marker)
      : undefined;
  }

  register(
    marker: CelestialMarker
  ): void
  {
    this.markers.set(
      marker.id,
      structuredClone(marker)
    );

    this.notify();
  }

  unregister(
    markerId: string
  ): void
  {
    if (!this.markers.delete(markerId))
    {
      return;
    }

    this.notify();
  }

  expireTemporaryMarkers(
    exceptMarkerId?: string
  ): void
  {
    let changed = false;

    for (
      const [id, marker]
      of this.markers
    )
    {
      if (
        marker.lifetime !== 'temporary' ||
        id === exceptMarkerId
      )
      {
        continue;
      }

      this.markers.delete(id);
      changed = true;
    }

    if (changed)
    {
      this.notify();
    }
  }

  clear(): void
  {
    if (this.markers.size === 0)
    {
      return;
    }

    this.markers.clear();
    this.notify();
  }

  subscribe(
    listener: CelestialMarkerListener
  ): () => void
  {
    this.listeners.add(listener);

    return () =>
    {
      this.listeners.delete(listener);
    };
  }

  private notify(): void
  {
    const markers =
      this.getMarkers();

    for (const listener of this.listeners)
    {
      listener(markers);
    }
  }
}

export const celestialMarkerRegistry =
  new CelestialMarkerRegistry();