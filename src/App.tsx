import './App.css';
import { moduleRegistry } from './modules/registry';
import { useEffect, useState } from 'react';
import { hostEventBroker } from './events/HostEventBroker';
import { hostServiceRegistry } from './services/HostServiceRegistry';
import {
  registerStorageHostServices,
} from './services/StorageHostService';

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

  return () => {
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

  function toggleModule(moduleId: string) {
    setEnabledModuleIds((current) => {
      if (current.includes(moduleId)) {
        if (activeModuleId === moduleId) {
          setActiveModuleId(null);
        }

        return current.filter(
          (id) => id !== moduleId
        );
      }

      return [...current, moduleId];
    });
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

        {enabledModules.length > 0 && (
          <>
            <div className="module-menu-separator" />

            {enabledModules.map((module) => (
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
  {activeModule ? (
  activeModule.devUrl ? (
    <iframe
      className="module-frame"
      src={activeModule.devUrl}
      title={activeModule.name}
    />
  ) : (
    <div className="module-placeholder">
      <h1>{activeModule.name}</h1>
      <p>{activeModule.description}</p>
      <small>Module version {activeModule.version}</small>
    </div>
  )
) : (
    <div className="empty-workspace">
      <h1>SettingForge</h1>
      <p>No module selected.</p>
      
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