import { describe, expect, it } from 'vitest'

import {
  createDefaultViewPreferences,
  getTaskGroup,
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

describe('view preference grouping storage', () => {
  it('round-trips valid grouping, keeps old version-1 documents compatible, and rejects invalid grouping values', () => {
    const storage = new MemoryStore()
    const grouped = {
      ...createDefaultViewPreferences(),
      projectView: 'project-2',
      group: 'list' as const,
    }

    saveViewPreferences(storage, grouped)
    expect(loadViewPreferences(storage)).toEqual(grouped)

    const legacyStorage = new MemoryStore()
    legacyStorage.setItem(
      'workspace-app.view-preferences',
      JSON.stringify({
        version: 1,
        preferences: {
          ...createDefaultViewPreferences(),
          projectView: 'project-legacy',
          sort: 'title',
        },
      }),
    )
    const legacy = loadViewPreferences(legacyStorage)
    expect(legacy.projectView).toBe('project-legacy')
    expect(legacy.sort).toBe('title')
    expect(getTaskGroup(legacy)).toBe('none')

    const invalidStorage = new MemoryStore()
    invalidStorage.setItem(
      'workspace-app.view-preferences',
      JSON.stringify({
        version: 1,
        preferences: {
          ...createDefaultViewPreferences(),
          group: 'owner',
        },
      }),
    )
    expect(loadViewPreferences(invalidStorage)).toEqual(
      createDefaultViewPreferences(),
    )
  })
})
