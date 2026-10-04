import { describe, expect, it } from 'vitest'

import { createProject } from '../domain/project'
import { createSubtask, createTask } from '../domain/task'
import { createTaskList } from '../domain/task-list'
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

describe('Workspace commands bulk Task movement', () => {
  it('moves Projects and Lists with one dispatch each and ordered Activity entries', () => {
    const sourceProject = createProject({
      id: 'project-source',
      name: 'Source',
      now: '2026-10-04T18:20:00.000Z',
    })
    const targetProject = createProject({
      id: 'project-target',
      name: 'Target',
      now: '2026-10-04T18:21:00.000Z',
    })
    const sourceList = createTaskList({
      id: 'list-source',
      projectId: sourceProject.id,
      name: 'Source list',
      now: '2026-10-04T18:22:00.000Z',
    })
    const targetList = createTaskList({
      id: 'list-target',
      projectId: targetProject.id,
      name: 'Target list',
      now: '2026-10-04T18:23:00.000Z',
    })
    const parent = createTask({
      id: 'task-parent',
      projectId: sourceProject.id,
      title: 'Parent',
      now: '2026-10-04T18:24:00.000Z',
      listId: sourceList.id,
    })
    const child = createSubtask({
      id: 'task-child',
      parent,
      title: 'Child',
      now: '2026-10-04T18:25:00.000Z',
    })
    const peer = createTask({
      id: 'task-peer',
      projectId: sourceProject.id,
      title: 'Peer',
      now: '2026-10-04T18:26:00.000Z',
      listId: sourceList.id,
    })
    const store = new ReducerStore({
      projects: [sourceProject, targetProject],
      lists: [sourceList, targetList],
      tasks: [parent, child, peer],
    })
    let nowCalls = 0
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'unused',
      now: () => {
        nowCalls += 1
        return nowCalls === 1
          ? '2026-10-04T18:30:00.000Z'
          : '2026-10-04T18:31:00.000Z'
      },
    })

    commands.changeTasksProject(
      [peer.id, parent.id, peer.id],
      targetProject.id,
    )

    expect(store.dispatches).toBe(1)
    expect(store.getState().tasks.map((task) => [task.id, task.projectId, task.listId])).toEqual([
      [parent.id, targetProject.id, undefined],
      [child.id, targetProject.id, undefined],
      [peer.id, targetProject.id, undefined],
    ])
    expect(store.getState().activity?.map((entry) => [entry.taskId, entry.event.kind])).toEqual([
      [parent.id, 'task.projectChanged'],
      [child.id, 'task.projectChanged'],
      [peer.id, 'task.projectChanged'],
    ])

    commands.changeTasksList(
      [peer.id, parent.id, peer.id],
      targetList.id,
    )

    expect(store.dispatches).toBe(2)
    expect(nowCalls).toBe(2)
    expect(store.getState().tasks.map((task) => [task.id, task.listId])).toEqual([
      [parent.id, targetList.id],
      [child.id, undefined],
      [peer.id, targetList.id],
    ])
    expect(store.getState().activity?.slice(3).map((entry) => [entry.taskId, entry.event.kind])).toEqual([
      [parent.id, 'task.listChanged'],
      [peer.id, 'task.listChanged'],
    ])
  })
})
