import { describe, expect, it } from 'vitest'

import {
  loadWorkspace,
  migrateWorkspaceStorageDocument,
  type KeyValueStore,
} from './workspace-storage'

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

describe('Workspace storage migration boundary', () => {
  it('routes current v1 through the migration framework without rewriting storage', () => {
    const document = {
      version: 1,
      workspace: {
        projects: [],
        tasks: [],
      },
    }

    const migration = migrateWorkspaceStorageDocument(document)

    expect(migration.document).toBe(document)
    expect(migration.migrated).toBe(false)

    const store = new TrackingStore(JSON.stringify(document))

    expect(loadWorkspace(store)).toEqual({
      projects: [],
      tasks: [],
    })
    expect(store.writes).toBe(0)
  })

  it('preserves the public unsupported-version error for unregistered versions', () => {
    const store = new TrackingStore(
      JSON.stringify({
        version: 2,
        workspace: {
          projects: [],
          tasks: [],
        },
      }),
    )

    expect(() => loadWorkspace(store)).toThrow(
      'Unsupported workspace storage version',
    )
    expect(store.writes).toBe(0)
  })
})
