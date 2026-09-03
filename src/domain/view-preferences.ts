import type { TaskDueDateFilter } from './task-filter'
import type { TaskSort } from './task-sort'
import type { TaskPriority, TaskStatus } from './task'

export interface ViewPreferences {
  projectView: string
  query: string
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  dueDate: TaskDueDateFilter
  sort: TaskSort
}

export function createDefaultViewPreferences(): ViewPreferences {
  return {
    projectView: 'all',
    query: '',
    status: 'all',
    priority: 'all',
    dueDate: 'all',
    sort: 'created',
  }
}

export function updateViewPreferences(
  current: ViewPreferences,
  patch: Partial<ViewPreferences>,
): ViewPreferences {
  return {
    ...current,
    ...patch,
  }
}
