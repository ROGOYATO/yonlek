import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createTask } from './task'
import { workspaceReducer, type WorkspaceState } from './workspace'

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-10-05T08:00:00.000Z',
})

describe('Workspace bulk Task date atomicity', () => {
  it('validates the whole selection before accepting schedule changes and preserves due-date clearing semantics', () => {
    const first = {
      ...createTask({
        id: 'task-first',
        projectId: project.id,
        title: 'First',
        now: '2026-10-05T08:01:00.000Z',
      }),
      startDate: '2026-10-10',
      dueDate: '2026-10-20',
      recurrence: { unit: 'day' as const, interval: 1 },
    }
    const second = {
      ...createTask({
        id: 'task-second',
        projectId: project.id,
        title: 'Second',
        now: '2026-10-05T08:02:00.000Z',
      }),
      startDate: '2026-10-15',
      dueDate: '2026-10-25',
    }
    const state: WorkspaceState = {
      projects: [project],
      tasks: [first, second],
    }

    expect(() =>
      workspaceReducer(state, {
        type: 'task/dueDateChangedBulk',
        taskIds: [first.id, second.id],
        dueDate: '2026-10-12',
      } as never),
    ).toThrow('Task due date must not be before start date')
    expect(state.tasks).toEqual([first, second])

    expect(() =>
      workspaceReducer(state, {
        type: 'task/startDateChangedBulk',
        taskIds: [second.id, first.id],
        startDate: '2026-10-22',
      } as never),
    ).toThrow('Task start date must not be after due date')
    expect(state.tasks).toEqual([first, second])

    const cleared = workspaceReducer(state, {
      type: 'task/dueDateChangedBulk',
      taskIds: [first.id],
      dueDate: null,
    } as never)

    expect(cleared.tasks[0]).not.toHaveProperty('dueDate')
    expect(cleared.tasks[0]).not.toHaveProperty('recurrence')
    expect(state.tasks[0]).toEqual(first)
  })
})
