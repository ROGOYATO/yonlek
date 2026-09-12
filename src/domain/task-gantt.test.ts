import { describe, expect, it } from 'vitest'

import { createTask, type Task } from './task'
import { createTaskGanttItems } from './task-gantt'

function makeTask(id: string, title: string): Task {
  return createTask({
    id,
    projectId: 'project-1',
    title,
    now: '2026-09-11T10:30:00.000Z',
  })
}

describe('Task Gantt items', () => {
  it('keeps every Task in input order and schedules only Tasks with both dates', () => {
    const tasks: Task[] = [
      {
        ...makeTask('task-1', 'Scheduled'),
        startDate: '2026-09-14',
        dueDate: '2026-09-16',
      },
      {
        ...makeTask('task-2', 'Start only'),
        startDate: '2026-09-15',
      },
      {
        ...makeTask('task-3', 'Due only'),
        dueDate: '2026-09-18',
      },
      makeTask('task-4', 'Unscheduled'),
    ]
    const before = tasks.map((task) => ({ ...task }))

    const items = createTaskGanttItems(tasks)

    expect(
      items.map((item) => ({
        taskId: item.task.id,
        startDate: item.startDate,
        dueDate: item.dueDate,
        isScheduled: item.isScheduled,
      })),
    ).toEqual([
      {
        taskId: 'task-1',
        startDate: '2026-09-14',
        dueDate: '2026-09-16',
        isScheduled: true,
      },
      {
        taskId: 'task-2',
        startDate: '2026-09-15',
        dueDate: null,
        isScheduled: false,
      },
      {
        taskId: 'task-3',
        startDate: null,
        dueDate: '2026-09-18',
        isScheduled: false,
      },
      {
        taskId: 'task-4',
        startDate: null,
        dueDate: null,
        isScheduled: false,
      },
    ])
    expect(tasks).toEqual(before)
  })
})
