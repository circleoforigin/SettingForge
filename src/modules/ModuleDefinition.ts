import type {
  EventDefinition,
} from '../events/EventDefinition';

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  devUrl?: string;
  productionEntry?: string;

  events: EventDefinition[];
}
