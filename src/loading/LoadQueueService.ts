export type LoadQueueItem =
  | {
      id: string;
      type: 'module.load';
      moduleId: string;
    }
  | {
      id: string;
      type: 'project.load';
      moduleId: string;
      projectId: string;
      loadId: string;
    }
  | {
      id: string;
      type: 'project.create';
      moduleId: string;
      projectName: string;
    };

interface LoadQueueCallbacks {
  loadModule: (moduleId: string) => void;
  loadProject: (
    moduleId: string,
    projectId: string,
    loadId: string
  ) => boolean;
  createProject: (
    moduleId: string,
    projectName: string
  ) => void;
  failed?: (
    item: LoadQueueItem,
    message: string
  ) => void;
  completed?: () => void;
}

export class LoadQueueService {
  private queue: LoadQueueItem[] = [];
  private active: LoadQueueItem | null = null;
  private readonly callbacks: LoadQueueCallbacks;

  constructor(callbacks: LoadQueueCallbacks) {
    this.callbacks = callbacks;
  }  

  replace(items: LoadQueueItem[]): void {
    this.queue = [...items];
    this.active = null;
    this.pump();
  }

  clear(): void {
    this.queue = [];
    this.active = null;
  }

  completeModule(moduleId: string): void {
    if (
      this.active?.type !== 'module.load' ||
      this.active.moduleId !== moduleId
    ) {
      return;
    }

    this.advance();
  }

  completeProject(
    moduleId: string,
    projectId: string,
    loadId: string
  ): void {
    if (
      this.active?.type !== 'project.load' ||
      this.active.moduleId !== moduleId ||
      this.active.projectId !== projectId ||
      this.active.loadId !== loadId
    ) {
      return;
    }

    this.advance();
  }

    completeProjectCreate(
    moduleId: string
  ): void {
    if (
      this.active?.type !==
        'project.create' ||
      this.active.moduleId !== moduleId
    ) {
      return;
    }

    this.advance();
  }

  failProjectCreate(
    moduleId: string,
    message: string
  ): void {
    if (
      this.active?.type !==
        'project.create' ||
      this.active.moduleId !== moduleId
    ) {
      return;
    }

    this.callbacks.failed?.(
      this.active,
      message
    );

    this.advance();
  }

  failProject(
    moduleId: string,
    projectId: string,
    loadId: string,
    message: string
  ): void {
    if (
      this.active?.type !== 'project.load' ||
      this.active.moduleId !== moduleId ||
      this.active.projectId !== projectId ||
      this.active.loadId !== loadId
    ) {
      return;
    }

    this.callbacks.failed?.(
      this.active,
      message
    );

    this.advance();
  }

  private advance(): void {
    this.active = null;
    this.pump();
  }

    private pump(): void {
    if (this.active) return;

    const next =
      this.queue.shift();

    if (!next) {
      this.callbacks.completed?.();
      return;
    }

    this.active = next;

    if (
      next.type ===
      'module.load'
    ) {
      this.callbacks.loadModule(
        next.moduleId
      );

      return;
    }

    if (
      next.type ===
      'project.create'
    ) {
      this.callbacks.createProject(
        next.moduleId,
        next.projectName
      );

      return;
    }

    const sent =
      this.callbacks.loadProject(
        next.moduleId,
        next.projectId,
        next.loadId
      );

    if (!sent) {
      this.callbacks.failed?.(
        next,
        `Module "${next.moduleId}" is not connected.`
      );

      this.active = null;
      this.pump();
    }
  }
}