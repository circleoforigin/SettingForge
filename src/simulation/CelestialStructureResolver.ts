import type { CelestialTag } from './CelestialSettings';
import {
  resolveCelestialTag,
  type ResolvedCelestialTag,
} from './CelestialTagResolver';

export interface CelestialTagProgress
{
  tagId: string;
  step: number;
}

export interface ResolvedCelestialStructure
{
  name: string;
  tags: ResolvedCelestialTag[];
}

export function resolveCelestialStructure(
  structure: string,
  tags: CelestialTag[],
  progress: CelestialTagProgress[]
): ResolvedCelestialStructure
{
  const tagByName = new Map(
    tags.map(tag => [tag.name, tag])
  );

  const progressById = new Map(
    progress.map(item => [
      item.tagId,
      item.step,
    ])
  );

  const resolvedTags = new Map<
    string,
    ResolvedCelestialTag
  >();

  function resolveText(
    text: string
  ): string
  {
    return text.replace(
      /\{([^{}]+)\}/g,
      (token, tagName: string) =>
      {
        const tag = tagByName.get(tagName);

        if (!tag)
        {
          return token;
        }

        const existing = resolvedTags.get(tag.id);

        if (existing)
        {
          return resolveText(existing.entry.name);
        }

        const step = progressById.get(tag.id) ?? 0;

        const resolved =
          resolveCelestialTag(
            tag,
            step
          );

        if (!resolved)
        {
          return token;
        }

        resolvedTags.set(
          tag.id,
          resolved
        );

        return resolveText(resolved.entry.name);
      }
    );
  }

  const name = resolveText(structure)
    .replace(/\s+/g, ' ')
    .trim();

  return {
    name,
    tags: Array.from(resolvedTags.values()),
  };
}