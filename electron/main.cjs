const {
  app,
  BrowserWindow,
  ipcMain,
} = require('electron');

const fs = require('node:fs');
const path = require('node:path');

app.setName('SettingForge');

const userDataPath = path.join(
  app.getPath('appData'),
  'SettingForge'
);

app.setPath(
  'userData',
  userDataPath
);

let mainWindow;

/* =========================================================
   STORAGE PATH VALIDATION
   ========================================================= */

function requireStorageName(
  value,
  label
) {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z0-9._-]+$/.test(value)
  ) {
    throw new Error(
      `Invalid storage ${label}.`
    );
  }

  return value;
}

/* =========================================================
   STORAGE PATH HELPERS
   ========================================================= */

function getModuleStorageRoot(
  moduleId
) {
  const safeModuleId =
    requireStorageName(
      moduleId,
      'module ID'
    );

  const root = path.join(
    app.getPath('userData'),
    'modules',
    safeModuleId
  );

  fs.mkdirSync(
    root,
    {
      recursive: true,
    }
  );

  return root;
}

function getCollectionRoot(
  moduleId,
  collection
) {
  const safeCollection =
    requireStorageName(
      collection,
      'collection'
    );

  const root = path.join(
    getModuleStorageRoot(
      moduleId
    ),
    safeCollection
  );

  fs.mkdirSync(
    root,
    {
      recursive: true,
    }
  );

  return root;
}

function getItemPath(
  moduleId,
  collection,
  key
  ) {
  const safeKey =
    requireStorageName(
      key,
      'key'
    );

  return path.join(
    getCollectionRoot(
      moduleId,
      collection
    ),
    `${safeKey}.json`
  );
}

function getModuleFilesRoot(
  moduleId
) {
  const root = path.join(
    getModuleStorageRoot(
      moduleId
    ),
    'files'
  );

  fs.mkdirSync(
    root,
    {
      recursive: true,
    }
  );

  return root;
}

function getModuleFilePath(
  moduleId,
  folder,
  fileName
) {
  const safeFolder =
    requireStorageName(
      folder,
      'file folder'
    );

  const safeFileName =
    requireStorageName(
      fileName,
      'file name'
    );

  const folderRoot =
    path.join(
      getModuleFilesRoot(
        moduleId
      ),
      safeFolder
    );

  fs.mkdirSync(
    folderRoot,
    {
      recursive: true,
    }
  );

  return path.join(
    folderRoot,
    safeFileName
  );
}

/* =========================================================
   STORAGE OPERATIONS
   ========================================================= */

function readItem(
  moduleId,
  collection,
  key
) {
  const filePath =
    getItemPath(
      moduleId,
      collection,
      key
    );

  if (
    !fs.existsSync(
      filePath
    )
  ) {
    return null;
  }

  const raw =
    fs.readFileSync(
      filePath,
      'utf8'
    );

  if (
    !raw.trim()
  ) {
    return null;
  }

  return JSON.parse(
    raw
  );
}

function listCollection(
  moduleId,
  collection
) {
  const collectionRoot =
    getCollectionRoot(
      moduleId,
      collection
    );

  const files =
    fs
      .readdirSync(
        collectionRoot
      )
      .filter(
        (fileName) =>
          fileName.endsWith(
            '.json'
          )
      );

  return files.map(
    (fileName) => {
      const filePath =
        path.join(
          collectionRoot,
          fileName
        );

      const raw =
        fs.readFileSync(
          filePath,
          'utf8'
        );

      return JSON.parse(
        raw
      );
    }
  );
}

function writeItem(
  moduleId,
  collection,
  key,
  value
) {
  const filePath =
    getItemPath(
      moduleId,
      collection,
      key
    );

  const temporaryPath =
    `${filePath}.tmp`;

  const contents =
    JSON.stringify(
      value,
      null,
      2
    );

  fs.writeFileSync(
    temporaryPath,
    contents,
    'utf8'
  );

  if (
    fs.existsSync(
      filePath
    )
  ) {
    fs.unlinkSync(
      filePath
    );
  }

  fs.renameSync(
    temporaryPath,
    filePath
  );
}

function deleteItem(
  moduleId,
  collection,
  key
) {
  const filePath =
    getItemPath(
      moduleId,
      collection,
      key
    );

  if (
    !fs.existsSync(
      filePath
    )
  ) {
    return false;
  }

  fs.unlinkSync(
    filePath
  );

  return true;
}

function writeModuleFile(
  moduleId,
  folder,
  fileName,
  bytes
) {
  const filePath =
    getModuleFilePath(
      moduleId,
      folder,
      fileName
    );

  const buffer =
    Buffer.from(
      bytes
    );

  fs.writeFileSync(
    filePath,
    buffer
  );

  return {
    fileName,
    folder,
  };
}

function readModuleFile(
  moduleId,
  folder,
  fileName
) {
  const filePath =
    getModuleFilePath(
      moduleId,
      folder,
      fileName
    );

  if (
    !fs.existsSync(
      filePath
    )
  ) {
    return null;
  }

  const buffer =
    fs.readFileSync(
      filePath
    );

  return Array.from(
    buffer
  );
}

function deleteModuleFile(
  moduleId,
  folder,
  fileName
) {
  const filePath =
    getModuleFilePath(
      moduleId,
      folder,
      fileName
    );

  if (
    !fs.existsSync(
      filePath
    )
  ) {
    return false;
  }

  fs.unlinkSync(
    filePath
  );

  return true;
}

/* =========================================================
   IPC STORAGE HANDLERS
   ========================================================= */

function registerStorageHandlers() {
  ipcMain.handle(
    'settingforge:storage:read',
    (
      _event,
      moduleId,
      collection,
      key
    ) => {
      if (key) {
        return readItem(
          moduleId,
          collection,
          key
        );
      }

      return listCollection(
        moduleId,
        collection
      );
    }
  );

  ipcMain.handle(
    'settingforge:storage:write',
    (
      _event,
      moduleId,
      collection,
      key,
      value
    ) => {
      writeItem(
        moduleId,
        collection,
        key,
        value
      );

      return true;
    }
  );

  ipcMain.handle(
    'settingforge:storage:delete',
    (
      _event,
      moduleId,
      collection,
      key
    ) => {
      return deleteItem(
        moduleId,
        collection,
        key
      );
    }
  );
}

function registerFileHandlers() {
  ipcMain.handle(
    'settingforge:file:write',
    (
      _event,
      moduleId,
      folder,
      fileName,
      bytes
    ) => {
      return writeModuleFile(
        moduleId,
        folder,
        fileName,
        bytes
      );
    }
  );

  ipcMain.handle(
    'settingforge:file:read',
    (
      _event,
      moduleId,
      folder,
      fileName
    ) => {
      return readModuleFile(
        moduleId,
        folder,
        fileName
      );
    }
  );

  ipcMain.handle(
    'settingforge:file:delete',
    (
      _event,
      moduleId,
      folder,
      fileName
    ) => {
      return deleteModuleFile(
        moduleId,
        folder,
        fileName
      );
    }
  );
}

/* =========================================================
   WINDOW
   ========================================================= */

function createWindow() {
  mainWindow =
    new BrowserWindow({
      title:
        'SettingForge',

      width:
        1440,

      height:
        900,

      minWidth:
        1000,

      minHeight:
        700,

      backgroundColor:
        '#1e1f22',

      webPreferences: {
        contextIsolation:
          true,

        nodeIntegration:
          false,

        preload:
          path.join(
            __dirname,
            'preload.cjs'
          ),
      },
    });

  mainWindow.setMenuBarVisibility(
    false
  );

  mainWindow.loadURL(
    'http://localhost:5174'
  );

  mainWindow.on(
    'closed',
    () => {
      mainWindow = null;
    }
  );
}

/* =========================================================
   APP LIFECYCLE
   ========================================================= */

app.whenReady().then(
  () => {
    console.log(
      'SettingForge userData:',
      app.getPath(
        'userData'
      )
    );

    registerStorageHandlers();
    registerFileHandlers();
    createWindow();

    app.on(
      'activate',
      () => {
        if (
          BrowserWindow
            .getAllWindows()
            .length === 0
        ) {
          createWindow();
        }
      }
    );
  }
);

app.on(
  'window-all-closed',
  () => {
    if (
      process.platform !==
      'darwin'
    ) {
      app.quit();
    }
  }
);