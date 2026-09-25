import { normalizeDateCustomFieldValue } from '../domain/custom-field'
import type { CustomFieldTaskFilter } from '../domain/task-filter'
import {
  createDefaultViewPreferences,
  isTaskViewMode,
  type TaskViewFilterSortState,
  type ViewPreferences,
} from '../domain/view-preferences'
import type { TaskFilterSet } from '../domain/task-filter-set'
import type { SavedTaskView } from '../domain/saved-task-view'
import type { KeyValueStore } from './workspace-storage'
import {
  migrateVersionedDocument,
  type VersionedDocumentMigrationResult,
  type VersionedDocumentMigrations,
} from './versioned-document'

const STORAGE_KEY = 'workspace-app.view-preferences'
const STORAGE_VERSION = 1
const VIEW_PREFERENCES_STORAGE_MIGRATIONS: VersionedDocumentMigrations = {}

interface StoredViewPreferencesV1 {
  version: 1
  preferences: ViewPreferences
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function migrateViewPreferencesStorageDocument(
  value: unknown,
): VersionedDocumentMigrationResult | null {
  try {
    return migrateVersionedDocument(
      value,
      STORAGE_VERSION,
      VIEW_PREFERENCES_STORAGE_MIGRATIONS,
    )
  } catch {
    return null
  }
}


function isNonEmptyTrimmedString(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.trim() === value
  )
}

function isValidCustomFieldTaskFilter(
  value: unknown,
): value is CustomFieldTaskFilter {
  if (
    !isRecord(value) ||
    !isNonEmptyTrimmedString(value.fieldId) ||
    (value.fieldType !== 'text' &&
      value.fieldType !== 'number' &&
      value.fieldType !== 'checkbox' &&
      value.fieldType !== 'select' &&
      value.fieldType !== 'date')
  ) {
    return false
  }

  if (value.fieldType === 'text' || value.fieldType === 'select') {
    return isNonEmptyTrimmedString(value.value)
  }

  if (value.fieldType === 'number') {
    return typeof value.value === 'number' && Number.isFinite(value.value)
  }

  if (value.fieldType === 'checkbox') {
    return typeof value.value === 'boolean'
  }

  if (typeof value.value !== 'string') {
    return false
  }

  try {
    return normalizeDateCustomFieldValue(value.value) === value.value
  } catch {
    return false
  }
}

function isValidOptionalCustomFieldFilter(value: unknown): boolean {
  return value === undefined || isValidCustomFieldTaskFilter(value)
}

function isValidOptionalCustomFieldSortFieldId(value: unknown): boolean {
  return value === undefined || isNonEmptyTrimmedString(value)
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
      value.dueDate === 'withoutDueDate') &&
    isValidOptionalCustomFieldFilter(value.customFieldFilter)
  )
}

function isValidTaskViewFilterSortState(
  value: unknown,
): value is TaskViewFilterSortState {
  return (
    isRecord(value) &&
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
    isValidOptionalCustomFieldFilter(value.customFieldFilter) &&
    isValidOptionalCustomFieldSortFieldId(value.customFieldSortFieldId)
  )
}

function isValidTaskViewFilterSortByView(value: unknown): boolean {
  if (value === undefined) {
    return true
  }

  if (!isRecord(value)) {
    return false
  }

  return Object.entries(value).every(
    ([viewMode, state]) =>
      isTaskViewMode(viewMode) && isValidTaskViewFilterSortState(state),
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
      value.group === 'list') &&
    isValidOptionalCustomFieldFilter(value.customFieldFilter) &&
    isValidOptionalCustomFieldSortFieldId(value.customFieldSortFieldId)
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
    isValidOptionalCustomFieldFilter(value.customFieldFilter) &&
    isValidOptionalCustomFieldSortFieldId(value.customFieldSortFieldId) &&
    (value.viewMode === undefined || isTaskViewMode(value.viewMode)) &&
    (value.group === undefined ||
      value.group === 'none' ||
      value.group === 'status' ||
      value.group === 'priority' ||
      value.group === 'list') &&
    isValidTaskFilterSets(value.savedFilterSets) &&
    isValidSavedTaskViews(value.savedViews) &&
    isValidTaskViewFilterSortByView(value.filterSortByView)
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
    const parsed: unknown = JSON.parse(raw)
    const migration = migrateViewPreferencesStorageDocument(parsed)

    if (
      migration === null ||
      !isValidPreferences(migration.document.preferences)
    ) {
      return createDefaultViewPreferences()
    }

    return migration.document.preferences
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
