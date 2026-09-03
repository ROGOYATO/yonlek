import {
  createDefaultViewPreferences,
  type ViewPreferences,
} from '../domain/view-preferences'
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
      value.sort === 'priority')
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
