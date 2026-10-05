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
  now: '2026-10-06T00:40:00.000Z',
})
const first = createTask({
  id: 'task-a',
  projectId: project.id,
  title: 'First',
  now: '2026-10-06T00:41:00.000Z',
})
const second = createTask({
  id: 'task-b',
  projectId: project.id,
  title: 'Second',
  now: '2026-10-06T00:42:00.000Z',
})
const notes = {
  id: 'field-notes',
  name: 'Notes',
  type: 'text' as const,
  createdAt: '2026-10-06T00:43:00.000Z',
}

describe('Workspace commands bulk Custom Field values', () => {
  it('changes the selected Custom Field value with exactly one dispatch per bulk operation', () => {
    const store = new ReducerStore({
      customFields: [notes],
      projects: [project],
      tasks: [first, second],
    })
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'unused-id',
      now: () => '2026-10-06T00:44:00.000Z',
    })

    commands.changeTasksCustomFieldValue(
      [second.id, first.id, second.id],
      notes.id,
      '  ready  ',
    )

    expect(store.dispatches).toBe(1)
    expect(
      store.getState().tasks.map((task) => task.customFieldValues?.[notes.id]),
    ).toEqual(['ready', 'ready'])

    commands.changeTasksCustomFieldValue(
      [first.id, second.id],
      notes.id,
      null,
    )

    expect(store.dispatches).toBe(2)
    expect(
      store.getState().tasks.every(
        (task) => task.customFieldValues?.[notes.id] === undefined,
      ),
    ).toBe(true)
  })
})
