import {
  OccurrenceReactions,
  type OccurrenceReaction,
} from '@settingforge/module-sdk';

export {
  OccurrenceReactions,
};

export type {
  OccurrenceReaction,
};

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

export function combineOccurrenceReactions(
  reactions: readonly OccurrenceReaction[]
): OccurrenceReaction
{
  if (reactions.includes(OccurrenceReactions.Interrupt))
  {
    return OccurrenceReactions.Interrupt;
  }

  if (reactions.includes(OccurrenceReactions.Recalculate))
  {
    return OccurrenceReactions.Recalculate;
  }

  if (reactions.includes(OccurrenceReactions.End))
  {
    return OccurrenceReactions.End;
  }

  if (reactions.includes(OccurrenceReactions.None))
  {
    return OccurrenceReactions.None;
  }

  return OccurrenceReactions.Notify;
}