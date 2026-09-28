import { describe, expect, it } from 'vitest'

import type { WorkspaceState } from '../domain/workspace'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from './workspace-storage'

class MemoryStore implements KeyValueStore {
  readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

function writeRawWorkspace(storage: MemoryStore, workspace: unknown): void {
  storage.setItem(
    'workspace-app.workspace',
    JSON.stringify({ version: 1, workspace }),
  )
}

describe('Automation persistence validation', () => {
  it('round-trips a valid Automation collection through storage version 1', () => {
    const storage = new MemoryStore()
    const workspace: WorkspaceState = {
      projects: [],
      tasks: [],
      automations: [
        {
          id: 'automation-1',
          name: 'Triage new Tasks',
          enabled: true,
          trigger: { kind: 'task.created' },
          conditions: [{ kind: 'priority', priority: 'normal' }],
          actions: [{ kind: 'priority.set', priority: 'high' }],
        },
      ],
    }

    saveWorkspace(storage, workspace)

    expect(loadWorkspace(storage)).toEqual(workspace)
  })

  it('rejects malformed persisted Automation records', () => {
    const storage = new MemoryStore()
    writeRawWorkspace(storage, {
      projects: [],
      tasks: [],
      automations: [
        {
          id: 'automation-1',
          name: 'Broken',
          enabled: true,
          trigger: { kind: 'task.created' },
          conditions: [],
          actions: [{ kind: 'status.set', status: 'invalid' }],
        },
      ],
    })

    expect(() => loadWorkspace(storage)).toThrow('Workspace storage is invalid')
  })

  it('rejects duplicate persisted Automation ids', () => {
    const storage = new MemoryStore()
    const automation = {
      id: 'automation-1',
      name: 'Duplicate',
      enabled: true,
      trigger: { kind: 'task.created' },
      conditions: [],
      actions: [],
    }

    writeRawWorkspace(storage, {
      projects: [],
      tasks: [],
      automations: [automation, { ...automation, name: 'Duplicate two' }],
    })

    expect(() => loadWorkspace(storage)).toThrow('Workspace storage is invalid')
  })
})
