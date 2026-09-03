import { createProject } from '../domain/project'
import {
  createTask,
  type TaskPriority,
  type TaskStatus,
} from '../domain/task'
import type { WorkspaceStore } from './workspace-store'

export interface WorkspaceRuntime {
  nextId(): string
  now(): string
}

export interface WorkspaceCommands {
  addProject(name: string): ReturnType<typeof createProject>
  addTask(projectId: string, title: string): ReturnType<typeof createTask>
  renameTask(taskId: string, title: string): void
  changeTaskStatus(taskId: string, status: TaskStatus): void
  changeTaskPriority(taskId: string, priority: TaskPriority): void
  deleteTask(taskId: string): void
  deleteProject(projectId: string): void
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

    renameTask(taskId, title) {
      store.dispatch({
        type: 'task/titleChanged',
        taskId,
        title,
      })
    },

    changeTaskStatus(taskId, status) {
      store.dispatch({
        type: 'task/statusChanged',
        taskId,
        status,
      })
    },

    changeTaskPriority(taskId, priority) {
      store.dispatch({
        type: 'task/priorityChanged',
        taskId,
        priority,
      })
    },

    deleteTask(taskId) {
      store.dispatch({
        type: 'task/deleted',
        taskId,
      })
    },

    deleteProject(projectId) {
      store.dispatch({
        type: 'project/deleted',
        projectId,
      })
    },
  }
}
