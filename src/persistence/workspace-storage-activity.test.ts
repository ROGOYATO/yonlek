import { describe, expect, it } from 'vitest'

import { createProject } from '../domain/project'
import type { WorkspaceState } from '../domain/workspace'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from './workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-09-23T08:00:00.000Z',
})

const activity = [
  {
    sequence: 1,
    occurredAt: '2026-09-23T09:00:00.000Z',
    taskId: 'task-deleted',
    taskTitle: 'Deleted task',
    event: {
      kind: 'task.created' as const,
      projectId: project.id,
      projectName: project.name,
    },
  },
  {
    sequence: 2,
    occurredAt: '2026-09-23T09:05:00.000Z',
    taskId: 'task-deleted',
    taskTitle: 'Deleted task',
    event: { kind: 'task.deleted' as const },
  },
]

function rawStore(workspace: unknown) {
  const store = new MemoryStore()
  store.setItem(
    'workspace-app.workspace',
    JSON.stringify({ version: 1, workspace }),
  )
  return store
}

describe('Workspace Activity storage', () => {
  it('round-trips Activity in version 1 even when the historical Task no longer exists', () => {
    const storage = new MemoryStore()
    const workspace: WorkspaceState = {
      projects: [project],
      tasks: [],
      activity,
    }

    saveWorkspace(storage, workspace)

    expect(loadWorkspace(storage)).toEqual(workspace)
  })

  it('keeps legacy version-1 workspaces without Activity valid', () => {
    const legacy = { projects: [project], tasks: [] }
    expect(loadWorkspace(rawStore(legacy))).toEqual(legacy)
  })

  it('rejects malformed sequence, timestamp, event kind, and extra event fields', () => {
    const valid = {
      projects: [project],
      tasks: [],
      activity,
    }

    const invalidActivity = [
      [{ ...activity[0], sequence: 2 }],
      [{ ...activity[0], occurredAt: '2026-09-23 09:00:00Z' }],
      [{ ...activity[0], event: { kind: 'task.unknown' } }],
      [{ ...activity[1], event: { kind: 'task.deleted', extra: true } }],
    ]

    for (const candidate of invalidActivity) {
      expect(() =>
        loadWorkspace(rawStore({ ...valid, activity: candidate })),
      ).toThrow('Workspace storage is invalid')
    }
  })
})
