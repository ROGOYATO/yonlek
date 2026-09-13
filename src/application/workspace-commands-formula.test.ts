import { describe, expect, it } from 'vitest'

import type { CustomFieldFormula } from '../domain/custom-field'
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

type FormulaCommands = WorkspaceCommands & {
  configureCustomFieldFormula(
    fieldId: string,
    formula: CustomFieldFormula | null,
  ): void
}

function baseState(): WorkspaceState {
  return {
    projects: [
      {
        id: 'project-1',
        name: 'Research',
        createdAt: '2026-09-13T10:00:00.000Z',
      },
    ],
    customFields: [
      {
        id: 'field-left',
        name: 'Left',
        type: 'number',
        createdAt: '2026-09-13T10:00:00.000Z',
      },
      {
        id: 'field-right',
        name: 'Right',
        type: 'number',
        createdAt: '2026-09-13T10:00:00.000Z',
      },
      {
        id: 'field-notes',
        name: 'Notes',
        type: 'text',
        createdAt: '2026-09-13T10:00:00.000Z',
      },
      {
        id: 'field-first',
        name: 'First formula',
        type: 'formula',
        createdAt: '2026-09-13T10:00:00.000Z',
      },
      {
        id: 'field-second',
        name: 'Second formula',
        type: 'formula',
        createdAt: '2026-09-13T10:00:00.000Z',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        projectId: 'project-1',
        title: 'Task',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-13T10:00:00.000Z',
        customFieldValues: {
          'field-left': 3,
          'field-right': 4,
        },
      },
    ],
  }
}

function commandsFor(store: ReducerStore): FormulaCommands {
  return createWorkspaceCommands(store, {
    nextId: () => 'generated-id',
    now: () => '2026-09-13T10:05:00.000Z',
  }) as FormulaCommands
}

describe('Formula custom field workspace commands', () => {
  it('configures and clears a Formula through one dispatch per change', () => {
    const store = new ReducerStore(baseState())
    const commands = commandsFor(store)
    expect(commands.configureCustomFieldFormula).toBeTypeOf('function')

    commands.configureCustomFieldFormula('field-first', {
      leftFieldId: 'field-left',
      operator: '+',
      rightFieldId: 'field-right',
    })

    expect(store.getState().customFields?.find(
      (field) => field.id === 'field-first',
    )?.formula).toEqual({
      leftFieldId: 'field-left',
      operator: '+',
      rightFieldId: 'field-right',
    })

    commands.configureCustomFieldFormula('field-first', null)
    expect(store.getState().customFields?.find(
      (field) => field.id === 'field-first',
    )).not.toHaveProperty('formula')
    expect(store.dispatches).toBe(2)
  })

  it('rejects invalid operands, self-reference, and indirect Formula cycles', () => {
    const store = new ReducerStore(baseState())
    const commands = commandsFor(store)
    expect(commands.configureCustomFieldFormula).toBeTypeOf('function')

    expect(() =>
      commands.configureCustomFieldFormula('missing', {
        leftFieldId: 'field-left',
        operator: '+',
        rightFieldId: 'field-right',
      }),
    ).toThrow('Cannot configure a missing custom field')
    expect(() =>
      commands.configureCustomFieldFormula('field-left', {
        leftFieldId: 'field-left',
        operator: '+',
        rightFieldId: 'field-right',
      }),
    ).toThrow('Custom field must be Formula')
    expect(() =>
      commands.configureCustomFieldFormula('field-first', {
        leftFieldId: 'missing',
        operator: '+',
        rightFieldId: 'field-right',
      }),
    ).toThrow('Formula operand field not found')
    expect(() =>
      commands.configureCustomFieldFormula('field-first', {
        leftFieldId: 'field-notes',
        operator: '+',
        rightFieldId: 'field-right',
      }),
    ).toThrow('Formula operand must be Number or Formula')
    expect(() =>
      commands.configureCustomFieldFormula('field-first', {
        leftFieldId: 'field-first',
        operator: '+',
        rightFieldId: 'field-right',
      }),
    ).toThrow('Formula cannot reference itself')

    commands.configureCustomFieldFormula('field-first', {
      leftFieldId: 'field-left',
      operator: '+',
      rightFieldId: 'field-right',
    })
    commands.configureCustomFieldFormula('field-second', {
      leftFieldId: 'field-first',
      operator: '*',
      rightFieldId: 'field-right',
    })

    expect(() =>
      commands.configureCustomFieldFormula('field-first', {
        leftFieldId: 'field-second',
        operator: '+',
        rightFieldId: 'field-left',
      }),
    ).toThrow('Formula dependency cycle is not allowed')
  })

  it('clears direct deleted dependencies while keeping downstream formulas and Formula Task values read-only', () => {
    const store = new ReducerStore(baseState())
    const commands = commandsFor(store)
    expect(commands.configureCustomFieldFormula).toBeTypeOf('function')

    commands.configureCustomFieldFormula('field-first', {
      leftFieldId: 'field-left',
      operator: '+',
      rightFieldId: 'field-right',
    })
    commands.configureCustomFieldFormula('field-second', {
      leftFieldId: 'field-first',
      operator: '*',
      rightFieldId: 'field-right',
    })

    expect(() =>
      commands.changeTaskCustomFieldValue('task-1', 'field-second', 12),
    ).toThrow('Custom field value does not match field type')

    commands.deleteCustomField('field-left')

    const fields = store.getState().customFields ?? []
    expect(fields.find((field) => field.id === 'field-first')).not.toHaveProperty(
      'formula',
    )
    expect(fields.find((field) => field.id === 'field-second')?.formula).toEqual({
      leftFieldId: 'field-first',
      operator: '*',
      rightFieldId: 'field-right',
    })
    expect(store.getState().tasks[0]?.customFieldValues).toEqual({
      'field-right': 4,
    })
  })
})
