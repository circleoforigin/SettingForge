import type { World } from '../../models/World';
import { rulesService } from '../../rules/RulesService';
import {
  combineOccurrenceReactions,
  OccurrenceReactions,
} from './OccurrenceProgression';
import type {
  OccurrenceProgressionMode,
  OccurrenceReaction,
} from './OccurrenceProgression';

export function resolveOccurrenceReaction(
  world: World,
  tags: readonly string[],
  mode: OccurrenceProgressionMode
): OccurrenceReaction
{
  const reactions =
    tags.map(
      (tagId) =>
      {
        const tag =
          rulesService.getOccurrenceTag(
            world,
            tagId
          );

        return (
          tag?.reactions[mode] ??
          OccurrenceReactions.Notify
        );
      }
    );

  return combineOccurrenceReactions(reactions);
}