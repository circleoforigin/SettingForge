import type {
  EventDefinition,
} from '@settingforge/module-sdk';

export const celestialEventDefinitions:
  EventDefinition[] = [
    {
      id: 'Celestial.MarkersChanged',
      label: 'Celestial Markers Changed',
      description:
        'Provides the current collection of celestial markers available for simulation time progression.',

      delivery: 'state',

      fields: [
        {
          key: 'markers',
          label: 'Celestial Markers',
          type: 'array',
        },
      ],
    },
  ];