import {
  useEffect,
  useRef,
} from 'react';

interface SimClockValueControlProps
{
  label: string;
  value: string;
  onStep?: (direction: 1 | -1) => void;
}

const INITIAL_REPEAT_DELAY = 400;
const REPEAT_INTERVAL = 100;
const FAST_REPEAT_INTERVAL = 40;
const ACCELERATION_DELAY = 1200;

export function SimClockValueControl({
  label,
  value,
  onStep,
}: SimClockValueControlProps)
{
  const timeoutRef =
    useRef<number | null>(null);

  const intervalRef =
    useRef<number | null>(null);

  const accelerationRef =
    useRef<number | null>(null);

  const clearRepeat = () =>
  {
    if (timeoutRef.current !== null)
    {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (intervalRef.current !== null)
    {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (accelerationRef.current !== null)
    {
      window.clearTimeout(accelerationRef.current);
      accelerationRef.current = null;
    }
  };

  const beginRepeat = (
    direction: 1 | -1
  ) =>
  {
    clearRepeat();

    onStep?.(direction);

    timeoutRef.current =
      window.setTimeout(() =>
      {
        intervalRef.current =
          window.setInterval(
            () => onStep?.(direction),
            REPEAT_INTERVAL
          );

        accelerationRef.current =
          window.setTimeout(() =>
          {
            if (intervalRef.current !== null)
            {
              window.clearInterval(
                intervalRef.current
              );
            }

            intervalRef.current =
              window.setInterval(
                () => onStep?.(direction),
                FAST_REPEAT_INTERVAL
              );
          }, ACCELERATION_DELAY);
      }, INITIAL_REPEAT_DELAY);
  };

  useEffect(() =>
  {
    return clearRepeat;
  }, []);

  return (
    <div className="sim-clock-field-control">
      <div className="sim-clock-field-value">
        {value}
      </div>

      <div className="sim-clock-field-arrows">
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onPointerDown={() =>
            beginRepeat(1)
          }
          onPointerUp={clearRepeat}
          onPointerCancel={clearRepeat}
          onPointerLeave={clearRepeat}
        >
          ▲
        </button>

        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onPointerDown={() =>
            beginRepeat(-1)
          }
          onPointerUp={clearRepeat}
          onPointerCancel={clearRepeat}
          onPointerLeave={clearRepeat}
        >
          ▼
        </button>
      </div>
    </div>
  );
}