import { describe, expect, it } from 'vitest'

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

function validWorkspace(): WorkspaceState {
  return {
    projects: [
      {
        id: 'project-1',
        name: 'Robotics Research',
        createdAt: '2026-09-13T15:00:00.000Z',
      },
    ],
    customFields: [
      {
        id: 'field-review-date',
        name: 'Review date',
        type: 'date',
        createdAt: '2026-09-13T15:00:00.000Z',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        projectId: 'project-1',
        title: 'Draft experiment plan',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-13T15:05:00.000Z',
        customFieldValues: {
          'field-review-date': '2026-09-21',
        },
      },
    ],
  }
}

function rawStore(workspace: unknown): KeyValueStore {
  return {
    getItem: () => JSON.stringify({ version: 1, workspace }),
    setItem: () => undefined,
  }
}

describe('Date custom field workspace storage', () => {
  it('round-trips Date definitions and exact Task values in version 1', () => {
    const store = new MemoryStore()
    const workspace = validWorkspace()

    saveWorkspace(store, workspace)

    expect(loadWorkspace(store)).toEqual(workspace)
  })

  it('keeps older version-1 workspaces without Date fields valid', () => {
    const workspace = {
      projects: [
        {
          id: 'project-1',
          name: 'Robotics Research',
          createdAt: '2026-09-13T15:00:00.000Z',
        },
      ],
      tasks: [],
    }

    expect(loadWorkspace(rawStore(workspace))).toEqual(workspace)
  })

  it('rejects Date definitions with Select-only option metadata', () => {
    const base = validWorkspace()
    const workspace = {
      ...base,
      customFields: [
        {
          ...base.customFields![0]!,
          options: [{ id: 'option-invalid', name: 'Invalid' }],
        },
      ],
      tasks: [],
    }

    expect(() => loadWorkspace(rawStore(workspace))).toThrow(
      'Workspace storage is invalid',
    )
  })

  it('rejects malformed, impossible, or non-exact persisted Date values', () => {
    for (const value of [
      '2026-02-30',
      '2025-02-29',
      '2026-2-03',
      ' 2026-09-21 ',
    ]) {
      const workspace = validWorkspace()
      workspace.tasks[0] = {
        ...workspace.tasks[0]!,
        customFieldValues: {
          'field-review-date': value,
        },
      }

      expect(() => loadWorkspace(rawStore(workspace))).toThrow(
        'Workspace storage is invalid',
      )
    }
  })
})
