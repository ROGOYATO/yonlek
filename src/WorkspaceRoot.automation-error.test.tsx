/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createAutomation } from './domain/automation'
import { createProject } from './domain/project'
import { createTask } from './domain/task'
import { createWorkspaceCommands } from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import {
  saveWorkspace,
  type KeyValueStore,
} from './persistence/workspace-storage'
import { WorkspaceRoot } from './WorkspaceRoot'

class MemoryStore implements KeyValueStore {
  readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-09-27T13:00:00.000Z',
})

function createTestApplication(
  actions: Parameters<typeof createAutomation>[0]['actions'],
  maxAutomationActionApplications = 8,
) {
  const storage = new MemoryStore()
  const task = createTask({
    id: 'task-1',
    projectId: project.id,
    title: 'Prepare demo',
    now: '2026-09-27T13:05:00.000Z',
  })
  saveWorkspace(storage, {
    projects: [project],
    tasks: [task],
    automations: [
      createAutomation({
        id: 'automation-1',
        name: 'Failure case',
        enabled: true,
        trigger: { kind: 'task.statusChanged' },
        conditions: [],
        actions,
      }),
    ],
  })
  const store = createWorkspaceStore(storage)
  const commands = createWorkspaceCommands(store, {
    nextId: () => 'unused-id',
    now: () => '2026-09-27T13:30:00.000Z',
    maxAutomationActionApplications,
  })

  return { storage, store, commands }
}

describe('Automation command error surface and rollback', () => {
  it('surfaces an Automation action error without accepting partial Workspace state', async () => {
    const user = userEvent.setup()
    const { storage, store, commands } = createTestApplication([
      { kind: 'project.move', projectId: 'missing-project' },
    ])
    const persistedBefore = storage.getItem('workspace-app.workspace')

    render(<WorkspaceRoot store={store} commands={commands} />)
    await user.selectOptions(
      screen.getByLabelText('Status for Prepare demo'),
      'doing',
    )

    expect(screen.getByRole('alert').textContent).toContain(
      'Cannot move a task to a missing project',
    )
    expect(store.getState().tasks[0]).toMatchObject({
      status: 'todo',
      priority: 'normal',
    })
    expect(store.getState()).not.toHaveProperty('activity')
    expect(storage.getItem('workspace-app.workspace')).toBe(persistedBefore)
  })

  it('surfaces budget exhaustion without committing earlier Automation actions', async () => {
    const user = userEvent.setup()
    const { storage, store, commands } = createTestApplication(
      [
        { kind: 'priority.set', priority: 'high' },
        { kind: 'task.archive' },
      ],
      1,
    )
    const persistedBefore = storage.getItem('workspace-app.workspace')

    render(<WorkspaceRoot store={store} commands={commands} />)
    await user.selectOptions(
      screen.getByLabelText('Status for Prepare demo'),
      'doing',
    )

    expect(screen.getByRole('alert').textContent).toContain(
      'Automation action application limit reached',
    )
    expect(store.getState().tasks[0]).toMatchObject({
      status: 'todo',
      priority: 'normal',
    })
    expect(store.getState().tasks[0]).not.toHaveProperty('archivedAt')
    expect(store.getState()).not.toHaveProperty('activity')
    expect(storage.getItem('workspace-app.workspace')).toBe(persistedBefore)
  })
})
