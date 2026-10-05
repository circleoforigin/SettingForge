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

export const OccurrenceReactions = {
  Notify: 'notify',
  Recalculate: 'recalculate',
  Interrupt: 'interrupt',
} as const;

export type OccurrenceReaction =
  typeof OccurrenceReactions[
    keyof typeof OccurrenceReactions
  ];