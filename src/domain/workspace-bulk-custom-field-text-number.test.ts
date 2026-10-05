import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createTask } from './task'
import { workspaceReducer, type WorkspaceState } from './workspace'

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-10-06T00:10:00.000Z',
})
const notes = {
  id: 'field-notes',
  name: 'Notes',
  type: 'text' as const,
  createdAt: '2026-10-06T00:11:00.000Z',
}
const score = {
  id: 'field-score',
  name: 'Score',
  type: 'number' as const,
  createdAt: '2026-10-06T00:12:00.000Z',
}

describe('Workspace bulk Custom Field text and number values', () => {
  it('sets and clears normalized values across selected Tasks without mutating the input Workspace', () => {
    const first = {
      ...createTask({
        id: 'task-first',
        projectId: project.id,
        title: 'First',
        now: '2026-10-06T00:13:00.000Z',
      }),
      customFieldValues: {
        [notes.id]: 'old note',
        [score.id]: 1,
      },
    }
    const second = createTask({
      id: 'task-second',
      projectId: project.id,
      title: 'Second',
      now: '2026-10-06T00:14:00.000Z',
    })
    const state: WorkspaceState = {
      customFields: [notes, score],
      projects: [project],
      tasks: [first, second],
    }

    const textChanged = workspaceReducer(state, {
      type: 'task/customFieldValueChangedBulk',
      taskIds: [second.id, first.id, second.id],
      fieldId: notes.id,
      value: '  release ready  ',
    } as never)

    expect(
      textChanged.tasks.map((task) => task.customFieldValues?.[notes.id]),
    ).toEqual(['release ready', 'release ready'])
    expect(state.tasks[0]?.customFieldValues?.[notes.id]).toBe('old note')
    expect(state.tasks[1]?.customFieldValues).toBeUndefined()

    const numberChanged = workspaceReducer(textChanged, {
      type: 'task/customFieldValueChangedBulk',
      taskIds: [first.id, second.id],
      fieldId: score.id,
      value: 42,
    } as never)

    expect(
      numberChanged.tasks.map((task) => task.customFieldValues?.[score.id]),
    ).toEqual([42, 42])

    const cleared = workspaceReducer(numberChanged, {
      type: 'task/customFieldValueChangedBulk',
      taskIds: [first.id, second.id],
      fieldId: notes.id,
      value: null,
    } as never)

    expect(
      cleared.tasks.map((task) => task.customFieldValues?.[notes.id]),
    ).toEqual([undefined, undefined])
    expect(
      cleared.tasks.map((task) => task.customFieldValues?.[score.id]),
    ).toEqual([42, 42])
  })
})
