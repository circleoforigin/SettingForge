import type {
  SimClockEra,
} from './SimClockSettings';

import type {
  CelestialSolarCycle,
} from './CelestialSettings';

import type {
  SimulationTime,
} from './SimulationClockService';

import {
  calendarToSimulationTime,
  simulationTimeToCalendar,
  getMonthDays,
} from './SimCalendar';

export interface CelestialSolarState
{
  daylightMinutes: number;
  sunriseHour: number;
  solarNoonHour: number;
  sunsetHour: number;
}

interface SolarBoundary
{
  monthId: string;
  day: number;
}

function getBoundaryTime(
  year: number,
  boundary: SolarBoundary,
  era: SimClockEra
): SimulationTime
{
  const month = era.months.find(
    (item) =>
      item.id === boundary.monthId
  );

  if (
    !month ||
    !Number.isInteger(boundary.day) ||
    boundary.day < 1 ||
    boundary.day > getMonthDays(
      month,
      year,
      era
    )
  )
  {
    throw new Error(
      'Invalid Celestial solar boundary.'
    );
  }

  return calendarToSimulationTime(
    {
      year,
      monthId: boundary.monthId,
      day: boundary.day,
      hour: 0,
      minute: 0,
      second: 0,
    },
    era
  );
}

function interpolateDaylight(
  position: number,
  duration: number,
  startingMinutes: number,
  endingMinutes: number
): number
{
  const progress =
    position / duration;

  const blend =
    (
      1 -
      Math.cos(
        Math.PI * progress
      )
    ) / 2;

  return (
    startingMinutes +
    (
      endingMinutes -
      startingMinutes
    ) * blend
  );
}

export function resolveCelestialSolarState(
  time: SimulationTime,
  era: SimClockEra,
  cycle: CelestialSolarCycle
): CelestialSolarState
{
  const calendar =
    simulationTimeToCalendar(
      time,
      era
    );

  const year = calendar.year;

  const boundaries = [
    {
      time: getBoundaryTime(
        year - 1,
        cycle.shortSolstice,
        era
      ),
      daylight:
        cycle.shortSolstice.daylightMinutes,
    },
    {
      time: getBoundaryTime(
        year - 1,
        cycle.longSolstice,
        era
      ),
      daylight:
        cycle.longSolstice.daylightMinutes,
    },
    {
      time: getBoundaryTime(
        year,
        cycle.shortSolstice,
        era
      ),
      daylight:
        cycle.shortSolstice.daylightMinutes,
    },
    {
      time: getBoundaryTime(
        year,
        cycle.longSolstice,
        era
      ),
      daylight:
        cycle.longSolstice.daylightMinutes,
    },
    {
      time: getBoundaryTime(
        year + 1,
        cycle.shortSolstice,
        era
      ),
      daylight:
        cycle.shortSolstice.daylightMinutes,
    },
    {
      time: getBoundaryTime(
        year + 1,
        cycle.longSolstice,
        era
      ),
      daylight:
        cycle.longSolstice.daylightMinutes,
    },
  ].sort(
    (left, right) =>
      left.time - right.time
  );

  const dayStart =
    calendarToSimulationTime(
      {
        year,
        monthId: calendar.monthId,
        day: calendar.day,
        hour: 0,
        minute: 0,
        second: 0,
      },
      era
    );

  let daylightMinutes =
    cycle.longSolstice.daylightMinutes;

  for (
    let index = 0;
    index < boundaries.length - 1;
    index += 1
  )
  {
    const start = boundaries[index];
    const end = boundaries[index + 1];

    if (
      dayStart >= start.time &&
      dayStart <= end.time
    )
    {
      daylightMinutes =
        interpolateDaylight(
          dayStart - start.time,
          end.time - start.time,
          start.daylight,
          end.daylight
        );

      break;
    }
  }

  const solarNoonHour =
    era.hoursPerDay / 2;

  const daylightHours =
    daylightMinutes /
    era.minutesPerHour;

  const sunriseHour =
    solarNoonHour -
    daylightHours / 2;

  const sunsetHour =
    solarNoonHour +
    daylightHours / 2;

  return {
    daylightMinutes,
    sunriseHour,
    solarNoonHour,
    sunsetHour,
  };
}