import {
  hostServiceRegistry,
} from './registry';

import type {
  HostRequestMessage,
} from '../events/HostMessage';

import type {
  FileDeleteRequest,
  FileReadRequest,
  FileSaveRequest,
} from './FileServiceTypes';

function requireHostService(
  type: string
): void {
  if (!hostServiceRegistry.get(type)) {
    throw new Error(
      `Host service "${type}" is not registered.`
    );
  }
}

export function registerFileHostServices(
  registerRequestHandler: (
    type: string,
    handler: (
      request: HostRequestMessage
    ) => Promise<unknown>
  ) => () => void
): () => void {
  requireHostService(
    'file.save'
  );

  requireHostService(
    'file.read'
  );

  requireHostService(
    'file.delete'
  );

  const unregisterSave =
    registerRequestHandler(
      'file.save',
      async (request) => {
        const payload =
          request.payload as FileSaveRequest;

        if (
          !payload?.folder ||
          !payload?.fileName ||
          !Array.isArray(
            payload.bytes
          )
        ) {
          throw new Error(
            'file.save requires folder, fileName, and bytes.'
          );
        }

        return window.settingForge.file.write(
          request.sourceModuleId,
          payload.folder,
          payload.fileName,
          payload.bytes
        );
      }
    );

  const unregisterRead =
    registerRequestHandler(
      'file.read',
      async (request) => {
        const payload =
          request.payload as FileReadRequest;

        if (
          !payload?.folder ||
          !payload?.fileName
        ) {
          throw new Error(
            'file.read requires folder and fileName.'
          );
        }

        return window.settingForge.file.read(
          request.sourceModuleId,
          payload.folder,
          payload.fileName
        );
      }
    );

  const unregisterDelete =
    registerRequestHandler(
      'file.delete',
      async (request) => {
        const payload =
          request.payload as FileDeleteRequest;

        if (
          !payload?.folder ||
          !payload?.fileName
        ) {
          throw new Error(
            'file.delete requires folder and fileName.'
          );
        }

        const deleted =
          await window.settingForge.file.delete(
            request.sourceModuleId,
            payload.folder,
            payload.fileName
          );

        return {
          deleted,
          folder:
            payload.folder,
          fileName:
            payload.fileName,
        };
      }
    );

  return () => {
    unregisterSave();
    unregisterRead();
    unregisterDelete();
  };
}