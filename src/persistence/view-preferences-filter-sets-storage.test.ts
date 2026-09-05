import { describe, expect, it } from 'vitest'

import {
  createDefaultViewPreferences,
  getTaskFilterSets,
  saveTaskFilterSet,
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

describe('saved Task filter set persistence', () => {
  it('round-trips valid sets, keeps old version-1 documents compatible, and rejects invalid saved sets', () => {
    const storage = new MemoryStore()
    const saved = saveTaskFilterSet(
      {
        ...createDefaultViewPreferences(),
        query: 'camera',
        status: 'doing',
        priority: 'high',
        dueDate: 'withDueDate',
        sort: 'title',
        group: 'status',
      },
      'Lab review',
    )

    saveViewPreferences(storage, saved)
    expect(loadViewPreferences(storage)).toEqual(saved)

    const legacyStorage = new MemoryStore()
    legacyStorage.setItem(
      'workspace-app.view-preferences',
      JSON.stringify({
        version: 1,
        preferences: {
          ...createDefaultViewPreferences(),
          projectView: 'project-legacy',
          sort: 'priority',
          group: 'list',
        },
      }),
    )
    const legacy = loadViewPreferences(legacyStorage)
    expect(legacy.projectView).toBe('project-legacy')
    expect(legacy.sort).toBe('priority')
    expect(legacy.group).toBe('list')
    expect(getTaskFilterSets(legacy)).toEqual([])

    const invalidStorage = new MemoryStore()
    invalidStorage.setItem(
      'workspace-app.view-preferences',
      JSON.stringify({
        version: 1,
        preferences: {
          ...createDefaultViewPreferences(),
          savedFilterSets: [
            {
              name: 'Lab review',
              query: 'camera',
              status: 'doing',
              priority: 'high',
              dueDate: 'withDueDate',
            },
            {
              name: 'Lab review',
              query: '',
              status: 'all',
              priority: 'normal',
              dueDate: 'all',
            },
          ],
        },
      }),
    )
    expect(loadViewPreferences(invalidStorage)).toEqual(
      createDefaultViewPreferences(),
    )
  })
})
