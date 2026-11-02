import type {
  SimClockEra,
} from './SimClockSettings';

import type {
  SimulationTime,
} from './SimulationClockService';

import type {
  CelestialSolarCycle,
} from './CelestialSettings';

import {
  calendarToSimulationTime,
  simulationTimeToCalendar,
} from './SimCalendar';

import {
  resolveCelestialSolarState,
} from './CelestialSolarResolver';

export function resolveNextCelestialMarker(
  markerId: string,
  afterTime: SimulationTime,
  era: SimClockEra,
  solarCycle: CelestialSolarCycle
): SimulationTime | undefined
{
  const supportedMarkers = [
    'sunrise',
    'solar-noon',
    'sunset',
    'midnight',
  ];

  if (!supportedMarkers.includes(markerId))
  {
    return undefined;
  }

  const secondsPerHour =
    era.secondsPerMinute *
    era.minutesPerHour;

  const secondsPerDay =
    secondsPerHour *
    era.hoursPerDay;

  const calendar =
    simulationTimeToCalendar(
      afterTime,
      era
    );

  const dayStart =
    calendarToSimulationTime(
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

  for (let dayOffset = 0; dayOffset <= 2; dayOffset += 1)
  {
    const candidateDayStart =
      dayStart +
      dayOffset * secondsPerDay;

    if (markerId === 'midnight')
    {
      if (candidateDayStart > afterTime)
      {
        return candidateDayStart;
      }

      continue;
    }

    const solarState =
      resolveCelestialSolarState(
        candidateDayStart,
        era,
        solarCycle
      );

    const markerHour =
      markerId === 'sunrise'
        ? solarState.sunriseHour
        : markerId === 'solar-noon'
          ? solarState.solarNoonHour
          : solarState.sunsetHour;

    const candidateTime =
      candidateDayStart +
      Math.round(
        markerHour * secondsPerHour
      );

    if (candidateTime > afterTime)
    {
      return candidateTime;
    }
  }

  return undefined;
}