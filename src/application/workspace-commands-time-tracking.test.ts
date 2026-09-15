import { describe, expect, it } from 'vitest'

import { createTask } from '../domain/task'
import {
  workspaceReducer,
  type WorkspaceState,
} from '../domain/workspace'
import { createWorkspaceCommands } from './workspace-commands'
import type { WorkspaceStore } from './workspace-store'

class ReducerStore implements WorkspaceStore {
  state: WorkspaceState

  constructor(state: WorkspaceState) {
    this.state = state
  }

  getState() {
    return this.state
  }

  dispatch(action: Parameters<typeof workspaceReducer>[1]) {
    this.state = workspaceReducer(this.state, action)
  }

  subscribe() {
    return () => undefined
  }
}

function state(): WorkspaceState {
  return {
    projects: [
      {
        id: 'project-1',
        name: 'Project',
        createdAt: '2026-09-15T09:00:00.000Z',
      },
    ],
    tasks: [
      createTask({
        id: 'task-1',
        projectId: 'project-1',
        title: 'Track work',
        now: '2026-09-15T09:00:00.000Z',
      }),
    ],
  }
}

describe('Workspace Task time-tracking commands', () => {
  it('records manual time, starts and stops one timer, and deletes entries through one dispatch each', () => {
    const store = new ReducerStore(state())
    let dispatches = 0
    const originalDispatch = store.dispatch.bind(store)
    store.dispatch = (action) => {
      dispatches += 1
      originalDispatch(action)
    }

    const ids = ['entry-manual', 'entry-timer']
    const times = [
      '2026-09-15T10:00:00.000Z',
      '2026-09-15T11:00:00.000Z',
      '2026-09-15T11:45:00.000Z',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => times.shift() ?? 'unexpected-time',
    }) as ReturnType<typeof createWorkspaceCommands> & {
      addTaskTrackedMinutes?: (taskId: string, minutes: number) => void
      startTaskTimer?: (taskId: string) => void
      stopTaskTimer?: (taskId: string) => void
      deleteTaskTimeEntry?: (taskId: string, entryId: string) => void
    }

    expect(commands.addTaskTrackedMinutes).toBeTypeOf('function')
    expect(commands.startTaskTimer).toBeTypeOf('function')
    expect(commands.stopTaskTimer).toBeTypeOf('function')
    expect(commands.deleteTaskTimeEntry).toBeTypeOf('function')

    commands.addTaskTrackedMinutes!('task-1', 20)
    expect(store.getState().tasks[0]?.timeEntries).toEqual([
      {
        id: 'entry-manual',
        durationMs: 20 * 60_000,
        recordedAt: '2026-09-15T10:00:00.000Z',
      },
    ])
    expect(dispatches).toBe(1)

    commands.startTaskTimer!('task-1')
    expect(store.getState().tasks[0]?.timerStartedAt).toBe(
      '2026-09-15T11:00:00.000Z',
    )
    expect(dispatches).toBe(2)

    commands.stopTaskTimer!('task-1')
    expect(store.getState().tasks[0]).not.toHaveProperty('timerStartedAt')
    expect(store.getState().tasks[0]?.timeEntries?.[1]).toEqual({
      id: 'entry-timer',
      durationMs: 45 * 60_000,
      recordedAt: '2026-09-15T11:45:00.000Z',
    })
    expect(dispatches).toBe(3)

    commands.deleteTaskTimeEntry!('task-1', 'entry-manual')
    expect(store.getState().tasks[0]?.timeEntries?.map((entry) => entry.id)).toEqual([
      'entry-timer',
    ])
    expect(dispatches).toBe(4)
  })

  it('rejects invalid tracked minutes without accepting new state', () => {
    const store = new ReducerStore(state())
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'entry-invalid',
      now: () => '2026-09-15T10:00:00.000Z',
    }) as ReturnType<typeof createWorkspaceCommands> & {
      addTaskTrackedMinutes?: (taskId: string, minutes: number) => void
    }

    expect(commands.addTaskTrackedMinutes).toBeTypeOf('function')
    expect(() => commands.addTaskTrackedMinutes!('task-1', 0)).toThrow(
      'Tracked minutes must be a positive integer',
    )
    expect(store.getState().tasks[0]).not.toHaveProperty('timeEntries')
  })
})
