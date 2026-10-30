import type { SimClockEra } from './SimClockSettings';
import type { CelestialSolarCycle } from './CelestialSettings';
import type { SimulationTime } from './SimulationClockService';
import {
  calendarToSimulationTime,
  simulationTimeToCalendar,
  getMonthDays,
} from './SimCalendar';

export interface CelestialSolarState
{
  daylightHours: number;
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
    item => item.id === boundary.monthId
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
  startingHours: number,
  endingHours: number
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
    startingHours +
    (
      endingHours -
      startingHours
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

  const summer =
    getBoundaryTime(
      year,
      cycle.summerSolstice,
      era
    );

  const winter =
    getBoundaryTime(
      year,
      cycle.winterSolstice,
      era
    );

  const boundaries = [
    {
      time: getBoundaryTime(
        year - 1,
        cycle.summerSolstice,
        era
      ),
      daylight: cycle.longestDayHours,
    },
    {
      time: getBoundaryTime(
        year - 1,
        cycle.winterSolstice,
        era
      ),
      daylight: cycle.shortestDayHours,
    },
    {
      time: summer,
      daylight: cycle.longestDayHours,
    },
    {
      time: winter,
      daylight: cycle.shortestDayHours,
    },
    {
      time: getBoundaryTime(
        year + 1,
        cycle.summerSolstice,
        era
      ),
      daylight: cycle.longestDayHours,
    },
    {
      time: getBoundaryTime(
        year + 1,
        cycle.winterSolstice,
        era
      ),
      daylight: cycle.shortestDayHours,
    },
  ].sort(
    (a, b) => a.time - b.time
  );

  const secondsPerDay =
    era.secondsPerMinute *
    era.minutesPerHour *
    era.hoursPerDay;

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

  let daylightHours =
    cycle.longestDayHours;

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
      daylightHours =
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
    cycle.solarNoonHour;

  const sunriseHour =
    solarNoonHour -
    daylightHours / 2;

  const sunsetHour =
    solarNoonHour +
    daylightHours / 2;

  return {
    daylightHours,
    sunriseHour,
    solarNoonHour,
    sunsetHour,
  };
}