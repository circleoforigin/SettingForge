import type {
  CelestialMoon,
  CelestialSettings,
} from './CelestialSettings';
import type { SimClockEra } from './SimClockSettings';
import { resolveCelestialCycle } from './CelestialCycleStepper';
import { resolveCelestialSolarState } from './CelestialSolarResolver';
import { simulationTimeToCalendar } from './SimCalendar';
import { resolveEclipsePhaseReference } from './CelestialEclipsePhaseResolver';
import { DEFAULT_ECLIPSE_OPTIONS } from './CelestialDefaults';

const TAU = Math.PI * 2;

export type CelestialAlignmentKind =
  | 'solar'
  | 'lunar';

export interface CelestialAlignment {
  moonId: string;
  kind: CelestialAlignmentKind;
  time: number;
}

// --------------------------------------------------
// POSITIONAL CALCULATIONS
// --------------------------------------------------

export function getSimulationDaySeconds(
  era: SimClockEra
): number {
  return (
    era.secondsPerMinute *
    era.minutesPerHour *
    era.hoursPerDay
  );
}

export function getSunAngle(
  time: number,
  era: SimClockEra
): number {
  const day = getSimulationDaySeconds(era);

  return TAU * (time / day - 0.5);
}

export function getMoonAngle(
  moon: CelestialMoon,
  time: number
): number | null {
  if (
    !Number.isFinite(moon.lunarDay) ||
    moon.lunarDay <= 0
  ) {
    return null;
  }

  return TAU * (
    (time - moon.moonriseOffset) /
      moon.lunarDay -
    0.25
  );
}

export function getAlignmentError(
  sunAngle: number,
  moonAngle: number,
  kind: CelestialAlignmentKind
): number {
  const target =
    kind === 'solar' ? 0 : Math.PI;

  const difference =
    moonAngle - sunAngle - target;

  return Math.atan2(
    Math.sin(difference),
    Math.cos(difference)
  );
}

// --------------------------------------------------
// EXACT ALIGNMENT PROSPECTING
// --------------------------------------------------

export function resolveNextPhysicalAlignment(
  moon: CelestialMoon,
  kind: CelestialAlignmentKind,
  afterTime: number,
  era: SimClockEra
): CelestialAlignment | null {
  if (
    moon.lunarDay <= 0 ||
    !Number.isFinite(moon.lunarDay) ||
    !Number.isFinite(moon.moonriseOffset) ||
    !Number.isFinite(afterTime)
  ) {
    return null;
  }

  const day = getSimulationDaySeconds(era);

  if (!Number.isFinite(day) || day <= 0) {
    return null;
  }

  const relativeSpeed =
    1 / moon.lunarDay - 1 / day;

  if (Math.abs(relativeSpeed) < 1e-15) {
    return null;
  }

  const relativeAtZero =
    -moon.moonriseOffset / moon.lunarDay +
    0.25;

  const target =
    kind === 'solar' ? 0 : 0.5;

  const position =
    relativeAtZero +
    relativeSpeed * afterTime;

  const nextIndex =
    relativeSpeed > 0
      ? Math.floor(position - target) + 1
      : Math.ceil(position - target) - 1;

  const time =
    (target + nextIndex - relativeAtZero) /
    relativeSpeed;

  if (!Number.isFinite(time)) {
    return null;
  }

  return {
    moonId: moon.id,
    kind,
    time,
  };
}

// --------------------------------------------------
// ALIGNMENT ELIGIBILITY
// --------------------------------------------------

export function isPhysicalAlignmentEligible(
  moon: CelestialMoon,
  kind: CelestialAlignmentKind,
  time: number,
  settings: CelestialSettings,
  era: SimClockEra
): boolean {
  if (
    moon.lunarDay === 0 ||
    !Number.isFinite(time)
  ) {
    return false;
  }

  const reference =
    kind === 'solar'
      ? moon.eclipseSettings?.newPhase
      : moon.eclipseSettings?.fullPhase;

  const phase = resolveEclipsePhaseReference(
    moon,
    reference
  );

  if (!phase) {
    return false;
  }

  const result = resolveCelestialCycle(
    phase.cycle,
    time,
    era
  );

  const matchesPhase =
    result.resolved.tags.some(
      tag =>
        tag.tagId === reference?.tagId &&
        tag.entry.id === reference.entryId
    );

  if (!matchesPhase) {
    return false;
  }

  const solar = resolveCelestialSolarState(
    time,
    era,
    settings.solarCycle
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

  const sunIsUp =
    hour >= solar.sunriseHour &&
    hour <= solar.sunsetHour;

  return kind === 'solar'
    ? sunIsUp
    : !sunIsUp;
}


export function resolveNextStationaryAlignment(
  moon: CelestialMoon,
  afterTime: number,
  era: SimClockEra,
  candidateInterval: number,
  offset: number
): CelestialAlignment | null {
  if (
    moon.lunarDay !== 0 ||
    !Number.isFinite(afterTime) ||
    !Number.isFinite(candidateInterval) ||
    candidateInterval <= 0 ||
    !Number.isFinite(offset)
  ) {
    return null;
  }

  const day = getSimulationDaySeconds(era);

  if (!Number.isFinite(day) || day <= 0) {
    return null;
  }

  // Place stationary solar candidates at
  // local solar noon, independent of phases.
  const solarNoon = day / 2;

  const baseTime = solarNoon + offset;

  const index =
    Math.floor(
      (afterTime - baseTime) /
      candidateInterval
    ) + 1;

  return {
    moonId: moon.id,
    kind: 'solar',
    time:
      baseTime +
      index * candidateInterval,
  };
}


function hashCelestialSeed(
  value: string
): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function celestialSeededRandom(
  worldSeed: string,
  moonId: string,
  alignmentTime: number,
  purpose: string
): number {
  const seed = hashCelestialSeed(
    [
      worldSeed,
      moonId,
      alignmentTime.toFixed(6),
      purpose,
    ].join(':')
  );

  // Deterministic value in [0, 1).
  let value = seed + 0x6D2B79F5;

  value = Math.imul(
    value ^ (value >>> 15),
    value | 1
  );

  value ^= value +
    Math.imul(
      value ^ (value >>> 7),
      value | 61
    );

  return (
    ((value ^ (value >>> 14)) >>> 0) /
    4294967296
  );
}


export function isCelestialEclipseCandidateEligible(
  moon: CelestialMoon,
  kind: CelestialAlignmentKind,
  time: number,
  settings: CelestialSettings,
  era: SimClockEra
): boolean {
  if (!Number.isFinite(time)) {
    return false;
  }

  if (moon.lunarDay === 0) {
    if (kind !== 'solar') {
      return false;
    }

    const solar = resolveCelestialSolarState(
      time,
      era,
      settings.solarCycle
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

    return (
      hour >= solar.sunriseHour &&
      hour <= solar.sunsetHour
    );
  }

  return isPhysicalAlignmentEligible(
    moon,
    kind,
    time,
    settings,
    era
  );
}


export type CelestialEclipseType =
  | 'solar-partial'
  | 'solar-annular'
  | 'solar-total'
  | 'lunar-penumbral'
  | 'lunar-partial'
  | 'lunar-total';

export interface CelestialEclipseContact {
  kind:
    | 'start'
    | 'central-start'
    | 'central-end'
    | 'end';

  time: number;
}

export interface CelestialEclipsePrediction {
  id: string;
  moonId: string;
  type: CelestialEclipseType;

  maximumTime: number;
  startTime: number;
  endTime: number;

  centralStartTime?: number;
  centralEndTime?: number;

  contacts: CelestialEclipseContact[];
}

export interface CelestialConjunctionPrediction {
  id: string;
  moonId: string;
  kind: CelestialAlignmentKind;
  time: number;

  // A conjunction may or may not
  // produce an eclipse.
  eclipse: CelestialEclipsePrediction | null;
}

export interface CelestialEclipseGenerationOptions {
  worldSeed: string;

  // Probability per eligible alignment.
  eclipseChance: number;

  // Relative weights within each eclipse family.
  solarWeights: {
    partial: number;
    annular: number;
    total: number;
  };

  lunarWeights: {
    penumbral: number;
    partial: number;
    total: number;
  };

  // Durations are simulation seconds.
  durations: Record<
    CelestialEclipseType,
    {
      minimum: number;
      maximum: number;
      centralMinimum?: number;
      centralMaximum?: number;
    }
  >;
}


function selectWeightedEclipseType(
  kind: CelestialAlignmentKind,
  roll: number,
  options: CelestialEclipseGenerationOptions
): CelestialEclipseType | null {
  const entries: {
    type: CelestialEclipseType;
    weight: number;
  }[] =
    kind === 'solar'
      ? [
          {
            type: 'solar-partial',
            weight: options.solarWeights.partial,
          },
          {
            type: 'solar-annular',
            weight: options.solarWeights.annular,
          },
          {
            type: 'solar-total',
            weight: options.solarWeights.total,
          },
        ]
      : [
          {
            type: 'lunar-penumbral',
            weight: options.lunarWeights.penumbral,
          },
          {
            type: 'lunar-partial',
            weight: options.lunarWeights.partial,
          },
          {
            type: 'lunar-total',
            weight: options.lunarWeights.total,
          },
        ];

  const totalWeight = entries.reduce(
    (sum, entry) =>
      sum + Math.max(0, entry.weight),
    0
  );

  if (totalWeight <= 0) {
    return null;
  }

  let position = roll * totalWeight;

  for (const entry of entries) {
    const weight = Math.max(0, entry.weight);

    if (position < weight) {
      return entry.type;
    }

    position -= weight;
  }

  return entries[entries.length - 1].type;
}

export function selectCelestialEclipseType(
  alignment: CelestialAlignment,
  options: CelestialEclipseGenerationOptions
): CelestialEclipseType | null {
  const chance = Math.max(
    0,
    Math.min(1, options.eclipseChance)
  );

  const occurrenceRoll = celestialSeededRandom(
    options.worldSeed,
    alignment.moonId,
    alignment.time,
    `${alignment.kind}:occurrence`
  );

  if (occurrenceRoll >= chance) {
    return null;
  }

  const typeRoll = celestialSeededRandom(
    options.worldSeed,
    alignment.moonId,
    alignment.time,
    `${alignment.kind}:type`
  );

  return selectWeightedEclipseType(
    alignment.kind,
    typeRoll,
    options
  );
}


function seededDuration(
  options: CelestialEclipseGenerationOptions,
  alignment: CelestialAlignment,
  purpose: string,
  minimum: number,
  maximum: number
): number {
  const low = Math.max(1, Math.ceil(minimum));
  const high = Math.max(low, Math.floor(maximum));

  const roll = celestialSeededRandom(
    options.worldSeed,
    alignment.moonId,
    alignment.time,
    purpose
  );

  return low + Math.floor(
    roll * (high - low + 1)
  );
}

export function generateCelestialEclipsePrediction(
  alignment: CelestialAlignment,
  options: CelestialEclipseGenerationOptions
): CelestialEclipsePrediction | null {
  const type = selectCelestialEclipseType(
    alignment,
    options
  );

  if (!type) {
    return null;
  }

  const range = options.durations[type];

  if (!range) {
    return null;
  }

  const duration = seededDuration(
    options,
    alignment,
    `${type}:duration`,
    range.minimum,
    range.maximum
  );

  const maximumTime = alignment.time;
  const startTime = maximumTime - duration / 2;
  const endTime = maximumTime + duration / 2;

  const contacts: CelestialEclipseContact[] = [
    { kind: 'start', time: startTime },
  ];

  let centralStartTime: number | undefined;
  let centralEndTime: number | undefined;

  const hasCentralPhase =
    type === 'solar-annular' ||
    type === 'solar-total' ||
    type === 'lunar-total';

  if (hasCentralPhase) {
    const centralDuration = seededDuration(
      options,
      alignment,
      `${type}:central-duration`,
      range.centralMinimum ?? 1,
      range.centralMaximum ?? duration - 1
    );

    // Central phase must be shorter than
    // the overall eclipse.
    const boundedCentralDuration = Math.min(
      centralDuration,
      duration / 2
    );

    centralStartTime =
      maximumTime - boundedCentralDuration / 2;

    centralEndTime =
      maximumTime + boundedCentralDuration / 2;

    contacts.push(
      {
        kind: 'central-start',
        time: centralStartTime,
      },
      {
        kind: 'central-end',
        time: centralEndTime,
      }
    );
  }

  contacts.push({
    kind: 'end',
    time: endTime,
  });

  return {
    id: [
      'eclipse',
      alignment.moonId,
      alignment.kind,
      alignment.time.toFixed(6),
    ].join(':'),

    moonId: alignment.moonId,
    type,

    maximumTime,
    startTime,
    endTime,

    centralStartTime,
    centralEndTime,

    contacts,
  };
}

export function prospectCelestialEclipses(
  startTime: number,
  endTime: number,
  settings: CelestialSettings,
  era: SimClockEra,
  options: CelestialEclipseGenerationOptions =
    DEFAULT_ECLIPSE_OPTIONS
): CelestialEclipsePrediction[] {
  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime <= startTime
  ) {
    return [];
  }

  const predictions: CelestialEclipsePrediction[] = [];
  const day = getSimulationDaySeconds(era);

  if (!Number.isFinite(day) || day <= 0) {
    return [];
  }

  for (const moon of settings.moons) {
    const kinds: CelestialAlignmentKind[] =
      moon.lunarDay === 0
        ? ['solar']
        : ['solar', 'lunar'];

    for (const kind of kinds) {
      let afterTime = startTime;

      for (let attempt = 0; attempt < 100000; attempt++) {
        const alignment =
          moon.lunarDay === 0
            ? resolveNextStationaryAlignment(
                moon,
                afterTime,
                era,
                day * 30,
                0
              )
            : resolveNextPhysicalAlignment(
                moon,
                kind,
                afterTime,
                era
              );

        if (
          !alignment ||
          !Number.isFinite(alignment.time) ||
          alignment.time <= afterTime ||
          alignment.time > endTime
        ) {
          break;
        }

        afterTime = alignment.time;

        if (!isCelestialEclipseCandidateEligible(
          moon,
          kind,
          alignment.time,
          settings,
          era
        )) {
          continue;
        }

        const prediction =
          generateCelestialEclipsePrediction(
            alignment,
            options
          );

        if (prediction) {
          predictions.push(prediction);
        }
      }
    }
  }

  return predictions.sort(
    (a, b) =>
      a.startTime - b.startTime ||
      a.id.localeCompare(b.id)
  );
}

export function prospectCelestialConjunctions(
  startTime: number,
  endTime: number,
  settings: CelestialSettings,
  era: SimClockEra,
  options: CelestialEclipseGenerationOptions =
    DEFAULT_ECLIPSE_OPTIONS
): CelestialConjunctionPrediction[] {
  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime <= startTime
  ) {
    return [];
  }

  const day = getSimulationDaySeconds(era);

  if (!Number.isFinite(day) || day <= 0) {
    return [];
  }

  const predictions: CelestialConjunctionPrediction[] = [];

  for (const moon of settings.moons) {
    const kinds: CelestialAlignmentKind[] =
      moon.lunarDay === 0
        ? ['solar']
        : ['solar', 'lunar'];

    for (const kind of kinds) {
      let afterTime = startTime;

      for (let attempt = 0; attempt < 100000; attempt++) {
        const alignment =
          moon.lunarDay === 0
            ? resolveNextStationaryAlignment(
                moon,
                afterTime,
                era,
                day * 30,
                0
              )
            : resolveNextPhysicalAlignment(
                moon,
                kind,
                afterTime,
                era
              );

        if (
          !alignment ||
          !Number.isFinite(alignment.time) ||
          alignment.time <= afterTime ||
          alignment.time > endTime
        ) {
          break;
        }

        afterTime = alignment.time;

        const eligible =
          isCelestialEclipseCandidateEligible(
            moon,
            kind,
            alignment.time,
            settings,
            era
          );

        predictions.push({
          id: [
            'conjunction',
            moon.id,
            kind,
            alignment.time.toFixed(6),
          ].join(':'),
          moonId: moon.id,
          kind,
          time: alignment.time,
          eclipse: eligible
            ? generateCelestialEclipsePrediction(
                alignment,
                options
              )
            : null,
        });
      }
    }
  }

  return predictions.sort(
    (a, b) =>
      a.time - b.time ||
      a.id.localeCompare(b.id)
  );
}
