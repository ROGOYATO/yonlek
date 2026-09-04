import { describe, expect, it } from 'vitest'

import {
  createDefaultViewPreferences,
  type ViewPreferences,
} from '../domain/view-preferences'
import type { KeyValueStore } from './workspace-storage'
import {
  loadViewPreferences,
  saveViewPreferences,
} from './view-preferences-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('view preference storage', () => {
  it('returns defaults when no preferences have been saved', () => {
    expect(loadViewPreferences(new MemoryStore())).toEqual(
      createDefaultViewPreferences(),
    )
  })

  it('round-trips preferences through a separate versioned document', () => {
    const storage = new MemoryStore()
    const preferences: ViewPreferences = {
      projectView: 'project-2',
      query: 'calibration',
      status: 'doing',
      priority: 'high',
      dueDate: 'withDueDate',
      sort: 'priority',
    }

    saveViewPreferences(storage, preferences)

    expect(loadViewPreferences(storage)).toEqual(preferences)
    expect(storage.getItem('workspace-app.workspace')).toBeNull()
  })
})


it('falls back to defaults for malformed preference JSON', () => {
  const storage: KeyValueStore = {
    getItem: () => '{not-json',
    setItem: () => undefined,
  }

  expect(loadViewPreferences(storage)).toEqual(createDefaultViewPreferences())
})

it('falls back to defaults for an unsupported preference version', () => {
  const storage: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 2,
        preferences: {
          ...createDefaultViewPreferences(),
          projectView: 'project-2',
        },
      }),
    setItem: () => undefined,
  }

  expect(loadViewPreferences(storage)).toEqual(createDefaultViewPreferences())
})

it('falls back to defaults for invalid preference values', () => {
  const storage: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        preferences: {
          ...createDefaultViewPreferences(),
          status: 'blocked',
        },
      }),
    setItem: () => undefined,
  }

  expect(loadViewPreferences(storage)).toEqual(createDefaultViewPreferences())
})


it('falls back to defaults when preference storage cannot be read', () => {
  const storage: KeyValueStore = {
    getItem: () => {
      throw new Error('Preference read failed')
    },
    setItem: () => undefined,
  }

  expect(loadViewPreferences(storage)).toEqual(createDefaultViewPreferences())
})


it('round-trips the manual task sort preference', () => {
  const storage = new MemoryStore()
  const preferences = {
    ...createDefaultViewPreferences(),
    sort: 'manual' as never,
  }

  saveViewPreferences(storage, preferences)

  expect(loadViewPreferences(storage).sort).toBe('manual')
})
