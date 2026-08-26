export {};

declare global {
  interface Window {
  settingForge: {
    storage: {
      read(
        moduleId: string,
        collection: string,
        key?: string
      ): Promise<unknown>;

      write(
        moduleId: string,
        collection: string,
        key: string,
        value: unknown
      ): Promise<boolean>;

      delete(
        moduleId: string,
        collection: string,
        key: string
      ): Promise<boolean>;
    };

    file: {
      write(
        moduleId: string,
        folder: string,
        fileName: string,
        bytes: number[]
      ): Promise<{
        folder: string;
        fileName: string;
      }>;

      read(
        moduleId: string,
        folder: string,
        fileName: string
      ): Promise<number[] | null>;

      delete(
        moduleId: string,
        folder: string,
        fileName: string
      ): Promise<boolean>;
    };
  };
}
}