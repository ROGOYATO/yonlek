import { describe, expect, it } from 'vitest'

import { createTask } from './task'
import { sortTasks } from './task-sort'

const zebra = createTask({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Zebra task',
  now: '2026-09-03T05:00:00.000Z',
})

const alpha = createTask({
  id: 'task-2',
  projectId: 'project-1',
  title: 'Alpha task',
  now: '2026-09-03T05:10:00.000Z',
})

describe('sortTasks', () => {
  it('sorts task titles alphabetically without changing the input array', () => {
    const tasks = [zebra, alpha]
    const result = sortTasks(tasks, 'title')

    expect(result.map((task) => task.title)).toEqual([
      'Alpha task',
      'Zebra task',
    ])
    expect(tasks.map((task) => task.title)).toEqual([
      'Zebra task',
      'Alpha task',
    ])
  })

  it('sorts by creation time', () => {
    const result = sortTasks([alpha, zebra], 'created')

    expect(result.map((task) => task.id)).toEqual(['task-1', 'task-2'])
  })

  it('sorts dated tasks first by due date and keeps undated tasks last', () => {
    const later = { ...zebra, dueDate: '2026-09-20' }
    const earlier = { ...alpha, dueDate: '2026-09-12' }
    const undated = createTask({
      id: 'task-3',
      projectId: 'project-1',
      title: 'Undated task',
      now: '2026-09-03T05:20:00.000Z',
    })

    expect(
      sortTasks([later, undated, earlier], 'dueDate').map(
        (task) => task.id,
      ),
    ).toEqual(['task-2', 'task-1', 'task-3'])
  })
})
