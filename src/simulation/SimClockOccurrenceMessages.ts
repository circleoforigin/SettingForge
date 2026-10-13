export interface SimClockOccurrenceMessageDefinition
{
  label: string;
  template: string;
}

export const SIM_CLOCK_OCCURRENCE_MESSAGES = {
  sunrise: {
    label: 'Sunrise',
    template: 'The sun rises.',
  },

  noon: {
    label: 'Noon',
    template: 'The sun reaches its zenith.',
  },

  sunset: {
    label: 'Sunset',
    template: 'The sun sets.',
  },

  midnight: {
    label: 'Midnight',
    template: 'Midnight arrives.',
  },
} as const satisfies Record<
  string,
  SimClockOccurrenceMessageDefinition
>;

export type SimClockOccurrenceMessageKey =
  keyof typeof SIM_CLOCK_OCCURRENCE_MESSAGES;

export function formatSimClockOccurrenceMessage(
  key: SimClockOccurrenceMessageKey
): string
{
  return SIM_CLOCK_OCCURRENCE_MESSAGES[
    key
  ].template;
}