export interface EventDefinition {
  type: string;

  /**
   * Short user-facing explanation of when this event fires.
   */
  description: string;

  /**
   * Public events can be exposed to other modules and
   * displayed in SettingForge's Events by Module UI.
   *
   * Internal events remain available to SettingForge
   * diagnostics but are not advertised to modules.
   */
  visibility: 'public' | 'internal';
}