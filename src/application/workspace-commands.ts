import { createProject } from '../domain/project'
import { createTask } from '../domain/task'
import type { WorkspaceStore } from './workspace-store'

export interface WorkspaceRuntime {
  nextId(): string
  now(): string
}

export interface WorkspaceCommands {
  addProject(name: string): ReturnType<typeof createProject>
  addTask(projectId: string, title: string): ReturnType<typeof createTask>
}

export function createWorkspaceCommands(
  store: WorkspaceStore,
  runtime: WorkspaceRuntime,
): WorkspaceCommands {
  return {
    addProject(name) {
      const project = createProject({
        id: runtime.nextId(),
        name,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'project/added',
        project,
      })

      return project
    },

    addTask(projectId, title) {
      const task = createTask({
        id: runtime.nextId(),
        projectId,
        title,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'task/added',
        task,
      })

      return task
    },
  }
}
