import { createChecklistItem } from '../domain/checklist'
import { createArea } from '../domain/area'
import { createProject } from '../domain/project'
import { createPerson } from '../domain/person'
import { createTaskList } from '../domain/task-list'
import { createTag } from '../domain/tag'
import {
  createSubtask,
  createTask,
  type TaskPriority,
  type TaskStatus,
} from '../domain/task'
import type { MoveDirection } from '../domain/manual-order'
import type { WorkspaceStore } from './workspace-store'

export interface WorkspaceRuntime {
  nextId(): string
  now(): string
}

export interface WorkspaceCommands {
  addPerson(name: string): ReturnType<typeof createPerson>
  renamePerson(personId: string, name: string): void
  deletePerson(personId: string): void
  assignTaskAssignee(taskId: string, personId: string): void
  removeTaskAssignee(taskId: string, personId: string): void
  addTag(name: string): ReturnType<typeof createTag>
  renameTag(tagId: string, name: string): void
  deleteTag(tagId: string): void
  assignTaskTag(taskId: string, tagId: string): void
  removeTaskTag(taskId: string, tagId: string): void
  addArea(name: string): ReturnType<typeof createArea>
  renameArea(areaId: string, name: string): void
  deleteArea(areaId: string): void
  moveArea(areaId: string, direction: MoveDirection): void
  changeProjectArea(projectId: string, areaId: string | null): void
  addTaskList(projectId: string, name: string): ReturnType<typeof createTaskList>
  renameTaskList(listId: string, name: string): void
  deleteTaskList(listId: string): void
  moveTaskList(listId: string, direction: MoveDirection): void
  changeTaskList(taskId: string, listId: string | null): void
  addChecklistItem(taskId: string, text: string): ReturnType<typeof createChecklistItem>
  renameChecklistItem(taskId: string, itemId: string, text: string): void
  changeChecklistItemCompleted(taskId: string, itemId: string, completed: boolean): void
  deleteChecklistItem(taskId: string, itemId: string): void
  moveChecklistItem(taskId: string, itemId: string, direction: MoveDirection): void
  moveProject(projectId: string, direction: MoveDirection): void
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
  moveTask(taskId: string, direction: MoveDirection): void
  deleteTask(taskId: string): void
  deleteProject(projectId: string): void
}

export function createWorkspaceCommands(
  store: WorkspaceStore,
  runtime: WorkspaceRuntime,
): WorkspaceCommands {
  return {
    addPerson(name) {
      const person = createPerson({
        id: runtime.nextId(),
        name,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'person/added',
        person,
      })

      return person
    },

    renamePerson(personId, name) {
      store.dispatch({
        type: 'person/nameChanged',
        personId,
        name,
      })
    },

    deletePerson(personId) {
      store.dispatch({
        type: 'person/deleted',
        personId,
      })
    },

    assignTaskAssignee(taskId, personId) {
      store.dispatch({
        type: 'task/assigneeAdded',
        taskId,
        personId,
      })
    },

    removeTaskAssignee(taskId, personId) {
      store.dispatch({
        type: 'task/assigneeRemoved',
        taskId,
        personId,
      })
    },

    addTag(name) {
      const tag = createTag({
        id: runtime.nextId(),
        name,
        now: runtime.now(),
      })

      store.dispatch({
        type: 'tag/added',
        tag,
      })

      return tag
    },

    renameTag(tagId, name) {
      store.dispatch({
        type: 'tag/nameChanged',
        tagId,
        name,
      })
    },

    deleteTag(tagId) {
      store.dispatch({
        type: 'tag/deleted',
        tagId,
      })
    },

    assignTaskTag(taskId, tagId) {
      store.dispatch({
        type: 'task/tagAdded',
        taskId,
        tagId,
      })
    },

    removeTaskTag(taskId, tagId) {
      store.dispatch({
        type: 'task/tagRemoved',
        taskId,
        tagId,
      })
    },

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

    moveArea(areaId, direction) {
      store.dispatch({
        type: 'area/moved',
        areaId,
        direction,
      })
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

    moveTaskList(listId, direction) {
      store.dispatch({
        type: 'list/moved',
        listId,
        direction,
      })
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

    moveChecklistItem(taskId, itemId, direction) {
      store.dispatch({
        type: 'task/checklistItemMoved',
        taskId,
        itemId,
        direction,
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

    moveProject(projectId, direction) {
      store.dispatch({
        type: 'project/moved',
        projectId,
        direction,
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

    moveTask(taskId, direction) {
      store.dispatch({
        type: 'task/moved',
        taskId,
        direction,
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
