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
  now: '2026-10-05T19:30:00.000Z',
})
const first = createTask({
  id: 'task-a',
  projectId: project.id,
  title: 'First',
  now: '2026-10-05T19:31:00.000Z',
})
const second = createTask({
  id: 'task-b',
  projectId: project.id,
  title: 'Second',
  now: '2026-10-05T19:32:00.000Z',
})
const safety = {
  id: 'tag-safety',
  name: 'Safety',
  createdAt: '2026-10-05T19:33:00.000Z',
}
const ada = {
  id: 'person-ada',
  name: 'Ada Lovelace',
  createdAt: '2026-10-05T19:34:00.000Z',
}

describe('Workspace commands bulk Tags and People', () => {
  it('changes each selected reference with exactly one dispatch per bulk operation', () => {
    const store = new ReducerStore({
      tags: [safety],
      people: [ada],
      projects: [project],
      tasks: [first, second],
    })
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'unused-id',
      now: () => '2026-10-05T19:35:00.000Z',
    })

    commands.changeTasksTag(
      [second.id, first.id, second.id],
      safety.id,
      true,
    )
    expect(store.dispatches).toBe(1)
    expect(store.getState().tasks.map((task) => task.tagIds)).toEqual([
      [safety.id],
      [safety.id],
    ])

    commands.changeTasksAssignee(
      [second.id, first.id, second.id],
      ada.id,
      true,
    )
    expect(store.dispatches).toBe(2)
    expect(store.getState().tasks.map((task) => task.assigneeIds)).toEqual([
      [ada.id],
      [ada.id],
    ])

    commands.changeTasksTag([first.id, second.id], safety.id, false)
    expect(store.dispatches).toBe(3)
    commands.changeTasksAssignee([first.id, second.id], ada.id, false)
    expect(store.dispatches).toBe(4)
    expect(store.getState().tasks.every((task) => task.tagIds === undefined)).toBe(true)
    expect(store.getState().tasks.every((task) => task.assigneeIds === undefined)).toBe(true)
  })
})
