export const OccurrenceProgressionModes = {
  RealTime: 'realTime',
  Progress: 'progress',
  ToMarker: 'toMarker',
  Travel: 'travel',
} as const;

export type OccurrenceProgressionMode =
  typeof OccurrenceProgressionModes[
    keyof typeof OccurrenceProgressionModes
  ];