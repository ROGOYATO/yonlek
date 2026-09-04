import { describe, expect, it } from 'vitest'

import * as taskDomain from './task'

const parent = taskDomain.createTask({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Draft experiment plan',
  now: '2026-09-04T04:30:00.000Z',
  listId: 'list-1',
})

function createSubtask() {
  return (
    taskDomain as typeof taskDomain & {
      createSubtask?: (input: {
        id: string
        parent: taskDomain.Task
        title: string
        now: string
      }) => taskDomain.Task
    }
  ).createSubtask
}

describe('createSubtask', () => {
  it('inherits project and list from its parent', () => {
    const subtask = createSubtask()?.({
      id: 'task-2',
      parent,
      title: '  Calibrate camera  ',
      now: '2026-09-04T04:31:00.000Z',
    })

    expect(subtask).toMatchObject({
      id: 'task-2',
      projectId: parent.projectId,
      listId: parent.listId,
      parentTaskId: parent.id,
      title: 'Calibrate camera',
      status: 'todo',
      priority: 'normal',
      createdAt: '2026-09-04T04:31:00.000Z',
    })
  })

  it('creates a subtask without a list when its parent has no list', () => {
    const unlistedParent = { ...parent }
    delete unlistedParent.listId

    expect(
      createSubtask()?.({
        id: 'task-2',
        parent: unlistedParent,
        title: 'Calibrate camera',
        now: '2026-09-04T04:31:00.000Z',
      }),
    ).not.toHaveProperty('listId')
  })

  it('rejects a blank subtask title', () => {
    expect(() =>
      createSubtask()?.({
        id: 'task-2',
        parent,
        title: '   ',
        now: '2026-09-04T04:31:00.000Z',
      }),
    ).toThrow('Task title is required')
  })
})
