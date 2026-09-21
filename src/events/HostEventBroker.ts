import type {
  HostEventMessage,
  HostMessage,
  HostRequestMessage,
  HostResponseMessage,
} from './HostMessage';
import { actionRegistry } from '../actions/ActionRegistry';
import { actionStateStore } from '../actions/ActionStateStore';

type EventHandler =
  (message: HostEventMessage) => void;

type RequestHandler =
  (
    message: HostRequestMessage
  ) => Promise<unknown>;

interface PendingModuleRequest {
  moduleId: string;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;  
}

interface PendingRelayedRequest {
  sourceWindow: Window;
  sourceModuleId: string;
  targetModuleId: string;
  originalRequestId: string;
  type: string;
  timeoutId: ReturnType<typeof setTimeout>;
}

export class HostEventBroker {
    private readonly moduleWindows = new Map<string, Window>();  
  
  private readonly eventHandlers = new Map<string, Set<EventHandler>>();

  private readonly requestHandlers = new Map<string, RequestHandler>();

  private readonly pendingModuleRequests =
  new Map<string, PendingModuleRequest>();

  private readonly pendingRelayedRequests =
  new Map<string, PendingRelayedRequest>();

  start(): () => void {
    const handleMessage = (
      event: MessageEvent
    ) => {
      const message =
        event.data as HostMessage | undefined;

      if (!this.isHostMessage(message)) {
        return;
      }

      if (
        message.sourceModuleId &&
        message.sourceModuleId !==
            'settingforge'
        ) {
        const sourceWindow =
            event.source as Window | null;

        if (sourceWindow) {
            this.moduleWindows.set(
                message.sourceModuleId,
                sourceWindow
                );
            }
        }

      if (
  message.kind ===
  'event'
) {
  this.dispatchEvent(
    message
  );

  if (message.sourceModuleId !== 'settingforge' &&
      actionRegistry.get(message.type)) {
    this.relayAction(message);
  }

  return;
}

if (
  message.kind ===
  'response'
) {
  if (
    this.pendingRelayedRequests.has(
      message.requestId
    )
  ) {
    this.handleRelayedResponse(
      message
    );
  } else {
    this.handleModuleResponse(
      message
    );
  }

  return;
}

if (message.targetModuleId) {
  this.relayRequest(
    event,
    message
  );

  return;
}

void this.handleRequest(
  event,
  message
);
    };

    window.addEventListener(
      'message',
      handleMessage
    );

    return () => {
      window.removeEventListener(
        'message',
        handleMessage
      );
    };
  }

  private relayAction(message: HostEventMessage): void {
    const action = actionRegistry.get(message.type);
    if (action?.delivery === 'state') actionStateStore.retain(message);

    for (const [moduleId, moduleWindow] of this.moduleWindows) {
      if (moduleId === message.sourceModuleId) continue;
      moduleWindow.postMessage(message, '*');
    }
  }

  sendEventToModule(
    moduleId: string,
    message: HostEventMessage
  ): boolean {
    const moduleWindow = this.moduleWindows.get(moduleId);
    if (!moduleWindow) return false;

    moduleWindow.postMessage(message, '*');
    return true;
  }

  subscribe(
    type: string,
    handler: EventHandler
  ): () => void {
    let handlers =
      this.eventHandlers.get(type);

    if (!handlers) {
      handlers = new Set();
      this.eventHandlers.set(
        type,
        handlers
      );
    }

    handlers.add(handler);

    return () => {
      handlers?.delete(handler);

      if (handlers?.size === 0) {
        this.eventHandlers.delete(type);
      }
    };
  }

  registerRequestHandler(
    type: string,
    handler: RequestHandler
  ): () => void {
    this.requestHandlers.set(
      type,
      handler
    );

    return () => {
      if (
        this.requestHandlers.get(type) ===
        handler
      ) {
        this.requestHandlers.delete(type);
      }
    };
  }

  broadcast(
  type: string,
  payload?: unknown
): void {
  const message: HostEventMessage = {
    kind: 'event',
    id: crypto.randomUUID(),
    sourceModuleId:
      'settingforge',
    type,
    timestamp:
      Date.now(),
    payload,
  };

  for (
    const moduleWindow
    of this.moduleWindows.values()
  ) {
    moduleWindow.postMessage(
      message,
      '*'
    );
  }
}

sendToModule(
  moduleId: string,
  type: string,
  payload?: unknown
  ): boolean {
  const moduleWindow =
    this.moduleWindows.get(
      moduleId
    );

  if (!moduleWindow) {
    return false;
  }

  const message: HostEventMessage = {
    kind: 'event',
    id: crypto.randomUUID(),
    sourceModuleId:
      'settingforge',
    type,
    timestamp:
      Date.now(),
    payload,
  };

  moduleWindow.postMessage(
    message,
    '*'
  );

  return true;
}

sendRequestToModule(
  moduleId: string,
  type: string,
  payload?: unknown
): boolean {
  const moduleWindow =
    this.moduleWindows.get(moduleId);

  if (!moduleWindow) {
    return false;
  }

  const message: HostRequestMessage = {
    kind: 'request',
    id: crypto.randomUUID(),
    sourceModuleId: 'settingforge',
    type,
    timestamp: Date.now(),
    payload,
  };

  moduleWindow.postMessage(
    message,
    '*'
  );

  return true;
}

requestModule<T>(
  moduleId: string,
  type: string,
  payload?: unknown,
  timeoutMs = 5000
): Promise<T> {
  const moduleWindow = this.moduleWindows.get(moduleId);

  if (!moduleWindow) {
    return Promise.reject(
      new Error(`Module "${moduleId}" is not connected.`)
    );
  }

  const id = crypto.randomUUID();

  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      this.pendingModuleRequests.delete(id);

      reject(
        new Error(`Module "${moduleId}" did not respond to "${type}".`)
      );
    }, timeoutMs);

    this.pendingModuleRequests.set(id, {
      moduleId,
      resolve: (value) => resolve(value as T),
      reject,
      timeoutId,
    });

    const message: HostRequestMessage = {
      kind: 'request',
      id,
      sourceModuleId: 'settingforge',
      type,
      timestamp: Date.now(),
      payload,
    };

    moduleWindow.postMessage(message, '*');
  });
}

private relayRequest(
  event: MessageEvent,
  request: HostRequestMessage
): void {
  const targetModuleId =
    request.targetModuleId;

  const sourceWindow =
    event.source as Window | null;

  if (
    !targetModuleId ||
    !sourceWindow
  ) {
    return;
  }

  const targetWindow =
    this.moduleWindows.get(
      targetModuleId
    );

  if (!targetWindow) {
    const response: HostResponseMessage = {
      kind: 'response',
      id: crypto.randomUUID(),
      requestId: request.id,
      sourceModuleId: 'settingforge',
      type: `${request.type}.response`,
      timestamp: Date.now(),
      ok: false,
      error:
        `Module "${targetModuleId}" is not connected.`,
    };

    sourceWindow.postMessage(
      response,
      '*'
    );

    return;
  }

  const relayRequestId =
    crypto.randomUUID();

  const timeoutId =
    setTimeout(
      () => {
        const pending =
          this.pendingRelayedRequests.get(
            relayRequestId
          );

        if (!pending) {
          return;
        }

        this.pendingRelayedRequests.delete(
          relayRequestId
        );

        const response: HostResponseMessage = {
          kind: 'response',
          id: crypto.randomUUID(),
          requestId:
            pending.originalRequestId,
          sourceModuleId:
            'settingforge',
          type:
            `${pending.type}.response`,
          timestamp:
            Date.now(),
          ok:
            false,
          error:
            `Module "${pending.targetModuleId}" did not respond to "${pending.type}".`,
        };

        pending.sourceWindow.postMessage(
          response,
          '*'
        );
      },
      5000
    );

  this.pendingRelayedRequests.set(
    relayRequestId,
    {
      sourceWindow,
      sourceModuleId:
        request.sourceModuleId,
      targetModuleId,
      originalRequestId:
        request.id,
      type:
        request.type,
      timeoutId,
    }
  );

  const forwardedRequest:
    HostRequestMessage = {
      ...request,

      id:
        relayRequestId,

      sourceModuleId:
        request.sourceModuleId,

      targetModuleId:
        undefined,
  };

  targetWindow.postMessage(
    forwardedRequest,
    '*'
  );
}

private handleRelayedResponse(
  response: HostResponseMessage
): void {
  const pending =
    this.pendingRelayedRequests.get(
      response.requestId
    );

  if (!pending) {
    return;
  }

  if (
    response.sourceModuleId !==
    pending.targetModuleId
  ) {
    return;
  }

  clearTimeout(
    pending.timeoutId
  );

  this.pendingRelayedRequests.delete(
    response.requestId
  );

  const relayedResponse:
    HostResponseMessage = {
      ...response,

      id:
        crypto.randomUUID(),

      requestId:
        pending.originalRequestId,
  };

  pending.sourceWindow.postMessage(
    relayedResponse,
    '*'
  );
}

private handleModuleResponse(response: HostResponseMessage): void {
  const pending =
    this.pendingModuleRequests.get(response.requestId);

  if (!pending) {
    return;
  }

  if (response.sourceModuleId !== pending.moduleId) {
    return;
  }

  clearTimeout(pending.timeoutId);
  this.pendingModuleRequests.delete(response.requestId);

  if (response.ok) {
    pending.resolve(response.payload);
    return;
  }

  pending.reject(
    new Error(
      response.error ??
      `Module "${pending.moduleId}" request failed.`
    )
  );
}

  private dispatchEvent(
    message: HostEventMessage
  ): void {
    const handlers =
      this.eventHandlers.get(message.type);

    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      handler(message);
    }
  }

  private async handleRequest(
    event: MessageEvent,
    request: HostRequestMessage
  ): Promise<void> {
    const handler =
      this.requestHandlers.get(request.type);

    let response: HostResponseMessage;

    if (!handler) {
      response = {
        kind: 'response',
        id: crypto.randomUUID(),
        requestId: request.id,
        sourceModuleId: 'settingforge',
        type: `${request.type}.response`,
        timestamp: Date.now(),
        ok: false,
        error:
          `No SettingForge handler is registered for "${request.type}".`,
      };
    } else {
      try {
        const payload =
          await handler(request);

        response = {
          kind: 'response',
          id: crypto.randomUUID(),
          requestId: request.id,
          sourceModuleId: 'settingforge',
          type: `${request.type}.response`,
          timestamp: Date.now(),
          ok: true,
          payload,
        };
      } catch (error) {
        response = {
          kind: 'response',
          id: crypto.randomUUID(),
          requestId: request.id,
          sourceModuleId: 'settingforge',
          type: `${request.type}.response`,
          timestamp: Date.now(),
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'SettingForge request failed.',
        };
      }
    }

    (
      event.source as Window | null
    )?.postMessage(response, '*');
  }

  private isHostMessage(
    value: unknown
  ): value is HostMessage {
    if (
      typeof value !== 'object' ||
      value === null
    ) {
      return false;
    }

    const candidate =
      value as Partial<HostMessage>;

    return (
      (
        candidate.kind === 'event' ||
        candidate.kind === 'request' ||
        candidate.kind === 'response'
      ) &&
      typeof candidate.id === 'string' &&
      typeof candidate.type === 'string' &&
      typeof candidate.timestamp ===
        'number'
    );
  }
}

export const hostEventBroker =
  new HostEventBroker();
