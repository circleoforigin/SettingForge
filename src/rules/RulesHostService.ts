import type { HostRequestMessage } from '@settingforge/module-sdk';
import type { World } from '../models/World';
import { rulesService } from './RulesService';

type RegisterRequestHandler = (
  type: string,
  handler: (
    message: HostRequestMessage
  ) => Promise<unknown>
) => () => void;

interface RulesetInteractionRequest 
{
  target: string;
}

interface RulesetInteractionDerivedRequest
{
  target: string;
  values: Record<string, unknown>;
}

interface RulesetFunctionRequest
{
  functionId: string;
  input?: unknown;
}

export function registerRulesHostService(
  registerRequestHandler:
    RegisterRequestHandler,
  getActiveWorld:
    () => World | null
): () => void 
{
  const unregisterInteraction =
    registerRequestHandler(
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

      const world = getActiveWorld();

      if (!world) 
      {
        return null;
      }

      const interaction =
        rulesService.getInteraction(
          world,
          payload.target
        );

      if (!interaction) 
      {
        return null;
      }

      const activeRuleset = rulesService.getActiveRuleset(world);

      if (!activeRuleset)
      {
        return null;
      }

      return {
        rulesetId: activeRuleset.definition.id,
        rulesetVersion: activeRuleset.definition.version,
        interaction,
      };
    }
  );

    const unregisterDerivedInteraction =
    registerRequestHandler(
      'rules.deriveInteraction',
      async (request) =>
      {
        const payload =
          request.payload as
            | RulesetInteractionDerivedRequest
            | undefined;

        if (
          !payload ||
          typeof payload.target !== 'string' ||
          !payload.target.trim()
        )
        {
          throw new Error(
            'Ruleset interaction target is required.'
          );
        }

        const world =
          getActiveWorld();

        if (!world)
        {
          return null;
        }

        const interaction =
          rulesService.getInteraction(
            world,
            payload.target
          );

        if (!interaction?.derived)
        {
          return null;
        }

        return rulesService.executeFunction(
          world,
          interaction.derived.functionId,
          {
            values: payload.values,
          }
        );
      }
    );

  const unregisterFunction =
  registerRequestHandler(
    'rules.executeFunction',
    async (request) =>
    {
      const payload =
        request.payload as
          | RulesetFunctionRequest
          | undefined;

      if (
        !payload ||
        typeof payload.functionId !== 'string' ||
        !payload.functionId.trim()
      )
      {
        throw new Error(
          'Ruleset function ID is required.'
        );
      }

      const world =
        getActiveWorld();

      if (!world)
      {
        throw new Error(
          'No World is active.'
        );
      }

      return rulesService.executeFunction(
        world,
        payload.functionId,
        payload.input
      );
    }
  );

return () =>
{
  unregisterInteraction();
  unregisterDerivedInteraction();
  unregisterFunction();
};
}