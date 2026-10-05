import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createTask } from './task'
import { workspaceReducer } from './workspace'

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-10-05T19:20:00.000Z',
})
const first = createTask({
  id: 'task-a',
  projectId: project.id,
  title: 'First',
  now: '2026-10-05T19:21:00.000Z',
})
const second = createTask({
  id: 'task-b',
  projectId: project.id,
  title: 'Second',
  now: '2026-10-05T19:22:00.000Z',
})
const safety = {
  id: 'tag-safety',
  name: 'Safety',
  createdAt: '2026-10-05T19:23:00.000Z',
}
const ada = {
  id: 'person-ada',
  name: 'Ada Lovelace',
  createdAt: '2026-10-05T19:24:00.000Z',
}

describe('Workspace bulk Tag and Person reference integrity', () => {
  it('deduplicates caller Task IDs and rejects assigning deleted references without partial mutation', () => {
    const state = {
      tags: [safety],
      people: [ada],
      projects: [project],
      tasks: [first, second],
    }

    const tagged = workspaceReducer(state, {
      type: 'task/tagChangedBulk',
      taskIds: [second.id, first.id, second.id],
      tagId: safety.id,
      assigned: true,
    } as never)
    const assigned = workspaceReducer(tagged, {
      type: 'task/assigneeChangedBulk',
      taskIds: [second.id, first.id, second.id],
      personId: ada.id,
      assigned: true,
    } as never)

    expect(assigned.tasks.map((task) => task.tagIds)).toEqual([
      [safety.id],
      [safety.id],
    ])
    expect(assigned.tasks.map((task) => task.assigneeIds)).toEqual([
      [ada.id],
      [ada.id],
    ])

    const withoutTag = workspaceReducer(assigned, {
      type: 'tag/deleted',
      tagId: safety.id,
    } as never)
    const withoutReferences = workspaceReducer(withoutTag, {
      type: 'person/deleted',
      personId: ada.id,
    } as never)

    expect(withoutReferences.tasks.every((task) => task.tagIds === undefined)).toBe(true)
    expect(withoutReferences.tasks.every((task) => task.assigneeIds === undefined)).toBe(true)

    expect(() =>
      workspaceReducer(withoutReferences, {
        type: 'task/tagChangedBulk',
        taskIds: [first.id, second.id],
        tagId: safety.id,
        assigned: true,
      } as never),
    ).toThrow('Cannot assign a missing tag')
    expect(() =>
      workspaceReducer(withoutReferences, {
        type: 'task/assigneeChangedBulk',
        taskIds: [first.id, second.id],
        personId: ada.id,
        assigned: true,
      } as never),
    ).toThrow('Cannot assign a missing person')

    expect(
      workspaceReducer(withoutReferences, {
        type: 'task/tagChangedBulk',
        taskIds: [first.id, first.id],
        tagId: safety.id,
        assigned: false,
      } as never).tasks,
    ).toEqual(withoutReferences.tasks)
    expect(
      workspaceReducer(withoutReferences, {
        type: 'task/assigneeChangedBulk',
        taskIds: [second.id, second.id],
        personId: ada.id,
        assigned: false,
      } as never).tasks,
    ).toEqual(withoutReferences.tasks)
  })
})
