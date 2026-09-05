import { describe, expect, it } from 'vitest'

import type { Task } from './task'
import { createTaskBoardColumns } from './task-board'

const tasks: Task[] = [
  {
    id: 'task-zeta',
    projectId: 'project-1',
    title: 'Zeta',
    status: 'todo',
    priority: 'normal',
    createdAt: '2026-09-05T18:00:00.000Z',
  },
  {
    id: 'task-done',
    projectId: 'project-1',
    title: 'Done task',
    status: 'done',
    priority: 'high',
    createdAt: '2026-09-05T18:01:00.000Z',
  },
  {
    id: 'task-alpha',
    projectId: 'project-1',
    title: 'Alpha',
    status: 'todo',
    priority: 'low',
    createdAt: '2026-09-05T18:02:00.000Z',
  },
]

describe('Task board columns', () => {
  it('keeps fixed status columns and preserves input order inside each column', () => {
    const columns = createTaskBoardColumns(tasks)

    expect(columns.map(({ key, label }) => ({ key, label }))).toEqual([
      { key: 'todo', label: 'To do' },
      { key: 'doing', label: 'Doing' },
      { key: 'done', label: 'Done' },
    ])
    expect(columns[0].tasks.map((task) => task.id)).toEqual([
      'task-zeta',
      'task-alpha',
    ])
    expect(columns[1].tasks).toEqual([])
    expect(columns[2].tasks.map((task) => task.id)).toEqual(['task-done'])
    expect(tasks.map((task) => task.id)).toEqual([
      'task-zeta',
      'task-done',
      'task-alpha',
    ])
  })
})
