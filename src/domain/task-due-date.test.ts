import { describe, expect, it } from 'vitest'

import * as taskDomain from './task'

type SetTaskDueDate = (
  task: taskDomain.Task,
  dueDate: string | null,
) => taskDomain.Task

const task = taskDomain.createTask({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Draft experiment plan',
  now: '2026-09-03T05:00:00.000Z',
})

function getSetTaskDueDate(): SetTaskDueDate | undefined {
  return (
    taskDomain as typeof taskDomain & { setTaskDueDate?: SetTaskDueDate }
  ).setTaskDueDate
}

describe('setTaskDueDate', () => {
  it('sets a normalized calendar due date without mutating the original task', () => {
    const updated = getSetTaskDueDate()?.(task, '  2026-09-12  ')

    expect(updated?.dueDate).toBe('2026-09-12')
    expect(task).not.toHaveProperty('dueDate')
  })

  it('clears an existing due date', () => {
    const taskWithDueDate = { ...task, dueDate: '2026-09-12' }
    const updated = getSetTaskDueDate()?.(taskWithDueDate, null)

    expect(updated).toEqual(task)
  })

  it('rejects an invalid calendar date', () => {
    expect(() => getSetTaskDueDate()?.(task, '2026-02-31')).toThrow(
      'Task due date must use YYYY-MM-DD',
    )
  })
})
