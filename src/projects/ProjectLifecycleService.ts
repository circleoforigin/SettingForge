import type {
  ProjectCreateResponse,
  ProjectDeleteResponse,
  ProjectListResponse,
  ProjectRenameResponse,
} from '@settingforge/module-sdk'

import {
  hostEventBroker,
} from '../events/HostEventBroker'

export interface ProjectStatus {
  projectId?: string
  projectName?: string
  dirty: boolean
}

export class ProjectLifecycleService {
  async getStatus(
    moduleId: string,
  ): Promise<ProjectStatus> {
    return hostEventBroker
      .requestModule<ProjectStatus>(
        moduleId,
        'project.status',
        {},
      )
  }

  async listProjects(
    moduleId: string,
  ): Promise<ProjectListResponse> {
    return hostEventBroker
      .requestModule<ProjectListResponse>(
        moduleId,
        'project.list',
        {},
      )
  }

  async createProject(
    moduleId: string,
    name: string,
  ): Promise<ProjectCreateResponse> {
    return hostEventBroker
      .requestModule<ProjectCreateResponse>(
        moduleId,
        'project.create',
        {
          name,
        },
      )
  }

  async renameProject(
    moduleId: string,
    projectId: string,
    name: string,
  ): Promise<ProjectRenameResponse> {
    return hostEventBroker
      .requestModule<ProjectRenameResponse>(
        moduleId,
        'project.rename',
        {
          projectId,
          name,
        },
      )
  }

  async saveProject(
    moduleId: string,
  ): Promise<void> {
    await hostEventBroker
      .requestModule(
        moduleId,
        'project.save',
        {},
      )
  }

  async closeProject(
    moduleId: string,
    discardChanges = false,
  ): Promise<void> {
    await hostEventBroker
      .requestModule(
        moduleId,
        'project.close',
        {
          discardChanges,
        },
      )
  }

  async deleteProject(
    moduleId: string,
    projectId: string,
  ): Promise<ProjectDeleteResponse> {
    return hostEventBroker
      .requestModule<ProjectDeleteResponse>(
        moduleId,
        'project.delete',
        {
          projectId,
        },
      )
  }
}

export const projectLifecycleService =
  new ProjectLifecycleService()