import type {
  CelestialMarker,
} from '../../simulation/CelestialMarkers';

type Listener = (
  markers: CelestialMarker[]
) => void;

class SimClockMarkerState
{
  private markers: CelestialMarker[] = [];

  private listeners = new Set<Listener>();

  getMarkers(): CelestialMarker[]
  {
    return structuredClone(this.markers);
  }

  setMarkers(
    markers: CelestialMarker[]
  ): void
  {
    this.markers = structuredClone(markers);

    for (const listener of this.listeners)
    {
      listener(this.getMarkers());
    }
  }

  subscribe(
    listener: Listener
  ): () => void
  {
    this.listeners.add(listener);

    return () =>
    {
      this.listeners.delete(listener);
    };
  }
}

export const simClockMarkerState =
  new SimClockMarkerState();