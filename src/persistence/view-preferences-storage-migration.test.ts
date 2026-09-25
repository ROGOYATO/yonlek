import { describe, expect, it } from 'vitest'

import { createDefaultViewPreferences } from '../domain/view-preferences'
import {
  loadViewPreferences,
  migrateViewPreferencesStorageDocument,
} from './view-preferences-storage'
import type { KeyValueStore } from './workspace-storage'

class TrackingStore implements KeyValueStore {
  writes = 0

  constructor(private readonly raw: string | null) {}

  getItem() {
    return this.raw
  }

  setItem() {
    this.writes += 1
  }
}

describe('View Preferences storage migration boundary', () => {
  it('accepts current v1 through the migration framework without rewriting storage', () => {
    const document = {
      version: 1,
      preferences: createDefaultViewPreferences(),
    }

    const migration = migrateViewPreferencesStorageDocument(document)

    expect(migration?.document).toBe(document)
    expect(migration?.migrated).toBe(false)

    const store = new TrackingStore(JSON.stringify(document))

    expect(loadViewPreferences(store)).toEqual(document.preferences)
    expect(store.writes).toBe(0)
  })

  it('preserves preference fallback semantics for unregistered versions', () => {
    const document = {
      version: 2,
      preferences: createDefaultViewPreferences(),
    }
    const store = new TrackingStore(JSON.stringify(document))

    expect(migrateViewPreferencesStorageDocument(document)).toBeNull()
    expect(loadViewPreferences(store)).toEqual(
      createDefaultViewPreferences(),
    )
    expect(store.writes).toBe(0)
  })
})
