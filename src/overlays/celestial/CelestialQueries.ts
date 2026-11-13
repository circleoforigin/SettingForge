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

{
  id: 'Celestial.GetSeasonCalendar',
  label: 'Get Season Calendar',

  description:
    'Returns configured season starts and solar solstice dates ' +
    'for the requested calendar year and its adjacent years.',

  input: [
    {
      key: 'year',
      label: 'Calendar Year',
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
      key: 'previous',
      label: 'Previous Year',
      type: 'object',
      required: true,
    },
    {
      key: 'current',
      label: 'Current Year',
      type: 'object',
      required: true,
    },
    {
      key: 'next',
      label: 'Next Year',
      type: 'object',
      required: true,
    },
  ],
},

    {
  id: 'Celestial.GenerateOccurrences',
  label: 'Generate Celestial Occurrences',

  description:
    'Generates celestial Occurrences within a specified simulation-time interval without advancing time or modifying the Occurrences queue.',

  input: [
    {
      key: 'startTime',
      label: 'Start Time',
      type: 'number',
      required: true,
    },
    {
      key: 'endTime',
      label: 'End Time',
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
      key: 'occurrences',
      label: 'Generated Occurrences',
      type: 'array',
      required: true,
    },
  ],
},
  ];