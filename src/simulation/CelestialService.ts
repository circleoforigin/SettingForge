import {
  createDefaultCelestialSettings,
  type CelestialSettings,
  type CelestialNotable,
  type CelestialConjunctionCondition,
} from './CelestialSettings';
import type { SimClockEra } from './SimClockSettings';
import type { CelestialCycle } from './CelestialSettings';
import {
  resolveCelestialCycle,
  getCelestialCyclePeriod,
  getCelestialCalendarEntryStart,
  type CelestialCycleStepResult,
} from './CelestialCycleStepper';
import {
  simulationTimeToCalendar,
  calendarToSimulationTime,
  getMonthDays,
} from './SimCalendar';
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

export interface CelestialConjunctionInterval {
  id: string;
  conjunctionId: string;
  startTime: SimulationTime;
  endTime: SimulationTime;
}

export interface CelestialConjunctionTransition {
  id: string;
  conjunctionId: string;
  time: SimulationTime;
  kind: 'start' | 'end';
}

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

isConjunctionConditionSatisfied(
  condition: CelestialConjunctionCondition,
  time: SimulationTime,
  era: SimClockEra
): boolean {
  if (!Number.isFinite(time)) {
    return false;
  }

  // Sun conditions use the configured daylight cycle.
  if (condition.bodyId === this.settings.sun.id) {
    if (!condition.solarPhase) {
      return false;
    }

    const solar = this.getSolarStateAtTime(
      time,
      era
    );

    const calendar = simulationTimeToCalendar(
      time,
      era
    );

    const hour =
      calendar.hour +
      calendar.minute / era.minutesPerHour +
      calendar.second /
        (
          era.secondsPerMinute *
          era.minutesPerHour
        );

    const isDaytime =
      hour >= solar.sunriseHour &&
      hour < solar.sunsetHour;

    return condition.solarPhase === 'daytime'
      ? isDaytime
      : isDaytime === false;
  }

  // Resolve either a Moon or a Zodiac.
  const moon = this.settings.moons.find(
    body => body.id === condition.bodyId
  );

  const zodiac = this.settings.zodiacs.find(
    body => body.id === condition.bodyId
  );

  const cycles = moon
    ? moon.phaseCycles
    : zodiac?.cycles;

  if (!cycles) {
    return false;
  }

  if (
    !condition.cycleId ||
    !condition.tagId ||
    !condition.entryId
  ) {
    return false;
  }

  const cycle = cycles.find(
    item => item.id === condition.cycleId
  );

  if (!cycle) {
    return false;
  }

  const result = this.getCycleAtTime(
    cycle,
    time,
    era
  );

  return result.resolved.tags.some(
    tag =>
      tag.tagId === condition.tagId &&
      tag.entry.id === condition.entryId
  );
}

getNextDurationCycleBoundary(
  cycle: CelestialCycle,
  afterTime: SimulationTime
): SimulationTime | undefined {
  if (cycle.cycleMeasurement === 'calendar') {
    return undefined;
  }

  const period = getCelestialCyclePeriod(cycle);

  if (
    !period ||
    period.stepCount <= 0 ||
    !Number.isFinite(cycle.cycleDuration) ||
    cycle.cycleDuration <= 0 ||
    !Number.isFinite(cycle.cycleOffset)
  ) {
    return undefined;
  }

  const stepDuration =
    cycle.cycleDuration / period.stepCount;

  if (
    !Number.isFinite(stepDuration) ||
    stepDuration <= 0
  ) {
    return undefined;
  }

  const step = Math.floor(
    (afterTime + cycle.cycleOffset) /
      stepDuration
  );

  const nextBoundary =
    (step + 1) * stepDuration -
    cycle.cycleOffset;

  return nextBoundary > afterTime
    ? nextBoundary
    : undefined;
}

getNextCalendarCycleBoundary(
  cycle: CelestialCycle,
  afterTime: SimulationTime,
  era: SimClockEra
): SimulationTime | undefined {
  if (cycle.cycleMeasurement !== 'calendar') {
    return undefined;
  }

  if (!Number.isFinite(afterTime)) {
    return undefined;
  }

  const calendar = simulationTimeToCalendar(
    afterTime,
    era
  );

  let nextBoundary = Infinity;

  // Include the current and following year.
  for (
    const year of [
      calendar.year,
      calendar.year + 1,
    ]
  ) {
    for (const tag of cycle.tags) {
      for (const entry of tag.entries) {
        const month = era.months.find(
          item => item.id === entry.startMonthId
        );

        if (
          !month ||
          entry.startDay === undefined ||
          entry.startDay < 1 ||
          entry.startDay > getMonthDays(
            month,
            year,
            era
          )
        ) {
          continue;
        }

        const boundary =
          getCelestialCalendarEntryStart(
            entry,
            year,
            cycle.cycleOffset,
            era
          );

        if (
          boundary !== undefined &&
          boundary > afterTime &&
          boundary < nextBoundary
        ) {
          nextBoundary = boundary;
        }
      }
    }
  }

  return Number.isFinite(nextBoundary)
    ? nextBoundary
    : undefined;
}

getNextSolarConjunctionBoundary(
  afterTime: SimulationTime,
  era: SimClockEra
): SimulationTime | undefined {
  if (!Number.isFinite(afterTime)) {
    return undefined;
  }

  const daySeconds =
    era.secondsPerMinute *
    era.minutesPerHour *
    era.hoursPerDay;

  if (!Number.isFinite(daySeconds) || daySeconds <= 0) {
    return undefined;
  }

  const calendar = simulationTimeToCalendar(
    afterTime,
    era
  );

  const dayStart = calendarToSimulationTime(
    {
      year: calendar.year,
      monthId: calendar.monthId,
      day: calendar.day,
      hour: 0,
      minute: 0,
      second: 0,
    },
    era
  );

  let nextBoundary = Infinity;

  // Examine today's and tomorrow's solar transitions.
  for (const start of [
    dayStart,
    dayStart + daySeconds,
  ]) {
    const solar = this.getSolarStateAtTime(
      start,
      era
    );

    const secondsPerHour =
      era.secondsPerMinute *
      era.minutesPerHour;

    const sunrise =
      start + solar.sunriseHour * secondsPerHour;

    const sunset =
      start + solar.sunsetHour * secondsPerHour;

    for (const boundary of [sunrise, sunset]) {
      if (
        boundary > afterTime &&
        boundary < nextBoundary
      ) {
        nextBoundary = boundary;
      }
    }
  }

  return Number.isFinite(nextBoundary)
    ? nextBoundary
    : undefined;
}

getNextConjunctionConditionBoundary(
  condition: CelestialConjunctionCondition,
  afterTime: SimulationTime,
  era: SimClockEra
): SimulationTime | undefined {
  if (condition.bodyId === this.settings.sun.id) {
    if (!condition.solarPhase) {
      return undefined;
    }

    return this.getNextSolarConjunctionBoundary(
      afterTime,
      era
    );
  }

  return this.getNextConjunctionCycleBoundary(
    condition,
    afterTime,
    era
  );
}

getNextConjunctionBoundary(
  conjunctionId: string,
  afterTime: SimulationTime,
  era: SimClockEra
): SimulationTime | undefined {
  const conjunction =
    this.settings.conjunctions.find(
      item => item.id === conjunctionId
    );

  if (
    !conjunction ||
    conjunction.conditions.length === 0 ||
    !Number.isFinite(afterTime)
  ) {
    return undefined;
  }

  let nextBoundary = Infinity;

  for (const condition of conjunction.conditions) {
    const boundary =
      this.getNextConjunctionConditionBoundary(
        condition,
        afterTime,
        era
      );

    if (
      boundary !== undefined &&
      Number.isFinite(boundary) &&
      boundary > afterTime &&
      boundary < nextBoundary
    ) {
      nextBoundary = boundary;
    }
  }

  return Number.isFinite(nextBoundary)
    ? nextBoundary
    : undefined;
}

prospectConjunctionIntervals(
  startTime: SimulationTime,
  endTime: SimulationTime,
  era: SimClockEra
): CelestialConjunctionInterval[] {
  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime <= startTime
  ) {
    return [];
  }

  const intervals: CelestialConjunctionInterval[] = [];

  for (const conjunction of this.settings.conjunctions) {
    // Eclipses have their own alignment and duration logic.
    if (conjunction.type !== undefined) {
      continue;
    }

    if (conjunction.conditions.length === 0) {
      continue;
    }

    let cursor = startTime;

    let active = this.isConjunctionSatisfied(
      conjunction.id,
      cursor,
      era
    );

    let activeStart: number | undefined =
      active ? cursor : undefined;

    while (cursor < endTime) {
      const boundary = this.getNextConjunctionBoundary(
        conjunction.id,
        cursor,
        era
      );

      if (
        boundary === undefined ||
        !Number.isFinite(boundary) ||
        boundary <= cursor ||
        boundary > endTime
      ) {
        break;
      }

      const nextActive = this.isConjunctionSatisfied(
        conjunction.id,
        boundary,
        era
      );

      if (!active && nextActive) {
        activeStart = boundary;
      }

      if (active && !nextActive && activeStart !== undefined) {
        intervals.push({
          id: `${conjunction.id}:${activeStart}`,
          conjunctionId: conjunction.id,
          startTime: activeStart,
          endTime: boundary,
        });

        activeStart = undefined;
      }

      active = nextActive;
      cursor = boundary;
    }

    // The conjunction may continue beyond this window.
    if (active && activeStart !== undefined) {
      intervals.push({
        id: `${conjunction.id}:${activeStart}`,
        conjunctionId: conjunction.id,
        startTime: activeStart,
        endTime,
      });
    }
  }

  return intervals.sort(
    (a, b) =>
      a.startTime - b.startTime ||
      a.id.localeCompare(b.id)
  );
}

prospectConjunctionTransitions(
  startTime: SimulationTime,
  endTime: SimulationTime,
  era: SimClockEra
): CelestialConjunctionTransition[] {
  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime <= startTime
  ) {
    return [];
  }

  const transitions: CelestialConjunctionTransition[] = [];

  for (const conjunction of this.settings.conjunctions) {
    if (
      conjunction.type !== undefined ||
      conjunction.conditions.length === 0
    ) {
      continue;
    }

    let cursor = startTime;

    // Check whether a transition occurs exactly at
    // the beginning of the requested window.
    const beforeStart = this.isConjunctionSatisfied(
      conjunction.id,
      startTime - Math.max(
        Number.EPSILON * Math.abs(startTime) * 2,
        0.000001
      ),
      era
    );

    let active = this.isConjunctionSatisfied(
      conjunction.id,
      startTime,
      era
    );

    if (beforeStart !== active) {
      const kind = active ? 'start' : 'end';

      transitions.push({
        id: `${conjunction.id}:${kind}:${startTime}`,
        conjunctionId: conjunction.id,
        time: startTime,
        kind,
      });
    }

    while (cursor < endTime) {
      const boundary = this.getNextConjunctionBoundary(
        conjunction.id,
        cursor,
        era
      );

      // Half-open window: [startTime, endTime).
      // A transition at endTime belongs to the
      // following window.
      if (
        boundary === undefined ||
        !Number.isFinite(boundary) ||
        boundary <= cursor ||
        boundary >= endTime
      ) {
        break;
      }

      const nextActive = this.isConjunctionSatisfied(
        conjunction.id,
        boundary,
        era
      );

      if (active !== nextActive) {
        const kind = nextActive ? 'start' : 'end';

        transitions.push({
          id: `${conjunction.id}:${kind}:${boundary}`,
          conjunctionId: conjunction.id,
          time: boundary,
          kind,
        });
      }

      active = nextActive;
      cursor = boundary;
    }
  }

  return transitions.sort(
    (a, b) =>
      a.time - b.time ||
      a.id.localeCompare(b.id)
  );
}

getNextConjunctionCycleBoundary(
  condition: CelestialConjunctionCondition,
  afterTime: SimulationTime,
  era: SimClockEra
): SimulationTime | undefined {
  const moon = this.settings.moons.find(
    body => body.id === condition.bodyId
  );

  const zodiac = this.settings.zodiacs.find(
    body => body.id === condition.bodyId
  );

  const cycles = moon
    ? moon.phaseCycles
    : zodiac?.cycles;

  const cycle = cycles?.find(
    item => item.id === condition.cycleId
  );

  if (!cycle) {
    return undefined;
  }

if (cycle.cycleMeasurement === 'calendar') {
  return this.getNextCalendarCycleBoundary(
    cycle,
    afterTime,
    era
  );
}

return this.getNextDurationCycleBoundary(
  cycle,
  afterTime
);
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

  isConjunctionSatisfied(
  conjunctionId: string,
  time: SimulationTime,
  era: SimClockEra
): boolean {
  const conjunction =
    this.settings.conjunctions.find(
      item => item.id === conjunctionId
    );

  if (
    !conjunction ||
    conjunction.conditions.length === 0
  ) {
    return false;
  }

  return conjunction.conditions.every(
    condition =>
      this.isConjunctionConditionSatisfied(
        condition,
        time,
        era
      )
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
