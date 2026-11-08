import {
  createDefaultCelestialSettings,
  type CelestialSettings,
  type CelestialNotable,
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
import {
  prospectCelestialEclipses,
  type CelestialEclipsePrediction,
} from './CelestialPositionResolver';
import { DEFAULT_ECLIPSE_OPTIONS } from './CelestialDefaults';
import {
  prospectCelestialConjunctions,
  type CelestialConjunctionPrediction,
} from './CelestialPositionResolver';

type CelestialListener = (
  settings: CelestialSettings
) => void;

export class CelestialService
{
  private settings: CelestialSettings =
    createDefaultCelestialSettings();

  private listeners = new Set<CelestialListener>();

  private conjunctionPredictions:
    CelestialConjunctionPrediction[] = [];

  private conjunctionCoverageStart = Infinity;
  private conjunctionCoverageEnd = -Infinity;

  private eclipsePredictions:
    CelestialEclipsePrediction[] = [];

  private eclipseCoverageEnd = -Infinity;
  private eclipseCoverageStart = Infinity;

private resetEclipsePredictions(): void {
  this.eclipsePredictions = [];
  this.eclipseCoverageEnd = -Infinity;
  this.eclipseCoverageStart = Infinity;
  this.conjunctionPredictions = [];
  this.conjunctionCoverageStart = Infinity;
  this.conjunctionCoverageEnd = -Infinity;
}

getUpcomingConjunctions(
  currentTime: number,
  era: SimClockEra
): CelestialConjunctionPrediction[] {
  if (!Number.isFinite(currentTime)) {
    return [];
  }

  const day =
    era.secondsPerMinute *
    era.minutesPerHour *
    era.hoursPerDay;

  if (!Number.isFinite(day) || day <= 0) {
    return [];
  }

  if (
    currentTime < this.conjunctionCoverageStart ||
    currentTime >= this.conjunctionCoverageEnd
  ) {
    this.conjunctionPredictions = [];
    this.conjunctionCoverageStart = currentTime;
    this.conjunctionCoverageEnd = currentTime;
  }

  // Extend the search until five future
  // conjunctions have been found.
  for (let attempt = 0; attempt < 100; attempt++) {
    const upcoming =
      this.conjunctionPredictions.filter(
        prediction => prediction.time > currentTime
      );

    if (upcoming.length >= 5) {
      break;
    }

    const nextEnd =
      this.conjunctionCoverageEnd + day * 365;

    const generated =
      prospectCelestialConjunctions(
        this.conjunctionCoverageEnd,
        nextEnd,
        this.settings,
        era
      );

    this.conjunctionPredictions.push(...generated);
    this.conjunctionCoverageEnd = nextEnd;
  }

  this.conjunctionPredictions =
    this.conjunctionPredictions
      .filter(
        prediction => prediction.time > currentTime
      )
      .sort(
        (a, b) =>
          a.time - b.time ||
          a.id.localeCompare(b.id)
      );

  return this.conjunctionPredictions.slice(0, 5);
}

getEclipsePredictions(
  startTime: number,
  endTime: number,
  era: SimClockEra
): CelestialEclipsePrediction[] {
  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime <= startTime
  ) {
    return [];
  }

  // Keep active eclipses until their final contact.
  this.eclipsePredictions =
    this.eclipsePredictions.filter(
      prediction =>
        prediction.endTime > startTime
    );

  const day =
    era.secondsPerMinute *
    era.minutesPerHour *
    era.hoursPerDay;

  if (!Number.isFinite(day) || day <= 0) {
    return [];
  }

  // Expand in yearly chunks until five predictions
  // are cached or the requested range is covered.
  const chunk = day * 365;
const maximumEclipseDuration = Math.max(
  ...Object.values(
    DEFAULT_ECLIPSE_OPTIONS.durations
  ).map(range => range.maximum)
);

const lookback = Math.max(
  day,
  maximumEclipseDuration
);

const requiredStart = startTime - lookback;

if (
  requiredStart < this.eclipseCoverageStart ||
  startTime >= this.eclipseCoverageEnd
) {
  this.eclipsePredictions = [];
  this.eclipseCoverageStart = requiredStart;
  this.eclipseCoverageEnd = requiredStart;
}

let cursor = this.eclipseCoverageEnd;

  for (let attempt = 0; attempt < 100; attempt++) {
    const futureCount =
      this.eclipsePredictions.filter(
        prediction =>
          prediction.startTime > startTime
      ).length;

    if (
      cursor >= endTime &&
      futureCount >= 5
    ) {
      break;
    }

    const nextEnd = cursor + chunk;

    const generated = prospectCelestialEclipses(
      cursor,
      nextEnd,
      this.settings,
      era,
      DEFAULT_ECLIPSE_OPTIONS
    );

    const existingIds = new Set(
      this.eclipsePredictions.map(
        prediction => prediction.id
      )
    );

    for (const prediction of generated) {
      if (
        prediction.endTime > startTime &&
        !existingIds.has(prediction.id)
      ) {
        this.eclipsePredictions.push(prediction);
        existingIds.add(prediction.id);
      }
    }

    cursor = nextEnd;
  }

  this.eclipseCoverageEnd = cursor;

  this.eclipsePredictions.sort(
    (a, b) =>
      a.startTime - b.startTime ||
      a.id.localeCompare(b.id)
  );

  return this.eclipsePredictions.filter(
    prediction =>
      prediction.endTime > startTime &&
      prediction.startTime <= endTime
  );
}
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
    this.settings = structuredClone(settings);
    this.resetEclipsePredictions();
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

  const restoredMoons =
    structuredClone(
      settings?.moons ?? defaults.moons
    );

  const restoredZodiacs =
    structuredClone(
      settings?.zodiacs ?? defaults.zodiacs
    );

  const migratedNotables: CelestialNotable[] = [];

  const migrateCycles = (
    bodyId: string,
    cycles: typeof restoredMoons[number]['phaseCycles']
  ): void =>
  {
    for (const cycle of cycles)
    {
      for (const notable of cycle.notables ?? [])
      {
        migratedNotables.push({
          id: `${bodyId}:${cycle.id}:${notable.id}`,
          name: notable.name,

          conditions: notable.conditions.map(
            condition => ({
              bodyId,
              cycleId: cycle.id,
              tagId: condition.tagId,
              value: condition.value,
            })
          ),
        });
      }

      delete cycle.notables;
    }
  };

  for (const moon of restoredMoons)
  {
    migrateCycles(moon.id, moon.phaseCycles);
  }

  for (const zodiac of restoredZodiacs)
  {
    migrateCycles(zodiac.id, zodiac.cycles);
  }

   const globalNotables = [
    ...structuredClone(
      settings?.notables ??
      (
        migratedNotables.length > 0
          ? []
          : defaults.notables
      )
    ),
    ...migratedNotables,
  ];

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

    moons: restoredMoons,
    zodiacs: restoredZodiacs,
    notables: globalNotables,
  };

  celestialMarkerRegistry.clear();
  this.resetEclipsePredictions();
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

getUpcomingEclipses(
  currentTime: number,
  era: SimClockEra
): CelestialEclipsePrediction[] {
  const day =
    era.secondsPerMinute *
    era.minutesPerHour *
    era.hoursPerDay;

  const predictions =
    this.getEclipsePredictions(
      currentTime,
      currentTime + day,
      era
    );

  return predictions
    .filter(
      prediction =>
        prediction.endTime > currentTime
    )
    .sort(
      (a, b) =>
        a.startTime - b.startTime ||
        a.id.localeCompare(b.id)
    )
    .slice(0, 5);
}

}


export const celestialService = new CelestialService();
