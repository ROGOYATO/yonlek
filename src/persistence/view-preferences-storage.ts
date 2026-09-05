import {
  createDefaultViewPreferences,
  isTaskViewMode,
  type ViewPreferences,
} from '../domain/view-preferences'
import type { TaskFilterSet } from '../domain/task-filter-set'
import type { SavedTaskView } from '../domain/saved-task-view'
import type { KeyValueStore } from './workspace-storage'

const STORAGE_KEY = 'workspace-app.view-preferences'
const STORAGE_VERSION = 1

interface StoredViewPreferencesV1 {
  version: 1
  preferences: ViewPreferences
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidTaskFilterSet(value: unknown): value is TaskFilterSet {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    value.name.trim() === value.name &&
    typeof value.query === 'string' &&
    (value.status === 'all' ||
      value.status === 'todo' ||
      value.status === 'doing' ||
      value.status === 'done') &&
    (value.priority === 'all' ||
      value.priority === 'low' ||
      value.priority === 'normal' ||
      value.priority === 'high') &&
    (value.dueDate === 'all' ||
      value.dueDate === 'withDueDate' ||
      value.dueDate === 'withoutDueDate')
  )
}

function isValidTaskFilterSets(value: unknown): boolean {
  if (value === undefined) {
    return true
  }

  if (!Array.isArray(value)) {
    return false
  }

  const names = new Set<string>()

  for (const filterSet of value) {
    if (!isValidTaskFilterSet(filterSet)) {
      return false
    }

    if (names.has(filterSet.name)) {
      return false
    }
    names.add(filterSet.name)
  }

  return true
}

function isValidSavedTaskView(value: unknown): value is SavedTaskView {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    value.name.trim() === value.name &&
    typeof value.projectView === 'string' &&
    value.projectView.length > 0 &&
    typeof value.query === 'string' &&
    (value.status === 'all' ||
      value.status === 'todo' ||
      value.status === 'doing' ||
      value.status === 'done') &&
    (value.priority === 'all' ||
      value.priority === 'low' ||
      value.priority === 'normal' ||
      value.priority === 'high') &&
    (value.dueDate === 'all' ||
      value.dueDate === 'withDueDate' ||
      value.dueDate === 'withoutDueDate') &&
    (value.sort === 'created' ||
      value.sort === 'title' ||
      value.sort === 'dueDate' ||
      value.sort === 'priority' ||
      value.sort === 'manual') &&
    (value.group === 'none' ||
      value.group === 'status' ||
      value.group === 'priority' ||
      value.group === 'list')
  )
}

function isValidSavedTaskViews(value: unknown): boolean {
  if (value === undefined) {
    return true
  }

  if (!Array.isArray(value)) {
    return false
  }

  const names = new Set<string>()

  for (const savedView of value) {
    if (!isValidSavedTaskView(savedView)) {
      return false
    }

    if (names.has(savedView.name)) {
      return false
    }
    names.add(savedView.name)
  }

  return true
}

function isValidPreferences(value: unknown): value is ViewPreferences {
  return (
    isRecord(value) &&
    typeof value.projectView === 'string' &&
    value.projectView.length > 0 &&
    typeof value.query === 'string' &&
    (value.status === 'all' ||
      value.status === 'todo' ||
      value.status === 'doing' ||
      value.status === 'done') &&
    (value.priority === 'all' ||
      value.priority === 'low' ||
      value.priority === 'normal' ||
      value.priority === 'high') &&
    (value.dueDate === 'all' ||
      value.dueDate === 'withDueDate' ||
      value.dueDate === 'withoutDueDate') &&
    (value.sort === 'created' ||
      value.sort === 'title' ||
      value.sort === 'dueDate' ||
      value.sort === 'priority' ||
      value.sort === 'manual') &&
    (value.viewMode === undefined || isTaskViewMode(value.viewMode)) &&
    (value.group === undefined ||
      value.group === 'none' ||
      value.group === 'status' ||
      value.group === 'priority' ||
      value.group === 'list') &&
    isValidTaskFilterSets(value.savedFilterSets) &&
    isValidSavedTaskViews(value.savedViews)
  )
}

export function loadViewPreferences(
  storage: KeyValueStore,
): ViewPreferences {
  let raw: string | null

  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return createDefaultViewPreferences()
  }

  if (raw === null) {
    return createDefaultViewPreferences()
  }

  try {
    const document: unknown = JSON.parse(raw)

    if (
      !isRecord(document) ||
      document.version !== STORAGE_VERSION ||
      !isValidPreferences(document.preferences)
    ) {
      return createDefaultViewPreferences()
    }

    return document.preferences
  } catch {
    return createDefaultViewPreferences()
  }
}

export function saveViewPreferences(
  storage: KeyValueStore,
  preferences: ViewPreferences,
): void {
  const document: StoredViewPreferencesV1 = {
    version: STORAGE_VERSION,
    preferences,
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(document))
}
