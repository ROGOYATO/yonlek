import { renameArea, type Area } from './area'
import {
  renameChecklistItem,
  setChecklistItemCompleted,
  type ChecklistItem,
} from './checklist'
import { renameTaskList, type TaskList } from './task-list'
import {
  moveProjectToArea,
  renameProject,
  setProjectDescription,
  type Project,
} from './project'
import {
  moveTaskToProject,
  renameTask,
  setTaskDescription,
  setTaskList,
  setTaskDueDate,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from './task'

export interface WorkspaceState {
  areas?: Area[]
  lists?: TaskList[]
  projects: Project[]
  tasks: Task[]
}

export const emptyWorkspace: WorkspaceState = {
  areas: [],
  lists: [],
  projects: [],
  tasks: [],
}

export type WorkspaceAction =
  | { type: 'area/added'; area: Area }
  | { type: 'area/deleted'; areaId: string }
  | { type: 'area/nameChanged'; areaId: string; name: string }
  | { type: 'list/added'; list: TaskList }
  | { type: 'list/deleted'; listId: string }
  | { type: 'list/nameChanged'; listId: string; name: string }
  | { type: 'project/added'; project: Project }
  | { type: 'project/deleted'; projectId: string }
  | { type: 'project/nameChanged'; projectId: string; name: string }
  | { type: 'project/descriptionChanged'; projectId: string; description: string | null }
  | { type: 'project/areaChanged'; projectId: string; areaId: string | null }
  | { type: 'task/added'; task: Task }
  | { type: 'task/statusChanged'; taskId: string; status: TaskStatus }
  | { type: 'task/titleChanged'; taskId: string; title: string }
  | { type: 'task/priorityChanged'; taskId: string; priority: TaskPriority }
  | { type: 'task/dueDateChanged'; taskId: string; dueDate: string | null }
  | { type: 'task/descriptionChanged'; taskId: string; description: string | null }
  | { type: 'task/projectChanged'; taskId: string; projectId: string }
  | { type: 'task/listChanged'; taskId: string; listId: string | null }
  | { type: 'task/checklistItemAdded'; taskId: string; item: ChecklistItem }
  | { type: 'task/checklistItemTextChanged'; taskId: string; itemId: string; text: string }
  | { type: 'task/checklistItemCompletedChanged'; taskId: string; itemId: string; completed: boolean }
  | { type: 'task/checklistItemDeleted'; taskId: string; itemId: string }
  | { type: 'task/deleted'; taskId: string }

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  switch (action.type) {
    case 'area/added':
      return {
        ...state,
        areas: [...(state.areas ?? []), action.area],
      }

    case 'area/nameChanged':
      return {
        ...state,
        areas: (state.areas ?? []).map((area) =>
          area.id === action.areaId ? renameArea(area, action.name) : area,
        ),
      }

    case 'area/deleted':
      return {
        ...state,
        areas: (state.areas ?? []).filter((area) => area.id !== action.areaId),
        projects: state.projects.map((project) =>
          project.areaId === action.areaId
            ? moveProjectToArea(project, null)
            : project,
        ),
      }

    case 'list/added': {
      const projectExists = state.projects.some(
        (project) => project.id === action.list.projectId,
      )

      if (!projectExists) {
        throw new Error('Cannot add a list to a missing project')
      }

      return {
        ...state,
        lists: [...(state.lists ?? []), action.list],
      }
    }

    case 'list/nameChanged':
      return {
        ...state,
        lists: (state.lists ?? []).map((list) =>
          list.id === action.listId
            ? renameTaskList(list, action.name)
            : list,
        ),
      }

    case 'list/deleted':
      return {
        ...state,
        lists: (state.lists ?? []).filter(
          (list) => list.id !== action.listId,
        ),
        tasks: state.tasks.map((task) => {
          if (task.listId !== action.listId) {
            return task
          }

          const next = { ...task }
          delete next.listId
          return next
        }),
      }

    case 'project/added':
      return {
        ...state,
        projects: [...state.projects, action.project],
      }

    case 'project/nameChanged':
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? renameProject(project, action.name)
            : project,
        ),
      }

    case 'project/descriptionChanged':
      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? setProjectDescription(project, action.description)
            : project,
        ),
      }

    case 'project/areaChanged': {
      if (
        action.areaId !== null &&
        !(state.areas ?? []).some((area) => area.id === action.areaId)
      ) {
        throw new Error('Cannot move a project to a missing area')
      }

      return {
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.projectId
            ? moveProjectToArea(project, action.areaId)
            : project,
        ),
      }
    }

    case 'project/deleted': {
      const next: WorkspaceState = {
        projects: state.projects.filter(
          (project) => project.id !== action.projectId,
        ),
        tasks: state.tasks.filter(
          (task) => task.projectId !== action.projectId,
        ),
      }

      if (state.areas !== undefined && state.areas.length > 0) {
        next.areas = state.areas
      }

      if (state.lists !== undefined && state.lists.length > 0) {
        next.lists = state.lists.filter(
          (list) => list.projectId !== action.projectId,
        )
      }

      return next
    }

    case 'task/added': {
      const projectExists = state.projects.some(
        (project) => project.id === action.task.projectId,
      )

      if (!projectExists) {
        throw new Error('Cannot add a task to a missing project')
      }

      if (action.task.parentTaskId !== undefined) {
        if (action.task.parentTaskId === action.task.id) {
          throw new Error('Cannot add a task as its own subtask')
        }

        const parent = state.tasks.find(
          (candidate) => candidate.id === action.task.parentTaskId,
        )

        if (!parent) {
          throw new Error('Cannot add a subtask to a missing parent task')
        }

        if (parent.projectId !== action.task.projectId) {
          throw new Error(
            'Cannot add a subtask to a parent from another project',
          )
        }
      }

      if (action.task.listId !== undefined) {
        const list = (state.lists ?? []).find(
          (candidate) => candidate.id === action.task.listId,
        )

        if (!list) {
          throw new Error('Cannot add a task to a missing list')
        }

        if (list.projectId !== action.task.projectId) {
          throw new Error('Cannot add a task to a list from another project')
        }
      }

      return {
        ...state,
        tasks: [...state.tasks, action.task],
      }
    }

    case 'task/statusChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? { ...task, status: action.status }
            : task,
        ),
      }


    case 'task/titleChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId ? renameTask(task, action.title) : task,
        ),
      }

    case 'task/priorityChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? { ...task, priority: action.priority }
            : task,
        ),
      }

    case 'task/dueDateChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? setTaskDueDate(task, action.dueDate)
            : task,
        ),
      }

    case 'task/descriptionChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? setTaskDescription(task, action.description)
            : task,
        ),
      }

    case 'task/projectChanged': {
      const projectExists = state.projects.some(
        (project) => project.id === action.projectId,
      )

      if (!projectExists) {
        throw new Error('Cannot move a task to a missing project')
      }

      const targetTask = state.tasks.find(
        (task) => task.id === action.taskId,
      )

      if (!targetTask) {
        return state
      }

      if (
        targetTask.parentTaskId !== undefined &&
        targetTask.projectId !== action.projectId
      ) {
        throw new Error(
          'Cannot move a subtask away from its parent project',
        )
      }

      const movedIds = new Set([targetTask.id])

      let changed = true
      while (changed) {
        changed = false

        for (const task of state.tasks) {
          if (
            task.parentTaskId !== undefined &&
            movedIds.has(task.parentTaskId) &&
            !movedIds.has(task.id)
          ) {
            movedIds.add(task.id)
            changed = true
          }
        }
      }

      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (!movedIds.has(task.id)) {
            return task
          }

          const moved = moveTaskToProject(task, action.projectId)

          return task.projectId === action.projectId
            ? moved
            : setTaskList(moved, null)
        }),
      }
    }

    case 'task/listChanged': {
      const task = state.tasks.find((candidate) => candidate.id === action.taskId)

      if (!task) {
        return state
      }

      if (action.listId !== null) {
        const list = (state.lists ?? []).find(
          (candidate) => candidate.id === action.listId,
        )

        if (!list) {
          throw new Error('Cannot assign a task to a missing list')
        }

        if (list.projectId !== task.projectId) {
          throw new Error('Cannot assign a task to a list from another project')
        }
      }

      return {
        ...state,
        tasks: state.tasks.map((candidate) =>
          candidate.id === action.taskId
            ? setTaskList(candidate, action.listId)
            : candidate,
        ),
      }
    }

    case 'task/checklistItemAdded': {
      const target = state.tasks.find((task) => task.id === action.taskId)

      if (!target) {
        throw new Error('Cannot add a checklist item to a missing task')
      }

      if (
        (target.checklist ?? []).some(
          (item) => item.id === action.item.id,
        )
      ) {
        throw new Error('Cannot add a duplicate checklist item')
      }

      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? {
                ...task,
                checklist: [...(task.checklist ?? []), action.item],
              }
            : task,
        ),
      }
    }

    case 'task/checklistItemTextChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? {
                ...task,
                checklist: (task.checklist ?? []).map((item) =>
                  item.id === action.itemId
                    ? renameChecklistItem(item, action.text)
                    : item,
                ),
              }
            : task,
        ),
      }

    case 'task/checklistItemCompletedChanged':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? {
                ...task,
                checklist: (task.checklist ?? []).map((item) =>
                  item.id === action.itemId
                    ? setChecklistItemCompleted(
                        item,
                        action.completed,
                      )
                    : item,
                ),
              }
            : task,
        ),
      }

    case 'task/checklistItemDeleted':
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.taskId || task.checklist === undefined) {
            return task
          }

          const checklist = task.checklist.filter(
            (item) => item.id !== action.itemId,
          )
          const next = { ...task }

          if (checklist.length === 0) {
            delete next.checklist
          } else {
            next.checklist = checklist
          }

          return next
        }),
      }

    case 'task/deleted': {
      const deletedIds = new Set([action.taskId])

      let changed = true
      while (changed) {
        changed = false

        for (const task of state.tasks) {
          if (
            task.parentTaskId !== undefined &&
            deletedIds.has(task.parentTaskId) &&
            !deletedIds.has(task.id)
          ) {
            deletedIds.add(task.id)
            changed = true
          }
        }
      }

      return {
        ...state,
        tasks: state.tasks.filter((task) => !deletedIds.has(task.id)),
      }
    }
  }
}
