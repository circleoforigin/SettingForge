import { useState } from 'react';
import { celestialService } from '../../simulation/CelestialService';
import type { CelestialSettings } from '../../simulation/CelestialSettings';
import type { SimClockEra } from '../../simulation/SimClockSettings';
import { environmentService } from '../../simulation/EnvironmentService';
import {
  getMonthDays,
  simulationTimeToCalendar,
} from '../../simulation/SimCalendar';
import { simulationClockService } from '../../simulation/SimulationClockService';
import { EnvironmentSettingsSection } from '../environment/EnvironmentSettingsSection';

interface CelestialSettingsDialogProps
{
  onClose: () => void;
  era: SimClockEra;
}

export function CelestialSettingsDialog({
  onClose,
  era,
}: CelestialSettingsDialogProps)
{
const [draft, setDraft] =
  useState<CelestialSettings>(
    () => celestialService.getSettings()
  );

const seasons =
  environmentService.getDefinitions()
    ?.seasons ?? [];

const currentYear =
  simulationTimeToCalendar(
    simulationClockService.getTime(),
    era
  ).year;

const updateSeasonStart = (
  seasonId: string,
  monthId: string,
  day: number
) =>
{
  setDraft(current => ({
    ...current,

    seasonStarts:
      current.seasonStarts.map(start =>
        start.seasonId === seasonId
          ? {
              ...start,
              monthId,
              day,
            }
          : start
      ),
  }));
};

  const saveSettings = () =>
  {
    celestialService.setSettings(draft);
    onClose();
  };

  return (
    <div className="dialog-backdrop">
      <div className="dialog celestial-settings-dialog">
        <h2>Celestial Settings</h2>

        <div className="celestial-settings-content">
          <div className="celestial-settings-columns">
          <div className="celestial-seasons-section">
  <h3 className="celestial-start-date-header">
    Start Date
  </h3>
<EnvironmentSettingsSection
  title="Seasons"
  entries={seasons}
  onChange={() => {}}
  renderEntry={season =>
  {
    const start =
      draft.seasonStarts.find(
        item =>
          item.seasonId === season.id
      );

    const month =
      era.months.find(
        item =>
          item.id === start?.monthId
      );

    return (
      <>
        <span className="environment-settings-static-value">
          {season.name}
        </span>

        <span className="environment-settings-static-value celestial-season-start-date">
          {start && month
            ? `${month.name} ${start.day}`
            : 'Not configured'}
        </span>
      </>
    );
  }}
/>
<EnvironmentSettingsSection
  title="Solar"
  entries={[
    {
      id: 'hibernal',
      name: 'Hibernal Solstice',
      value: draft.solarCycle.shortSolstice,
    },
    {
      id: 'estival',
      name: 'Estival Solstice',
      value: draft.solarCycle.longSolstice,
    },
  ]}
  onChange={() => {}}
  renderEntry={entry =>
  {
    const month = era.months.find(
      item =>
        item.id === entry.value.monthId
    );

    const hours = Math.floor(
      entry.value.daylightMinutes / 60
    );

    const minutes =
      entry.value.daylightMinutes % 60;

return (
  <div className="celestial-solar-entry">
    <div className="celestial-solar-entry-heading">
      <span className="celestial-solar-name">
        {entry.name}
      </span>

      <span className="celestial-solar-date">
        {month
          ? `${month.name} ${entry.value.day}`
          : 'Not configured'}
      </span>
    </div>

    <div className="celestial-solar-entry-daylight">
      <span>Daylight Hours</span>

      <span>
        {hours}h {String(minutes).padStart(2, '0')}m
      </span>
    </div>
  </div>
);
  }}
/>
</div>
</div>
        </div>

        <div className="dialog-actions">
          <button
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={saveSettings}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
