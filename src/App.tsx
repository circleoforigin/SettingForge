import './App.css';
import { moduleRegistry } from './modules/registry';
import { useEffect, useState } from 'react';
import { hostEventBroker } from './events/HostEventBroker';
import { hostServiceRegistry } from './services/registry';
import { registerStorageHostServices} from './services/StorageHostService';
import { registerFileHostServices } from './services/FileHostService';
import { modulePresenceService } from './modules/ModulePresenceService';

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
                  setModuleManagerOpen(true);
                }}
              >
                Add / Remove Modules...
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