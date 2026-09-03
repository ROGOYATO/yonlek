/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createWorkspaceCommands } from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import type { KeyValueStore } from './persistence/workspace-storage'
import { WorkspaceRoot } from './WorkspaceRoot'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

function createTestApplication() {
  const storage = new MemoryStore()
  const store = createWorkspaceStore(storage)
  const ids = ['project-1', 'task-1']
  const commands = createWorkspaceCommands(store, {
    nextId: () => ids.shift() ?? 'unexpected-id',
    now: () => '2026-09-03T02:00:00.000Z',
  })

  return { store, commands }
}

describe('WorkspaceRoot', () => {
  it('lets a user create a project', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(screen.getByLabelText('Project name'), 'Robotics Research')
    await user.click(screen.getByRole('button', { name: 'Add project' }))

    expect(
      screen.getByRole('heading', { name: 'Robotics Research' }),
    ).toBeTruthy()
    expect(store.getState().projects[0]?.name).toBe('Robotics Research')
  })
  it('lets a user add a task to an existing project', async () => {
    const user = userEvent.setup()
    const { store, commands } = createTestApplication()
    commands.addProject('Robotics Research')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(
      screen.getByLabelText('Task title for Robotics Research'),
      'Draft experiment plan',
    )
    await user.click(screen.getByRole('button', { name: 'Add task' }))

    expect(screen.getByText('Draft experiment plan')).toBeTruthy()
    expect(store.getState().tasks[0]?.title).toBe('Draft experiment plan')
  })
})
