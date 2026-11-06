import {
  createDefaultCelestialSettings,
  type CelestialSettings,
} from './CelestialSettings';
import type { SimClockEra } from './SimClockSettings';
import type { CelestialCycle } from './CelestialSettings';
import {
  resolveCelestialCycle,
  type CelestialCycleStepResult,
} from './CelestialCycleStepper';
import type { SimulationTime } from './SimulationClockService';
import { resolveCelestialSeason } from './CelestialSeasonResolver';
import {
  resolveCelestialSolarState,
  type CelestialSolarState,
} from './CelestialSolarResolver';
import { celestialMarkerRegistry } from './CelestialMarkers';
import { resolveNextCelestialMarker } from './CelestialMarkerResolver';

type CelestialListener = (
  settings: CelestialSettings
) => void;

export class CelestialService
{
  private settings: CelestialSettings =
    createDefaultCelestialSettings();

  private listeners = new Set<CelestialListener>();

  constructor()
  {
    this.synchronizeMarkers();
  }

  getSettings(): CelestialSettings
  {
    return structuredClone(this.settings);
  }

  getCycleAtTime(
    cycle: CelestialCycle,
    time: SimulationTime,
    era: SimClockEra
  ): CelestialCycleStepResult
  {
    return resolveCelestialCycle(
      cycle,
      time,
      era
    );
  }

  getSeasonAtTime(
    time: SimulationTime,
    era: SimClockEra
  ): string | undefined
  {
    return resolveCelestialSeason(
        time,
        era,
        this.settings.seasonStarts
    );
  }

  getSolarStateAtTime(
    time: SimulationTime,
    era: SimClockEra
  ): CelestialSolarState
  {
    return resolveCelestialSolarState(
        time,
        era,
        this.settings.solarCycle
    );
  }

  resolveMarker(
  markerId: string,
  afterTime: SimulationTime,
  era: SimClockEra
): SimulationTime | undefined
{
  const marker =
    celestialMarkerRegistry.getMarker(
      markerId
    );

  if (!marker)
  {
    return undefined;
  }

  if (marker.lifetime === 'temporary')
  {
    const targetTime =
      marker.targetTime;

    if (
      targetTime === undefined ||
      targetTime <= afterTime
    )
    {
      return undefined;
    }

    return targetTime;
  }

  return resolveNextCelestialMarker(
    marker.id,
    afterTime,
    era,
    this.settings.solarCycle
  );
}

  setSettings(
    settings: CelestialSettings
  ): void
  {
    this.settings =
      structuredClone(settings);

    this.notify();
  }

restoreWorldState(
  settings?: CelestialSettings
): void
{
  const defaults = createDefaultCelestialSettings();

  type LegacySolarCycle = {
    summerSolstice?: {
      monthId: string;
      day: number;
    };

    winterSolstice?: {
      monthId: string;
      day: number;
    };

    longestDayHours?: number;
    shortestDayHours?: number;
  };

  const savedCycle = settings?.solarCycle;

  const legacyCycle =
    savedCycle as
      (typeof savedCycle & LegacySolarCycle)
      | undefined;

  const shortSolstice = {
    ...defaults.solarCycle.shortSolstice,

    monthId:
      savedCycle?.shortSolstice?.monthId ??
      legacyCycle?.winterSolstice?.monthId ??
      defaults.solarCycle.shortSolstice.monthId,

    day:
      savedCycle?.shortSolstice?.day ??
      legacyCycle?.winterSolstice?.day ??
      defaults.solarCycle.shortSolstice.day,

    daylightMinutes:
      savedCycle?.shortSolstice?.daylightMinutes ??
      (
        legacyCycle?.shortestDayHours !== undefined
          ? legacyCycle.shortestDayHours * 60
          : defaults.solarCycle.shortSolstice.daylightMinutes
      ),
  };

  const longSolstice = {
    ...defaults.solarCycle.longSolstice,

    monthId:
      savedCycle?.longSolstice?.monthId ??
      legacyCycle?.summerSolstice?.monthId ??
      defaults.solarCycle.longSolstice.monthId,

    day:
      savedCycle?.longSolstice?.day ??
      legacyCycle?.summerSolstice?.day ??
      defaults.solarCycle.longSolstice.day,

    daylightMinutes:
      savedCycle?.longSolstice?.daylightMinutes ??
      (
        legacyCycle?.longestDayHours !== undefined
          ? legacyCycle.longestDayHours * 60
          : defaults.solarCycle.longSolstice.daylightMinutes
      ),
  };

  this.settings = {
    ...defaults,
    ...structuredClone(settings ?? {}),

    sun: {
      ...defaults.sun,
      ...settings?.sun,
    },

    solarCycle: {
      shortSolstice,
      longSolstice,
    },

    seasonStarts:
      settings?.seasonStarts?.length
        ? structuredClone(settings.seasonStarts)
        : defaults.seasonStarts,

    moons:
      settings?.moons !== undefined
        ? structuredClone(settings.moons)
        : defaults.moons,
    
    zodiacs:
      settings?.zodiacs !== undefined
        ? structuredClone(settings.zodiacs)
        : defaults.zodiacs,
  };

  celestialMarkerRegistry.clear();
  this.notify();
}

  subscribe(
    listener: CelestialListener
  ): () => void
  {
    this.listeners.add(listener);

    return () =>
    {
      this.listeners.delete(listener);
    };
  }

  private synchronizeMarkers(): void
{
  const recurringMarkers = [
    {
      id: 'sunrise',
      name: 'Sunrise',
      bodyId: this.settings.sun.id,
    },
    {
      id: 'solar-noon',
      name: 'Solar Noon',
      bodyId: this.settings.sun.id,
    },
    {
      id: 'sunset',
      name: 'Sunset',
      bodyId: this.settings.sun.id,
    },
    {
      id: 'midnight',
      name: 'Midnight',
      bodyId: null,
    },
  ];

  for (const marker of recurringMarkers)
  {
    celestialMarkerRegistry.register({
      ...marker,
      lifetime: 'recurring',
    });
  }
}

private notify(): void
{
  this.synchronizeMarkers();

  for (const listener of this.listeners)
  {
    listener(
      this.getSettings()
    );
  }
}
}

export const celestialService =
  new CelestialService();
