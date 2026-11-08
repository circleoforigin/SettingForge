
import type {
  CelestialMoon,
  CelestialPhaseCycle,
  CelestialPhaseTag,
  CelestialPhaseTagEntry,
  CelestialEclipsePhaseReference,
} from './CelestialSettings';

export interface ResolvedEclipsePhase {
  cycle: CelestialPhaseCycle;
  tag: CelestialPhaseTag;
  entry: CelestialPhaseTagEntry;
}

export function resolveEclipsePhaseReference(
  moon: CelestialMoon,
  reference: CelestialEclipsePhaseReference | undefined
): ResolvedEclipsePhase | null {
  if (!reference) {
    return null;
  }

  const cycle = moon.phaseCycles.find(
    candidate => candidate.id === reference.cycleId
  );

  if (!cycle) {
    return null;
  }

  const tag = cycle.tags.find(
    candidate => candidate.id === reference.tagId
  );

  if (!tag) {
    return null;
  }

  const entry = tag.entries.find(
    candidate => candidate.id === reference.entryId
  );

  if (!entry) {
    return null;
  }

  return {
    cycle,
    tag,
    entry,
  };
}

export function canMoonProduceSolarEclipse(
  moon: CelestialMoon
): boolean {
  if (moon.lunarDay === 0) {
    return true;
  }

  return resolveEclipsePhaseReference(
    moon,
    moon.eclipseSettings?.newPhase
  ) !== null;
}

export function canMoonProduceLunarEclipse(
  moon: CelestialMoon
): boolean {
  if (moon.lunarDay === 0) {
    return false;
  }

  return resolveEclipsePhaseReference(
    moon,
    moon.eclipseSettings?.fullPhase
  ) !== null;
}
