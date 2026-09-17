import { OverlayRegistry } from './OverlayRegistry';
import type { OverlayDefinition } from './OverlayDefinition';
import { TestOverlaySurface } from './TestOverlaySurface';

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