
import { useState } from 'react';
import { celestialService } from '../../simulation/CelestialService';
import type { CelestialSettings } from '../../simulation/CelestialSettings';
import type { SimClockEra } from '../../simulation/SimClockSettings';
import { environmentService } from '../../simulation/EnvironmentService';
import { EnvironmentSettingsSection } from '../environment/EnvironmentSettingsSection';

interface CelestialSettingsDialogProps
{
  onClose: () => void;
  era: SimClockEra;
}

type CelestialDetailsTab =
  | 'moons'
  | 'zodiac';

export function CelestialSettingsDialog({
  onClose,
  era,
}: CelestialSettingsDialogProps)
{
  const [draft] =
    useState<CelestialSettings>(
      () => celestialService.getSettings()
    );

  const [activeDetailsTab, setActiveDetailsTab] =
    useState<CelestialDetailsTab>('moons');

  const seasons =
    environmentService.getDefinitions()
      ?.seasons ?? [];

  const saveSettings = () =>
  {
    celestialService.setSettings(draft);
    onClose();
  };

  const formatDate = (
    monthId: string,
    day: number
  ): string =>
  {
    const month = era.months.find(
      item => item.id === monthId
    );

    return month
      ? `${month.name} ${day}`
      : 'Not configured';
  };

  const formatDaylight = (
    daylightMinutes: number
  ): string =>
  {
    const hours = Math.floor(daylightMinutes / 60);
    const minutes = daylightMinutes % 60;

    return (`${hours}h ${String(minutes).padStart(2, '0')}m`);
  };

  return (
    <div className="dialog-backdrop">
      <div className="dialog celestial-settings-dialog">
        <h2>Celestial Settings</h2>

        <div className="celestial-settings-content">
          <div className="celestial-settings-columns">

            <div className="celestial-settings-left">

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

                    return (
                      <>
                        <span className="environment-settings-static-value">
                          {season.name}
                        </span>

                        <span className="environment-settings-static-value celestial-season-start-date">
                          {start
                            ? formatDate(
                                start.monthId,
                                start.day
                              )
                            : 'Not configured'}
                        </span>
                      </>
                    );
                  }}
                />
              </div>

              <div className="celestial-solar-section">
                <section className="celestial-solar-panel">
                  <h3>
                    Solar Details - {draft.sun.name}
                  </h3>

                  <div className="celestial-solar-content">
                    {[
                      {
                        id: 'hibernal',
                        name: 'Hibernal Solstice',
                        value:
                          draft.solarCycle.shortSolstice,
                      },
                      {
                        id: 'estival',
                        name: 'Estival Solstice',
                        value:
                          draft.solarCycle.longSolstice,
                      },
                    ].map(entry => (
                      <div
                        key={entry.id}
                        className="celestial-solar-entry"
                      >
                        <div className="celestial-solar-entry-heading">
                          <span className="celestial-solar-name">
                            {entry.name}
                          </span>

                          <span className="celestial-solar-date">
                            {formatDate(
                              entry.value.monthId,
                              entry.value.day
                            )}
                          </span>
                        </div>

                        <div className="celestial-solar-entry-daylight">
                          <span>
                            Daylight Hours
                          </span>

                          <span>
                            {formatDaylight(
                              entry.value.daylightMinutes
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

            </div>

            <div className="celestial-settings-right">
              <div
                className="celestial-details-tabs"
                role="tablist"
                aria-label="Celestial details"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    activeDetailsTab === 'moons'
                  }
                  className={
                    activeDetailsTab === 'moons'
                      ? 'selected'
                      : ''
                  }
                  onClick={() =>
                  {
                    setActiveDetailsTab('moons');
                  }}
                >
                  Moons
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    activeDetailsTab === 'zodiac'
                  }
                  className={
                    activeDetailsTab === 'zodiac'
                      ? 'selected'
                      : ''
                  }
                  onClick={() =>
                  {
                    setActiveDetailsTab('zodiac');
                  }}
                >
                  Zodiac
                </button>
              </div>

              <div
                className="celestial-details-panel"
                role="tabpanel"
              >
                {activeDetailsTab === 'moons' ? (
                  <p>
                    Moon details will appear here.
                  </p>
                ) : (
                  <p>
                    Zodiac details will appear here.
                  </p>
                )}
              </div>
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
