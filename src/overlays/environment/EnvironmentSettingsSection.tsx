import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface EnvironmentSettingsEntry
{
  id: string;
}

interface EnvironmentSettingsSectionProps<
  T extends EnvironmentSettingsEntry
>
{
  title: string;
  entries: T[];
  minimumEntries?: number;
  createEntry: () => T;
  onChange: (entries: T[]) => void;
  renderEntry: (
    entry: T,
    update: (changes: Partial<T>) => void
  ) => ReactNode;
}

export function EnvironmentSettingsSection<
  T extends EnvironmentSettingsEntry
>({
  title,
  entries,
  minimumEntries = 1,
  createEntry,
  onChange,
  renderEntry,
}: EnvironmentSettingsSectionProps<T>)
{
  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const sectionRef =
    useRef<HTMLElement>(null);

  const selectedEntry =
    entries.find(entry => entry.id === selectedId);

  useEffect(() =>
  {
    if (
      selectedId &&
      !entries.some(entry => entry.id === selectedId)
    )
    {
      setSelectedId(null);
    }
  }, [entries, selectedId]);

  useEffect(() =>
  {
    const handlePointerDown = (event: PointerEvent) =>
    {
      if (
        sectionRef.current &&
        !sectionRef.current.contains(
          event.target as Node
        )
      )
      {
        setSelectedId(null);
      }
    };

    document.addEventListener(
      'pointerdown',
      handlePointerDown
    );

    return () =>
    {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown
      );
    };
  }, []);

  const addEntry = () =>
  {
    const entry = createEntry();

    onChange([...entries, entry]);
    setSelectedId(null);
  };

  const removeEntry = () =>
  {
    if (
      !selectedEntry ||
      entries.length <= minimumEntries
    )
    {
      return;
    }

    onChange(
      entries.filter(entry =>
        entry.id !== selectedEntry.id
      )
    );

    setSelectedId(null);
  };

  return (
    <section
      ref={sectionRef}
      className="environment-settings-section"
    >
      <div className="environment-settings-section-header">
        <h3>{title}</h3>

        <button
          type="button"
          disabled={
            !!selectedEntry &&
            entries.length <= minimumEntries
          }
          onClick={
            selectedEntry
              ? removeEntry
              : addEntry
          }
        >
          {selectedEntry ? 'Remove' : 'Add'}
        </button>
      </div>

      <div className="environment-settings-entry-list">
        {entries.map(entry => (
          <div
            key={entry.id}
            className={
              selectedId === entry.id
                ? 'environment-settings-entry selected'
                : 'environment-settings-entry'
            }
            onPointerDown={() =>
              setSelectedId(entry.id)
            }
            onFocusCapture={() =>
              setSelectedId(entry.id)
            }
          >
            {renderEntry(
              entry,
              changes =>
              {
                onChange(
                  entries.map(current =>
                    current.id === entry.id
                      ? {
                          ...current,
                          ...changes,
                        }
                      : current
                  )
                );
              }
            )}
          </div>
        ))}
      </div>
    </section>
  );
}