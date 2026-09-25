import { describe, expect, it } from 'vitest'

import {
  workspaceReducer,
  type WorkspaceState,
} from '../domain/workspace'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from '../persistence/workspace-storage'
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

class MemoryStore implements KeyValueStore {
  readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('Workspace Automation commands and storage boundary', () => {
  it('adds, updates, and deletes one Automation through command dispatches', () => {
    const store = new ReducerStore({ projects: [], tasks: [] })
    const ids = ['automation-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-25T19:00:00.000Z',
    }) as ReturnType<typeof createWorkspaceCommands> & {
      addAutomation?: (
        name: string,
        input: {
          enabled: boolean
          trigger: { kind: 'task.created' }
          conditions: []
          actions: [{ kind: 'priority.set'; priority: 'high' }]
        },
      ) => { id: string }
      renameAutomation?: (automationId: string, name: string) => void
      setAutomationEnabled?: (automationId: string, enabled: boolean) => void
      changeAutomationTrigger?: (
        automationId: string,
        trigger: { kind: 'task.statusChanged' },
      ) => void
      changeAutomationConditions?: (
        automationId: string,
        conditions: [{ kind: 'status'; status: 'doing' }],
      ) => void
      changeAutomationActions?: (
        automationId: string,
        actions: [{ kind: 'status.set'; status: 'done' }],
      ) => void
      deleteAutomation?: (automationId: string) => void
    }

    expect(commands.addAutomation).toBeTypeOf('function')
    expect(commands.renameAutomation).toBeTypeOf('function')
    expect(commands.setAutomationEnabled).toBeTypeOf('function')
    expect(commands.changeAutomationTrigger).toBeTypeOf('function')
    expect(commands.changeAutomationConditions).toBeTypeOf('function')
    expect(commands.changeAutomationActions).toBeTypeOf('function')
    expect(commands.deleteAutomation).toBeTypeOf('function')

    const added = commands.addAutomation!('Daily triage', {
      enabled: true,
      trigger: { kind: 'task.created' },
      conditions: [],
      actions: [{ kind: 'priority.set', priority: 'high' }],
    })
    expect(added.id).toBe('automation-1')

    commands.renameAutomation!('automation-1', 'Morning triage')
    commands.setAutomationEnabled!('automation-1', false)
    commands.changeAutomationTrigger!('automation-1', {
      kind: 'task.statusChanged',
    })
    commands.changeAutomationConditions!('automation-1', [
      { kind: 'status', status: 'doing' },
    ])
    commands.changeAutomationActions!('automation-1', [
      { kind: 'status.set', status: 'done' },
    ])

    expect(store.getState().automations?.[0]).toMatchObject({
      id: 'automation-1',
      name: 'Morning triage',
      enabled: false,
      trigger: { kind: 'task.statusChanged' },
      conditions: [{ kind: 'status', status: 'doing' }],
      actions: [{ kind: 'status.set', status: 'done' }],
    })

    commands.deleteAutomation!('automation-1')
    expect(store.getState()).not.toHaveProperty('automations')
  })

  it('does not accept a duplicate runtime id into Workspace state', () => {
    const store = new ReducerStore({ projects: [], tasks: [] })
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'automation-1',
      now: () => '2026-09-25T19:00:00.000Z',
    }) as ReturnType<typeof createWorkspaceCommands> & {
      addAutomation?: (
        name: string,
        input: {
          enabled: boolean
          trigger: { kind: 'task.created' }
          conditions: []
          actions: []
        },
      ) => unknown
    }

    expect(commands.addAutomation).toBeTypeOf('function')
    commands.addAutomation!('First', {
      enabled: true,
      trigger: { kind: 'task.created' },
      conditions: [],
      actions: [],
    })

    expect(() =>
      commands.addAutomation!('Second', {
        enabled: true,
        trigger: { kind: 'task.created' },
        conditions: [],
        actions: [],
      }),
    ).toThrow('Automation id must be unique')
    expect(store.getState().automations).toHaveLength(1)
  })

  it('round-trips a valid Automation collection through storage version 1', () => {
    const storage = new MemoryStore()
    const workspace: WorkspaceState = {
      projects: [],
      tasks: [],
      automations: [
        {
          id: 'automation-1',
          name: 'Daily triage',
          enabled: true,
          trigger: { kind: 'task.created' },
          conditions: [],
          actions: [{ kind: 'priority.set', priority: 'high' }],
        },
      ],
    }

    saveWorkspace(storage, workspace)

    const raw = [...storage.values.values()][0]
    expect(JSON.parse(raw ?? '{}').version).toBe(1)
    expect(loadWorkspace(storage)).toEqual(workspace)
  })
})
