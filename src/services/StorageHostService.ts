import type {
  HostRequestMessage,
} from '../events/HostMessage';

import type {
  StorageDeleteRequest,
  StorageLoadRequest,
  StorageSaveRequest,
} from './StorageServiceTypes';

export function registerStorageHostServices(
  registerRequestHandler: (
    type: string,
    handler: (
      request: HostRequestMessage
    ) => Promise<unknown>
  ) => () => void
): () => void {
  const unregisterLoad =
  registerRequestHandler(
    'storage.load',
    async (request) => {
      const payload =
        request.payload as StorageLoadRequest;

      if (!payload?.collection) {
        throw new Error(
          'storage.load requires a collection.'
        );
      }

      return window.settingForge.storage.read(
        request.sourceModuleId,
        payload.collection,
        payload.key
      );
    }
  );

  const unregisterSave =
    registerRequestHandler(
      'storage.save',
      async (request) => {
        const payload =
          request.payload as StorageSaveRequest;

        if (
          !payload?.collection ||
          !payload?.key
        ) {
          throw new Error(
            'storage.save requires collection and key.'
          );
        }

        await window.settingForge.storage.write(
            request.sourceModuleId,
            payload.collection,
            payload.key,
            payload.data
        );

        return {
          saved: true,
          collection: payload.collection,
          key: payload.key,
        };
      }
    );

  const unregisterDelete =
  registerRequestHandler(
    'storage.delete',
    async (request) => {
      const payload =
        request.payload as StorageDeleteRequest;

      if (
        !payload?.collection ||
        !payload?.key
      ) {
        throw new Error(
          'storage.delete requires collection and key.'
        );
      }

      const deleted =
        await window.settingForge.storage.delete(
          request.sourceModuleId,
          payload.collection,
          payload.key
        );

      return {
        deleted,
        collection: payload.collection,
        key: payload.key,
      };
    }
  );

  return () => {
    unregisterLoad();
    unregisterSave();
    unregisterDelete();
  };
}