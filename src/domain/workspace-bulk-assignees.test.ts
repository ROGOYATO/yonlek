import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createTask } from './task'
import { workspaceReducer } from './workspace'

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-10-05T19:10:00.000Z',
})
const first = createTask({
  id: 'task-a',
  projectId: project.id,
  title: 'First',
  now: '2026-10-05T19:11:00.000Z',
})
const second = createTask({
  id: 'task-b',
  projectId: project.id,
  title: 'Second',
  now: '2026-10-05T19:12:00.000Z',
})
const untouched = createTask({
  id: 'task-c',
  projectId: project.id,
  title: 'Untouched',
  now: '2026-10-05T19:13:00.000Z',
})
const ada = {
  id: 'person-ada',
  name: 'Ada Lovelace',
  createdAt: '2026-10-05T19:14:00.000Z',
}
const grace = {
  id: 'person-grace',
  name: 'Grace Hopper',
  createdAt: '2026-10-05T19:15:00.000Z',
}

describe('Workspace bulk Task assignees', () => {
  it('assigns and unassigns one Person across the selected Tasks without mutating the input Workspace', () => {
    const state = {
      people: [ada, grace],
      projects: [project],
      tasks: [{ ...first, assigneeIds: [grace.id] }, second, untouched],
    }

    const assigned = workspaceReducer(state, {
      type: 'task/assigneeChangedBulk',
      taskIds: [first.id, second.id],
      personId: ada.id,
      assigned: true,
    } as never)

    expect(assigned.tasks.map((task) => [task.id, task.assigneeIds])).toEqual([
      [first.id, [grace.id, ada.id]],
      [second.id, [ada.id]],
      [untouched.id, undefined],
    ])

    const removed = workspaceReducer(assigned, {
      type: 'task/assigneeChangedBulk',
      taskIds: [first.id, second.id],
      personId: ada.id,
      assigned: false,
    } as never)

    expect(removed.tasks.map((task) => [task.id, task.assigneeIds])).toEqual([
      [first.id, [grace.id]],
      [second.id, undefined],
      [untouched.id, undefined],
    ])
    expect(state.tasks[0]?.assigneeIds).toEqual([grace.id])
    expect(state.tasks[1]).not.toHaveProperty('assigneeIds')
  })
})
