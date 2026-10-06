import { describe, expect, it } from 'vitest'

import { createTask } from './task'
import { createTaskGanttScheduleChange } from './task-gantt'

const task = createTask({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Schedule review',
  now: '2026-10-06T00:10:00.000Z',
})

describe('Task Gantt schedule changes', () => {
  it('requires two exact calendar dates, preserves them, and rejects inverted ranges', () => {
    expect(
      createTaskGanttScheduleChange(
        task,
        ' 2026-10-20 ',
        '2026-10-22 ',
      ),
    ).toEqual({
      startDate: '2026-10-20',
      dueDate: '2026-10-22',
    })

    expect(() =>
      createTaskGanttScheduleChange(task, '2026-10-23', '2026-10-22'),
    ).toThrow('Task due date must not be before start date')

    expect(() =>
      createTaskGanttScheduleChange(task, '', '2026-10-22'),
    ).toThrow('Task start date must use YYYY-MM-DD')

    expect(() =>
      createTaskGanttScheduleChange(task, '2026-10-20', ''),
    ).toThrow('Task due date must use YYYY-MM-DD')
  })
})
