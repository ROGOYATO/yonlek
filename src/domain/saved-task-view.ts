import type { CustomFieldTaskFilter, TaskDueDateFilter } from './task-filter'
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
  customFieldFilter?: CustomFieldTaskFilter
  customFieldSortFieldId?: string
}

export function createSavedTaskView(input: SavedTaskView): SavedTaskView {
  const name = input.name.trim()

  if (name.length === 0) {
    throw new Error('Saved view name is required')
  }

  const savedView: SavedTaskView = {
    ...input,
    name,
  }

  if (input.customFieldFilter === undefined) {
    delete savedView.customFieldFilter
  }

  if (input.customFieldSortFieldId === undefined) {
    delete savedView.customFieldSortFieldId
  }

  return savedView
}
