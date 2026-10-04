import type {
  SimClockEra,
  SimClockMonth,
} from './SimClockSettings';
import type {
  SimulationTime,
} from './SimulationClockService';

export interface SimCalendarDateTime
{
  year: number;
  monthId: string;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface ResolvedSimCalendarDateTime
  extends SimCalendarDateTime
{
  monthIndex: number;
  monthName: string;
  weekDay: string;
}

function isLeapYear(
  year: number,
  era: SimClockEra
): boolean
{
  const rule = era.leapRule;

  if (!rule)
    return false;

  return year % rule.interval === 0;
}

function getMonthDays(
  month: SimClockMonth,
  year: number,
  era: SimClockEra
): number
{
  const rule = era.leapRule;

  if (
    rule &&
    isLeapYear(year, era) &&
    rule.monthId === month.id
  )
  {
    return (
      month.days +
      rule.additionalDays
    );
  }

  return month.days;
}

function getDaysInYear(
  year: number,
  era: SimClockEra
): number
{
  return era.months.reduce(
    (total, month) =>
      total +
      getMonthDays(
        month,
        year,
        era
      ),
    0
  );
}

function getSecondsPerDay(
  era: SimClockEra
): number
{
  return (
    era.secondsPerMinute *
    era.minutesPerHour *
    era.hoursPerDay
  );
}

function getWeekDay(
  dayOffset: number,
  era: SimClockEra
): string
{
  if (era.dayNames.length === 0)
    return '';

  const startingIndex =
    era.dayNames.indexOf(
      era.startingWeekday
    );

  const safeStartingIndex =
    startingIndex >= 0
      ? startingIndex
      : 0;

  const index =
    (
      (
        safeStartingIndex +
        dayOffset
      ) %
      era.dayNames.length +
      era.dayNames.length
    ) %
    era.dayNames.length;

  return era.dayNames[index];
}

export function simulationTimeToCalendar(
  time: SimulationTime,
  era: SimClockEra
): ResolvedSimCalendarDateTime
{
  const secondsPerDay =
    getSecondsPerDay(era);

  const dayOffset =
    Math.floor(
      time / secondsPerDay
    );

  let secondsOfDay =
    (
      time % secondsPerDay +
      secondsPerDay
    ) %
    secondsPerDay;

  let year = 1;
  let remainingDays = dayOffset;

  if (remainingDays >= 0)
  {
    while (
      remainingDays >=
      getDaysInYear(year, era)
    )
    {
      remainingDays -=
        getDaysInYear(year, era);

      year += 1;
    }
  }
  else
  {
    while (remainingDays < 0)
    {
      year -= 1;

      remainingDays +=
        getDaysInYear(year, era);
    }
  }

  let monthIndex = 0;

  while (
    monthIndex <
      era.months.length - 1 &&
    remainingDays >=
      getMonthDays(
        era.months[monthIndex],
        year,
        era
      )
  )
  {
    remainingDays -=
      getMonthDays(
        era.months[monthIndex],
        year,
        era
      );

    monthIndex += 1;
  }

  const month =
    era.months[monthIndex];

  const day =
    remainingDays + 1;

  const secondsPerHour =
    era.secondsPerMinute *
    era.minutesPerHour;

  const hour =
    Math.floor(
      secondsOfDay /
      secondsPerHour
    );

  secondsOfDay %=
    secondsPerHour;

  const minute =
    Math.floor(
      secondsOfDay /
      era.secondsPerMinute
    );

  const second =
    secondsOfDay %
    era.secondsPerMinute;

  return {
    year,
    monthId: month.id,
    monthIndex,
    monthName: month.name,
    day,
    hour,
    minute,
    second,
    weekDay:
      getWeekDay(
        dayOffset,
        era
      ),
  };
}

export function calendarToSimulationTime(
  dateTime: SimCalendarDateTime,
  era: SimClockEra
): SimulationTime
{
  let dayOffset = 0;

  if (dateTime.year >= 1)
  {
    for (
      let year = 1;
      year < dateTime.year;
      year += 1
    )
    {
      dayOffset +=
        getDaysInYear(
          year,
          era
        );
    }
  }
  else
  {
    for (
      let year = 0;
      year >= dateTime.year;
      year -= 1
    )
    {
      dayOffset -=
        getDaysInYear(
          year,
          era
        );
    }
  }

  const monthIndex =
    era.months.findIndex(
      (month) =>
        month.id ===
        dateTime.monthId
    );

  const safeMonthIndex =
    monthIndex >= 0
      ? monthIndex
      : 0;

  for (
    let index = 0;
    index < safeMonthIndex;
    index += 1
  )
  {
    dayOffset +=
      getMonthDays(
        era.months[index],
        dateTime.year,
        era
      );
  }

  dayOffset +=
    dateTime.day - 1;

  const secondsPerDay =
    getSecondsPerDay(era);

  const secondsPerHour =
    era.secondsPerMinute *
    era.minutesPerHour;

  return (
    dayOffset *
      secondsPerDay +
    dateTime.hour *
      secondsPerHour +
    dateTime.minute *
      era.secondsPerMinute +
    dateTime.second
  );
}

export type SimCalendarField =
  | 'year'
  | 'month'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second';

export function stepSimulationTime(
  time: SimulationTime,
  field: SimCalendarField,
  direction: 1 | -1,
  era: SimClockEra
): SimulationTime
{
  const calendar =
    simulationTimeToCalendar(
      time,
      era
    );

  if (
    field === 'second' ||
    field === 'minute' ||
    field === 'hour' ||
    field === 'day'
  )
  {
    let seconds = 1;

    if (field === 'minute')
    {
      seconds =
        era.secondsPerMinute;
    }
    else if (field === 'hour')
    {
      seconds =
        era.secondsPerMinute *
        era.minutesPerHour;
    }
    else if (field === 'day')
    {
      seconds =
        era.secondsPerMinute *
        era.minutesPerHour *
        era.hoursPerDay;
    }

    return (
      time +
      direction * seconds
    );
  }

  if (field === 'month')
  {
    let year = calendar.year;
    let monthIndex =
      calendar.monthIndex +
      direction;

    if (monthIndex < 0)
    {
      year -= 1;
      monthIndex =
        era.months.length - 1;
    }
    else if (
      monthIndex >=
      era.months.length
    )
    {
      year += 1;
      monthIndex = 0;
    }

    const month =
      era.months[monthIndex];

    const day =
      Math.min(
        calendar.day,
        getMonthDays(
          month,
          year,
          era
        )
      );

    return calendarToSimulationTime(
      {
        year,
        monthId: month.id,
        day,
        hour: calendar.hour,
        minute: calendar.minute,
        second: calendar.second,
      },
      era
    );
  }

  const year =
    calendar.year +
    direction;

  const month =
    era.months[
      calendar.monthIndex
    ];

  const day =
    Math.min(
      calendar.day,
      getMonthDays(
        month,
        year,
        era
      )
    );

  return calendarToSimulationTime(
    {
      year,
      monthId: month.id,
      day,
      hour: calendar.hour,
      minute: calendar.minute,
      second: calendar.second,
    },
    era
  );
}

function ordinal(
  value: number
): string
{
  const remainder100 =
    Math.abs(value) % 100;

  if (
    remainder100 >= 11 &&
    remainder100 <= 13
  )
  {
    return `${value}th`;
  }

  switch (Math.abs(value) % 10)
  {
    case 1:
      return `${value}st`;

    case 2:
      return `${value}nd`;

    case 3:
      return `${value}rd`;

    default:
      return `${value}th`;
  }
}

export function formatSimulationDate(
  time: SimulationTime,
  era: SimClockEra
): string
{
  const calendar =
    simulationTimeToCalendar(
      time,
      era
    );

  const values: Record<string, string> = {
    '{monthName}':
      calendar.monthName,

    '{month#}':
      ordinal(
        calendar.monthIndex + 1
      ),

    '{weekDay}':
      calendar.weekDay,

    '{day#}':
      ordinal(calendar.day),

    '{era}':
      era.abbreviation,

    '{year}':
      String(calendar.year),
  };

  return Object.entries(values).reduce(
    (result, [token, value]) =>
      result.replaceAll(
        token,
        value
      ),
    era.dateFormat
  );
}

export function formatSimulationTime(
  time: SimulationTime,
  era: SimClockEra
): string
{
  const calendar =
    simulationTimeToCalendar(
      time,
      era
    );

  const minute =
    String(calendar.minute)
      .padStart(2, '0');

  const second =
    String(calendar.second)
      .padStart(2, '0');

  const period =
    calendar.hour <
      era.hoursPerDay / 2
      ? 'AM'
      : 'PM';

  const halfDay =
    era.hoursPerDay / 2;

  let hour =
    calendar.hour %
    halfDay;

  if (hour === 0)
    hour = halfDay;

  return (
    `${hour}:${minute}:${second} ` +
    period
  );
}