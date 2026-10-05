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

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-10-05T08:00:00.000Z',
})

describe('Workspace commands bulk Task dates', () => {
  it('sets due/start dates with one dispatch per operation and ordered Activity entries', () => {
    const first = {
      ...createTask({
        id: 'task-first',
        projectId: project.id,
        title: 'First',
        now: '2026-10-05T08:01:00.000Z',
      }),
      startDate: '2026-10-08',
      dueDate: '2026-10-18',
    }
    const second = {
      ...createTask({
        id: 'task-second',
        projectId: project.id,
        title: 'Second',
        now: '2026-10-05T08:02:00.000Z',
      }),
      startDate: '2026-10-09',
      dueDate: '2026-10-19',
    }
    const store = new ReducerStore({
      projects: [project],
      tasks: [first, second],
    })
    let nowCalls = 0
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'unused-id',
      now: () => {
        nowCalls += 1
        return `2026-10-05T09:00:0${nowCalls}.000Z`
      },
    })

    commands.changeTasksDueDate(
      [second.id, first.id, second.id],
      '2026-10-20',
    )

    expect(store.dispatches).toBe(1)
    expect(store.getState().tasks.map((task) => task.dueDate)).toEqual([
      '2026-10-20',
      '2026-10-20',
    ])
    expect(store.getState().activity?.map((entry) => [
      entry.taskId,
      entry.event.kind,
      entry.occurredAt,
    ])).toEqual([
      [first.id, 'task.dueDateChanged', '2026-10-05T09:00:01.000Z'],
      [second.id, 'task.dueDateChanged', '2026-10-05T09:00:01.000Z'],
    ])

    commands.changeTasksStartDate(
      [second.id, first.id, second.id],
      '2026-10-10',
    )

    expect(store.dispatches).toBe(2)
    expect(nowCalls).toBe(2)
    expect(store.getState().tasks.map((task) => task.startDate)).toEqual([
      '2026-10-10',
      '2026-10-10',
    ])
    expect(store.getState().activity?.slice(-2).map((entry) => [
      entry.taskId,
      entry.event.kind,
      entry.occurredAt,
    ])).toEqual([
      [first.id, 'task.startDateChanged', '2026-10-05T09:00:02.000Z'],
      [second.id, 'task.startDateChanged', '2026-10-05T09:00:02.000Z'],
    ])
  })
})
