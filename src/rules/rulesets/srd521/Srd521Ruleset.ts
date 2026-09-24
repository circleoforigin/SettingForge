import type {
  RulesetDefinition,
} from '../../RulesetDefinition';

export const SRD_521_RULESET_ID =
  'srd-5.2.1';

export const SRD_521_RULESET_VERSION =
  '0.1.0';

export const srd521Ruleset:
  RulesetDefinition = {
    id:
      SRD_521_RULESET_ID,

    name:
      'SRD 5.2.1',

    version:
      SRD_521_RULESET_VERSION,

    description:
      'SettingForge rules implementation based on SRD 5.2.1.',

    requirements: [],
  };