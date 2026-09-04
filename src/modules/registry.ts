import {
  ModuleRegistry,
} from './ModuleRegistry';

import {
  eventRegistry,
} from '../events/EventRegistry';

import type { ModuleDefinition } from './ModuleDefinition';

export const moduleRegistry =
  new ModuleRegistry();

const sacscapeModule : ModuleDefinition = {
  id: 'sacscape',
  name: 'SACscape',
  description:
    'Spatial audio and soundscape control.',
  version: '1.0.0',
  devUrl: 'http://localhost:5173',
  productionEntry: 'index.html',

  events: [
    {
      type: 'sacscape.scene.opened',
      description:
        'Fired when SACscape opens and activates a Scene.',
      visibility: 'public',
    },

    {
      type: 'sacscape.scene.closed',
      description:
        'Fired when SACscape closes the active Scene.',
      visibility: 'public',
    },

    {
      type: 'sacscape.loopingZone.spawned',
      description:
        'Fired when a Looping Zone generates a runtime sound.',
      visibility: 'public',
    },
  ],
};

moduleRegistry.register(
  sacscapeModule
);

eventRegistry.registerModuleEvents(
  sacscapeModule.id,
  sacscapeModule.name,
  [...sacscapeModule.events]
);

const regionsModule: ModuleDefinition = {
  id: 'regions',
  name: 'Regions',
  description:
    'Interactive maps, locations, connections, and regional features.',
  version: '1.0.0',
  devUrl: 'http://localhost:5175',
  productionEntry: 'index.html',

  events: [
    {
      type: 'regions.map.opened',
      description:
        'Fired when Regions opens a map.',
      visibility: 'public',
    },

    {
      type: 'regions.location.selected',
      description:
        'Fired when a location is selected.',
      visibility: 'public',
    },

    {
      type: 'regions.location.entered',
      description:
        'Fired when a location becomes the active location.',
      visibility: 'public',
    },
  ],
};

moduleRegistry.register(
  regionsModule
);

eventRegistry.registerModuleEvents(
  regionsModule.id,
  regionsModule.name,
  [...regionsModule.events]
);
