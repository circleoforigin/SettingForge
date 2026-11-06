
import { useState } from 'react';
import { celestialService } from '../../simulation/CelestialService';
import type { CelestialSettings } from '../../simulation/CelestialSettings';
import type { SimClockEra } from '../../simulation/SimClockSettings';
import { environmentService } from '../../simulation/EnvironmentService';
import { EnvironmentSettingsSection } from '../environment/EnvironmentSettingsSection';
import { resolveCelestialCycleOffset } from '../../simulation/CelestialCycleStepper';

interface CelestialSettingsDialogProps
{
  onClose: () => void;
  era: SimClockEra;
}

type CelestialDetailsTab =
  | 'moons'
  | 'zodiac'
  | 'notables'
  | 'ruleset';

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

const [selectedMoonId, setSelectedMoonId] =
  useState<string>(
    () => draft.moons[0]?.id ?? ''
  );

const selectedMoon =
  draft.moons.find(
    moon => moon.id === selectedMoonId
  );

  const [selectedCycleId, setSelectedCycleId] =
  useState<string>(
    () => draft.moons[0]?.phaseCycles[0]?.id ?? ''
  );

const selectedCycle =
  selectedMoon?.phaseCycles.find(
    cycle => cycle.id === selectedCycleId
  ) ?? selectedMoon?.phaseCycles[0];

const cycleOffsetResult =
  selectedCycle?.cycleMeasurement !== 'calendar' &&
  selectedCycle
    ? resolveCelestialCycleOffset(selectedCycle)
    : undefined;

const [keywordIndex, setKeywordIndex] = useState(0);

const keywords = selectedCycle?.tags ?? [];
const keywordsPerPage =
  selectedCycle?.cycleMeasurement === 'calendar'
    ? 1
    : 2;

const visibleKeywords =
  keywords.slice(
    Math.min(
      keywordIndex,
      Math.max(0, keywords.length - keywordsPerPage)
    ),
    Math.min(
      keywordIndex,
      Math.max(0, keywords.length - keywordsPerPage)
    ) + keywordsPerPage
  );

const navigateMoon = (direction: number) =>
{
  if (draft.moons.length <= 1)
  {
    return;
  }

  const currentIndex =
    draft.moons.findIndex(
      moon => moon.id === selectedMoonId
    );

  const nextIndex =
    (
      currentIndex + direction +
      draft.moons.length
    ) % draft.moons.length;

  setSelectedMoonId(draft.moons[nextIndex].id);
  setKeywordIndex(0);
};

const navigateCycle = (direction: number) =>
{
  if (!selectedMoon || selectedMoon.phaseCycles.length <= 1)
  {
    return;
  }

  const cycles = selectedMoon.phaseCycles;

  const currentIndex =
    cycles.findIndex(
      cycle => cycle.id === selectedCycle?.id
    );

  const nextIndex =
    (
      currentIndex + direction +
      cycles.length
    ) % cycles.length;

  setSelectedCycleId(cycles[nextIndex].id);
  setKeywordIndex(0);
};

const navigateKeywords = (direction: number) =>
{
  if (keywords.length <= keywordsPerPage)
  {
    return;
  }

  setKeywordIndex(current =>
  {
    const maxIndex =
      keywords.length - keywordsPerPage;

    return (
      current + direction + maxIndex + 1
    ) % (maxIndex + 1);
  });
};

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


const formatMoonTime = (
  seconds: number,
  signed = false
): string =>
{
  const sign =
    signed
      ? seconds < 0 ? '-' : '+'
      : '';

  const absoluteSeconds = Math.abs(seconds);

  const hours =
    Math.floor(absoluteSeconds / 3600);

  const minutes =
    Math.floor((absoluteSeconds % 3600) / 60);

  const remainingSeconds =
    Math.floor(absoluteSeconds % 60);

  const formatted =
    `${hours}h ${String(minutes).padStart(2, '0')}m`;

  return (
    sign +
    formatted +
    (remainingSeconds > 0
      ? ` ${remainingSeconds}s`
      : '')
  );
};


const formatCycleDuration = (
  seconds: number
): string =>
{
  const totalSeconds =
    Math.floor(Math.abs(seconds));

  const days =
    Math.floor(totalSeconds / 86400);

  const hours =
    Math.floor((totalSeconds % 86400) / 3600);

  const minutes =
    Math.floor((totalSeconds % 3600) / 60);

  const remainingSeconds =
    totalSeconds % 60;

  return [
    days > 0 ? `${days}d` : '',
    hours > 0 ? `${hours}h` : '',
    minutes > 0 ? `${minutes}m` : '',
    remainingSeconds > 0
      ? `${remainingSeconds}s`
      : '',
  ].filter(Boolean).join(' ') || '0s';
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

<button
  type="button"
  role="tab"
  aria-selected={
    activeDetailsTab === 'notables'
  }
  className={
    activeDetailsTab === 'notables'
      ? 'selected'
      : ''
  }
  onClick={() =>
  {
    setActiveDetailsTab('notables');
  }}
>
  Notables
</button>

<button
  type="button"
  role="tab"
  aria-selected={
    activeDetailsTab === 'ruleset'
  }
  className={
    activeDetailsTab === 'ruleset'
      ? 'selected'
      : ''
  }
  onClick={() =>
  {
    setActiveDetailsTab('ruleset');
  }}
>
  Ruleset
</button>

              </div>

              <div
                className="celestial-details-panel"
                role="tabpanel"
              >

{activeDetailsTab === 'moons' ? (
  <div className="celestial-moons-panel">    
<div className="celestial-moon-navigation">
  <button
    type="button"
    onClick={() => navigateMoon(-1)}
    style={{
      visibility:
        draft.moons.length > 1
          ? 'visible'
          : 'hidden',
    }}
    aria-label="Previous moon"
  >
    ‹
  </button>

  <strong>
    {selectedMoon?.name ?? 'None'}
  </strong>

  <button
    type="button"
    onClick={() => navigateMoon(1)}
    style={{
      visibility:
        draft.moons.length > 1
          ? 'visible'
          : 'hidden',
    }}
    aria-label="Next moon"
  >
    ›

  </button>

</div>

{selectedMoon && (
  <div className="celestial-moon-properties">
    <span>
      Lunar Day:{' '}
      <strong>
        {formatMoonTime(selectedMoon.lunarDay)}
      </strong>
    </span>

    <span>
      Moonrise Offset (Day 1):{' '}
      <strong>
        {formatMoonTime(
          selectedMoon.moonriseOffset,
          true
        )}
      </strong>
    </span>
  </div>
)}


{selectedMoon && (
  <section className="celestial-phase-cycles">
    {selectedCycle ? (
      <div className="celestial-cycle-navigation">

        <button
          type="button"
          onClick={() => navigateCycle(-1)}
          style={{
            visibility:
              selectedMoon.phaseCycles.length > 1
                ? 'visible'
                : 'hidden',
          }}
          aria-label="Previous phase cycle"
        >
          ‹
        </button>

        <strong>
          Cycle Name: {selectedCycle.name}
        </strong>

        <button
          type="button"
          onClick={() => navigateCycle(1)}
          style={{
            visibility:
              selectedMoon.phaseCycles.length > 1
                ? 'visible'
                : 'hidden',
          }}
          aria-label="Next phase cycle"
        >
          ›

        </button>

      </div>
    ) : (
      <p>No phase cycles configured.</p>
    )}

    {selectedCycle && (
      <div className="celestial-cycle-properties">

        <div>
          <strong>Structure:</strong>
          <span>{selectedCycle.structure}</span>
        </div>
<div>
  <strong>Cycle Measurement:</strong>
  <span>
    {selectedCycle.cycleMeasurement === 'calendar'
      ? 'Calendar'
      : 'Duration'}
  </span>
</div>
        <div>
<strong>Length:</strong>
<span>
  {selectedCycle.cycleMeasurement === 'calendar'
    ? 'Yearly'
    : formatCycleDuration(
        selectedCycle.cycleDuration
      )}
</span>
        </div>

<div>
  <strong>Offset:</strong>

  <span>
    {formatCycleDuration(
      selectedCycle.cycleOffset
    )}

    {cycleOffsetResult && (
      <>
        {' — '}
        {cycleOffsetResult.name}
      </>
    )}
  </span>
</div>

      </div>
    )}

{selectedCycle && keywords.length > 0 && (
  <div className="celestial-keywords-section">

    <div className="celestial-keywords-navigation">

      <button
        type="button"
        onClick={() => navigateKeywords(-1)}
        style={{
          visibility:
            keywords.length > keywordsPerPage
              ? 'visible'
              : 'hidden',
        }}
        aria-label="Previous keywords"
      >
        ‹
      </button>

      <button
        type="button"
        onClick={() => navigateKeywords(1)}
        style={{
          visibility:
            keywords.length > keywordsPerPage
              ? 'visible'
              : 'hidden',
        }}
        aria-label="Next keywords"
      >
        ›
      </button>

    </div>

    <div className="celestial-keywords-grid">
      {visibleKeywords.map(keyword => (

<div
  key={keyword.id}
  className="celestial-keyword-panel"
>
  <strong>
    Keyword: {'{'}{keyword.name}{'}'}
  </strong>

<div className="celestial-keyword-entry-header">
  <strong>Name</strong>
  <strong>
    {selectedCycle.cycleMeasurement === 'calendar'
      ? 'Start Date'
      : 'Duration'}
  </strong>
</div>

<div className="celestial-keyword-entries">

   <div className="celestial-keyword-entry-scroll">
  {keyword.entries.map(entry => (
    <div
      key={entry.id}
      className="celestial-keyword-entry"
    >
      <span>
        {entry.name || '(Blank)'}
      </span>

<span>
  {selectedCycle.cycleMeasurement === 'calendar'
    ? (
        entry.startMonthId !== undefined &&
        entry.startDay !== undefined
          ? formatDate(
              entry.startMonthId,
              entry.startDay
            )
          : 'Not configured'
      )
    : entry.phaseDuration}
</span>
    </div>
  ))}
</div>
  </div>

{selectedCycle.cycleMeasurement !== 'calendar' && (
  <div className="celestial-keyword-progression">
    <span>Progression Style:</span>

    <strong>
      {keyword.progressionStyle.charAt(0).toUpperCase() +
        keyword.progressionStyle.slice(1)}
    </strong>
  </div>
)}
</div>

      ))}
    </div>

  </div>
)}


  </section>
)}

{!selectedMoon && (
  <p>No moons configured.</p>
)}
  </div>
) : activeDetailsTab === 'zodiac' ? (
  <p>Zodiac details will appear here.</p>
) : activeDetailsTab === 'notables' ? (
  <p>Notables will appear here.</p>
) : (
  <p>Ruleset details will appear here.</p>
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
