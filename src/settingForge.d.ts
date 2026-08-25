export {};

declare global {
  interface Window {
    settingForge: {
      storage: {
  read<T>(
    moduleId: string,
    collection: string,
    key?: string
  ): Promise<T>;

  write<T>(
    moduleId: string,
    collection: string,
    key: string,
    value: T
  ): Promise<boolean>;

  delete(
    moduleId: string,
    collection: string,
    key: string
  ): Promise<boolean>;
};
    };
  }
}