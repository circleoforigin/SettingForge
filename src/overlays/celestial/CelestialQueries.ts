import type { QueryDefinition } from '@settingforge/module-sdk';

export const celestialQueryDefinitions:
  QueryDefinition[] = [
    {
      id: 'Celestial.ResolveMarker',
      label: 'Resolve Celestial Marker',

      description: 'Resolves the next occurrence of a celestial marker strictly after a specified simulation time.',

      input: [
        {
          key: 'markerId',
          label: 'Marker ID',
          type: 'string',
          required: true,
        },
        {
          key: 'afterTime',
          label: 'After Time',
          type: 'number',
          required: true,
        },
        {
          key: 'era',
          label: 'Calendar Era',
          type: 'object',
          required: true,
        },
      ],

      output: [
        {
          key: 'targetTime',
          label: 'Resolved Time',
          type: 'number',
          description:
            'Next occurrence timestamp. Omitted when the marker cannot be resolved.',
        },
      ],
    },
  ];