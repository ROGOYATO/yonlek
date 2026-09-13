import { describe, expect, it } from 'vitest'

import type { CustomFieldOption } from '../domain/custom-field'
import {
  workspaceReducer,
  type WorkspaceState,
} from '../domain/workspace'
import {
  createWorkspaceCommands,
  type WorkspaceCommands,
} from './workspace-commands'
import type { WorkspaceStore } from './workspace-store'

class ReducerStore implements WorkspaceStore {
  state: WorkspaceState
  dispatches = 0

  constructor(state: WorkspaceState) {
    this.state = state
  }

  getState() {
    return this.state
  }

  dispatch(action: Parameters<typeof workspaceReducer>[1]) {
    this.dispatches += 1
    this.state = workspaceReducer(this.state, action)
  }

  subscribe() {
    return () => undefined
  }
}

type SelectOptionCommands = WorkspaceCommands & {
  addCustomFieldOption(fieldId: string, name: string): CustomFieldOption
  renameCustomFieldOption(fieldId: string, optionId: string, name: string): void
  deleteCustomFieldOption(fieldId: string, optionId: string): void
}

function baseState(): WorkspaceState {
  return {
    projects: [],
    customFields: [
      {
        id: 'field-phase',
        name: 'Phase',
        type: 'select',
        createdAt: '2026-09-13T09:00:00.000Z',
        options: [
          { id: 'option-draft', name: 'Draft' },
          { id: 'option-stay', name: 'Stay' },
        ],
      },
      {
        id: 'field-notes',
        name: 'Notes',
        type: 'text',
        createdAt: '2026-09-13T09:00:00.000Z',
      },
    ],
    tasks: [
      {
        id: 'task-clear',
        projectId: 'project-1',
        title: 'Clear selected option',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-13T09:00:00.000Z',
        customFieldValues: {
          'field-phase': 'option-draft',
          'field-notes': 'keep',
        },
      },
      {
        id: 'task-keep',
        projectId: 'project-1',
        title: 'Keep another option',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-13T09:00:00.000Z',
        customFieldValues: {
          'field-phase': 'option-stay',
        },
      },
    ],
  }
}

describe('Select custom field option commands', () => {
  it('adds, renames, and deletes options while clearing only deleted references', () => {
    const store = new ReducerStore(baseState())
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'option-review',
      now: () => '2026-09-13T09:05:00.000Z',
    }) as SelectOptionCommands

    expect(commands.addCustomFieldOption).toBeTypeOf('function')
    expect(commands.renameCustomFieldOption).toBeTypeOf('function')
    expect(commands.deleteCustomFieldOption).toBeTypeOf('function')

    const added = commands.addCustomFieldOption('field-phase', '  Review  ')
    expect(added).toEqual({ id: 'option-review', name: 'Review' })

    commands.renameCustomFieldOption(
      'field-phase',
      'option-review',
      '  Ready  ',
    )
    commands.deleteCustomFieldOption('field-phase', 'option-draft')

    const state = store.getState()
    expect(state.customFields?.[0]).toMatchObject({
      type: 'select',
      options: [
        { id: 'option-stay', name: 'Stay' },
        { id: 'option-review', name: 'Ready' },
      ],
    })
    expect(state.tasks[0]?.customFieldValues).toEqual({
      'field-notes': 'keep',
    })
    expect(state.tasks[1]?.customFieldValues).toEqual({
      'field-phase': 'option-stay',
    })
    expect(store.dispatches).toBe(3)
  })

  it('rejects missing fields, non-Select fields, and missing options', () => {
    const store = new ReducerStore(baseState())
    let nextId = 0
    const commands = createWorkspaceCommands(store, {
      nextId: () => `generated-${++nextId}`,
      now: () => '2026-09-13T09:05:00.000Z',
    }) as SelectOptionCommands

    expect(commands.addCustomFieldOption).toBeTypeOf('function')

    expect(() =>
      commands.addCustomFieldOption('missing', 'Review'),
    ).toThrow('Cannot change options on a missing custom field')
    expect(() =>
      commands.addCustomFieldOption('field-notes', 'Review'),
    ).toThrow('Custom field must be Select')
    expect(() =>
      commands.renameCustomFieldOption('field-phase', 'missing', 'Review'),
    ).toThrow('Custom field option not found')
    expect(() =>
      commands.deleteCustomFieldOption('field-phase', 'missing'),
    ).toThrow('Custom field option not found')
  })
})
