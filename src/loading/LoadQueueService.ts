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
    }
  | {
      id: string;
      type: 'project.rename';
      moduleId: string;
      projectId: string;
      projectName: string;
    };

export interface ProjectCreateQueueResult {
  moduleId: string;
  projectId: string;
  projectName: string;
}

export interface ProjectRenameQueueResult {
  moduleId: string;
  projectId: string;
  projectName: string;
}

export interface LoadQueueRun {
  id: string;
}

interface LoadQueueCallbacks {
  loadModule: (
    moduleId: string
  ) => void;

  loadProject: (
    moduleId: string,
    projectId: string,
    loadId: string
  ) => boolean;

  createProject: (
    moduleId: string,
    projectName: string
  ) => void;

  renameProject: (
    moduleId: string,
    projectId: string,
    projectName: string
  ) => void;

  projectCreated?: (
    run: LoadQueueRun,
    result: ProjectCreateQueueResult
  ) => void;

  projectRenamed?: (
    run: LoadQueueRun,
    result: ProjectRenameQueueResult
  ) => void;

  failed?: (
    run: LoadQueueRun,
    item: LoadQueueItem,
    message: string
  ) => void;

  completed?: (
    run: LoadQueueRun
  ) => void;
}

export class LoadQueueService {
  private queue: LoadQueueItem[] = [];
  private active: LoadQueueItem | null = null;
  private run: LoadQueueRun | null = null;

  private readonly callbacks:
    LoadQueueCallbacks;

  constructor(
    callbacks: LoadQueueCallbacks
  ) {
    this.callbacks = callbacks;
  }

  replace(
    run: LoadQueueRun,
    items: LoadQueueItem[]
  ): void {
    this.queue = [...items];
    this.active = null;
    this.run = run;
    this.pump();
  }

  clear(): void {
    this.queue = [];
    this.active = null;
    this.run = null;
  }

  completeModule(
    moduleId: string
  ): void {
    if (
      this.active?.type !==
        'module.load' ||
      this.active.moduleId !==
        moduleId
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
      this.active?.type !==
        'project.load' ||
      this.active.moduleId !==
        moduleId ||
      this.active.projectId !==
        projectId ||
      this.active.loadId !==
        loadId
    ) {
      return;
    }

    this.advance();
  }

  completeProjectCreate(
    result: ProjectCreateQueueResult
  ): void {
    if (
      this.active?.type !==
        'project.create' ||
      this.active.moduleId !==
        result.moduleId ||
      !this.run
    ) {
      return;
    }

    this.callbacks.projectCreated?.(
      this.run,
      result
    );

    this.advance();
  }

  completeProjectRename(
    result: ProjectRenameQueueResult
  ): void {
    if (
      this.active?.type !==
        'project.rename' ||
      this.active.moduleId !==
        result.moduleId ||
      this.active.projectId !==
        result.projectId ||
      !this.run
    ) {
      return;
    }

    this.callbacks.projectRenamed?.(
      this.run,
      result
    );

    this.advance();
  }

  failProjectCreate(
    moduleId: string,
    message: string
  ): void {
    if (
      this.active?.type !==
        'project.create' ||
      this.active.moduleId !==
        moduleId
    ) {
      return;
    }

    this.failActive(message);
  }

  failProjectRename(
    moduleId: string,
    projectId: string,
    message: string
  ): void {
    if (
      this.active?.type !==
        'project.rename' ||
      this.active.moduleId !==
        moduleId ||
      this.active.projectId !==
        projectId
    ) {
      return;
    }

    this.failActive(message);
  }

  failProject(
    moduleId: string,
    projectId: string,
    loadId: string,
    message: string
  ): void {
    if (
      this.active?.type !==
        'project.load' ||
      this.active.moduleId !==
        moduleId ||
      this.active.projectId !==
        projectId ||
      this.active.loadId !==
        loadId
    ) {
      return;
    }

    this.failActive(message);
  }

  private failActive(
    message: string
  ): void {
    if (
      this.run &&
      this.active
    ) {
      this.callbacks.failed?.(
        this.run,
        this.active,
        message
      );
    }

    this.advance();
  }

  private advance(): void {
    this.active = null;
    this.pump();
  }

  private pump(): void {
    if (this.active) {
      return;
    }

    const next =
      this.queue.shift();

    if (!next) {
      const completedRun =
        this.run;

      this.run = null;

      if (completedRun) {
        this.callbacks.completed?.(
          completedRun
        );
      }

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

    if (
      next.type ===
      'project.rename'
    ) {
      this.callbacks.renameProject(
        next.moduleId,
        next.projectId,
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
      if (this.run) {
        this.callbacks.failed?.(
          this.run,
          next,
          `Module "${next.moduleId}" is not connected.`
        );
      }

      this.active = null;
      this.pump();
    }
  }
}