import { describe, expect, it } from 'vitest'
import * as taskDomain from './task'

type EstimateDomain = typeof taskDomain & {
  setTaskTimeEstimate?: (task: taskDomain.Task, estimateMinutes: number | null) => taskDomain.Task
}

describe('Task time estimates', () => {
  it('sets, clears, and validates positive integer minute estimates without mutating the source', () => {
    const setEstimate = (taskDomain as EstimateDomain).setTaskTimeEstimate
    expect(setEstimate).toBeTypeOf('function')
    const source = taskDomain.createTask({ id: 'task-1', projectId: 'project-1', title: 'Plan', now: '2026-09-14T12:00:00.000Z' })
    const estimated = setEstimate!(source, 90)
    expect(estimated.estimateMinutes).toBe(90)
    expect(source).not.toHaveProperty('estimateMinutes')
    expect(setEstimate!(estimated, null)).not.toHaveProperty('estimateMinutes')
    for (const value of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => setEstimate!(source, value)).toThrow('Task time estimate must be a positive integer number of minutes')
    }
  })

  it('preserves estimates when duplicating and creating a recurring next occurrence', () => {
    const setEstimate = (taskDomain as EstimateDomain).setTaskTimeEstimate!
    const base = setEstimate(taskDomain.createTask({ id: 'task-1', projectId: 'project-1', title: 'Plan', now: '2026-09-14T12:00:00.000Z' }), 45)
    expect(taskDomain.duplicateTask(base, { id: 'task-2', now: '2026-09-14T13:00:00.000Z' }).estimateMinutes).toBe(45)
    const recurring = taskDomain.setTaskRecurrence(taskDomain.setTaskDueDate({ ...base, status: 'done' }, '2026-09-15'), { unit: 'day', interval: 1 })
    expect(taskDomain.createNextRecurringTaskOccurrence(recurring, { id: 'task-3', now: '2026-09-15T12:00:00.000Z' }).estimateMinutes).toBe(45)
  })
})
