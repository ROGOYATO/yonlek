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
        name: 'Research',
        createdAt: '2026-09-13T11:00:00.000Z',
      },
    ],
    customFields: [
      {
        id: 'field-left',
        name: 'Left',
        type: 'number',
        createdAt: '2026-09-13T11:00:00.000Z',
      },
      {
        id: 'field-right',
        name: 'Right',
        type: 'number',
        createdAt: '2026-09-13T11:00:00.000Z',
      },
      {
        id: 'field-subtotal',
        name: 'Subtotal',
        type: 'formula',
        createdAt: '2026-09-13T11:00:00.000Z',
        formula: {
          leftFieldId: 'field-left',
          operator: '+',
          rightFieldId: 'field-right',
        },
      },
      {
        id: 'field-total',
        name: 'Total',
        type: 'formula',
        createdAt: '2026-09-13T11:00:00.000Z',
        formula: {
          leftFieldId: 'field-subtotal',
          operator: '*',
          rightFieldId: 'field-right',
        },
      },
      {
        id: 'field-unconfigured',
        name: 'Unconfigured',
        type: 'formula',
        createdAt: '2026-09-13T11:00:00.000Z',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        projectId: 'project-1',
        title: 'Task',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-13T11:05:00.000Z',
        customFieldValues: {
          'field-left': 2,
          'field-right': 3,
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

describe('Formula custom field workspace storage', () => {
  it('round-trips configured and unconfigured Formula definitions in version 1', () => {
    const store = new MemoryStore()
    const workspace = validWorkspace()

    saveWorkspace(store, workspace)

    expect(loadWorkspace(store)).toEqual(workspace)
  })

  it('keeps older version-1 workspaces without Formula fields valid', () => {
    const workspace = {
      projects: [
        {
          id: 'project-1',
          name: 'Research',
          createdAt: '2026-09-13T11:00:00.000Z',
        },
      ],
      tasks: [],
    }

    expect(loadWorkspace(rawStore(workspace))).toEqual(workspace)
  })

  it('rejects malformed Formula metadata and Formula metadata on non-Formula fields', () => {
    const base = validWorkspace()
    const malformed = [
      {
        ...base.customFields![2],
        formula: {
          leftFieldId: '   ',
          operator: '+',
          rightFieldId: 'field-right',
        },
      },
      {
        ...base.customFields![2],
        formula: {
          leftFieldId: 'field-left',
          operator: '%',
          rightFieldId: 'field-right',
        },
      },
      {
        ...base.customFields![0],
        formula: {
          leftFieldId: 'field-left',
          operator: '+',
          rightFieldId: 'field-right',
        },
      },
      {
        ...base.customFields![2],
        options: [],
      },
    ]

    for (const field of malformed) {
      expect(() =>
        loadWorkspace(rawStore({
          ...base,
          customFields: [
            base.customFields![0],
            base.customFields![1],
            field,
          ],
          tasks: [],
        })),
      ).toThrow('Workspace storage is invalid')
    }
  })

  it('rejects missing, incompatible, self, and cyclic Formula dependencies', () => {
    const base = validWorkspace()
    const left = base.customFields![0]!
    const right = base.customFields![1]!
    const invalidFieldSets = [
      [
        left,
        right,
        {
          ...base.customFields![2]!,
          formula: {
            leftFieldId: 'missing',
            operator: '+' as const,
            rightFieldId: right.id,
          },
        },
      ],
      [
        left,
        right,
        {
          id: 'field-text',
          name: 'Text',
          type: 'text' as const,
          createdAt: '2026-09-13T11:00:00.000Z',
        },
        {
          ...base.customFields![2]!,
          formula: {
            leftFieldId: 'field-text',
            operator: '+' as const,
            rightFieldId: right.id,
          },
        },
      ],
      [
        left,
        right,
        {
          ...base.customFields![2]!,
          formula: {
            leftFieldId: 'field-subtotal',
            operator: '+' as const,
            rightFieldId: right.id,
          },
        },
      ],
      [
        left,
        right,
        {
          ...base.customFields![2]!,
          formula: {
            leftFieldId: 'field-total',
            operator: '+' as const,
            rightFieldId: right.id,
          },
        },
        {
          ...base.customFields![3]!,
          formula: {
            leftFieldId: 'field-subtotal',
            operator: '*' as const,
            rightFieldId: right.id,
          },
        },
      ],
    ]

    for (const customFields of invalidFieldSets) {
      expect(() =>
        loadWorkspace(rawStore({
          ...base,
          customFields,
          tasks: [],
        })),
      ).toThrow('Workspace storage is invalid')
    }
  })

  it('rejects persisted Task values for Formula definitions', () => {
    const workspace = validWorkspace()
    workspace.tasks[0] = {
      ...workspace.tasks[0]!,
      customFieldValues: {
        ...workspace.tasks[0]!.customFieldValues,
        'field-subtotal': 5,
      },
    }

    expect(() => loadWorkspace(rawStore(workspace))).toThrow(
      'Workspace storage is invalid',
    )
  })
})
