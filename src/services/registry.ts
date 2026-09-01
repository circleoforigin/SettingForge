import {
  hostServiceRegistry,
} from './HostServiceRegistry';

hostServiceRegistry.register({
  type: 'storage.load',
  description:
    'Loads a module-owned data collection from SettingForge storage.',
});

hostServiceRegistry.register({
  type: 'storage.loadMany',
  description:
    'Loads module-owned records from SettingForge storage.',
});

hostServiceRegistry.register({
  type: 'storage.save',
  description:
    'Saves a module-owned data collection to SettingForge storage.',
});

hostServiceRegistry.register({
  type: 'storage.delete',
  description:
    'Deletes a module-owned data collection from SettingForge storage.',
});
hostServiceRegistry.register({
  type: 'file.save',
  description:
    'Saves a module-owned file to SettingForge storage.',
});

hostServiceRegistry.register({
  type: 'file.read',
  description:
    'Reads a module-owned file from SettingForge storage.',
});

hostServiceRegistry.register({
  type: 'file.delete',
  description:
    'Deletes a module-owned file from SettingForge storage.',
});
export { hostServiceRegistry };
