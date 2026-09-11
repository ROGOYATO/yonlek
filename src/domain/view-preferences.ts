import type { TaskDueDateFilter } from './task-filter'
import { createTaskFilterSet, type TaskFilterSet } from './task-filter-set'
import { createSavedTaskView, type SavedTaskView } from './saved-task-view'
import type { TaskSort } from './task-sort'
import type { TaskGroup } from './task-group'
import type { TaskPriority, TaskStatus } from './task'

export type TaskViewMode = 'list' | 'board' | 'calendar' | 'table' | 'timeline'

export interface ViewPreferences {
  projectView: string
  query: string
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  dueDate: TaskDueDateFilter
  sort: TaskSort
  viewMode?: TaskViewMode
  group?: TaskGroup
  savedFilterSets?: TaskFilterSet[]
  savedViews?: SavedTaskView[]
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

export function isTaskViewMode(value: unknown): value is TaskViewMode {
  return (
    value === 'list' ||
    value === 'board' ||
    value === 'calendar' ||
    value === 'table' ||
    value === 'timeline'
  )
}

export function getTaskViewMode(
  preferences: ViewPreferences,
): TaskViewMode {
  return preferences.viewMode ?? 'list'
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

export function getSavedTaskViews(
  preferences: ViewPreferences,
): SavedTaskView[] {
  return preferences.savedViews ?? []
}

export function saveTaskView(
  current: ViewPreferences,
  name: string,
): ViewPreferences {
  const savedView = createSavedTaskView({
    name,
    projectView: current.projectView,
    query: current.query,
    status: current.status,
    priority: current.priority,
    dueDate: current.dueDate,
    sort: current.sort,
    group: getTaskGroup(current),
  })
  const existing = getSavedTaskViews(current)
  const matchingIndex = existing.findIndex(
    (candidate) => candidate.name === savedView.name,
  )
  const savedViews = [...existing]

  if (matchingIndex === -1) {
    savedViews.push(savedView)
  } else {
    savedViews[matchingIndex] = savedView
  }

  return {
    ...current,
    savedViews,
  }
}

export function applyTaskView(
  current: ViewPreferences,
  name: string,
): ViewPreferences {
  const normalizedName = name.trim()
  const savedView = getSavedTaskViews(current).find(
    (candidate) => candidate.name === normalizedName,
  )

  if (!savedView) {
    throw new Error('Saved view not found')
  }

  return {
    ...current,
    projectView: savedView.projectView,
    query: savedView.query,
    status: savedView.status,
    priority: savedView.priority,
    dueDate: savedView.dueDate,
    sort: savedView.sort,
    group: savedView.group,
  }
}

export function deleteTaskView(
  current: ViewPreferences,
  name: string,
): ViewPreferences {
  const normalizedName = name.trim()
  const existing = getSavedTaskViews(current)
  const savedViews = existing.filter(
    (candidate) => candidate.name !== normalizedName,
  )

  if (savedViews.length === existing.length) {
    throw new Error('Saved view not found')
  }

  if (savedViews.length > 0) {
    return {
      ...current,
      savedViews,
    }
  }

  const next = { ...current }
  delete next.savedViews
  return next
}
