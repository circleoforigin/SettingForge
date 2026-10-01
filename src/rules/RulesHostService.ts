import type {
  HostRequestMessage,
} from '@settingforge/module-sdk';

import type {
  World,
} from '../models/World';

import {
  rulesService,
} from './RulesService';

type RegisterRequestHandler = (
  type: string,
  handler: (
    message: HostRequestMessage
  ) => Promise<unknown>
) => () => void;

interface RulesetInteractionRequest {
  target: string;
}

export function registerRulesHostService(
  registerRequestHandler:
    RegisterRequestHandler,
  getActiveWorld:
    () => World | null
): () => void {
  return registerRequestHandler(
    'rules.getInteraction',
    async (request) => {
      const payload =
        request.payload as
          | RulesetInteractionRequest
          | undefined;

      if (
        !payload ||
        typeof payload.target !==
          'string' ||
        !payload.target.trim()
      ) {
        throw new Error(
          'Ruleset interaction target is required.'
        );
      }

      const world =
        getActiveWorld();

      if (!world) {
        return null;
      }

      const interaction =
        rulesService.getInteraction(
          world,
          payload.target
        );

      if (!interaction) {
        return null;
      }

      const activeRuleset =
        rulesService.getActiveRuleset(
          world
        );

      if (!activeRuleset) {
        return null;
      }

      return {
        rulesetId:
          activeRuleset.definition.id,

        rulesetVersion:
          activeRuleset.definition
            .version,

        interaction,
      };
    }
  );
}