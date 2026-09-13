import { describe, expect, it } from 'vitest'

import * as taskDomain from './task'

type CreateNextOccurrence = (
  task: taskDomain.Task,
  input: { id: string; now: string },
) => taskDomain.Task

function getCreateNextOccurrence(): CreateNextOccurrence | undefined {
  return (
    taskDomain as typeof taskDomain & {
      createNextRecurringTaskOccurrence?: CreateNextOccurrence
    }
  ).createNextRecurringTaskOccurrence
}

describe('Recurring Task next occurrence', () => {
  it('copies Task-owned data, advances dates, resets status/checklist, and removes archive state', () => {
    const createNext = getCreateNextOccurrence()
    expect(createNext).toBeTypeOf('function')

    const source: taskDomain.Task = {
      id: 'task-1',
      projectId: 'project-1',
      listId: 'list-1',
      parentTaskId: 'parent-1',
      title: 'Monthly report',
      status: 'done',
      priority: 'high',
      description: 'Keep this',
      createdAt: '2026-01-01T09:00:00.000Z',
      archivedAt: '2026-02-01T09:00:00.000Z',
      startDate: '2026-01-30',
      dueDate: '2026-01-31',
      recurrence: { unit: 'month', interval: 1 },
      checklist: [
        { id: 'check-1', text: 'Collect data', completed: true },
        { id: 'check-2', text: 'Send report', completed: false },
      ],
      tagIds: ['tag-1'],
      assigneeIds: ['person-1'],
      customFieldValues: { 'field-1': 12 },
    }

    const next = createNext?.(source, {
      id: 'task-2',
      now: '2026-02-01T10:00:00.000Z',
    })

    expect(next).toMatchObject({
      id: 'task-2',
      projectId: 'project-1',
      listId: 'list-1',
      parentTaskId: 'parent-1',
      title: 'Monthly report',
      status: 'todo',
      priority: 'high',
      description: 'Keep this',
      createdAt: '2026-02-01T10:00:00.000Z',
      startDate: '2026-02-28',
      dueDate: '2026-02-28',
      recurrence: { unit: 'month', interval: 1 },
      tagIds: ['tag-1'],
      assigneeIds: ['person-1'],
      customFieldValues: { 'field-1': 12 },
    })
    expect(next).not.toHaveProperty('archivedAt')
    expect(next?.checklist).toEqual([
      { id: 'check-1', text: 'Collect data', completed: false },
      { id: 'check-2', text: 'Send report', completed: false },
    ])
    expect(source.checklist?.[0]?.completed).toBe(true)
  })

  it('rejects incomplete or non-recurring sources', () => {
    const createNext = getCreateNextOccurrence()
    expect(createNext).toBeTypeOf('function')

    const base = taskDomain.createTask({
      id: 'task-1',
      projectId: 'project-1',
      title: 'Task',
      now: '2026-09-13T09:00:00.000Z',
    })

    expect(() =>
      createNext?.(
        { ...base, dueDate: '2026-09-14', recurrence: { unit: 'day', interval: 1 } },
        { id: 'task-2', now: '2026-09-13T10:00:00.000Z' },
      ),
    ).toThrow('Recurring Task must be completed before creating the next occurrence')

    expect(() =>
      createNext?.(
        { ...base, status: 'done', dueDate: '2026-09-14' },
        { id: 'task-2', now: '2026-09-13T10:00:00.000Z' },
      ),
    ).toThrow('Task does not have a recurrence rule')
  })
})
