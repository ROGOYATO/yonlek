import { createChecklistItem } from '../domain/checklist'
import { createArea } from '../domain/area'
import { createProject } from '../domain/project'
import { createTaskList } from '../domain/task-list'
import {
  createSubtask,
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
  addArea(name: string): ReturnType<typeof createArea>
  renameArea(areaId: string, name: string): void
  deleteArea(areaId: string): void
  changeProjectArea(projectId: string, areaId: string | null): void
  addTaskList(projectId: string, name: string): ReturnType<typeof createTaskList>
  renameTaskList(listId: string, name: string): void
  deleteTaskList(listId: string): void
  changeTaskList(taskId: string, listId: string | null): void
  addChecklistItem(taskId: string, text: string): ReturnType<typeof createChecklistItem>
  renameChecklistItem(taskId: string, itemId: string, text: string): void
  changeChecklistItemCompleted(taskId: string, itemId: string, completed: boolean): void
  deleteChecklistItem(taskId: string, itemId: string): void
  addProject(name: string): ReturnType<typeof createProject>
  addTask(projectId: string, title: string, listId?: string): ReturnType<typeof createTask>
  addSubtask(parentTaskId: string, title: string): ReturnType<typeof createSubtask>
  renameProject(projectId: string, name: string): void
  changeProjectDescription(projectId: string, description: string | null): void
  renameTask(taskId: string, title: string): void
  changeTaskStatus(taskId: string, status: TaskStatus): void
  changeTaskPriority(taskId: string, priority: TaskPriority): void
  changeTaskDueDate(taskId: string, dueDate: string | null): void
  changeTaskDescription(taskId: string, description: string | null): void
  changeTaskProject(taskId: string, projectId: string): void
  deleteTask(taskId: string): void
  deleteProject(projectId: string): void
}

export function createWorkspaceCommands(
  store: WorkspaceStore,
  runtime: WorkspaceRuntime,
): WorkspaceCommands {
  return {
    addArea(name) {
      const area = createArea({
        id: runtime.nextId(),
        name,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'area/added',
        area,
      })

      return area
    },

    renameArea(areaId, name) {
      store.dispatch({
        type: 'area/nameChanged',
        areaId,
        name,
      })
    },

    deleteArea(areaId) {
      store.dispatch({
        type: 'area/deleted',
        areaId,
      })
    },

    changeProjectArea(projectId, areaId) {
      store.dispatch({
        type: 'project/areaChanged',
        projectId,
        areaId,
      })
    },

    addTaskList(projectId, name) {
      const list = createTaskList({
        id: runtime.nextId(),
        projectId,
        name,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'list/added',
        list,
      })

      return list
    },

    renameTaskList(listId, name) {
      store.dispatch({
        type: 'list/nameChanged',
        listId,
        name,
      })
    },

    deleteTaskList(listId) {
      store.dispatch({
        type: 'list/deleted',
        listId,
      })
    },

    changeTaskList(taskId, listId) {
      store.dispatch({
        type: 'task/listChanged',
        taskId,
        listId,
      })
    },

    addChecklistItem(taskId, text) {
      const item = createChecklistItem({
        id: runtime.nextId(),
        text,
      })

      store.dispatch({
        type: 'task/checklistItemAdded',
        taskId,
        item,
      })

      return item
    },

    renameChecklistItem(taskId, itemId, text) {
      store.dispatch({
        type: 'task/checklistItemTextChanged',
        taskId,
        itemId,
        text,
      })
    },

    changeChecklistItemCompleted(taskId, itemId, completed) {
      store.dispatch({
        type: 'task/checklistItemCompletedChanged',
        taskId,
        itemId,
        completed,
      })
    },

    deleteChecklistItem(taskId, itemId) {
      store.dispatch({
        type: 'task/checklistItemDeleted',
        taskId,
        itemId,
      })
    },

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

    addTask(projectId, title, listId) {
      const task = createTask({
        id: runtime.nextId(),
        projectId,
        title,
        now: runtime.now(),
        listId,
      })

      store.dispatch({
        type: 'task/added',
        task,
      })

      return task
    },

    addSubtask(parentTaskId, title) {
      const parent = store
        .getState()
        .tasks.find((task) => task.id === parentTaskId)

      if (!parent) {
        throw new Error('Cannot create a subtask for a missing task')
      }

      const task = createSubtask({
        id: runtime.nextId(),
        parent,
        title,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'task/added',
        task,
      })

      return task
    },

    renameProject(projectId, name) {
      store.dispatch({
        type: 'project/nameChanged',
        projectId,
        name,
      })
    },

    changeProjectDescription(projectId, description) {
      store.dispatch({
        type: 'project/descriptionChanged',
        projectId,
        description,
      })
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

    changeTaskDueDate(taskId, dueDate) {
      store.dispatch({
        type: 'task/dueDateChanged',
        taskId,
        dueDate,
      })
    },

    changeTaskDescription(taskId, description) {
      store.dispatch({
        type: 'task/descriptionChanged',
        taskId,
        description,
      })
    },

    changeTaskProject(taskId, projectId) {
      store.dispatch({
        type: 'task/projectChanged',
        taskId,
        projectId,
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
