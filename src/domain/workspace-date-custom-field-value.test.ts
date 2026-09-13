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
        id: 'field-review-date',
        name: 'Review date',
        type: 'date',
        createdAt: '2026-09-13T14:00:00.000Z',
      },
      {
        id: 'field-notes',
        name: 'Notes',
        type: 'text',
        createdAt: '2026-09-13T14:00:00.000Z',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        projectId: 'project-1',
        title: 'Draft experiment plan',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-13T14:00:00.000Z',
        startDate: '2026-09-10',
        dueDate: '2026-09-30',
        customFieldValues: {
          'field-notes': 'keep me',
        },
      },
    ],
  }
}

describe('Task Date custom field values', () => {
  it('stores and clears Date values without changing Task schedule dates', () => {
    const changed = workspaceReducer(baseState(), {
      type: 'task/customFieldValueChanged',
      taskId: 'task-1',
      fieldId: 'field-review-date',
      value: ' 2026-09-21 ',
    })

    expect(changed.tasks[0]?.customFieldValues).toEqual({
      'field-notes': 'keep me',
      'field-review-date': '2026-09-21',
    })
    expect(changed.tasks[0]?.startDate).toBe('2026-09-10')
    expect(changed.tasks[0]?.dueDate).toBe('2026-09-30')

    const cleared = workspaceReducer(changed, {
      type: 'task/customFieldValueChanged',
      taskId: 'task-1',
      fieldId: 'field-review-date',
      value: null,
    })

    expect(cleared.tasks[0]?.customFieldValues).toEqual({
      'field-notes': 'keep me',
    })
    expect(cleared.tasks[0]?.startDate).toBe('2026-09-10')
    expect(cleared.tasks[0]?.dueDate).toBe('2026-09-30')
  })

  it('rejects invalid Date values through the definition-aware path', () => {
    expect(() =>
      workspaceReducer(baseState(), {
        type: 'task/customFieldValueChanged',
        taskId: 'task-1',
        fieldId: 'field-review-date',
        value: '2026-02-30',
      }),
    ).toThrow('Date custom field value must use YYYY-MM-DD')
  })
})
