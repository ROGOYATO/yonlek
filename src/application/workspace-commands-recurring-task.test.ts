import { describe, expect, it } from 'vitest'

import {
  workspaceReducer,
  type WorkspaceState,
} from '../domain/workspace'
import type { TaskRecurrenceRule } from '../domain/task'
import {
  createWorkspaceCommands,
  type WorkspaceCommands,
} from './workspace-commands'
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

  dispatch(action: Parameters<typeof workspaceReducer>[1]) {
    this.dispatches += 1
    this.state = workspaceReducer(this.state, action)
  }

  subscribe() {
    return () => undefined
  }
}

type RecurrenceCommands = WorkspaceCommands & {
  changeTaskRecurrence(taskId: string, recurrence: TaskRecurrenceRule | null): void
}

function recurringState(): WorkspaceState {
  return {
    projects: [
      { id: 'project-1', name: 'Research', createdAt: '2026-09-13T09:00:00.000Z' },
    ],
    tasks: [
      {
        id: 'task-1',
        projectId: 'project-1',
        title: 'Daily check',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-13T09:00:00.000Z',
        dueDate: '2026-09-13',
        recurrence: { unit: 'day', interval: 1 },
        checklist: [{ id: 'check-1', text: 'Verify', completed: true }],
      },
      {
        id: 'task-plain',
        projectId: 'project-1',
        title: 'Plain',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-13T09:00:00.000Z',
      },
    ],
  }
}

describe('Recurring Task workspace commands', () => {
  it('configures recurrence through one dispatch and clears it normally', () => {
    const store = new ReducerStore({
      projects: recurringState().projects,
      tasks: [{ ...recurringState().tasks[0]!, recurrence: undefined }],
    })
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'unused-id',
      now: () => '2026-09-13T10:00:00.000Z',
    }) as RecurrenceCommands

    expect(commands.changeTaskRecurrence).toBeTypeOf('function')
    commands.changeTaskRecurrence('task-1', { unit: 'week', interval: 2 })
    expect(store.getState().tasks[0]?.recurrence).toEqual({ unit: 'week', interval: 2 })
    commands.changeTaskRecurrence('task-1', null)
    expect(store.getState().tasks[0]).not.toHaveProperty('recurrence')
    expect(store.dispatches).toBe(2)
  })

  it('completes a recurring Task and creates exactly one next occurrence atomically', () => {
    const store = new ReducerStore(recurringState())
    let nextIdCalls = 0
    let nowCalls = 0
    const commands = createWorkspaceCommands(store, {
      nextId: () => {
        nextIdCalls += 1
        return 'task-next'
      },
      now: () => {
        nowCalls += 1
        return '2026-09-13T10:00:00.000Z'
      },
    }) as RecurrenceCommands

    commands.changeTaskStatus('task-1', 'done')

    expect(store.dispatches).toBe(1)
    expect(nextIdCalls).toBe(1)
    expect(nowCalls).toBe(1)
    expect(store.getState().tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'task-1', status: 'done', dueDate: '2026-09-13' }),
        expect.objectContaining({
          id: 'task-next',
          status: 'todo',
          dueDate: '2026-09-14',
          recurrence: { unit: 'day', interval: 1 },
          checklist: [{ id: 'check-1', text: 'Verify', completed: false }],
        }),
      ]),
    )

    commands.changeTaskStatus('task-1', 'done')
    expect(store.getState().tasks).toHaveLength(3)
    expect(nextIdCalls).toBe(1)
    expect(nowCalls).toBe(1)
  })

  it('keeps non-recurring completion unchanged and rejects invalid recurrence before dispatch', () => {
    const store = new ReducerStore(recurringState())
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'generated-id',
      now: () => '2026-09-13T10:00:00.000Z',
    }) as RecurrenceCommands

    commands.changeTaskStatus('task-plain', 'done')
    expect(store.getState().tasks.find((task) => task.id === 'task-plain')?.status).toBe('done')

    const invalidStore = new ReducerStore({
      projects: recurringState().projects,
      tasks: [
        {
          ...recurringState().tasks[0]!,
          recurrence: { unit: 'day', interval: 0 } as TaskRecurrenceRule,
        },
      ],
    })
    const invalidCommands = createWorkspaceCommands(invalidStore, {
      nextId: () => 'should-not-run',
      now: () => '2026-09-13T10:00:00.000Z',
    }) as RecurrenceCommands

    expect(() => invalidCommands.changeTaskStatus('task-1', 'done')).toThrow(
      'Task recurrence interval must be a positive integer',
    )
    expect(invalidStore.dispatches).toBe(0)
  })
})
