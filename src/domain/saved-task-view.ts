import type { TaskDueDateFilter } from './task-filter'
import type { TaskGroup } from './task-group'
import type { TaskSort } from './task-sort'
import type { TaskPriority, TaskStatus } from './task'

export interface SavedTaskView {
  name: string
  projectView: string
  query: string
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  dueDate: TaskDueDateFilter
  sort: TaskSort
  group: TaskGroup
}

export function createSavedTaskView(input: SavedTaskView): SavedTaskView {
  const name = input.name.trim()

  if (name.length === 0) {
    throw new Error('Saved view name is required')
  }

  return {
    ...input,
    name,
  }
}
