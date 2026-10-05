import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createTask } from './task'
import { workspaceReducer, type WorkspaceState } from './workspace'

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-10-05T08:00:00.000Z',
})

describe('Workspace bulk Task due dates', () => {
  it('sets and clears selected Task due dates without mutating the input Workspace', () => {
    const first = {
      ...createTask({
        id: 'task-first',
        projectId: project.id,
        title: 'First',
        now: '2026-10-05T08:01:00.000Z',
      }),
      dueDate: '2026-10-12',
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
      type: 'task/dueDateChangedBulk',
      taskIds: [second.id, first.id, second.id],
      dueDate: '2026-10-20',
    } as never)

    expect(dated.tasks.map((task) => [task.id, task.dueDate])).toEqual([
      [first.id, '2026-10-20'],
      [second.id, '2026-10-20'],
    ])
    expect(state.tasks.map((task) => [task.id, task.dueDate])).toEqual([
      [first.id, '2026-10-12'],
      [second.id, undefined],
    ])

    const cleared = workspaceReducer(dated, {
      type: 'task/dueDateChangedBulk',
      taskIds: [first.id, second.id],
      dueDate: null,
    } as never)

    expect(cleared.tasks.map((task) => task.dueDate)).toEqual([
      undefined,
      undefined,
    ])
  })
})
