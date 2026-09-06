import { describe, expect, it } from 'vitest'

import type { Task } from './task'
import type { TaskList } from './task-list'
import { createTaskTableRows } from './task-table'

const tasks: Task[] = [
  {
    id: 'task-beta',
    projectId: 'project-1',
    title: 'Beta review',
    status: 'doing',
    priority: 'high',
    dueDate: '2026-09-12',
    listId: 'list-lab',
    createdAt: '2026-09-05T22:50:00.000Z',
  },
  {
    id: 'task-alpha',
    projectId: 'project-1',
    title: 'Alpha notes',
    status: 'todo',
    priority: 'normal',
    createdAt: '2026-09-05T22:51:00.000Z',
  },
  {
    id: 'task-done',
    projectId: 'project-1',
    title: 'Publish results',
    status: 'done',
    priority: 'low',
    dueDate: '2026-09-10',
    listId: 'list-publish',
    createdAt: '2026-09-05T22:52:00.000Z',
  },
]

const lists: TaskList[] = [
  {
    id: 'list-lab',
    projectId: 'project-1',
    name: 'Lab',
    createdAt: '2026-09-05T22:48:00.000Z',
  },
  {
    id: 'list-publish',
    projectId: 'project-1',
    name: 'Publishing',
    createdAt: '2026-09-05T22:49:00.000Z',
  },
]

describe('Task table rows', () => {
  it('formats fixed columns, resolves List names, and preserves incoming Task order', () => {
    const originalIds = tasks.map((task) => task.id)

    expect(createTaskTableRows(tasks, lists)).toEqual([
      {
        taskId: 'task-beta',
        title: 'Beta review',
        status: 'Doing',
        priority: 'High',
        dueDate: '2026-09-12',
        list: 'Lab',
      },
      {
        taskId: 'task-alpha',
        title: 'Alpha notes',
        status: 'To do',
        priority: 'Normal',
        dueDate: 'No due date',
        list: 'No list',
      },
      {
        taskId: 'task-done',
        title: 'Publish results',
        status: 'Done',
        priority: 'Low',
        dueDate: '2026-09-10',
        list: 'Publishing',
      },
    ])
    expect(tasks.map((task) => task.id)).toEqual(originalIds)
  })
})
