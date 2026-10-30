
import {
  useState,
} from 'react';

import {
  celestialService,
} from '../../simulation/CelestialService';

import type {
  CelestialSettings,
} from '../../simulation/CelestialSettings';

interface CelestialSettingsDialogProps
{
  onClose: () => void;
}

export function CelestialSettingsDialog({
  onClose,
}: CelestialSettingsDialogProps)
{
  const [draft] = useState<CelestialSettings>(
    () => celestialService.getSettings()
  );

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
          <section>
            <h3>Seasons</h3>

            <p>
              Configured season starts:
              {' '}
              {draft.seasonStarts.length}
            </p>
          </section>
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
