import {
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
  onChange: (entries: T[]) => void;
  renderEntry: (
    entry: T,
    update: (changes: Partial<T>) => void
  ) => ReactNode;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

export function EnvironmentSettingsSection<
  T extends EnvironmentSettingsEntry
>({
  title,
  entries,
  onChange,
  renderEntry,
  selectedId,
  onSelect,
}: EnvironmentSettingsSectionProps<T>)
{
  return (
    <section className="environment-settings-section">
      <div className="environment-settings-section-header">
        <h3>{title}</h3>
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
            onClick={
              onSelect
                ? () => onSelect(entry.id)
                : undefined
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