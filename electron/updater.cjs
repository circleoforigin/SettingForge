const { app, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

const fs = require('node:fs');
const path = require('node:path');

function getUpdateBaseUrl() {
  const prefix = '--update-base-url=';
  const argument = process.argv.find((value) => value.startsWith(prefix));
  const configured = argument?.slice(prefix.length) ||
    process.env.SETTINGFORGE_UPDATE_BASE_URL;

  if (!configured) return null;

  const url = new URL(configured);
  if (url.username || url.password) {
    throw new Error('Update source must not contain credentials.');
  }

  if (url.protocol !== 'https:' && url.hostname !== '127.0.0.1') {
    throw new Error('Update source must use HTTPS or local loopback HTTP.');
  }

  return url.toString();
}

function createUpdaterLogger() {
  const logRoot = path.join(app.getPath('userData'), 'logs');
  const logPath = path.join(logRoot, 'updater.log');

  return (message) => {
    const line = `${new Date().toISOString()} ${message}`;
    console.log(line);

    try {
      fs.mkdirSync(logRoot, { recursive: true });
      fs.appendFileSync(logPath, `${line}\n`, 'utf8');
    } catch (error) {
      console.error('Unable to write updater log.', error);
    }
  };
}

function describeError(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function startApplicationUpdater(parentWindow) {
  const log = createUpdaterLogger();
  let downloadStarted = false;
  let updatePromptHandled = false;
  let updateInstallRequested = false;

  if (!app.isPackaged) {
    log('Updater disabled outside a packaged application.');
    return;
  }

  let updateBaseUrl;

  try {
    updateBaseUrl = getUpdateBaseUrl();
  } catch (error) {
    log(`Update configuration error: ${describeError(error)}`);
    return;
  }

  if (!updateBaseUrl) {
    log('Updater disabled because no update source is configured.');
    return;
  }

  log(`Updater initialized for SettingForge ${app.getVersion()}.`);
  log(`Update feed: ${updateBaseUrl}`);

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.setFeedURL({ provider: 'generic', url: updateBaseUrl });

  autoUpdater.on('checking-for-update', () => {
    log(`Checking ${updateBaseUrl} from version ${app.getVersion()}.`);
  });

  autoUpdater.on('update-available', (info) => {
    log(`Update ${info.version} is available.`);
  });

  autoUpdater.on('update-not-available', (info) => {
    log(`No update is available. Latest version: ${info.version}.`);
  });

  autoUpdater.on('download-progress', (progress) => {
    if (!downloadStarted) {
      downloadStarted = true;
      log('Downloading available update.');
    }

    log(`Download progress: ${progress.percent.toFixed(1)}%.`);
  });

  autoUpdater.on('error', (error) => {
    log(`Update error: ${describeError(error)}`);
  });

  autoUpdater.on('update-downloaded', async (info) => {
    log(`Update ${info.version} downloaded and ready to install.`);

    if (updatePromptHandled) {
      log('Additional update-downloaded event ignored for this session.');
      return;
    }

    updatePromptHandled = true;

    const result = await dialog.showMessageBox(parentWindow, {
      type: 'info',
      title: 'SettingForge Update Ready',
      message: `SettingForge ${info.version} is ready to install.`,
      detail: 'Restart SettingForge now to apply the update?',
      buttons: ['Restart & Update', 'Later'],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
    });

    if (result.response !== 0) {
      log('User postponed the downloaded update.');
      return;
    }

    if (updateInstallRequested) return;

    updateInstallRequested = true;
    log('User approved restart and update installation.');
    log('Silent update installation requested.');
    autoUpdater.quitAndInstall(true, true);
  });

  setTimeout(() => {
    void autoUpdater.checkForUpdates().catch(() => {});
  }, 1500);
}

module.exports = { startApplicationUpdater };
