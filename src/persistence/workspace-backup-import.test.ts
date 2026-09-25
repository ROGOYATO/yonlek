import { describe, expect, it } from 'vitest'

import { createProject } from '../domain/project'
import { createDefaultViewPreferences } from '../domain/view-preferences'
import {
  loadViewPreferences,
  saveViewPreferences,
} from './view-preferences-storage'
import {
  createWorkspaceBackupDocument,
  importWorkspaceBackup,
  serializeWorkspaceBackup,
} from './workspace-backup'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from './workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()
  private writeCount = 0
  private failOnWrite: number | null = null

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.writeCount += 1

    if (this.failOnWrite === this.writeCount) {
      this.failOnWrite = null
      throw new Error('Synthetic storage failure')
    }

    this.values.set(key, value)
  }

  failOnNextImportWrite(number: number) {
    this.writeCount = 0
    this.failOnWrite = number
  }
}

function backupContents() {
  const project = createProject({
    id: 'imported-project',
    name: 'Imported project',
    now: '2026-09-25T10:10:00.000Z',
  })

  return serializeWorkspaceBackup(
    createWorkspaceBackupDocument(
      { projects: [project], tasks: [] },
      {
        ...createDefaultViewPreferences(),
        query: 'imported',
      },
      '2026-09-25T10:11:00.000Z',
    ),
  )
}

describe('Workspace backup persistence import', () => {
  it('replaces Workspace and View Preferences only after validating the whole backup', () => {
    const storage = new MemoryStore()
    saveWorkspace(storage, { projects: [], tasks: [] })
    saveViewPreferences(storage, createDefaultViewPreferences())

    const imported = importWorkspaceBackup(storage, backupContents())

    expect(loadWorkspace(storage)).toEqual(imported.workspace)
    expect(loadViewPreferences(storage)).toEqual(imported.viewPreferences)
  })

  it('rolls back Workspace when the View Preferences write fails', () => {
    const storage = new MemoryStore()
    const previousWorkspace = { projects: [], tasks: [] }
    const previousPreferences = {
      ...createDefaultViewPreferences(),
      query: 'before-import',
    }

    saveWorkspace(storage, previousWorkspace)
    saveViewPreferences(storage, previousPreferences)
    storage.failOnNextImportWrite(2)

    expect(() => importWorkspaceBackup(storage, backupContents())).toThrow(
      'Workspace backup could not be imported',
    )

    expect(loadWorkspace(storage)).toEqual(previousWorkspace)
    expect(loadViewPreferences(storage)).toEqual(previousPreferences)
  })
})
