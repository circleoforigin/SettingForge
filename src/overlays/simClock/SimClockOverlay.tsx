import { useState } from 'react';
import type { OverlayPlacement } from '../OverlayPlacement';
import { SimClockSurface } from './SimClockSurface';

export interface SimClockMonth
{
  id: string;
  name: string;
  days: number;
}

export interface SimClockLeapRule
{
  interval: number;
  monthId: string;
  afterDay: number;
  additionalDays: number;
}

export interface SimClockReckoning
{
  name: string;
  abbreviation: string;
  yearOffset: number;
}

export interface SimClockSettings
{
  minutesPerHour: number;
  hoursPerDay: number;
  dayNames: string[];
  months: SimClockMonth[];
  leapRule?: SimClockLeapRule;
  reckoning: SimClockReckoning;
  dateFormat: string;
  timeFormat: '12-hour' | '24-hour';
}

const DEFAULT_SETTINGS: SimClockSettings = {
  minutesPerHour: 60,
  hoursPerDay: 24,

  dayNames: [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ],

  months: [
    { id: 'january', name: 'January', days: 31 },
    { id: 'february', name: 'February', days: 28 },
    { id: 'march', name: 'March', days: 31 },
    { id: 'april', name: 'April', days: 30 },
    { id: 'may', name: 'May', days: 31 },
    { id: 'june', name: 'June', days: 30 },
    { id: 'july', name: 'July', days: 31 },
    { id: 'august', name: 'August', days: 31 },
    { id: 'september', name: 'September', days: 30 },
    { id: 'october', name: 'October', days: 31 },
    { id: 'november', name: 'November', days: 30 },
    { id: 'december', name: 'December', days: 31 },
  ],

  leapRule: {
    interval: 4,
    monthId: 'february',
    afterDay: 28,
    additionalDays: 1,
  },

  reckoning: {
    name: 'Common Era',
    abbreviation: 'CE',
    yearOffset: 0,
  },

  dateFormat: '{month} {dayOrdinal}, {year}',
  timeFormat: '12-hour',
};

export function useSimClockOverlay()
{
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<SimClockSettings>(DEFAULT_SETTINGS);

  return {
    settingsOpen,
    setSettingsOpen,
    settings,
    setSettings,
  };
}

export type SimClockOverlayController =
  ReturnType<typeof useSimClockOverlay>;

interface SimClockOverlayProps
{
  controller: SimClockOverlayController;
  placement: OverlayPlacement;
}

export function SimClockOverlay({
  controller,
  placement,
}: SimClockOverlayProps)
{
  return (
    <SimClockSurface
      placement={placement}
    />
  );
}