import type { CustomFieldTaskFilter, TaskDueDateFilter } from './task-filter'
import type { TaskPriority, TaskStatus } from './task'

export interface TaskFilterSet {
  name: string
  query: string
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  dueDate: TaskDueDateFilter
  customFieldFilter?: CustomFieldTaskFilter
}

export interface CreateTaskFilterSetInput {
  name: string
  query: string
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  dueDate: TaskDueDateFilter
  customFieldFilter?: CustomFieldTaskFilter
}

export function createTaskFilterSet(
  input: CreateTaskFilterSetInput,
): TaskFilterSet {
  const name = input.name.trim()

  if (!name) {
    throw new Error('Filter set name is required')
  }

  const filterSet: TaskFilterSet = {
    name,
    query: input.query,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate,
  }

  if (input.customFieldFilter !== undefined) {
    filterSet.customFieldFilter = input.customFieldFilter
  }

  return filterSet
}
