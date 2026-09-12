import { describe, expect, it } from 'vitest'

import * as taskDomain from './task'

type SetTaskStartDate = (
  task: taskDomain.Task,
  startDate: string | null,
) => taskDomain.Task

const task = taskDomain.createTask({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Draft experiment plan',
  now: '2026-09-11T09:00:00.000Z',
})

function getSetTaskStartDate(): SetTaskStartDate | undefined {
  return (
    taskDomain as typeof taskDomain & { setTaskStartDate?: SetTaskStartDate }
  ).setTaskStartDate
}

describe('setTaskStartDate', () => {
  it('sets a normalized calendar start date without mutating the original task', () => {
    const updated = getSetTaskStartDate()?.(task, '  2026-09-14  ')

    expect(updated?.startDate).toBe('2026-09-14')
    expect(task).not.toHaveProperty('startDate')
  })

  it('clears an existing start date', () => {
    const taskWithStartDate = { ...task, startDate: '2026-09-14' }
    const updated = getSetTaskStartDate()?.(taskWithStartDate, null)

    expect(updated).toEqual(task)
  })

  it('rejects an invalid calendar date', () => {
    expect(() => getSetTaskStartDate()?.(task, '2026-02-31')).toThrow(
      'Task start date must use YYYY-MM-DD',
    )
  })
})
