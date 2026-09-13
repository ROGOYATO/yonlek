import type { CustomFieldTaskFilter, TaskDueDateFilter } from './task-filter'
import { createTaskFilterSet, type TaskFilterSet } from './task-filter-set'
import { createSavedTaskView, type SavedTaskView } from './saved-task-view'
import type { TaskSort } from './task-sort'
import type { TaskGroup } from './task-group'
import type { TaskPriority, TaskStatus } from './task'

export type TaskViewMode = 'list' | 'board' | 'calendar' | 'table' | 'timeline' | 'gantt'

export interface TaskViewFilterSortState {
  query: string
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  dueDate: TaskDueDateFilter
  sort: TaskSort
  customFieldFilter?: CustomFieldTaskFilter
  customFieldSortFieldId?: string
}

export type TaskViewFilterSortByView = Partial<
  Record<TaskViewMode, TaskViewFilterSortState>
>

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
  filterSortByView?: TaskViewFilterSortByView
  customFieldFilter?: CustomFieldTaskFilter
  customFieldSortFieldId?: string
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

function getTaskViewFilterSortState(
  preferences: ViewPreferences,
): TaskViewFilterSortState {
  const state: TaskViewFilterSortState = {
    query: preferences.query,
    status: preferences.status,
    priority: preferences.priority,
    dueDate: preferences.dueDate,
    sort: preferences.sort,
  }

  if (preferences.customFieldFilter !== undefined) {
    state.customFieldFilter = preferences.customFieldFilter
  }

  if (preferences.customFieldSortFieldId !== undefined) {
    state.customFieldSortFieldId = preferences.customFieldSortFieldId
  }

  return state
}

function hasOwnProperty<T extends object>(object: T, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(object, key)
}

function mergeTaskViewFilterSortState(
  current: TaskViewFilterSortState,
  patch: Partial<TaskViewFilterSortState>,
): TaskViewFilterSortState {
  const next: TaskViewFilterSortState = {
    ...current,
    ...patch,
  }

  if (
    hasOwnProperty(patch, 'customFieldFilter') &&
    patch.customFieldFilter === undefined
  ) {
    delete next.customFieldFilter
  }

  if (
    hasOwnProperty(patch, 'customFieldSortFieldId') &&
    patch.customFieldSortFieldId === undefined
  ) {
    delete next.customFieldSortFieldId
  }

  return next
}

function applyTaskViewFilterSortState(
  current: ViewPreferences,
  state: TaskViewFilterSortState,
): ViewPreferences {
  const next: ViewPreferences = {
    ...current,
    ...state,
  }

  if (state.customFieldFilter === undefined) {
    delete next.customFieldFilter
  }

  if (state.customFieldSortFieldId === undefined) {
    delete next.customFieldSortFieldId
  }

  return next
}

export function updateTaskViewFilterSort(
  current: ViewPreferences,
  patch: Partial<TaskViewFilterSortState>,
): ViewPreferences {
  const activeState = mergeTaskViewFilterSortState(
    getTaskViewFilterSortState(current),
    patch,
  )
  const next = applyTaskViewFilterSortState(current, activeState)

  if (current.filterSortByView === undefined) {
    return next
  }

  return {
    ...next,
    filterSortByView: {
      ...current.filterSortByView,
      [getTaskViewMode(current)]: activeState,
    },
  }
}

export function switchTaskViewMode(
  current: ViewPreferences,
  nextMode: TaskViewMode,
): ViewPreferences {
  const currentMode = getTaskViewMode(current)

  if (currentMode === nextMode) {
    return current
  }

  const currentState = getTaskViewFilterSortState(current)
  const targetState = current.filterSortByView?.[nextMode] ?? currentState

  return {
    ...applyTaskViewFilterSortState(current, targetState),
    viewMode: nextMode,
    filterSortByView: {
      ...current.filterSortByView,
      [currentMode]: currentState,
      [nextMode]: targetState,
    },
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
    value === 'timeline' ||
    value === 'gantt'
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
    customFieldFilter: current.customFieldFilter,
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

  return updateTaskViewFilterSort(current, {
    query: filterSet.query,
    status: filterSet.status,
    priority: filterSet.priority,
    dueDate: filterSet.dueDate,
    customFieldFilter: filterSet.customFieldFilter,
  })
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
    customFieldFilter: current.customFieldFilter,
    customFieldSortFieldId: current.customFieldSortFieldId,
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

  return updateTaskViewFilterSort(
    updateViewPreferences(current, {
      projectView: savedView.projectView,
      group: savedView.group,
    }),
    {
      query: savedView.query,
      status: savedView.status,
      priority: savedView.priority,
      dueDate: savedView.dueDate,
      sort: savedView.sort,
      customFieldFilter: savedView.customFieldFilter,
      customFieldSortFieldId: savedView.customFieldSortFieldId,
    },
  )
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
