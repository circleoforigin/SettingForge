import { OverlayRegistry } from './OverlayRegistry';
import type { OverlayDefinition } from './OverlayDefinition';
import { TestOverlaySurface } from './TestOverlaySurface';
import { MessengerSurface } from './messenger/MessengerSurface';

export const overlayRegistry =
  new OverlayRegistry();

const testOverlay: OverlayDefinition = {
  id: 'test-overlay',
  name: 'Test Overlay',
  description:
    'Temporary overlay used to develop and verify SettingForge overlay support.',
  version: '0.1.0',
  Surface: TestOverlaySurface,
};

overlayRegistry.register(
  testOverlay
);

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