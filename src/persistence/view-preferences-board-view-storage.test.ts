import { describe, expect, it } from 'vitest'

import {
  createDefaultViewPreferences,
  getTaskViewMode,
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

describe('Task view mode preference storage', () => {
  it('round-trips Board mode, keeps old version-1 documents compatible, and rejects invalid modes', () => {
    const storage = new MemoryStore()
    const boardPreferences = {
      ...createDefaultViewPreferences(),
      projectView: 'project-2',
      viewMode: 'board' as const,
    }

    saveViewPreferences(storage, boardPreferences)
    expect(loadViewPreferences(storage)).toEqual(boardPreferences)

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
    expect(getTaskViewMode(legacy)).toBe('list')

    const invalidStorage = new MemoryStore()
    invalidStorage.setItem(
      'workspace-app.view-preferences',
      JSON.stringify({
        version: 1,
        preferences: {
          ...createDefaultViewPreferences(),
          viewMode: 'matrix',
        },
      }),
    )
    expect(loadViewPreferences(invalidStorage)).toEqual(
      createDefaultViewPreferences(),
    )
  })
})
