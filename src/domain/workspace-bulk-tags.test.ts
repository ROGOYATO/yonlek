import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createTask } from './task'
import { workspaceReducer } from './workspace'

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-10-05T19:00:00.000Z',
})
const first = createTask({
  id: 'task-a',
  projectId: project.id,
  title: 'First',
  now: '2026-10-05T19:01:00.000Z',
})
const second = createTask({
  id: 'task-b',
  projectId: project.id,
  title: 'Second',
  now: '2026-10-05T19:02:00.000Z',
})
const untouched = createTask({
  id: 'task-c',
  projectId: project.id,
  title: 'Untouched',
  now: '2026-10-05T19:03:00.000Z',
})
const safety = {
  id: 'tag-safety',
  name: 'Safety',
  createdAt: '2026-10-05T19:04:00.000Z',
}
const camera = {
  id: 'tag-camera',
  name: 'Camera',
  createdAt: '2026-10-05T19:05:00.000Z',
}

describe('Workspace bulk Task Tags', () => {
  it('adds and removes one Tag across the selected Tasks without mutating the input Workspace', () => {
    const state = {
      tags: [safety, camera],
      projects: [project],
      tasks: [{ ...first, tagIds: [camera.id] }, second, untouched],
    }

    const assigned = workspaceReducer(state, {
      type: 'task/tagChangedBulk',
      taskIds: [first.id, second.id],
      tagId: safety.id,
      assigned: true,
    } as never)

    expect(assigned.tasks.map((task) => [task.id, task.tagIds])).toEqual([
      [first.id, [camera.id, safety.id]],
      [second.id, [safety.id]],
      [untouched.id, undefined],
    ])

    const removed = workspaceReducer(assigned, {
      type: 'task/tagChangedBulk',
      taskIds: [first.id, second.id],
      tagId: safety.id,
      assigned: false,
    } as never)

    expect(removed.tasks.map((task) => [task.id, task.tagIds])).toEqual([
      [first.id, [camera.id]],
      [second.id, undefined],
      [untouched.id, undefined],
    ])
    expect(state.tasks[0]?.tagIds).toEqual([camera.id])
    expect(state.tasks[1]).not.toHaveProperty('tagIds')
  })
})
