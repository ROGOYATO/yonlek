import { describe, expect, it } from 'vitest'

import { createTask, renameTask } from './task'

describe('createTask', () => {
  it('creates a task in the supplied project with normalized title and defaults', () => {
    const task = createTask({
      id: 'task-1',
      projectId: 'project-1',
      title: '  Draft README  ',
      now: '2026-09-03T00:00:00.000Z',
    })

    expect(task).toEqual({
      id: 'task-1',
      projectId: 'project-1',
      title: 'Draft README',
      status: 'todo',
      priority: 'normal',
      createdAt: '2026-09-03T00:00:00.000Z',
    })
  })

  it('rejects a blank task title', () => {
    expect(() =>
      createTask({
        id: 'task-1',
        projectId: 'project-1',
        title: '   ',
        now: '2026-09-03T00:00:00.000Z',
      }),
    ).toThrow('Task title is required')
  })
})


describe('renameTask', () => {
  const task = createTask({
    id: 'task-1',
    projectId: 'project-1',
    title: 'Draft README',
    now: '2026-09-03T00:00:00.000Z',
  })

  it('returns a renamed task without mutating the original task', () => {
    const renamed = renameTask(task, '  Review README  ')

    expect(renamed.title).toBe('Review README')
    expect(task.title).toBe('Draft README')
    expect(renamed).not.toBe(task)
  })

  it('rejects a blank task title', () => {
    expect(() => renameTask(task, '   ')).toThrow('Task title is required')
  })
})
