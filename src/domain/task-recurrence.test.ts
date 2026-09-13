import { describe, expect, it } from 'vitest'

import * as taskDomain from './task'

type RecurrenceRule = {
  unit: 'day' | 'week' | 'month'
  interval: number
}

type SetTaskRecurrence = (
  task: taskDomain.Task,
  recurrence: RecurrenceRule | null,
) => taskDomain.Task

type AdvanceTaskCalendarDate = (
  date: string,
  recurrence: RecurrenceRule,
) => string

function recurrenceHelpers() {
  const domain = taskDomain as typeof taskDomain & {
    setTaskRecurrence?: SetTaskRecurrence
    advanceTaskCalendarDate?: AdvanceTaskCalendarDate
  }

  return {
    setRecurrence: domain.setTaskRecurrence,
    advanceDate: domain.advanceTaskCalendarDate,
  }
}

function taskWithDueDate(): taskDomain.Task {
  return {
    ...taskDomain.createTask({
      id: 'task-1',
      projectId: 'project-1',
      title: 'Recurring report',
      now: '2026-09-13T09:00:00.000Z',
    }),
    dueDate: '2026-01-31',
  }
}

describe('Task recurrence rules', () => {
  it('configures and clears validated recurrence without mutating the source Task', () => {
    const { setRecurrence } = recurrenceHelpers()
    expect(setRecurrence).toBeTypeOf('function')

    const source = taskWithDueDate()
    const recurring = setRecurrence?.(source, { unit: 'month', interval: 2 })

    expect(recurring?.recurrence).toEqual({ unit: 'month', interval: 2 })
    expect(source).not.toHaveProperty('recurrence')
    expect(setRecurrence?.(recurring!, null)).toEqual(source)
    expect(taskDomain.setTaskDueDate(recurring!, null)).not.toHaveProperty('recurrence')

    const withoutDueDate = taskDomain.createTask({
      id: 'task-2',
      projectId: 'project-1',
      title: 'No date',
      now: '2026-09-13T09:00:00.000Z',
    })
    expect(() =>
      setRecurrence?.(withoutDueDate, { unit: 'day', interval: 1 }),
    ).toThrow('Recurring task requires a valid due date')
    expect(() =>
      setRecurrence?.(source, { unit: 'day', interval: 0 }),
    ).toThrow('Task recurrence interval must be a positive integer')
    expect(() =>
      setRecurrence?.(source, { unit: 'week', interval: 1.5 }),
    ).toThrow('Task recurrence interval must be a positive integer')
  })

  it('advances day, week, and month rules with calendar-safe month-end clamping', () => {
    const { advanceDate } = recurrenceHelpers()
    expect(advanceDate).toBeTypeOf('function')

    expect(advanceDate?.('2026-09-13', { unit: 'day', interval: 2 })).toBe(
      '2026-09-15',
    )
    expect(advanceDate?.('2026-09-13', { unit: 'week', interval: 2 })).toBe(
      '2026-09-27',
    )
    expect(advanceDate?.('2026-01-31', { unit: 'month', interval: 1 })).toBe(
      '2026-02-28',
    )
    expect(advanceDate?.('2024-01-31', { unit: 'month', interval: 1 })).toBe(
      '2024-02-29',
    )
  })
})
