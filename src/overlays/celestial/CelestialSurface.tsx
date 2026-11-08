import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { OverlaySurfaceProps } from '../OverlayDefinition';
import { celestialService } from '../../simulation/CelestialService';
import type { CelestialSettings } from '../../simulation/CelestialSettings';
import { simulationClockService } from '../../simulation/SimulationClockService';

interface CelestialTickerItem {
  id: string;
  bodyId: string;
  bodyName: string;
  cycleName: string;
  phaseName: string;
  notable: boolean;
}

interface CelestialTickerConjunction {
  id: string;
  name: string;
  bodyNames: string[];
}

interface CelestialTickerState {
  items: CelestialTickerItem[];
  conjunctions: CelestialTickerConjunction[];
}

export function CelestialSurface({
  mountId = 'bottom-center',
}: OverlaySurfaceProps)
{
  const [expanded, setExpanded] = useState(false);

  const [settings, setSettings] =
    useState<CelestialSettings>(
      () => celestialService.getSettings()
    );

  const [ticker, setTicker] =
  useState<CelestialTickerState>({
    items: [],
    conjunctions: [],
  });

  const tickerContentRef =
  useRef<HTMLSpanElement>(null);

const [tickerDistance, setTickerDistance] =
  useState(0);

useLayoutEffect(() =>
{
  const content = tickerContentRef.current;

  if (!content)
  {
    setTickerDistance(0);
    return;
  }

  const measure = () =>
  {
    setTickerDistance(
      content.getBoundingClientRect().width + 80
    );
  };

  const observer = new ResizeObserver(measure);

  observer.observe(content);
  measure();

  return () => observer.disconnect();
}, [
  ticker.items,
  ticker.conjunctions,
]);

useEffect(() =>
{
  const refreshTicker = () =>
  {
    const era =
      simulationClockService.getActiveEra();

    if (!era)
    {
      setTicker({
        items: [],
        conjunctions: [],
      });

      return;
    }

    const time =
      simulationClockService.getTime();

    setTicker(
      celestialService.getTickerSnapshot(
        time,
        era
      )
    );
  };

  refreshTicker();

  const unsubscribeClock =
    simulationClockService.subscribe(
      refreshTicker
    );

  const unsubscribeCelestial =
    celestialService.subscribe(
      refreshTicker
    );

  return () =>
  {
    unsubscribeClock();
    unsubscribeCelestial();
  };
}, []);

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
  title="Expand Celestial"
>
  <span className="celestial-ticker-viewport">
    {ticker.conjunctions.length === 1 ? (
      <span className="celestial-ticker-single-conjunction">
        {ticker.conjunctions[0].name}
        {': '}
        {ticker.conjunctions[0].bodyNames.join(', ')}
      </span>
    ) : (
<span
  className="celestial-ticker-track"
  style={{
    '--ticker-distance': `${tickerDistance}px`,
    '--ticker-duration': `${tickerDistance / 40}s`,
    animationPlayState:
      tickerDistance > 0 ? 'running' : 'paused',
  } as CSSProperties}
>
  {[0, 1].map(copy => (
    <span
      key={copy}
      ref={copy === 0 ? tickerContentRef : undefined}
      className="celestial-ticker-copy"
      aria-hidden={copy === 1}
    >
      {ticker.conjunctions.length > 1
        ? ticker.conjunctions.map((conjunction, index) => (
            <span
              key={conjunction.id}
              className="celestial-ticker-conjunction"
            >
              {conjunction.name}
              {': '}
              {conjunction.bodyNames.join(', ')}

              {index < ticker.conjunctions.length - 1 && (
                <span className="celestial-ticker-separator">
                  {' ✦ '}
                </span>
              )}
            </span>
          ))
        : ticker.items.map((item, index) => (
            <span
              key={item.id}
              className="celestial-ticker-item"
            >
              {item.bodyName}
              {': '}
              {item.phaseName}

              {index < ticker.items.length - 1 && (
                <span className="celestial-ticker-separator">
                  {' ✦ '}
                </span>
              )}
            </span>
          ))}
    </span>
  ))}
</span>
    )}
  </span>
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
