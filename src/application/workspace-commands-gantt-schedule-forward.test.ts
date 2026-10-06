import { describe, expect, it } from 'vitest'

import { createProject } from '../domain/project'
import { createTask } from '../domain/task'
import {
  workspaceReducer,
  type WorkspaceAction,
  type WorkspaceState,
} from '../domain/workspace'
import { createWorkspaceCommands } from './workspace-commands'
import type { WorkspaceStore } from './workspace-store'

class ReducerStore implements WorkspaceStore {
  state: WorkspaceState
  dispatches = 0

  constructor(state: WorkspaceState) {
    this.state = state
  }

  getState() {
    return this.state
  }

  dispatch(action: WorkspaceAction) {
    this.dispatches += 1
    this.state = workspaceReducer(this.state, action)
  }

  subscribe() {
    return () => undefined
  }
}

describe('Workspace commands Gantt schedule movement', () => {
  it('moves a schedule forward through existing date actions without an inverted intermediate range', () => {
    const project = createProject({
      id: 'project-1',
      name: 'Launch',
      now: '2026-10-06T00:20:00.000Z',
    })
    const task = {
      ...createTask({
        id: 'task-1',
        projectId: project.id,
        title: 'Review launch',
        now: '2026-10-06T00:21:00.000Z',
      }),
      startDate: '2026-10-10',
      dueDate: '2026-10-12',
    }
    const store = new ReducerStore({ projects: [project], tasks: [task] })
    let nowCalls = 0
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'unused-id',
      now: () => {
        nowCalls += 1
        return '2026-10-06T00:22:00.000Z'
      },
    })

    commands.changeTaskGanttSchedule(
      task.id,
      '2026-10-20',
      '2026-10-22',
    )

    expect(store.getState().tasks[0]).toMatchObject({
      startDate: '2026-10-20',
      dueDate: '2026-10-22',
    })
    expect(store.dispatches).toBe(2)
    expect(nowCalls).toBe(1)
    expect(store.getState().activity?.map((entry) => entry.event.kind)).toEqual([
      'task.dueDateChanged',
      'task.startDateChanged',
    ])
    expect(
      store.getState().activity?.map((entry) => entry.occurredAt),
    ).toEqual([
      '2026-10-06T00:22:00.000Z',
      '2026-10-06T00:22:00.000Z',
    ])
  })
})
