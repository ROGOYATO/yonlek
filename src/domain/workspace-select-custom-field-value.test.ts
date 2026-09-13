import { describe, expect, it } from 'vitest'

import {
  workspaceReducer,
  type WorkspaceState,
} from './workspace'

function baseState(): WorkspaceState {
  return {
    projects: [],
    customFields: [
      {
        id: 'field-phase',
        name: 'Phase',
        type: 'select',
        createdAt: '2026-09-13T10:00:00.000Z',
        options: [
          { id: 'option-draft', name: 'Draft' },
          { id: 'option-review', name: 'Review' },
        ],
      },
      {
        id: 'field-notes',
        name: 'Notes',
        type: 'text',
        createdAt: '2026-09-13T10:00:00.000Z',
      },
      {
        id: 'field-score',
        name: 'Score',
        type: 'number',
        createdAt: '2026-09-13T10:00:00.000Z',
      },
      {
        id: 'field-ready',
        name: 'Ready',
        type: 'checkbox',
        createdAt: '2026-09-13T10:00:00.000Z',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        projectId: 'project-1',
        title: 'Draft experiment plan',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-13T10:00:00.000Z',
      },
    ],
  }
}

describe('Task Select custom field values', () => {
  it('stores only option ids owned by the Select field and clears with null', () => {
    const selected = workspaceReducer(baseState(), {
      type: 'task/customFieldValueChanged',
      taskId: 'task-1',
      fieldId: 'field-phase',
      value: 'option-review',
    })

    expect(selected.tasks[0]?.customFieldValues).toEqual({
      'field-phase': 'option-review',
    })

    expect(() =>
      workspaceReducer(selected, {
        type: 'task/customFieldValueChanged',
        taskId: 'task-1',
        fieldId: 'field-phase',
        value: 'option-missing',
      }),
    ).toThrow('Custom field option not found')

    const cleared = workspaceReducer(selected, {
      type: 'task/customFieldValueChanged',
      taskId: 'task-1',
      fieldId: 'field-phase',
      value: null,
    })

    expect(cleared.tasks[0]).not.toHaveProperty('customFieldValues')
  })

  it('keeps Text, Number, and Checkbox value normalization unchanged', () => {
    const text = workspaceReducer(baseState(), {
      type: 'task/customFieldValueChanged',
      taskId: 'task-1',
      fieldId: 'field-notes',
      value: '  findings  ',
    })
    const number = workspaceReducer(text, {
      type: 'task/customFieldValueChanged',
      taskId: 'task-1',
      fieldId: 'field-score',
      value: 3.5,
    })
    const checkbox = workspaceReducer(number, {
      type: 'task/customFieldValueChanged',
      taskId: 'task-1',
      fieldId: 'field-ready',
      value: true,
    })

    expect(checkbox.tasks[0]?.customFieldValues).toEqual({
      'field-notes': 'findings',
      'field-score': 3.5,
      'field-ready': true,
    })
  })
})
