import {
  useEffect,
  useRef,
} from 'react';

interface SimClockValueControlProps
{
  label: string;
  value: string;
  onStep?: (direction: 1 | -1) => void;
  onValueChange?: (value: string) => void;
}

const INITIAL_REPEAT_DELAY = 400;
const REPEAT_INTERVAL = 100;

export function SimClockValueControl({
  label,
  value,
  onStep,
  onValueChange,
}: SimClockValueControlProps)
{
  const timeoutRef = useRef<number | null>(null);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  const intervalRef = useRef<number | null>(null);

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
  };

  const beginRepeat = (direction: 1 | -1) =>
{
  clearRepeat();
  onStep?.(direction);
  timeoutRef.current = window.setTimeout(() =>
{
  intervalRef.current = window.setInterval(
    () => onStep?.(direction),
    REPEAT_INTERVAL
  );
}, INITIAL_REPEAT_DELAY);
  };

  useEffect(() =>
{
  return () =>
  {
    clearRepeat();
  };
}, []);

  return (
    <div className="sim-clock-field-control">
      {onValueChange ? (
  <input
    type="number"
    className="sim-clock-field-value sim-clock-field-value-input"
    aria-label={label}
    value={value}
    onChange={(event) =>
      onValueChange(event.target.value)
    }
  />
) : (
  <div className="sim-clock-field-value">
    {value}
  </div>
)}

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