import { describe, expect, it } from 'vitest'

import { createTask, setTaskDueDate, setTaskStartDate } from './task'

const task = createTask({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Draft experiment plan',
  now: '2026-09-11T10:00:00.000Z',
})

describe('Task schedule range', () => {
  it('rejects a start date after the existing due date', () => {
    const taskWithDueDate = setTaskDueDate(task, '2026-09-16')

    expect(() => setTaskStartDate(taskWithDueDate, '2026-09-17')).toThrow(
      'Task start date must not be after due date',
    )
  })

  it('rejects a due date before the existing start date', () => {
    const taskWithStartDate = setTaskStartDate(task, '2026-09-14')

    expect(() => setTaskDueDate(taskWithStartDate, '2026-09-13')).toThrow(
      'Task due date must not be before start date',
    )
  })

  it('allows the start and due date to share the same day', () => {
    const taskWithStartDate = setTaskStartDate(task, '2026-09-14')
    const scheduled = setTaskDueDate(taskWithStartDate, '2026-09-14')

    expect(scheduled.startDate).toBe('2026-09-14')
    expect(scheduled.dueDate).toBe('2026-09-14')
  })
})
