import { describe, expect, it } from 'vitest'

import type { Task } from './task'
import type { TaskList } from './task-list'
import { groupTasks } from './task-group'

const tasks: Task[] = [
  {
    id: 'task-low',
    projectId: 'project-1',
    title: 'Low unlisted',
    status: 'todo',
    priority: 'low',
    createdAt: '2026-09-05T00:10:00.000Z',
  },
  {
    id: 'task-high-a',
    projectId: 'project-1',
    title: 'High experiments A',
    status: 'doing',
    priority: 'high',
    listId: 'list-experiments',
    createdAt: '2026-09-05T00:11:00.000Z',
  },
  {
    id: 'task-high-b',
    projectId: 'project-1',
    title: 'High experiments B',
    status: 'todo',
    priority: 'high',
    listId: 'list-experiments',
    createdAt: '2026-09-05T00:12:00.000Z',
  },
  {
    id: 'task-normal',
    projectId: 'project-1',
    title: 'Normal review',
    status: 'done',
    priority: 'normal',
    listId: 'list-review',
    createdAt: '2026-09-05T00:13:00.000Z',
  },
]

const lists: TaskList[] = [
  {
    id: 'list-experiments',
    projectId: 'project-1',
    name: 'Experiments',
    createdAt: '2026-09-05T00:01:00.000Z',
  },
  {
    id: 'list-review',
    projectId: 'project-1',
    name: 'Review',
    createdAt: '2026-09-05T00:02:00.000Z',
  },
]

describe('task grouping', () => {
  it('groups tasks by status, priority, and list while preserving input order inside each group', () => {
    expect(groupTasks(tasks, 'status', lists)).toEqual([
      {
        key: 'todo',
        label: 'To do',
        tasks: [tasks[0], tasks[2]],
      },
      {
        key: 'doing',
        label: 'Doing',
        tasks: [tasks[1]],
      },
      {
        key: 'done',
        label: 'Done',
        tasks: [tasks[3]],
      },
    ])

    expect(groupTasks(tasks, 'priority', lists)).toEqual([
      {
        key: 'high',
        label: 'High',
        tasks: [tasks[1], tasks[2]],
      },
      {
        key: 'normal',
        label: 'Normal',
        tasks: [tasks[3]],
      },
      {
        key: 'low',
        label: 'Low',
        tasks: [tasks[0]],
      },
    ])

    expect(groupTasks(tasks, 'list', lists)).toEqual([
      {
        key: 'list-experiments',
        label: 'Experiments',
        tasks: [tasks[1], tasks[2]],
      },
      {
        key: 'list-review',
        label: 'Review',
        tasks: [tasks[3]],
      },
      {
        key: 'no-list',
        label: 'No list',
        tasks: [tasks[0]],
      },
    ])

    expect(groupTasks(tasks, 'none', lists)).toEqual([
      {
        key: 'all',
        label: 'All tasks',
        tasks,
      },
    ])
  })
})
