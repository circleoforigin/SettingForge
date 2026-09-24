import {
  rulesetRegistry,
} from './RulesetRegistry';

import {
  srd521Ruleset,
} from './rulesets/srd521/Srd521Ruleset';

let registered = false;

export function registerBuiltInRulesets(): void {
  if (registered) {
    return;
  }

  registered = true;

  rulesetRegistry.register(
    srd521Ruleset
  );
}