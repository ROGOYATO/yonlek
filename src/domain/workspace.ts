import { renameArea, type Area } from './area'
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
  setTaskDueDate,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from './task'

export interface WorkspaceState {
  areas?: Area[]
  projects: Project[]
  tasks: Task[]
}

export const emptyWorkspace: WorkspaceState = {
  areas: [],
  projects: [],
  tasks: [],
}

export type WorkspaceAction =
  | { type: 'area/added'; area: Area }
  | { type: 'area/deleted'; areaId: string }
  | { type: 'area/nameChanged'; areaId: string; name: string }
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

    case 'project/deleted':
      return {
        projects: state.projects.filter(
          (project) => project.id !== action.projectId,
        ),
        tasks: state.tasks.filter((task) => task.projectId !== action.projectId),
      }

    case 'task/added': {
      const projectExists = state.projects.some(
        (project) => project.id === action.task.projectId,
      )

      if (!projectExists) {
        throw new Error('Cannot add a task to a missing project')
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

      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.taskId
            ? moveTaskToProject(task, action.projectId)
            : task,
        ),
      }
    }

    case 'task/deleted':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.taskId),
      }
  }
}
