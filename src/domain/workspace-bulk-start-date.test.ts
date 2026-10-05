import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createTask } from './task'
import { workspaceReducer, type WorkspaceState } from './workspace'

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-10-05T08:00:00.000Z',
})

describe('Workspace bulk Task start dates', () => {
  it('sets and clears selected Task start dates without mutating the input Workspace', () => {
    const first = {
      ...createTask({
        id: 'task-first',
        projectId: project.id,
        title: 'First',
        now: '2026-10-05T08:01:00.000Z',
      }),
      startDate: '2026-10-08',
    }
    const second = createTask({
      id: 'task-second',
      projectId: project.id,
      title: 'Second',
      now: '2026-10-05T08:02:00.000Z',
    })
    const state: WorkspaceState = {
      projects: [project],
      tasks: [first, second],
    }

    const dated = workspaceReducer(state, {
      type: 'task/startDateChangedBulk',
      taskIds: [second.id, first.id, second.id],
      startDate: '2026-10-10',
    } as never)

    expect(dated.tasks.map((task) => [task.id, task.startDate])).toEqual([
      [first.id, '2026-10-10'],
      [second.id, '2026-10-10'],
    ])
    expect(state.tasks.map((task) => [task.id, task.startDate])).toEqual([
      [first.id, '2026-10-08'],
      [second.id, undefined],
    ])

    const cleared = workspaceReducer(dated, {
      type: 'task/startDateChangedBulk',
      taskIds: [first.id, second.id],
      startDate: null,
    } as never)

    expect(cleared.tasks.map((task) => task.startDate)).toEqual([
      undefined,
      undefined,
    ])
  })
})
