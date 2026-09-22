import './App.css';
import { moduleRegistry } from './modules/registry';
import { useEffect, useRef, useState } from 'react';
import { hostEventBroker } from './events/HostEventBroker';
import { registerStorageHostServices} from './services/StorageHostService';
import { registerFileHostServices } from './services/FileHostService';
import { modulePresenceService } from './modules/ModulePresenceService';
import { resolveModuleEntry } from './modules/ModuleEntryResolver';
import type { World } from './models/World';
import { worldRepository } from './worlds/WorldRepository';
import { overlayRegistry } from './overlays/registry';
import type { OverlayPlacement } from './overlays/OverlayPlacement';
import {
  registerActionHostService,
  sendActionCatalogTo,
  sendRetainedActionStateTo,
} from './actions/ActionHostService';
import type {
  ProjectCreateResponse,
  ProjectLoadFailedPayload,
  ProjectLoadedPayload,
} from '@settingforge/module-sdk';
import {
  LoadQueueService,
  type LoadQueueItem,
} from './loading/LoadQueueService';

type NewWorldProjectSource =
  | 'create'
  | 'import';

interface NewWorldModuleSelection {
  moduleId: string;
  source: NewWorldProjectSource;
}

interface WorldCreationOperation {
  runId: string;
  worldId: string;
  worldName: string;
  createdAt: Date;
  projectReferences: World['modules'];
  failed: boolean;
  errors: string[];
}

interface ModuleProjectStatus {
  projectId?: string;
  projectName?: string;
  dirty: boolean;
}

interface WorldSaveNotice {
  kind: 'success' | 'warning' | 'error';
  message: string;
}

interface WorldManifestSaveResult {
  statusFailures: string[];
}

interface OpenModuleProject {
  moduleId: string;
  projectId: string;
  projectName?: string;
  dirty: boolean;
}

interface ProjectStatusScan {
  projects: OpenModuleProject[];
  failures: string[];
}

interface SaveAllResult {
  statusFailures: string[];
  projectSaveFailures: string[];
  manifestStatusFailures: string[];
  manifestError?: string;
}

type CloseTarget = 'world' | 'application';

interface MessengerTabConfig {
  id: string;
  name: string;
  phoneNumber: string;
}

const TRANSIENT_NOTICE_DURATION_MS = 8000;
const DROPDOWN_DISMISS_DISTANCE_PX = 36;

function isPointerWithinGraceArea(
  element: HTMLElement,
  clientX: number,
  clientY: number
): boolean {
  const rect = element.getBoundingClientRect();

  return (
    clientX >= rect.left - DROPDOWN_DISMISS_DISTANCE_PX &&
    clientX <= rect.right + DROPDOWN_DISMISS_DISTANCE_PX &&
    clientY >= rect.top - DROPDOWN_DISMISS_DISTANCE_PX &&
    clientY <= rect.bottom + DROPDOWN_DISMISS_DISTANCE_PX
  );
}


function App() 
{
  const registeredOverlays = overlayRegistry.getAll();
  const [enabledOverlayIds, setEnabledOverlayIds] =
    useState<Set<string>>(() => new Set());
  const isOverlayEnabled = (overlayId: string) =>
    enabledOverlayIds.has(overlayId);
  const [messengerPlacement, setMessengerPlacement] =
  useState<OverlayPlacement>({
    edge: 'bottom',
    alignment: 'center',
  });

const [messengerSettingsOpen, setMessengerSettingsOpen] =
  useState(false);

const [messengerTabs, setMessengerTabs] =
  useState<MessengerTabConfig[]>([
    {
      id: crypto.randomUUID(),
      name: 'PLAYER ONE',
      phoneNumber: '',
    },
  ]);

const setOverlayEnabled = (
  overlayId: string,
  enabled: boolean
) => {
  setEnabledOverlayIds((current) => {
    const next = new Set(current);

    if (enabled) {
      next.add(overlayId);
    } else {
      next.delete(overlayId);
    }

    return next;
  });
};
  
    const loadQueueRef =
    useRef<LoadQueueService | null>(null);

  useEffect(() => {
  const stopBroker =
    hostEventBroker.start();

  const unregisterStorageServices =
    registerStorageHostServices(
      hostEventBroker.registerRequestHandler.bind(
        hostEventBroker
      )
    );

  const unregisterFileServices =
    registerFileHostServices(
      hostEventBroker.registerRequestHandler.bind(
        hostEventBroker
      )
    );

  const unregisterActionService = registerActionHostService(
    hostEventBroker.registerRequestHandler.bind(hostEventBroker)
  );

    const unregisterModuleReady =
  hostEventBroker.subscribe(
    'module.ready',
    (message) => {
      const payload =
        message.payload as
          | {
              capabilities?: {
                events?: string[];
                actions?: string[];
              };
            }
          | undefined;

      const presence = modulePresenceService.markReady(
        message.sourceModuleId,
        payload?.capabilities
      );
      console.info(
        `[ModuleReady] presence=${presence.id}:${presence.state}`
      );

setReadyModuleIds((current) => {
  if (current.includes(message.sourceModuleId)) {
    return current;
  }

  return [...current, message.sourceModuleId];
});

modulePresenceService.sendSnapshotTo(message.sourceModuleId);
sendActionCatalogTo(message.sourceModuleId);
sendRetainedActionStateTo(message.sourceModuleId);
loadQueueRef.current?.completeModule(
  message.sourceModuleId
);
    }
  );

  const unregisterProjectLoaded =
  hostEventBroker.subscribe(
    'project.loaded',
    (message) => {
      const payload =
        message.payload as ProjectLoadedPayload;

      if (!payload) return;

      console.info(
        `[LoadQueue] project.loaded ${message.sourceModuleId} ` +
        `loadId=${payload.loadId}`
      );

      loadQueueRef.current?.completeProject(
        message.sourceModuleId,
        payload.projectId,
        payload.loadId
      );
    }
  );

  const unregisterProjectLoadFailed =
  hostEventBroker.subscribe(
    'project.loadFailed',
    (message) => {
      const payload =
        message.payload as ProjectLoadFailedPayload;

      if (!payload) return;

      console.error(
        `[LoadQueue] project.loadFailed ${message.sourceModuleId} ` +
        `loadId=${payload.loadId}: ${payload.error}`
      );

      loadQueueRef.current?.failProject(
        message.sourceModuleId,
        payload.projectId,
        payload.loadId,
        payload.error ||
          'Project restoration failed.'
      );
    }
  );

  return () => {
    unregisterProjectLoadFailed();
    unregisterProjectLoaded();
    unregisterModuleReady();
    unregisterActionService();
    unregisterFileServices();
    unregisterStorageServices();
    stopBroker();
  };
}, []);
  
  const [fileMenuOpen, setFileMenuOpen] =
    useState(false);

  const [overlayMenuOpen, setOverlayMenuOpen] =
    useState(false);

    useEffect(() => {
  if (!fileMenuOpen && !overlayMenuOpen) return;

  const handlePointerMove = (event: PointerEvent) => {
    const openMenu = fileMenuOpen
      ? {
          selector: '[data-menu-group="file"]',
          close: () => setFileMenuOpen(false),
        }
      : {
          selector: '[data-menu-group="overlays"]',
          close: () => setOverlayMenuOpen(false),
        };

    const menuGroup = document.querySelector(
      openMenu.selector
    );

    const dropdowns = menuGroup?.querySelectorAll(
  '.dropdown-menu'
);

if (
  !(menuGroup instanceof HTMLElement) ||
  !dropdowns
) {
  return;
}

const pointerIsNearButton =
  isPointerWithinGraceArea(
    menuGroup,
    event.clientX,
    event.clientY
  );

const pointerIsNearDropdown =
  Array.from(dropdowns).some(
    (dropdown) =>
      dropdown instanceof HTMLElement &&
      isPointerWithinGraceArea(
        dropdown,
        event.clientX,
        event.clientY
      )
  );

if (!pointerIsNearButton && !pointerIsNearDropdown) {
  openMenu.close();
}
  };

  window.addEventListener(
    'pointermove',
    handlePointerMove
  );

  return () => {
    window.removeEventListener(
      'pointermove',
      handlePointerMove
    );
  };
}, [fileMenuOpen, overlayMenuOpen]);

  const [activeWorld, setActiveWorld] = useState<World | null>(null);

useEffect(() => {
  const title = activeWorld
    ? `SettingForge — ${activeWorld.name}.world`
    : 'SettingForge';

  void window.settingForge.window.setTitle(title);
}, [activeWorld]);

  const [showNewWorldDialog, setShowNewWorldDialog] =
    useState(false);

  const [newWorldName, setNewWorldName] = useState('');

  const [
  newWorldModuleSelections,
  setNewWorldModuleSelections,
] = useState<NewWorldModuleSelection[]>([]);

const [worldCreating, setWorldCreating] =
  useState(false);

const [worldCreateError, setWorldCreateError] =
  useState<string | null>(null);

const worldCreationOperationRef =
  useRef<WorldCreationOperation | null>(
    null
  );

  const [showLoadWorldDialog, setShowLoadWorldDialog] =
    useState(false);

  const [savedWorlds, setSavedWorlds] = useState<World[]>([]);

  const [worldListLoading, setWorldListLoading] = useState(false);

  const [loadingWorldId, setLoadingWorldId] =
    useState<string | null>(null);

  const [worldLoadError, setWorldLoadError] =
    useState<string | null>(null);

  const worldLoadGenerationRef = useRef(0);

const [worldSaving, setWorldSaving] = useState(false);

const [worldSaveNotice, setWorldSaveNotice] =
  useState<WorldSaveNotice | null>(null);


// ============================================================
// WORLD LOAD QUEUE
// ============================================================

if (!loadQueueRef.current) {
  loadQueueRef.current =
    new LoadQueueService({
      loadModule: (moduleId) => {
        const presence =
          modulePresenceService.get(moduleId);

        // If this module is already running, there will not
        // necessarily be another module.ready event.
        // Treat its existing ready state as completion.
        if (presence?.state === 'ready') {
          queueMicrotask(() => {
            loadQueueRef.current?.completeModule(
              moduleId
            );
          });

          return;
        }

        enableRequiredModule(moduleId);
      },

           loadProject: (
        moduleId,
        projectId,
        loadId
      ) => {
        console.info(
          `[LoadQueue] dispatching project.load ${moduleId}`
        );

        return hostEventBroker.sendRequestToModule(
          moduleId,
          'project.load',
          {
            projectId,
            loadId,
          }
        );
      },

      createProject: (
        moduleId,
        projectName
      ) => {
        console.info(
          `[LoadQueue] dispatching project.create ${moduleId}`
        );

        void hostEventBroker
          .requestModule<ProjectCreateResponse>(
            moduleId,
            'project.create',
            {
              name: projectName,
            }
          )
          .then((response) => {
            loadQueueRef.current
              ?.completeProjectCreate({
                moduleId,
                projectId:
                  response.projectId,
                projectName:
                  response.projectName,
              });
          })
          .catch((error) => {
            const message =
              error instanceof Error
                ? error.message
                : 'Project creation failed.';

            loadQueueRef.current
              ?.failProjectCreate(
                moduleId,
                message
              );
          });
      },
            projectCreated: (
        run,
        result
      ) => {
        console.info(
          `[LoadQueue] ${run.id} project.create completed ` +
          `${result.moduleId} → ${result.projectId}`
        );

        const operation =
          worldCreationOperationRef.current;

        if (
          !operation ||
          operation.runId !== run.id
        ) {
          return;
        }

        operation.projectReferences.push({
          moduleId:
            result.moduleId,

          projectId:
            result.projectId,
        });
      },

      failed: (run, item, message) => {
        console.error(
          `[LoadQueue] ${run.id} ${item.type} failed:`,
          message
        );

        const creationOperation =
          worldCreationOperationRef.current;

        if (
          creationOperation?.runId ===
          run.id
        ) {
          creationOperation.failed =
            true;

          creationOperation.errors.push(
            `${item.moduleId}: ${message}`
          );

          return;
        }

        setWorldLoadError((current) =>
          current
            ? `${current} ${message}`
            : message
        );
      },

            completed: (run) => {
        console.info(
          `[LoadQueue] ${run.id} complete`
        );

        const operation =
          worldCreationOperationRef.current;

        if (
          !operation ||
          operation.runId !== run.id
        ) {
          return;
        }

        worldCreationOperationRef.current =
          null;

        if (operation.failed) {
          setWorldCreating(false);

          setWorldCreateError(
            operation.errors.join(' ')
          );

          return;
        }

        const world: World = {
          id:
            operation.worldId,

          name:
            operation.worldName,

          modules:
            operation.projectReferences,

          createdAt:
            operation.createdAt,

          updatedAt:
            operation.createdAt,
        };

        void worldRepository
          .saveWorld(world)
          .then(() => {
            setActiveWorld(
              world
            );

            setWorldDirty(false);

            setActiveModuleId(
              world.modules[0]
                ?.moduleId ??
                null
            );

            setWorldSaveNotice({
              kind: 'success',
              message:
                `Created ${world.name}.world.`,
            });

            setNewWorldName('');

            setNewWorldModuleSelections(
              []
            );

            setShowNewWorldDialog(
              false
            );
          })
          .catch((error) => {
            const message =
              error instanceof Error
                ? error.message
                : 'Unable to save the new World.';

            console.error(
              'Unable to save new World:',
              error
            );

            setWorldCreateError(
              message
            );
          })
          .finally(() => {
            setWorldCreating(
              false
            );
          });
      },
    });
}


useEffect(() => {
  if (!worldLoadError || showLoadWorldDialog) return;

    const timeoutId = window.setTimeout(() => {
      setWorldLoadError(null);
    }, TRANSIENT_NOTICE_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [showLoadWorldDialog, worldLoadError]);

  const [worldDirty, setWorldDirty] = useState(false);

  const [showCloseWorldDialog, setShowCloseWorldDialog] =
    useState(false);

  useEffect(() => {
    if (!worldSaveNotice || showCloseWorldDialog) return;

    const timeoutId = window.setTimeout(() => {
      setWorldSaveNotice(null);
    }, TRANSIENT_NOTICE_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [showCloseWorldDialog, worldSaveNotice]);

  const [closeWorldProjects, setCloseWorldProjects] =
    useState<OpenModuleProject[]>([]);

  const [worldClosing, setWorldClosing] = useState(false);

  const [closeTarget, setCloseTarget] =
    useState<CloseTarget>('world');

  const [showDeleteWorldDialog, setShowDeleteWorldDialog] =
    useState(false);

  const [worldPendingDelete, setWorldPendingDelete] =
    useState<World | null>(null);

  const [worldDeleting, setWorldDeleting] = useState(false);

  const [worldDeleteError, setWorldDeleteError] =
    useState<string | null>(null);

  const [worldDeleteMessage, setWorldDeleteMessage] =
    useState<string | null>(null);

  const [moduleManagerOpen, setModuleManagerOpen] =
    useState(false);

  const [enabledModuleIds, setEnabledModuleIds] =
    useState<string[]>([]);    

    const [readyModuleIds, setReadyModuleIds] =
  useState<string[]>([]);

  const readyModules = readyModuleIds
    .map((id) => moduleRegistry.get(id))
    .filter((module) => module !== undefined);

  const [activeModuleId, setActiveModuleId] =
    useState<string | null>(null);

  useEffect(() => {
  hostEventBroker.setModuleFocusHandler(
    (moduleId) => {
      setActiveModuleId(
        moduleId
      );
    }
  );

  return () => {
    hostEventBroker.setModuleFocusHandler(
      null
    );
  };
}, []);

  const enabledModules =
    enabledModuleIds
      .map((id) => moduleRegistry.get(id))
      .filter((module) => module !== undefined);

  const availableModules = moduleRegistry.getAll();

  const activeModule =
    activeModuleId
      ? moduleRegistry.get(activeModuleId)
      : undefined;

function handleNewWorld() {
  setNewWorldName('');
  setNewWorldModuleSelections([]);
  setWorldCreateError(null);
  setShowNewWorldDialog(true);
}

function toggleNewWorldModule(
  moduleId: string
) {
  setNewWorldModuleSelections(
    (current) => {
      const existing =
        current.find(
          (selection) =>
            selection.moduleId === moduleId
        );

      if (existing) {
        return current.filter(
          (selection) =>
            selection.moduleId !== moduleId
        );
      }

      return [
        ...current,
        {
          moduleId,
          source: 'create',
        },
      ];
    }
  );
}

function setNewWorldModuleSource(
  moduleId: string,
  source: NewWorldProjectSource
) {
  setNewWorldModuleSelections(
    (current) =>
      current.map((selection) =>
        selection.moduleId === moduleId
          ? {
              ...selection,
              source,
            }
          : selection
      )
  );
}

function handleCreateWorld() {
  const name =
    newWorldName.trim();

  if (!name) {
    setWorldCreateError(
      'Enter a World name.'
    );

    return;
  }

  if (
    newWorldModuleSelections.length === 0
  ) {
    setWorldCreateError(
      'Select at least one module.'
    );

    return;
  }

  if (worldCreating) {
    return;
  }

  const importSelections =
    newWorldModuleSelections.filter(
      (selection) =>
        selection.source ===
        'import'
    );

  if (
    importSelections.length > 0
  ) {
    setWorldCreateError(
      'Import Existing Project is not connected yet.'
    );

    return;
  }

  const unknownModule =
    newWorldModuleSelections.find(
      (selection) =>
        !moduleRegistry.get(
          selection.moduleId
        )
    );

  if (unknownModule) {
    setWorldCreateError(
      `Module "${unknownModule.moduleId}" is not registered.`
    );

    return;
  }

  const runId =
    `world.create:${crypto.randomUUID()}`;

  const worldId =
    crypto.randomUUID();

  const createdAt =
    new Date();

  const operation:
    WorldCreationOperation = {
      runId,
      worldId,
      worldName:
        name,
      createdAt,
      projectReferences:
        [],
      failed:
        false,
      errors:
        [],
    };

  const queueItems:
    LoadQueueItem[] = [];

  // First make every selected module ready.
  for (
    const selection of
    newWorldModuleSelections
  ) {
    queueItems.push({
      id:
        crypto.randomUUID(),

      type:
        'module.load',

      moduleId:
        selection.moduleId,
    });
  }

  // Only after every module is ready do we
  // create its World-owned Project.
  for (
    const selection of
    newWorldModuleSelections
  ) {
    queueItems.push({
      id:
        crypto.randomUUID(),

      type:
        'project.create',

      moduleId:
        selection.moduleId,

      projectName:
        name,
    });
  }

  setWorldCreating(
    true
  );

  setWorldCreateError(
    null
  );

  setWorldSaveNotice(
    null
  );

  worldCreationOperationRef.current =
    operation;

  loadQueueRef.current?.replace(
    {
      id:
        runId,
    },
    queueItems
  );
}

async function handleOpenLoadWorld() {
  setFileMenuOpen(false);
  setWorldLoadError(null);
  setWorldSaveNotice(null);
  setSavedWorlds([]);
  setWorldListLoading(true);
  setShowLoadWorldDialog(true);

  try {
    setSavedWorlds(await worldRepository.loadWorlds());
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Unable to load saved Worlds.';

    console.error('Unable to load saved Worlds:', error);
    setWorldLoadError(message);
  } finally {
    setWorldListLoading(false);
  }
}

async function handleOpenDeleteWorld() {
  setFileMenuOpen(false);
  setWorldDeleteError(null);
  setWorldDeleteMessage(null);
  setWorldPendingDelete(null);
  setSavedWorlds([]);
  setWorldListLoading(true);
  setShowDeleteWorldDialog(true);

  try {
    setSavedWorlds(await worldRepository.loadWorlds());
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Unable to load saved Worlds.';

    console.error('Unable to load Worlds for deletion:', error);
    setWorldDeleteError(message);
  } finally {
    setWorldListLoading(false);
  }
}

async function handleDeleteWorld() {
  if (!worldPendingDelete || worldDeleting) return;

  const world = worldPendingDelete;

  setWorldDeleting(true);
  setWorldDeleteError(null);
  setWorldDeleteMessage(null);

  try {
    const deleted = await worldRepository.deleteWorld(world.id);

    if (!deleted) {
      throw new Error('The selected World could not be deleted.');
    }

    if (activeWorld?.id === world.id) {
      worldLoadGenerationRef.current += 1;
      loadQueueRef.current?.clear();
      setActiveWorld(null);
      setWorldDirty(false);
      setShowCloseWorldDialog(false);
      setCloseWorldProjects([]);
      setWorldLoadError(null);
    }

    setWorldPendingDelete(null);
    setWorldDeleteMessage(`Deleted ${world.name}.world.`);
    setWorldSaveNotice({
      kind: 'success',
      message: `Deleted ${world.name}.world.`,
    });

    try {
      setSavedWorlds(await worldRepository.loadWorlds());
    } catch (error) {
      console.error('Unable to refresh saved Worlds:', error);
      setWorldDeleteError(
        'World deleted, but the saved World list could not be refreshed.'
      );
    }
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Unable to delete World.';

    console.error('Unable to delete World:', error);
    setWorldDeleteError(message);
  } finally {
    setWorldDeleting(false);
  }
}

function enableRequiredModule(moduleId: string): void {
  const presence = modulePresenceService.get(moduleId);

  if (!presence || presence.state === 'stopped') {
    console.info(`[LoadQueue] enabling module ${moduleId}`);
    modulePresenceService.enableModule(moduleId);
  }

  setEnabledModuleIds((current) => {
    if (current.includes(moduleId)) return current;
    return [...current, moduleId];
  });
}

async function handleLoadWorld(worldId: string) {
  const generation = ++worldLoadGenerationRef.current;
  loadQueueRef.current?.clear();
  setLoadingWorldId(worldId);
  setWorldLoadError(null);

  try {
    const world = await worldRepository.loadWorld(worldId);
    if (generation !== worldLoadGenerationRef.current) return;

    if (!world) {
      throw new Error('The selected World could not be found.');
    }

    setActiveWorld(world);
    setWorldDirty(false);
    setShowLoadWorldDialog(false);

   const missingModules = world.modules.filter(
  (reference) =>
    !moduleRegistry.get(reference.moduleId)
);

const knownModules = world.modules.filter(
  (reference) =>
    moduleRegistry.get(reference.moduleId)
);

const loadItems: LoadQueueItem[] = [];

// First load/enable every module, one at a time.
for (const reference of knownModules) {
  loadItems.push({
    id: crypto.randomUUID(),
    type: 'module.load',
    moduleId: reference.moduleId,
  });
}

// Then load each module's assigned Project,
// again one at a time.
for (const reference of knownModules) {
  loadItems.push({
    id: crypto.randomUUID(),
    type: 'project.load',
    moduleId: reference.moduleId,
    projectId: reference.projectId,
    loadId: crypto.randomUUID(),
  });
}

setActiveModuleId(
  knownModules[0]?.moduleId ?? null
);

for (const reference of missingModules) {
  const message =
    `${reference.moduleId}: Module is not registered.`;

  console.error(
    '[LoadQueue]',
    message
  );

  setWorldLoadError((current) =>
    current
      ? `${current} ${message}`
      : message
  );
}

loadQueueRef.current?.replace(
  {
    id: `world.load:${world.id}:${generation}`,
  },
  loadItems
);
  } catch (error) {
    if (generation !== worldLoadGenerationRef.current) return;
    const message = error instanceof Error
      ? error.message
      : 'Unable to load the selected World.';

    console.error('Unable to load World:', error);
    setWorldLoadError(message);
  } finally {
    if (generation === worldLoadGenerationRef.current) {
      setLoadingWorldId(null);
    }
  }
}

function getReadyModuleIds(): string[] {
  return readyModuleIds.filter((moduleId) => {
    return modulePresenceService.get(moduleId)?.state === 'ready';
  });
}

function requestProjectStatuses(moduleIds: string[]) {
  return Promise.allSettled(
    moduleIds.map((moduleId) => {
      return hostEventBroker.requestModule<ModuleProjectStatus>(
        moduleId,
        'project.status'
      );
    })
  );
}

async function scanReadyProjectStatuses(): Promise<ProjectStatusScan> {
  const moduleIds = getReadyModuleIds();
  const results = await requestProjectStatuses(moduleIds);
  const projects: OpenModuleProject[] = [];
  const failures: string[] = [];

  results.forEach((result, index) => {
    const moduleId = moduleIds[index];

    if (result.status === 'fulfilled') {
      const projectId = typeof result.value?.projectId === 'string'
        ? result.value.projectId.trim()
        : '';
      const projectName = typeof result.value?.projectName === 'string'
        ? result.value.projectName.trim()
        : undefined;

      if (!projectId) return;
      projects.push({
        moduleId,
        projectId,
        projectName: projectName || undefined,
        dirty: result.value.dirty === true,
      });
      return;
    }

    const message = result.reason instanceof Error
      ? result.reason.message
      : 'Project status failed.';

    failures.push(`${moduleId}: ${message}`);
  });

  return { projects, failures };
}

async function saveWorldManifest(
  world: World
): Promise<WorldManifestSaveResult> {
  const moduleIds = getReadyModuleIds();
  const results = await requestProjectStatuses(moduleIds);
  const previousReferences = new Map(
    world.modules.map((reference) => [reference.moduleId, reference])
  );
  const modules = [] as World['modules'];
  const statusFailures: string[] = [];

  results.forEach((result, index) => {
    const moduleId = moduleIds[index];

    if (result.status === 'fulfilled') {
      const projectId = typeof result.value?.projectId === 'string'
        ? result.value.projectId.trim()
        : undefined;

      if (projectId) modules.push({ moduleId, projectId });
      return;
    }

    const previous = previousReferences.get(moduleId);
    const message = result.reason instanceof Error
      ? result.reason.message
      : 'Project status failed.';

    if (previous) modules.push(previous);
    statusFailures.push(`${moduleId}: ${message}`);
  });

  const savedWorld: World = {
    ...world,
    modules,
    updatedAt: new Date(),
  };

  await worldRepository.saveWorld(savedWorld);
  setActiveWorld(savedWorld);
  setWorldDirty(false);

  return { statusFailures };
}

async function handleSaveWorld() {
  if (!activeWorld || worldSaving) return;

  const world = activeWorld;

  setFileMenuOpen(false);
  setWorldSaving(true);
  setWorldSaveNotice(null);

  try {
    const result = await saveWorldManifest(world);

    if (result.statusFailures.length > 0) {
      const details = result.statusFailures.join(' ');

      console.error('World saved with status errors:', details);
      setWorldSaveNotice({
        kind: 'warning',
        message: `World saved. Status unavailable: ${details}`,
      });
    } else {
      setWorldSaveNotice({
        kind: 'success',
        message: 'World saved.',
      });
    }
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Unable to save World.';

    console.error('Unable to save World:', error);
    setWorldSaveNotice({
      kind: 'error',
      message,
    });
  } finally {
    setWorldSaving(false);
  }
}

async function saveOpenModuleProjects() {
  const scan = await scanReadyProjectStatuses();
  const saveResults = await Promise.allSettled(
    scan.projects.map((project) => {
      return hostEventBroker.requestModule(
        project.moduleId,
        'project.save'
      );
    })
  );
  const projectSaveFailures = saveResults.flatMap((result, index) => {
    if (result.status === 'fulfilled') return [];

    const moduleId = scan.projects[index].moduleId;
    const message = result.reason instanceof Error
      ? result.reason.message
      : 'Project save failed.';

    return [`${moduleId}: ${message}`];
  });

  return {
    statusFailures: scan.failures,
    projectSaveFailures,
  };
}

async function saveAllProjectsAndWorld(world: World) {
  const moduleResult = await saveOpenModuleProjects();

  try {
    const manifest = await saveWorldManifest(world);

    return {
      ...moduleResult,
      manifestStatusFailures: manifest.statusFailures,
    } as SaveAllResult;
  } catch (error) {
    const manifestError = error instanceof Error
      ? error.message
      : 'Unable to save World.';

    return {
      ...moduleResult,
      manifestStatusFailures: [],
      manifestError,
    } as SaveAllResult;
  }
}

function getSaveAllFailures(result: SaveAllResult): string[] {
  return [
    ...result.statusFailures,
    ...result.projectSaveFailures,
    ...result.manifestStatusFailures,
  ];
}

async function handleSaveAll() {
  if (!activeWorld || worldSaving) return;

  const world = activeWorld;

  setFileMenuOpen(false);
  setWorldSaving(true);
  setWorldSaveNotice(null);

  try {
    const result = await saveAllProjectsAndWorld(world);
    const failures = getSaveAllFailures(result);

    if (result.manifestError) {
      const warning = failures.length > 0
        ? ` Module warnings: ${failures.join(' ')}`
        : '';

      setWorldSaveNotice({
        kind: 'error',
        message: `Module saves completed, but World save failed: `
          + `${result.manifestError}.${warning}`,
      });
    } else if (failures.length > 0) {
      const details = failures.join(' ');

      console.error('Save All completed with warnings:', details);
      setWorldSaveNotice({
        kind: 'warning',
        message: `Save All completed with warnings: ${details}`,
      });
    } else {
      setWorldSaveNotice({
        kind: 'success',
        message: 'Everything saved.',
      });
    }
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Save All failed.';

    console.error('Unable to complete Save All:', error);
    setWorldSaveNotice({ kind: 'error', message });
  } finally {
    setWorldSaving(false);
  }
}

async function closeOpenProjects(
  projects: OpenModuleProject[], discardChanges = false
): Promise<string[]> {
  const results = await Promise.allSettled(
    projects.map((project) => {
      const payload = discardChanges
        ? { discardChanges: true }
        : undefined;

      return hostEventBroker.requestModule(
        project.moduleId,
        'project.close',
        payload
      );
    })
  );

  return results.flatMap((result, index) => {
    if (result.status === 'fulfilled') return [];

    const moduleId = projects[index].moduleId;
    const message = result.reason instanceof Error
      ? result.reason.message
      : 'Project close failed.';

    return [`${moduleId}: ${message}`];
  });
}

async function finishClose(target: CloseTarget): Promise<void> {
  setShowCloseWorldDialog(false);
  setCloseWorldProjects([]);

  if (target === 'application') {
    const closing = await window.settingForge.window.closeApp();

    if (!closing) throw new Error('SettingForge could not close.');
    return;
  }

  setActiveWorld(null);
  worldLoadGenerationRef.current += 1;
  loadQueueRef.current?.clear();
  setWorldDirty(false);
  setWorldSaveNotice({
    kind: 'success',
    message: 'World closed.',
  });
}

function reportCloseFailures(
  failures: string[], target: CloseTarget
): void {
  const details = failures.join(' ');
  const subject = target === 'application'
    ? 'SettingForge'
    : 'World';

  console.error(`Unable to close all ${subject} projects:`, details);
  setWorldSaveNotice({
    kind: 'error',
    message: `${subject} remains open. Close failures: ${details}`,
  });
}

async function handleCloseRequest(target: CloseTarget) {
  if (target === 'world' && !activeWorld) return;
  if (worldSaving || worldClosing) return;

  setFileMenuOpen(false);
  setWorldClosing(true);
  setWorldSaveNotice(null);
  setCloseTarget(target);

  try {
    const scan = await scanReadyProjectStatuses();

    if (scan.failures.length > 0) {
      const details = scan.failures.join(' ');

      setWorldSaveNotice({
        kind: 'error',
        message: `Close cancelled. Status unavailable: ${details}`,
      });
      return;
    }

    setCloseWorldProjects(scan.projects);

    if (worldDirty || scan.projects.some((project) => project.dirty)) {
      setShowCloseWorldDialog(true);
      return;
    }

    const failures = await closeOpenProjects(scan.projects);

    if (failures.length > 0) {
      reportCloseFailures(failures, target);
      return;
    }

    await finishClose(target);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Unable to complete close request.';

    console.error('Unable to complete close request:', error);
    setWorldSaveNotice({ kind: 'error', message });
  } finally {
    setWorldClosing(false);
  }
}

async function handleSaveAllAndClose() {
  if (worldSaving || worldClosing) return;

  const world = activeWorld;

  setWorldClosing(true);
  setWorldSaveNotice(null);

  try {
    let saveResult: SaveAllResult;

    if (world) {
      saveResult = await saveAllProjectsAndWorld(world);
    } else {
      const moduleResult = await saveOpenModuleProjects();

      saveResult = {
        ...moduleResult,
        manifestStatusFailures: [],
      };
    }

    const saveFailures = getSaveAllFailures(saveResult);

    if (saveResult.manifestError || saveFailures.length > 0) {
      const details = [
        saveResult.manifestError,
        ...saveFailures,
      ].filter(Boolean).join(' ');

      setWorldSaveNotice({
        kind: 'error',
        message: `Close cancelled. Save All failed: ${details}`,
      });
      return;
    }

    const scan = await scanReadyProjectStatuses();

    if (scan.failures.length > 0) {
      setWorldSaveNotice({
        kind: 'error',
        message: 'Close cancelled. Saved projects could not '
          + 'be verified.',
      });
      return;
    }

    if (scan.projects.some((project) => project.dirty)) {
      setWorldSaveNotice({
        kind: 'error',
        message: 'Close cancelled. Some projects remain unsaved.',
      });
      return;
    }

    const failures = await closeOpenProjects(scan.projects);

    if (failures.length > 0) {
      reportCloseFailures(failures, closeTarget);
      return;
    }

    await finishClose(closeTarget);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Unable to complete close request.';

    console.error('Unable to complete close request:', error);
    setWorldSaveNotice({ kind: 'error', message });
  } finally {
    setWorldClosing(false);
  }
}

async function handleDiscardAllAndClose() {
  if (worldClosing) return;

  setWorldClosing(true);
  setWorldSaveNotice(null);

  try {
    const failures = await closeOpenProjects(closeWorldProjects, true);

    if (failures.length > 0) {
      reportCloseFailures(failures, closeTarget);
      return;
    }

    await finishClose(closeTarget);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Unable to complete close request.';

    console.error('Unable to complete close request:', error);
    setWorldSaveNotice({ kind: 'error', message });
  } finally {
    setWorldClosing(false);
  }
}

  function toggleModule(moduleId: string) {
  const isEnabled =
    enabledModuleIds.includes(moduleId);

  if (isEnabled) {
    modulePresenceService.removeModule(moduleId);

    setReadyModuleIds((ready) =>
      ready.filter((id) => id !== moduleId)
    );

    if (activeModuleId === moduleId) {
      setActiveModuleId(null);
    }

    setEnabledModuleIds((current) =>
      current.filter((id) => id !== moduleId)
    );

    return;
  }

  console.warn(
    `[ModuleMount] requested ${moduleId} ${Date.now()}`
  );

  modulePresenceService.enableModule(moduleId);

  setEnabledModuleIds((current) => [
    ...current,
    moduleId,
  ]);
}

  return (
    <div className="app">
      <header className="menu-bar">
        <div
          className="menu-group"
          data-menu-group="file"
        >
          <button
            className="menu-item"
            onClick={() => {
              setOverlayMenuOpen(false);
              setFileMenuOpen(
                (current) => !current
              );
            }}
          >
            File
          </button>

          {fileMenuOpen && (
            <div className="dropdown-menu">
              <button
  className="dropdown-item"
  onClick={() => {
    setFileMenuOpen(false);
    handleNewWorld();
  }}
>
  New World...
</button>

<div className="dropdown-separator" />

<button
  className="dropdown-item"
  onClick={() => void handleOpenLoadWorld()}
>
  Load World...
</button>

<button
  className="dropdown-item"
  disabled={!activeWorld || worldSaving}
  onClick={() => void handleSaveWorld()}
>
  {worldSaving ? 'Saving World...' : 'Save World'}
</button>

<button
  className="dropdown-item"
  disabled={!activeWorld || worldSaving}
  onClick={() => void handleSaveAll()}
>
  Save All
</button>

<div className="dropdown-separator" />

<button
  className="dropdown-item"
  disabled={!activeWorld || worldSaving || worldClosing}
  onClick={() => void handleCloseRequest('world')}
>
  {worldClosing ? 'Closing World...' : 'Close World'}
</button>

<button
  className="dropdown-item"
  disabled={worldDeleting}
  onClick={() => void handleOpenDeleteWorld()}
>
  Delete World...
</button>

<div className="dropdown-separator" />

<button
  className="dropdown-item"
  onClick={() => {
    setFileMenuOpen(false);
    setModuleManagerOpen(true);
  }}
>
  Add / Remove Modules...
</button>

<div className="dropdown-separator" />

<button
  className="dropdown-item"
  disabled={worldSaving || worldClosing}
  onClick={() => void handleCloseRequest('application')}
>
  Close SettingForge
</button>
            </div>
          )}
        </div>

        <button className="menu-item">
          Settings
        </button>

        <div
  className="menu-group"
  data-menu-group="overlays"
>
  <button
    className="menu-item"
    onClick={() => {
      setFileMenuOpen(false);
      setOverlayMenuOpen(
        (current) => !current
      );
    }}
  >
    Overlays
  </button>

  {overlayMenuOpen && (
  <div className="dropdown-menu">
    <div className="overlay-menu-entry">
      <div className="dropdown-item overlay-menu-label">
        Messenger
        <span>›</span>
      </div>

      <div className="dropdown-menu overlay-submenu">
        <button
          type="button"
          className="dropdown-item"
          onClick={() =>
            setOverlayEnabled(
              'messenger',
              !isOverlayEnabled('messenger')
            )
          }
        >
          {isOverlayEnabled('messenger') ? '✓ ' : ''}
          Enabled
        </button>

        <div className="dropdown-separator" />

        <button
          type="button"
          className="dropdown-item"
          onClick={() => {
            setOverlayMenuOpen(false);
            setMessengerSettingsOpen(true);
          }}
        >
          Settings...
        </button>
      </div>
    </div>
  </div>
)}
</div>    

        {readyModules.length > 0 && (  <>
          <div className="module-menu-separator" />

          {readyModules.map((module) => (
              <button
                key={module.id}
                className={
                  activeModuleId === module.id
                    ? 'menu-item module-focus-button active'
                    : 'menu-item module-focus-button'
                }
                onClick={() =>
                  setActiveModuleId(module.id)
                  }
                >
                  {module.name}
                </button>
            ))}
          </>
        )}        
      </header>

<main className="host-workspace">
  {worldLoadError && !showLoadWorldDialog && (
    <div className="world-load-error" role="alert">
      {worldLoadError}
    </div>
  )}

  {worldSaveNotice && (
    <div
      className={`world-save-notice ${worldSaveNotice.kind}`}
      role="status"
    >
      {worldSaveNotice.message}
    </div>
  )}

  {enabledModules.map((module) => {
    const isActive =
      activeModuleId === module.id;
    const moduleEntry = resolveModuleEntry(module, import.meta.env.DEV);

    if (moduleEntry) {
      return (
        <iframe
  key={module.id}
  className={
    isActive
      ? 'module-frame active'
      : 'module-frame inactive'
  }
  src={moduleEntry}
  title={module.name}
  allow="display-capture"
  onLoad={() => {
  console.warn(
    `[ModuleMount] iframe loaded ${module.id} ${Date.now()}`
  );
}}
/>
      );
    }

    return (
      <div
        key={module.id}
        className={
          isActive
            ? 'module-placeholder active'
            : 'module-placeholder inactive'
        }
      >
        <h1>
          {module.name}
        </h1>

        <p>
          {module.description}
        </p>

        <small>
          Module version {module.version}
        </small>
      </div>
    );
  })}

  {!activeModule && (
    <div className="empty-workspace">
      <h1>
        SettingForge
      </h1>

      <p>
        Please add a module to begin.
      </p>
    </div>
  )}

    <div className="overlay-layer">
    {registeredOverlays
      .filter((overlay) =>
        isOverlayEnabled(overlay.id)
      )
      .map((overlay) => {
        const Surface = overlay.Surface;

        return (
          <Surface
            key={overlay.id}
            placement={messengerPlacement}
            tabs={
              overlay.id === 'messenger'
                ? messengerTabs
                : undefined
            }
          />
        );
      })}
  </div>
</main>

{messengerSettingsOpen && (
  <div className="dialog-backdrop">
    <div className="dialog messenger-settings-dialog">
      <h2>Messenger Settings</h2>

      <label className="messenger-settings-field">
        <span>Docking Position</span>

        <select
          value={
            `${messengerPlacement.edge}-${messengerPlacement.alignment}`
          }
          onChange={(event) => {
            const [edge, alignment] =
              event.target.value.split('-') as [
                OverlayPlacement['edge'],
                OverlayPlacement['alignment'],
              ];

            setMessengerPlacement({
              edge,
              alignment,
            });
          }}
        >
          <option value="top-left">Top Left</option>
          <option value="top-center">Top Center</option>
          <option value="top-right">Top Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-center">Bottom Center</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </label>

      <div className="messenger-settings-section">
        <strong>Tabs</strong>

        {messengerTabs.map((tab) => (
          <div
            key={tab.id}
            className="messenger-settings-tab-row"
          >
            <input
              type="text"
              placeholder="Name"
              value={tab.name}
              onChange={(event) => {
                const name = event.target.value;

                setMessengerTabs((current) =>
                  current.map((item) =>
                    item.id === tab.id
                      ? { ...item, name }
                      : item
                  )
                );
              }}
            />

            <input
              type="tel"
              placeholder="Phone number"
              value={tab.phoneNumber}
              onChange={(event) => {
                const phoneNumber = event.target.value;

                setMessengerTabs((current) =>
                  current.map((item) =>
                    item.id === tab.id
                      ? { ...item, phoneNumber }
                      : item
                  )
                );
              }}
            />

            <button
              type="button"
              onClick={() =>
                setMessengerTabs((current) =>
                  current.filter(
                    (item) => item.id !== tab.id
                  )
                )
              }
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() =>
            setMessengerTabs((current) => [
              ...current,
              {
                id: crypto.randomUUID(),
                name: '',
                phoneNumber: '',
              },
            ])
          }
        >
          + Add Tab
        </button>
      </div>

      <div className="dialog-buttons">
        <button
          type="button"
          onClick={() =>
            setMessengerSettingsOpen(false)
          }
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

{showNewWorldDialog && (
  <div className="dialog-backdrop">
    <div className="dialog">
      <h2>New World</h2>

      {worldCreateError && (
        <div
          className="dialog-error"
          role="alert"
        >
          {worldCreateError}
        </div>
      )}

      <input
        type="text"
        placeholder="World name"
        value={newWorldName}
        disabled={worldCreating}
        onChange={(event) => {
          setNewWorldName(
            event.target.value
          );

          setWorldCreateError(null);
        }}
        autoFocus
      />

      <h3>Modules</h3>

      <p>
        Select at least one module for
        this World.
      </p>

      <div className="world-module-list">
        {availableModules.map((module) => {
          const selection =
            newWorldModuleSelections.find(
              (candidate) =>
                candidate.moduleId ===
                module.id
            );

          return (
            <div
              key={module.id}
              className="world-module-option"
            >
              <label>
                <input
                  type="checkbox"
                  checked={
                    selection !==
                    undefined
                  }
                  disabled={worldCreating}
                  onChange={() => {
                    toggleNewWorldModule(
                      module.id
                    );

                    setWorldCreateError(
                      null
                    );
                  }}
                />

                {module.name}
              </label>

              {selection && (
                <div className="world-project-source">
                  <label>
                    <input
                      type="radio"
                      name={`new-world-${module.id}`}
                      checked={
                        selection.source ===
                        'create'
                      }
                      disabled={worldCreating}
                      onChange={() =>
                        setNewWorldModuleSource(
                          module.id,
                          'create'
                        )
                      }
                    />

                    Create New Project
                  </label>

                  <label>
                    <input
                      type="radio"
                      name={`new-world-${module.id}`}
                      checked={
                        selection.source ===
                        'import'
                      }
                      disabled={worldCreating}
                      onChange={() =>
                        setNewWorldModuleSource(
                          module.id,
                          'import'
                        )
                      }
                    />

                    Import Existing Project
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="dialog-buttons">
        <button
          type="button"
          disabled={worldCreating}
          onClick={() => {
            setShowNewWorldDialog(false);
            setWorldCreateError(null);
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={
            worldCreating ||
            !newWorldName.trim() ||
            newWorldModuleSelections.length === 0
          }
          onClick={() =>
            void handleCreateWorld()
          }
        >
          {worldCreating
            ? 'Creating...'
            : 'Create World'}
        </button>
      </div>
    </div>
  </div>
)}

{showLoadWorldDialog && (
  <div className="dialog-backdrop">
    <div className="dialog">
      <h2>Load World</h2>

      {worldLoadError && (
        <div className="dialog-error" role="alert">
          {worldLoadError}
        </div>
      )}

      {worldListLoading ? (
        <p>Loading saved Worlds...</p>
      ) : savedWorlds.length === 0 ? (
        <p>No saved Worlds found.</p>
      ) : (
        <div className="world-list">
          {savedWorlds.map((world) => (
            <button
              key={world.id}
              type="button"
              disabled={loadingWorldId !== null}
              onClick={() => void handleLoadWorld(world.id)}
            >
              {loadingWorldId === world.id
                ? `Loading ${world.name}...`
                : world.name}
            </button>
          ))}
        </div>
      )}

      <div className="dialog-buttons">
        <button
          type="button"
          disabled={loadingWorldId !== null}
          onClick={() => setShowLoadWorldDialog(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{showDeleteWorldDialog && (
  <div className="dialog-backdrop">
    <div className="dialog">
      <h2>Delete World</h2>

      {worldDeleteError && (
        <div className="dialog-error" role="alert">
          {worldDeleteError}
        </div>
      )}

      {worldDeleteMessage && !worldPendingDelete && (
        <div className="dialog-success" role="status">
          {worldDeleteMessage}
        </div>
      )}

      {worldPendingDelete ? (
        <>
          <p>Delete "{worldPendingDelete.name}.world"?</p>

          <p>
            This removes only the SettingForge World file. Associated
            module projects will NOT be deleted.
          </p>

          <div className="dialog-buttons">
            <button
              type="button"
              disabled={worldDeleting}
              onClick={() => void handleDeleteWorld()}
            >
              {worldDeleting ? 'Deleting...' : 'Delete'}
            </button>

            <button
              type="button"
              disabled={worldDeleting}
              onClick={() => setWorldPendingDelete(null)}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {worldListLoading ? (
            <p>Loading saved Worlds...</p>
          ) : savedWorlds.length === 0 ? (
            <p>No saved Worlds found.</p>
          ) : (
            <div className="world-list">
              {savedWorlds.map((world) => (
                <button
                  key={world.id}
                  type="button"
                  onClick={() => setWorldPendingDelete(world)}
                >
                  {world.name}
                </button>
              ))}
            </div>
          )}

          <div className="dialog-buttons">
            <button
              type="button"
              onClick={() => setShowDeleteWorldDialog(false)}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}

{showCloseWorldDialog && (
  <div className="dialog-backdrop">
    <div className="dialog">
      <h2>
        Save changes before closing {closeTarget === 'application'
          ? 'SettingForge'
          : 'World'}?
      </h2>

      <p>Unsaved changes:</p>

      <ul className="world-unsaved-list">
        {worldDirty && activeWorld && (
          <li>{activeWorld.name}.world</li>
        )}

        {closeWorldProjects
          .filter((project) => project.dirty)
          .map((project) => {
            const module = moduleRegistry.get(project.moduleId);
            const moduleName = module?.name ?? project.moduleId;
            const projectName = project.projectName ?? 'Open Project';

            return (
              <li key={project.moduleId}>
                {moduleName} — {projectName}
              </li>
            );
          })}
      </ul>

      {worldSaveNotice && (
        <div className="dialog-error" role="alert">
          {worldSaveNotice.message}
        </div>
      )}

      <div className="dialog-buttons">
        <button
          type="button"
          disabled={worldClosing}
          onClick={() => void handleSaveAllAndClose()}
        >
          Save All
        </button>

        <button
          type="button"
          disabled={worldClosing}
          onClick={() => void handleDiscardAllAndClose()}
        >
          Discard All
        </button>

        <button
          type="button"
          disabled={worldClosing}
          onClick={() => {
            setShowCloseWorldDialog(false);
            setCloseWorldProjects([]);
            setWorldSaveNotice(null);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

      {moduleManagerOpen && (
  <div className="dialog-backdrop">
    <div className="dialog module-manager-dialog">
      <h2>Add / Remove Modules</h2>

      <div className="module-list">
        {availableModules.map((module) => {
          const enabled =
            enabledModuleIds.includes(module.id);

          return (
            <div
              key={module.id}
              className="module-list-item"
            >
              <div className="module-information">
                <strong>{module.name}</strong>

                <span>
                  {module.description}
                </span>

                <small>
                  Version {module.version}
                </small>
              </div>

              <button
                onClick={() =>
                  toggleModule(module.id)
                }
              >
                {enabled ? 'Remove' : 'Add'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="dialog-buttons">
        <button
          onClick={() =>
            setModuleManagerOpen(false)
          }
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default App;
