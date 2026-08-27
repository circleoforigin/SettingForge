import type {
  HostEventMessage,
  HostMessage,
  HostRequestMessage,
  HostResponseMessage,
} from './HostMessage';

type EventHandler =
  (message: HostEventMessage) => void;

type RequestHandler =
  (
    message: HostRequestMessage
  ) => Promise<unknown>;

export class HostEventBroker {
    private readonly moduleWindows = new Map<string, Window>();  
  
  private readonly eventHandlers = new Map<string, Set<EventHandler>>();

  private readonly requestHandlers = new Map<string, RequestHandler>();

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

      if (message.kind === 'event') {
        this.dispatchEvent(message);
        return;
      }

      if (message.kind === 'request') {
        void this.handleRequest(
          event,
          message
        );
      }
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