import { renameProject, type Project } from './project'
import {
  renameTask,
  setTaskDueDate,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from './task'

export interface WorkspaceState {
  projects: Project[]
  tasks: Task[]
}

export const emptyWorkspace: WorkspaceState = {
  projects: [],
  tasks: [],
}

export type WorkspaceAction =
  | { type: 'project/added'; project: Project }
  | { type: 'project/deleted'; projectId: string }
  | { type: 'project/nameChanged'; projectId: string; name: string }
  | { type: 'task/added'; task: Task }
  | { type: 'task/statusChanged'; taskId: string; status: TaskStatus }
  | { type: 'task/titleChanged'; taskId: string; title: string }
  | { type: 'task/priorityChanged'; taskId: string; priority: TaskPriority }
  | { type: 'task/dueDateChanged'; taskId: string; dueDate: string | null }
  | { type: 'task/deleted'; taskId: string }

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  switch (action.type) {
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

    case 'task/deleted':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.taskId),
      }
  }
}
