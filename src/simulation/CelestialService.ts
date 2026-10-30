import {
  createDefaultCelestialSettings,
  type CelestialSettings,
} from './CelestialSettings';
import type { SimClockEra } from './SimClockSettings';
import type { SimulationTime } from './SimulationClockService';
import { resolveCelestialSeason } from './CelestialSeasonResolver';

type CelestialListener = (
  settings: CelestialSettings
) => void;

export class CelestialService
{
  private settings: CelestialSettings =
    createDefaultCelestialSettings();

  private listeners =
    new Set<CelestialListener>();

  getSettings(): CelestialSettings
  {
    return structuredClone(
      this.settings
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
  const defaults =
    createDefaultCelestialSettings();

  this.settings = {
    ...defaults,
    ...structuredClone(settings ?? {}),

    sun: {
      ...defaults.sun,
      ...settings?.sun,
    },

    solarCycle: {
      ...defaults.solarCycle,
      ...settings?.solarCycle,

      summerSolstice: {
        ...defaults.solarCycle.summerSolstice,
        ...settings?.solarCycle?.summerSolstice,
      },

      winterSolstice: {
        ...defaults.solarCycle.winterSolstice,
        ...settings?.solarCycle?.winterSolstice,
      },
    },

    seasonStarts:
      settings?.seasonStarts?.length
        ? structuredClone(settings.seasonStarts)
        : defaults.seasonStarts,
  };

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

  private notify(): void
  {
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
