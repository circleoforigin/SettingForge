import './App.css';
import { moduleRegistry } from './modules/registry';
import { useEffect, useState } from 'react';
import { hostEventBroker } from './events/HostEventBroker';
import { registerStorageHostServices} from './services/StorageHostService';
import { registerFileHostServices } from './services/FileHostService';
import { modulePresenceService } from './modules/ModulePresenceService';
import type { World } from './models/World';
import { worldRepository } from './worlds/WorldRepository';

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

function App() {
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

      modulePresenceService.markReady(
  message.sourceModuleId,
  payload?.capabilities
);

setReadyModuleIds((current) => {
  if (current.includes(message.sourceModuleId)) {
    return current;
  }

  return [...current, message.sourceModuleId];
});

modulePresenceService.sendSnapshotTo(message.sourceModuleId);
    }
  );

  return () => {
    unregisterModuleReady();
    unregisterFileServices();
    unregisterStorageServices();
    stopBroker();
  };
}, []);
  
  const [fileMenuOpen, setFileMenuOpen] =
    useState(false);

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

  const [showLoadWorldDialog, setShowLoadWorldDialog] =
    useState(false);

  const [savedWorlds, setSavedWorlds] = useState<World[]>([]);

  const [worldListLoading, setWorldListLoading] = useState(false);

  const [loadingWorldId, setLoadingWorldId] =
    useState<string | null>(null);

  const [worldLoadError, setWorldLoadError] =
    useState<string | null>(null);

  const [worldSaving, setWorldSaving] = useState(false);

  const [worldSaveNotice, setWorldSaveNotice] =
    useState<WorldSaveNotice | null>(null);

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
  setShowNewWorldDialog(true);
}

async function handleCreateWorld() {
  const name = newWorldName.trim();

  if (!name) {
    return;
  }

  const now = new Date();

  const world: World = {
    id: crypto.randomUUID(),
    name,
    modules: [],
    createdAt: now,
    updatedAt: now,
  };

  try {
    await worldRepository.saveWorld(world);

    setActiveWorld(world);
    setWorldSaveNotice(null);
    setNewWorldName('');
    setShowNewWorldDialog(false);
  } catch (error) {
    console.error('Unable to create World:', error);
  }
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

function waitForModuleReady(moduleId: string): Promise<void> {
  if (modulePresenceService.get(moduleId)?.state === 'ready') {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = hostEventBroker.subscribe(
      'module.ready',
      (message) => {
        if (message.sourceModuleId !== moduleId) return;

        clearTimeout(timeoutId);
        unsubscribe();
        resolve();
      }
    );
    const timeoutId = setTimeout(() => {
      unsubscribe();
      reject(new Error(
        `Module "${moduleId}" did not become ready.`
      ));
    }, 15000);
  });
}

function enableRequiredModule(moduleId: string): void {
  if (modulePresenceService.get(moduleId)?.state === 'stopped' ||
      !modulePresenceService.get(moduleId)) {
    modulePresenceService.enableModule(moduleId);
  }

  setEnabledModuleIds((current) => {
    if (current.includes(moduleId)) return current;
    return [...current, moduleId];
  });
}

async function loadWorldModule(
  moduleId: string, projectId: string
): Promise<void> {
  const ready = waitForModuleReady(moduleId);
  enableRequiredModule(moduleId);
  await ready;
  await hostEventBroker.requestModule(moduleId, 'project.load', {
    projectId,
  });
}

async function handleLoadWorld(worldId: string) {
  setLoadingWorldId(worldId);
  setWorldLoadError(null);

  try {
    const world = await worldRepository.loadWorld(worldId);

    if (!world) {
      throw new Error('The selected World could not be found.');
    }

    setActiveWorld(world);

    const missingModules = world.modules.filter(
      (reference) => !moduleRegistry.get(reference.moduleId)
    );
    const knownModules = world.modules.filter(
      (reference) => moduleRegistry.get(reference.moduleId)
    );
    const results = await Promise.allSettled(
      knownModules.map((reference) => loadWorldModule(
        reference.moduleId,
        reference.projectId
      ))
    );
    const failures = results.flatMap((result, index) => {
      if (result.status === 'fulfilled') return [];

      const moduleId = knownModules[index].moduleId;
      const message = result.reason instanceof Error
        ? result.reason.message
        : 'Project load failed.';

      return [`${moduleId}: ${message}`];
    });

    for (const reference of missingModules) {
      failures.push(
        `${reference.moduleId}: Module is not registered.`
      );
    }

    if (failures.length > 0) {
      const message = failures.join(' ');
      console.error('World loaded with module errors:', message);
      setWorldLoadError(message);
    }

    setShowLoadWorldDialog(false);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : 'Unable to load the selected World.';

    console.error('Unable to load World:', error);
    setWorldLoadError(message);
  } finally {
    setLoadingWorldId(null);
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

async function handleSaveAll() {
  if (!activeWorld || worldSaving) return;

  const world = activeWorld;
  const moduleIds = getReadyModuleIds();

  setFileMenuOpen(false);
  setWorldSaving(true);
  setWorldSaveNotice(null);

  try {
    const statusResults = await requestProjectStatuses(moduleIds);
    const statusFailures: string[] = [];
    const openModuleIds: string[] = [];

    statusResults.forEach((result, index) => {
      const moduleId = moduleIds[index];

      if (result.status === 'fulfilled') {
        const hasProject = typeof result.value?.projectId === 'string'
          && Boolean(result.value.projectId.trim());

        if (hasProject) openModuleIds.push(moduleId);
        return;
      }

      const message = result.reason instanceof Error
        ? result.reason.message
        : 'Project status failed.';

      statusFailures.push(`${moduleId}: ${message}`);
    });

    const saveResults = await Promise.allSettled(
      openModuleIds.map((moduleId) => {
        return hostEventBroker.requestModule(moduleId, 'project.save');
      })
    );
    const projectSaveFailures = saveResults.flatMap((result, index) => {
      if (result.status === 'fulfilled') return [];

      const moduleId = openModuleIds[index];
      const message = result.reason instanceof Error
        ? result.reason.message
        : 'Project save failed.';

      return [`${moduleId}: ${message}`];
    });
    let manifestResult: WorldManifestSaveResult;

    try {
      manifestResult = await saveWorldManifest(world);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Unable to save World.';
      const moduleFailures = [
        ...statusFailures,
        ...projectSaveFailures,
      ];
      const warning = moduleFailures.length > 0
        ? ` Module warnings: ${moduleFailures.join(' ')}`
        : '';

      console.error('Save All World persistence failed:', error);
      setWorldSaveNotice({
        kind: 'error',
        message: `Module saves completed, but World save failed: `
          + `${message}.${warning}`,
      });
      return;
    }

    const failures = [
      ...statusFailures,
      ...projectSaveFailures,
      ...manifestResult.statusFailures,
    ];

    if (failures.length > 0) {
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

  function toggleModule( moduleId: string) 
  {
  setEnabledModuleIds(
    (current) => {
      if (current.includes(moduleId)) 
      {
        modulePresenceService.removeModule(moduleId);

        setReadyModuleIds((ready) =>
          ready.filter((id) => id !== moduleId)
          );

        if (activeModuleId === moduleId) 
        {
          setActiveModuleId(null);
        }

        return current.filter(
          (id) =>
            id !== moduleId
        );
      }

      modulePresenceService.enableModule(moduleId);

      return [ ...current,moduleId ];
    }
  );
}

  return (
    <div className="app">
      <header className="menu-bar">
        <div className="menu-group">
          <button
            className="menu-item"
            onClick={() =>
              setFileMenuOpen(
                (current) => !current
              )
            }
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
  disabled={!activeWorld}
>
  Close World
</button>

<button
  className="dropdown-item"
  disabled={!activeWorld}
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
  disabled
>
  Close SettingForge
</button>
            </div>
          )}
        </div>

        <button className="menu-item">
          Settings
        </button>        

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

    if (module.devUrl) {
      return (
        <iframe
          key={module.id}
          className={
            isActive
              ? 'module-frame active'
              : 'module-frame inactive'
          }
          src={module.devUrl}
          title={module.name}
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
</main>

{showNewWorldDialog && (
  <div className="dialog-backdrop">
    <div className="dialog">
      <h2>New World</h2>

      <input
        type="text"
        placeholder="World name"
        value={newWorldName}
        onChange={(event) => setNewWorldName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            void handleCreateWorld();
          }
        }}
        autoFocus
      />

      <div className="dialog-buttons">
        <button
          type="button"
          onClick={() => setShowNewWorldDialog(false)}
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={!newWorldName.trim()}
          onClick={() => void handleCreateWorld()}
        >
          Create
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
