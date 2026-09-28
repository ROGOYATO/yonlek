import { describe, expect, it } from 'vitest'

import { createAutomation } from '../domain/automation'
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
  now: '2026-09-27T10:00:00.000Z',
})

function workspace(automations: WorkspaceState['automations']): WorkspaceState {
  return {
    projects: [project],
    tasks: [
      createTask({
        id: 'task-1',
        projectId: project.id,
        title: 'Prepare demo',
        now: '2026-09-27T10:05:00.000Z',
      }),
    ],
    automations,
  }
}

describe('Workspace commands controlled Automation transaction', () => {
  it('accepts the initiating mutation and Automation effects in one Store dispatch', () => {
    const store = new ReducerStore(
      workspace([
        createAutomation({
          id: 'automation-1',
          name: 'Raise active priority',
          enabled: true,
          trigger: { kind: 'task.statusChanged' },
          conditions: [{ kind: 'status', status: 'doing' }],
          actions: [{ kind: 'priority.set', priority: 'high' }],
        }),
      ]),
    )
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'unused-id',
      now: () => '2026-09-27T11:00:00.000Z',
    })

    commands.changeTaskStatus('task-1', 'doing')

    expect(store.dispatchCount).toBe(1)
    expect(store.getState().tasks[0]).toMatchObject({
      status: 'doing',
      priority: 'high',
    })
    expect(store.getState().activity?.map((entry) => entry.event.kind)).toEqual([
      'task.statusChanged',
      'task.priorityChanged',
    ])
  })

  it('commits an Activity-driven Automation cascade as one command transaction', () => {
    const store = new ReducerStore(
      workspace([
        createAutomation({
          id: 'automation-priority',
          name: 'Raise priority',
          enabled: true,
          trigger: { kind: 'task.statusChanged' },
          conditions: [],
          actions: [{ kind: 'priority.set', priority: 'high' }],
        }),
        createAutomation({
          id: 'automation-archive',
          name: 'Archive high priority',
          enabled: true,
          trigger: { kind: 'task.priorityChanged' },
          conditions: [{ kind: 'priority', priority: 'high' }],
          actions: [{ kind: 'task.archive' }],
        }),
      ]),
    )
    const commands = createWorkspaceCommands(store, {
      nextId: () => 'unused-id',
      now: () => '2026-09-27T11:05:00.000Z',
      maxAutomationActionApplications: 8,
    })

    commands.changeTaskStatus('task-1', 'doing')

    expect(store.dispatchCount).toBe(1)
    expect(store.getState().tasks[0]?.archivedAt).toBe(
      '2026-09-27T11:05:00.000Z',
    )
    expect(store.getState().activity?.map((entry) => entry.event.kind)).toEqual([
      'task.statusChanged',
      'task.priorityChanged',
      'task.archived',
    ])
  })
})
