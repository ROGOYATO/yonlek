import { describe, expect, it } from 'vitest'

import { createProject } from '../domain/project'
import { archiveTask, createSubtask, createTask } from '../domain/task'
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

describe('Workspace commands bulk Task lifecycle', () => {
  it('restores and deletes subtrees with one dispatch per operation and ordered Activity entries', () => {
    const project = createProject({
      id: 'project-1',
      name: 'Launch',
      now: '2026-10-04T16:40:00.000Z',
    })
    const parent = archiveTask(
      createTask({
        id: 'task-parent',
        projectId: project.id,
        title: 'Parent',
        now: '2026-10-04T16:41:00.000Z',
      }),
      '2026-10-04T16:50:00.000Z',
    )
    const child = archiveTask(
      createSubtask({
        id: 'task-child',
        parent,
        title: 'Child',
        now: '2026-10-04T16:42:00.000Z',
      }),
      '2026-10-04T16:50:00.000Z',
    )
    const peer = archiveTask(
      createTask({
        id: 'task-peer',
        projectId: project.id,
        title: 'Peer',
        now: '2026-10-04T16:43:00.000Z',
      }),
      '2026-10-04T16:50:00.000Z',
    )
    const store = new ReducerStore({
      projects: [project],
      tasks: [parent, child, peer],
    })
    const times = [
      '2026-10-04T17:00:00.000Z',
      '2026-10-04T17:01:00.000Z',
    ]
    let nowCalls = 0
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'unused',
      now: () => times[nowCalls++] ?? 'unexpected-time',
    })

    commands.restoreTasks([peer.id, parent.id, peer.id])

    expect(store.dispatches).toBe(1)
    expect(store.getState().tasks.every((task) => task.archivedAt === undefined)).toBe(true)
    expect(store.getState().activity?.map((entry) => [entry.taskId, entry.event.kind])).toEqual([
      [parent.id, 'task.restored'],
      [child.id, 'task.restored'],
      [peer.id, 'task.restored'],
    ])

    commands.deleteTasks([parent.id, peer.id, parent.id])

    expect(store.dispatches).toBe(2)
    expect(nowCalls).toBe(2)
    expect(store.getState().tasks).toEqual([])
    expect(store.getState().activity?.map((entry) => [entry.taskId, entry.event.kind])).toEqual([
      [parent.id, 'task.restored'],
      [child.id, 'task.restored'],
      [peer.id, 'task.restored'],
      [parent.id, 'task.deleted'],
      [child.id, 'task.deleted'],
      [peer.id, 'task.deleted'],
    ])
  })
})
