import {
  useEffect,
  useState,
} from 'react';
import type { OverlaySurfaceProps } from '../OverlayDefinition';
import { celestialService } from '../../simulation/CelestialService';
import type { CelestialSettings } from '../../simulation/CelestialSettings';

export function CelestialSurface({
  mountId = 'bottom-center',
}: OverlaySurfaceProps)
{
  const [expanded, setExpanded] = useState(false);

  const [settings, setSettings] =
    useState<CelestialSettings>(
      () => celestialService.getSettings()
    );

  useEffect(() =>
  {
    return celestialService.subscribe(
      nextSettings =>
      {
        setSettings(nextSettings);
      }
    );
  }, []);

  return (
    <div
      className="celestial-surface"
      data-mount={mountId}
    >
      {!expanded ? (
        <button
          type="button"
          className="celestial-summary"
          onClick={() => setExpanded(true)}
        >
          Celestial
        </button>
      ) : (
        <div className="celestial-expanded">
          <button
            type="button"
            className="celestial-context-tab"
            onClick={() =>
              setExpanded(false)
            }
          >
            Celestial
          </button>

          <div className="celestial-content">
            <strong>
              Celestial Configuration
            </strong>

            <p>
              Configured season starts:
              {' '}
              {settings.seasonStarts.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
