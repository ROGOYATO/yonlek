import { describe, expect, it } from 'vitest'

import type { CustomFieldType } from '../domain/custom-field'
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

type MigrationCommands = WorkspaceCommands & {
  changeCustomFieldType(fieldId: string, nextType: CustomFieldType): void
}

function state(): WorkspaceState {
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
        id: 'field-score',
        name: 'Score',
        type: 'number',
        createdAt: '2026-09-13T11:00:00.000Z',
      },
      {
        id: 'field-other',
        name: 'Other',
        type: 'number',
        createdAt: '2026-09-13T11:00:00.000Z',
      },
      {
        id: 'field-note',
        name: 'Note',
        type: 'text',
        createdAt: '2026-09-13T11:00:00.000Z',
      },
      {
        id: 'field-direct',
        name: 'Direct',
        type: 'formula',
        createdAt: '2026-09-13T11:00:00.000Z',
        formula: {
          leftFieldId: 'field-score',
          operator: '+',
          rightFieldId: 'field-other',
        },
      },
      {
        id: 'field-downstream',
        name: 'Downstream',
        type: 'formula',
        createdAt: '2026-09-13T11:00:00.000Z',
        formula: {
          leftFieldId: 'field-direct',
          operator: '*',
          rightFieldId: 'field-other',
        },
      },
    ],
    tasks: [
      {
        id: 'task-1',
        projectId: 'project-1',
        title: 'Task one',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-13T11:00:00.000Z',
        customFieldValues: {
          'field-score': 5,
          'field-other': 2,
          'field-note': 'keep',
        },
      },
      {
        id: 'task-2',
        projectId: 'project-1',
        title: 'Task two',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-13T11:01:00.000Z',
        customFieldValues: {
          'field-score': 9,
          'field-note': 'also keep',
        },
      },
    ],
  }
}

function commandsFor(store: ReducerStore): MigrationCommands {
  return createWorkspaceCommands(store, {
    nextId: () => 'unused-id',
    now: () => '2026-09-13T11:05:00.000Z',
  }) as MigrationCommands
}

describe('Custom Field type migration workspace command', () => {
  it('clears migrated Task values and incompatible direct Formula dependencies in one dispatch', () => {
    const store = new ReducerStore(state())
    const commands = commandsFor(store)
    expect(commands.changeCustomFieldType).toBeTypeOf('function')

    commands.changeCustomFieldType('field-score', 'text')

    const fields = store.getState().customFields ?? []
    expect(fields.find((field) => field.id === 'field-score')).toEqual({
      id: 'field-score',
      name: 'Score',
      type: 'text',
      createdAt: '2026-09-13T11:00:00.000Z',
    })
    expect(fields.find((field) => field.id === 'field-direct')).not.toHaveProperty(
      'formula',
    )
    expect(fields.find((field) => field.id === 'field-downstream')?.formula).toEqual({
      leftFieldId: 'field-direct',
      operator: '*',
      rightFieldId: 'field-other',
    })
    expect(store.getState().tasks[0]?.customFieldValues).toEqual({
      'field-other': 2,
      'field-note': 'keep',
    })
    expect(store.getState().tasks[1]?.customFieldValues).toEqual({
      'field-note': 'also keep',
    })
    expect(store.dispatches).toBe(1)
  })

  it('preserves Formula dependencies when the migrated field remains a numeric operand type', () => {
    const store = new ReducerStore(state())
    const commands = commandsFor(store)
    expect(commands.changeCustomFieldType).toBeTypeOf('function')

    commands.changeCustomFieldType('field-score', 'formula')

    const fields = store.getState().customFields ?? []
    expect(fields.find((field) => field.id === 'field-score')).toEqual({
      id: 'field-score',
      name: 'Score',
      type: 'formula',
      createdAt: '2026-09-13T11:00:00.000Z',
    })
    expect(fields.find((field) => field.id === 'field-direct')?.formula).toEqual({
      leftFieldId: 'field-score',
      operator: '+',
      rightFieldId: 'field-other',
    })
    expect(store.getState().tasks[0]?.customFieldValues).toEqual({
      'field-other': 2,
      'field-note': 'keep',
    })
  })

  it('rejects missing fields and makes same-type changes non-destructive no-ops', () => {
    const store = new ReducerStore(state())
    const commands = commandsFor(store)
    expect(commands.changeCustomFieldType).toBeTypeOf('function')

    expect(() => commands.changeCustomFieldType('missing', 'text')).toThrow(
      'Cannot change type of a missing custom field',
    )
    expect(store.dispatches).toBe(0)

    commands.changeCustomFieldType('field-score', 'number')
    expect(store.dispatches).toBe(0)
    expect(store.getState().tasks[0]?.customFieldValues?.['field-score']).toBe(5)
    expect(store.getState().customFields?.find(
      (field) => field.id === 'field-direct',
    )?.formula).toEqual({
      leftFieldId: 'field-score',
      operator: '+',
      rightFieldId: 'field-other',
    })
  })
})
