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

    window: {
      setTitle(title: string): Promise<boolean>;
      closeApp(): Promise<boolean>;
    };

    activation: {
      getStatus(): Promise<ActivationStatus>;
      register(input: {
        email: string;
        deviceName: string;
      }): Promise<ActivationStatus>;
      validate(): Promise<ActivationStatus>;
    };
  };
}

type ActivationState =
  | 'unchecked'
  | 'unregistered'
  | 'authorized'
  | 'denied'
  | 'offline'
  | 'invalid-request'
  | 'error';

interface ActivationStatus {
  state: ActivationState;
  deviceId: string;
  deviceName: string;
  email?: string;
  previouslyAuthorized: boolean;
  lastValidatedAt?: string;
  message?: string;
}
}
