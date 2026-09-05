import type { TaskDueDateFilter } from './task-filter'
import { createTaskFilterSet, type TaskFilterSet } from './task-filter-set'
import type { TaskSort } from './task-sort'
import type { TaskGroup } from './task-group'
import type { TaskPriority, TaskStatus } from './task'

export interface ViewPreferences {
  projectView: string
  query: string
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  dueDate: TaskDueDateFilter
  sort: TaskSort
  group?: TaskGroup
  savedFilterSets?: TaskFilterSet[]
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

export function getTaskGroup(preferences: ViewPreferences): TaskGroup {
  return preferences.group ?? 'none'
}

export function getTaskFilterSets(
  preferences: ViewPreferences,
): TaskFilterSet[] {
  return preferences.savedFilterSets ?? []
}

export function saveTaskFilterSet(
  current: ViewPreferences,
  name: string,
): ViewPreferences {
  const filterSet = createTaskFilterSet({
    name,
    query: current.query,
    status: current.status,
    priority: current.priority,
    dueDate: current.dueDate,
  })
  const existing = getTaskFilterSets(current)
  const matchingIndex = existing.findIndex(
    (candidate) => candidate.name === filterSet.name,
  )
  const savedFilterSets = [...existing]

  if (matchingIndex === -1) {
    savedFilterSets.push(filterSet)
  } else {
    savedFilterSets[matchingIndex] = filterSet
  }

  return {
    ...current,
    savedFilterSets,
  }
}

export function applyTaskFilterSet(
  current: ViewPreferences,
  name: string,
): ViewPreferences {
  const normalizedName = name.trim()
  const filterSet = getTaskFilterSets(current).find(
    (candidate) => candidate.name === normalizedName,
  )

  if (!filterSet) {
    throw new Error('Saved filter set not found')
  }

  return {
    ...current,
    query: filterSet.query,
    status: filterSet.status,
    priority: filterSet.priority,
    dueDate: filterSet.dueDate,
  }
}

export function deleteTaskFilterSet(
  current: ViewPreferences,
  name: string,
): ViewPreferences {
  const normalizedName = name.trim()
  const existing = getTaskFilterSets(current)
  const savedFilterSets = existing.filter(
    (candidate) => candidate.name !== normalizedName,
  )

  if (savedFilterSets.length === existing.length) {
    throw new Error('Saved filter set not found')
  }

  if (savedFilterSets.length > 0) {
    return {
      ...current,
      savedFilterSets,
    }
  }

  const next = { ...current }
  delete next.savedFilterSets
  return next
}
