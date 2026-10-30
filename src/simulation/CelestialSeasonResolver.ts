import type { SimClockEra } from './SimClockSettings';
import type { CelestialSeasonStart } from './CelestialSettings';
import { 
    simulationTimeToCalendar,
    getMonthDays,
 } from './SimCalendar';
import type { SimulationTime } from './SimulationClockService';

export function resolveCelestialSeason(
  time: SimulationTime,
  era: SimClockEra,
  seasonStarts: CelestialSeasonStart[]
): string | undefined
{
  if (seasonStarts.length === 0)
  {
    return undefined;
  }

  const calendar =
    simulationTimeToCalendar(
      time,
      era
    );

  const starts = seasonStarts
    .map(start =>
    {
      const monthIndex =
        era.months.findIndex(
          month =>
            month.id === start.monthId
        );

      if (
        monthIndex < 0 ||
        !Number.isInteger(start.day) ||
        start.day < 1 ||
start.day >
  getMonthDays(
    era.months[monthIndex],
    calendar.year,
    era
  )
      )
      {
        return undefined;
      }

      return {
        seasonId: start.seasonId,
        monthIndex,
        day: start.day,
      };
    })
    .filter(
      (start): start is {
        seasonId: string;
        monthIndex: number;
        day: number;
      } => start !== undefined
    )
    .sort(
      (a, b) =>
        a.monthIndex - b.monthIndex ||
        a.day - b.day
    );

  if (starts.length === 0)
  {
    return undefined;
  }

  let activeSeason =
    starts[starts.length - 1].seasonId;

  for (const start of starts)
  {
    if (
      start.monthIndex <
        calendar.monthIndex ||
      (
        start.monthIndex ===
          calendar.monthIndex &&
        start.day <= calendar.day
      )
    )
    {
      activeSeason = start.seasonId;
    }
    else
    {
      break;
    }
  }

  return activeSeason;
}