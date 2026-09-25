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
  dispatchCount = 0

  constructor(state: WorkspaceState) {
    this.state = state
  }

  getState() {
    return this.state
  }

  dispatch(action: WorkspaceAction) {
    this.dispatchCount += 1
    this.state = workspaceReducer(this.state, action)
  }

  subscribe() {
    return () => undefined
  }
}

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-09-23T08:00:00.000Z',
})

function state(): WorkspaceState {
  return {
    projects: [project],
    tasks: [
      createTask({
        id: 'task-1',
        projectId: project.id,
        title: 'Prepare slides',
        now: '2026-09-23T08:05:00.000Z',
      }),
    ],
  }
}

describe('Workspace commands Task activity', () => {
  it('tracks a direct lifecycle command through one Store dispatch', () => {
    const store = new ReducerStore(state())
    let nowCalls = 0
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'unused',
      now: () => {
        nowCalls += 1
        return '2026-09-23T09:00:00.000Z'
      },
    })

    commands.renameTask('task-1', 'Prepare demo')

    expect(store.dispatchCount).toBe(1)
    expect(nowCalls).toBe(1)
    expect(store.getState().tasks[0]?.title).toBe('Prepare demo')
    expect(store.getState().activity?.map((entry) => entry.event.kind)).toEqual([
      'task.titleChanged',
    ])
  })

  it('reuses the creation timestamp and does not consume an Activity id', () => {
    const store = new ReducerStore({ projects: [project], tasks: [] })
    const ids = ['task-2']
    let nowCalls = 0
    const commands = createWorkspaceCommands(store, {
      nextId: () => {
        const id = ids.shift()
        if (!id) throw new Error('Unexpected extra id request')
        return id
      },
      now: () => {
        nowCalls += 1
        return '2026-09-23T09:15:00.000Z'
      },
    })

    const created = commands.addTask(project.id, 'Write notes')

    expect(created.id).toBe('task-2')
    expect(created.createdAt).toBe('2026-09-23T09:15:00.000Z')
    expect(ids).toEqual([])
    expect(nowCalls).toBe(1)
    expect(store.dispatchCount).toBe(1)
    expect(store.getState().activity).toEqual([
      expect.objectContaining({
        sequence: 1,
        occurredAt: '2026-09-23T09:15:00.000Z',
        taskId: 'task-2',
        taskTitle: 'Write notes',
        event: expect.objectContaining({ kind: 'task.created' }),
      }),
    ])
  })
})
