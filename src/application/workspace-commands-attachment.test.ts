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
        createdAt: '2026-09-16T08:00:00.000Z',
      },
    ],
    tasks: [
      createTask({
        id: 'task-1',
        projectId: 'project-1',
        title: 'Attach file',
        now: '2026-09-16T08:00:00.000Z',
      }),
    ],
  }
}

describe('Workspace Task attachment commands', () => {
  it('adds and deletes attachment metadata through one dispatch each', () => {
    const store = new ReducerStore(state())
    let dispatches = 0
    const originalDispatch = store.dispatch.bind(store)
    store.dispatch = (action) => {
      dispatches += 1
      originalDispatch(action)
    }

    const commands = createWorkspaceCommands(store, {
      nextId: () => 'attachment-1',
      now: () => '2026-09-16T09:00:00.000Z',
    }) as ReturnType<typeof createWorkspaceCommands> & {
      addTaskAttachment?: (
        taskId: string,
        input: { name: string; sizeBytes: number; mediaType?: string },
      ) => void
      deleteTaskAttachment?: (taskId: string, attachmentId: string) => void
    }

    expect(commands.addTaskAttachment).toBeTypeOf('function')
    expect(commands.deleteTaskAttachment).toBeTypeOf('function')

    commands.addTaskAttachment!('task-1', {
      name: 'report.pdf',
      sizeBytes: 2048,
      mediaType: 'application/pdf',
    })
    expect(store.getState().tasks[0]?.attachments).toEqual([
      {
        id: 'attachment-1',
        name: 'report.pdf',
        sizeBytes: 2048,
        mediaType: 'application/pdf',
        addedAt: '2026-09-16T09:00:00.000Z',
      },
    ])
    expect(dispatches).toBe(1)

    commands.deleteTaskAttachment!('task-1', 'attachment-1')
    expect(store.getState().tasks[0]).not.toHaveProperty('attachments')
    expect(dispatches).toBe(2)
  })

  it('rejects invalid attachment metadata without accepting new state', () => {
    const store = new ReducerStore(state())
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'attachment-invalid',
      now: () => '2026-09-16T09:00:00.000Z',
    }) as ReturnType<typeof createWorkspaceCommands> & {
      addTaskAttachment?: (
        taskId: string,
        input: { name: string; sizeBytes: number; mediaType?: string },
      ) => void
    }

    expect(commands.addTaskAttachment).toBeTypeOf('function')
    expect(() =>
      commands.addTaskAttachment!('task-1', {
        name: 'bad.bin',
        sizeBytes: -1,
      }),
    ).toThrow('Task attachment size must be a non-negative integer')
    expect(store.getState().tasks[0]).not.toHaveProperty('attachments')
  })
})
