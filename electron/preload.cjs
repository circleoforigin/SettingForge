const {
  contextBridge,
  ipcRenderer,
} = require('electron');

contextBridge.exposeInMainWorld(
  'settingForge',
  {
    storage: {
  read(
    moduleId,
    collection,
    key
  ) {
    return ipcRenderer.invoke(
      'settingforge:storage:read',
      moduleId,
      collection,
      key
    );
  },

  write(
    moduleId,
    collection,
    key,
    value
  ) {
    return ipcRenderer.invoke(
      'settingforge:storage:write',
      moduleId,
      collection,
      key,
      value
    );
  },

  delete(
    moduleId,
    collection,
    key
  ) {
    return ipcRenderer.invoke(
      'settingforge:storage:delete',
      moduleId,
      collection,
      key
    );
  },
},
  }
);