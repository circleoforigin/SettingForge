import { OverlayRegistry } from './OverlayRegistry';
import type { OverlayDefinition } from './OverlayDefinition';
import { MessengerSurface } from './messenger/MessengerSurface';
import { SimClockSurface } from './simClock/SimClockSurface';

export const overlayRegistry =
  new OverlayRegistry();

const messengerOverlay: OverlayDefinition = {
  id: 'messenger',
  name: 'Messenger',
  description:
    'Persistent communications interface for host and player messaging.',
  version: '0.1.0',
  layout: 'positioned',
  Surface: MessengerSurface,
};

const simClockOverlay: OverlayDefinition = {
  id: 'sim-clock',
  name: 'SimClock',
  description:
    'Persistent simulation time and calendar interface.',
  version: '0.1.0',
  layout: 'positioned',
  Surface: SimClockSurface,
};

const occurrenceOverlay: OverlayDefinition = {
  id: 'occurrences',
  name: 'Occurrences',
  description:
    'Persistent interface for prospective simulation occurrences.',
  version: '0.1.0',
  layout: 'fixed',
};

overlayRegistry.register(
  messengerOverlay
);

overlayRegistry.register(
  simClockOverlay
);

overlayRegistry.register(
  occurrenceOverlay
);