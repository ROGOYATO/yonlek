import { describe, expect, it } from 'vitest'

import {
  createDefaultViewPreferences,
  getSavedTaskViews,
  saveTaskView,
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

describe('saved Task view persistence', () => {
  it('round-trips valid views, keeps old version-1 documents compatible, and rejects invalid saved views', () => {
    const storage = new MemoryStore()
    const saved = saveTaskView(
      {
        ...createDefaultViewPreferences(),
        projectView: 'project-1',
        query: 'camera',
        status: 'doing',
        priority: 'high',
        dueDate: 'withDueDate',
        sort: 'title',
        group: 'status',
      },
      'Camera review',
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
    expect(getSavedTaskViews(legacy)).toEqual([])

    const duplicateStorage = new MemoryStore()
    duplicateStorage.setItem(
      'workspace-app.view-preferences',
      JSON.stringify({
        version: 1,
        preferences: {
          ...createDefaultViewPreferences(),
          savedViews: [
            {
              name: 'Camera review',
              projectView: 'project-1',
              query: 'camera',
              status: 'doing',
              priority: 'high',
              dueDate: 'withDueDate',
              sort: 'title',
              group: 'status',
            },
            {
              name: 'Camera review',
              projectView: 'all',
              query: '',
              status: 'all',
              priority: 'all',
              dueDate: 'all',
              sort: 'created',
              group: 'none',
            },
          ],
        },
      }),
    )
    expect(loadViewPreferences(duplicateStorage)).toEqual(
      createDefaultViewPreferences(),
    )

    const invalidStorage = new MemoryStore()
    invalidStorage.setItem(
      'workspace-app.view-preferences',
      JSON.stringify({
        version: 1,
        preferences: {
          ...createDefaultViewPreferences(),
          savedViews: [
            {
              name: 'Camera review',
              projectView: 'project-1',
              query: '',
              status: 'all',
              priority: 'all',
              dueDate: 'all',
              sort: 'created',
              group: 'owner',
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
