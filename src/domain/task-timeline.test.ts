import { describe, expect, it } from 'vitest'

import type { Task } from './task'
import { createTaskTimelineItems } from './task-timeline'

const tasks: Task[] = [
  {
    id: 'task-late',
    projectId: 'project-1',
    title: 'Alpha later',
    status: 'todo',
    priority: 'normal',
    dueDate: '2026-09-12',
    createdAt: '2026-09-06T10:00:00.000Z',
  },
  {
    id: 'task-early-b',
    projectId: 'project-1',
    title: 'Beta early',
    status: 'doing',
    priority: 'high',
    dueDate: '2026-09-08',
    createdAt: '2026-09-06T10:01:00.000Z',
  },
  {
    id: 'task-undated',
    projectId: 'project-1',
    title: 'Delta unscheduled',
    status: 'todo',
    priority: 'low',
    createdAt: '2026-09-06T10:02:00.000Z',
  },
  {
    id: 'task-early-a',
    projectId: 'project-1',
    title: 'Gamma early',
    status: 'done',
    priority: 'normal',
    dueDate: '2026-09-08',
    createdAt: '2026-09-06T10:03:00.000Z',
  },
]

describe('Task timeline items', () => {
  it('orders due dates chronologically, preserves incoming order on ties, and keeps undated Tasks last', () => {
    const originalIds = tasks.map((task) => task.id)

    expect(
      createTaskTimelineItems(tasks).map((item) => ({
        taskId: item.task.id,
        dueDateLabel: item.dueDateLabel,
      })),
    ).toEqual([
      { taskId: 'task-early-b', dueDateLabel: '2026-09-08' },
      { taskId: 'task-early-a', dueDateLabel: '2026-09-08' },
      { taskId: 'task-late', dueDateLabel: '2026-09-12' },
      { taskId: 'task-undated', dueDateLabel: 'No due date' },
    ])
    expect(tasks.map((task) => task.id)).toEqual(originalIds)
  })
})
