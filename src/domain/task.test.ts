import { describe, expect, it } from 'vitest'

import { createTask, duplicateTask, renameTask, type Task } from './task'

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

describe('duplicateTask', () => {
  it('copies task data under a new identity with independent nested collections', () => {
    const source: Task = {
      id: 'task-1',
      projectId: 'project-1',
      title: 'Draft experiment plan',
      status: 'doing',
      priority: 'high',
      createdAt: '2026-09-04T12:00:00.000Z',
      dueDate: '2026-09-12',
      description: 'Prepare the camera calibration procedure.',
      listId: 'list-1',
      parentTaskId: 'task-parent',
      checklist: [
        { id: 'check-1', text: 'Review safety notes', completed: true },
      ],
      tagIds: ['tag-1'],
      assigneeIds: ['person-1'],
      customFieldValues: {
        'field-text': 'Inspect mount',
        'field-number': 3.5,
        'field-checkbox': true,
      },
    }

    const duplicate = duplicateTask(source, {
      id: 'task-2',
      now: '2026-09-04T12:30:00.000Z',
    })

    expect(duplicate).toEqual({
      ...source,
      id: 'task-2',
      createdAt: '2026-09-04T12:30:00.000Z',
    })
    expect(duplicate.checklist).not.toBe(source.checklist)
    expect(duplicate.checklist?.[0]).not.toBe(source.checklist?.[0])
    expect(duplicate.tagIds).not.toBe(source.tagIds)
    expect(duplicate.assigneeIds).not.toBe(source.assigneeIds)
    expect(duplicate.customFieldValues).not.toBe(source.customFieldValues)
  })
})
