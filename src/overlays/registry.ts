import { OverlayRegistry } from './OverlayRegistry';
import type { OverlayDefinition } from './OverlayDefinition';
import { MessengerSurface } from './messenger/MessengerSurface';

export const overlayRegistry =
  new OverlayRegistry();

const messengerOverlay: OverlayDefinition = {
  id: 'messenger',
  name: 'Messenger',
  description:
    'Persistent communications interface for host and player messaging.',
  version: '0.1.0',
  Surface: MessengerSurface,
};

overlayRegistry.register(
  messengerOverlay
)