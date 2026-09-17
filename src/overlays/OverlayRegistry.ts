import type { OverlayDefinition } from './OverlayDefinition';

export class OverlayRegistry {
  private overlays = new Map<string, OverlayDefinition>();

  register(overlay: OverlayDefinition): void {
    this.overlays.set(overlay.id, overlay);
  }

  get(id: string): OverlayDefinition | undefined {
    return this.overlays.get(id);
  }

  getAll(): OverlayDefinition[] {
    return Array.from(this.overlays.values());
  }
}