import { describe, expect, it } from 'vitest'

import type { Task } from './task'
import { createTaskCalendarSections } from './task-calendar'

const tasks: Task[] = [
  {
    id: 'task-late',
    projectId: 'project-1',
    title: 'Late',
    status: 'todo',
    priority: 'normal',
    createdAt: '2026-09-05T18:00:00.000Z',
    dueDate: '2026-09-12',
  },
  {
    id: 'task-undated',
    projectId: 'project-1',
    title: 'Undated',
    status: 'doing',
    priority: 'high',
    createdAt: '2026-09-05T18:01:00.000Z',
  },
  {
    id: 'task-early-b',
    projectId: 'project-1',
    title: 'Early B',
    status: 'todo',
    priority: 'low',
    createdAt: '2026-09-05T18:02:00.000Z',
    dueDate: '2026-09-08',
  },
  {
    id: 'task-early-a',
    projectId: 'project-1',
    title: 'Early A',
    status: 'done',
    priority: 'normal',
    createdAt: '2026-09-05T18:03:00.000Z',
    dueDate: '2026-09-08',
  },
]

describe('Task calendar sections', () => {
  it('orders dated sections chronologically, keeps undated last, and preserves input order inside each section', () => {
    const sections = createTaskCalendarSections(tasks)

    expect(sections.map(({ key, label }) => ({ key, label }))).toEqual([
      { key: '2026-09-08', label: '2026-09-08' },
      { key: '2026-09-12', label: '2026-09-12' },
      { key: 'undated', label: 'No due date' },
    ])
    expect(sections[0].tasks.map((task) => task.id)).toEqual([
      'task-early-b',
      'task-early-a',
    ])
    expect(sections[1].tasks.map((task) => task.id)).toEqual(['task-late'])
    expect(sections[2].tasks.map((task) => task.id)).toEqual(['task-undated'])
    expect(tasks.map((task) => task.id)).toEqual([
      'task-late',
      'task-undated',
      'task-early-b',
      'task-early-a',
    ])
  })
})
