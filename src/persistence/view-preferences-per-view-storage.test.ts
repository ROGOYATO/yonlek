import { describe, expect, it } from 'vitest'

import {
  createDefaultViewPreferences,
  switchTaskViewMode,
  updateTaskViewFilterSort,
} from '../domain/view-preferences'
import {
  loadViewPreferences,
  saveViewPreferences,
} from './view-preferences-storage'
import type { KeyValueStore } from './workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const storageKey = 'workspace-app.view-preferences'

describe('per-view filter/sort preference storage', () => {
  it('round-trips snapshots in version 1 and keeps legacy version-1 documents valid', () => {
    const storage = new MemoryStore()
    const list = updateTaskViewFilterSort(createDefaultViewPreferences(), {
      query: 'camera',
      sort: 'title',
    })
    const board = updateTaskViewFilterSort(
      switchTaskViewMode(list, 'board'),
      {
        query: 'review',
        status: 'doing',
        priority: 'high',
        dueDate: 'withDueDate',
        sort: 'priority',
      },
    )

    saveViewPreferences(storage, board)
    expect(loadViewPreferences(storage)).toEqual(board)

    const legacy = {
      ...createDefaultViewPreferences(),
      query: 'legacy',
      sort: 'title' as const,
    }
    storage.setItem(
      storageKey,
      JSON.stringify({ version: 1, preferences: legacy }),
    )
    expect(loadViewPreferences(storage)).toEqual(legacy)
  })

  it('falls back when a snapshot uses an unsupported view key or invalid state', () => {
    const storage = new MemoryStore()
    const defaults = createDefaultViewPreferences()

    storage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        preferences: {
          ...defaults,
          filterSortByView: {
            matrix: {
              query: '',
              status: 'all',
              priority: 'all',
              dueDate: 'all',
              sort: 'created',
            },
          },
        },
      }),
    )
    expect(loadViewPreferences(storage)).toEqual(defaults)

    storage.setItem(
      storageKey,
      JSON.stringify({
        version: 1,
        preferences: {
          ...defaults,
          filterSortByView: {
            list: {
              query: '',
              status: 'all',
              priority: 'all',
              dueDate: 'all',
              sort: 'sideways',
            },
          },
        },
      }),
    )
    expect(loadViewPreferences(storage)).toEqual(defaults)
  })
})
