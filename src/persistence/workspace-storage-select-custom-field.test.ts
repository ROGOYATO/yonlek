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
        createdAt: '2026-09-13T11:00:00.000Z',
      },
    ],
    customFields: [
      {
        id: 'field-phase',
        name: 'Phase',
        type: 'select',
        createdAt: '2026-09-13T11:00:00.000Z',
        options: [
          { id: 'option-draft', name: 'Draft' },
          { id: 'option-review', name: 'Review' },
        ],
      },
    ],
    tasks: [
      {
        id: 'task-1',
        projectId: 'project-1',
        title: 'Draft experiment plan',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-13T11:05:00.000Z',
        customFieldValues: {
          'field-phase': 'option-review',
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

describe('Select custom field workspace storage', () => {
  it('round-trips Select definitions and option-id Task values in version 1', () => {
    const store = new MemoryStore()
    const workspace = validWorkspace()

    saveWorkspace(store, workspace)

    expect(loadWorkspace(store)).toEqual(workspace)
  })

  it('keeps older version-1 workspaces without Select fields valid', () => {
    const workspace = {
      projects: [
        {
          id: 'project-1',
          name: 'Robotics Research',
          createdAt: '2026-09-13T11:00:00.000Z',
        },
      ],
      tasks: [],
    }

    expect(loadWorkspace(rawStore(workspace))).toEqual(workspace)
  })

  it('rejects malformed Select options and Select metadata on non-Select fields', () => {
    const base = validWorkspace()
    const invalidFields = [
      {
        ...base.customFields![0],
        options: [
          { id: 'option-draft', name: 'Draft' },
          { id: 'option-draft', name: 'Duplicate' },
        ],
      },
      {
        ...base.customFields![0],
        options: [{ id: 'option-draft', name: '   ' }],
      },
      {
        id: 'field-notes',
        name: 'Notes',
        type: 'text',
        createdAt: '2026-09-13T11:00:00.000Z',
        options: [{ id: 'option-invalid', name: 'Invalid' }],
      },
    ]

    for (const field of invalidFields) {
      expect(() =>
        loadWorkspace(
          rawStore({
            ...base,
            customFields: [field],
            tasks: [],
          }),
        ),
      ).toThrow('Workspace storage is invalid')
    }
  })

  it('rejects persisted Select Task values that do not reference an owned option', () => {
    const workspace = validWorkspace()
    workspace.tasks[0] = {
      ...workspace.tasks[0]!,
      customFieldValues: {
        'field-phase': 'option-missing',
      },
    }

    expect(() => loadWorkspace(rawStore(workspace))).toThrow(
      'Workspace storage is invalid',
    )
  })
})
