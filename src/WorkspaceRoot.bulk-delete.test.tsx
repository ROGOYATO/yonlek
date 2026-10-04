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

describe('WorkspaceRoot bulk Task delete', () => {
  it('requires an explicit confirmation before deleting the selected Tasks', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-1', 'task-alpha', 'task-beta']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-10-04T17:40:00.000Z',
    })
    const project = commands.addProject('Launch')
    commands.addTask(project.id, 'Alpha')
    commands.addTask(project.id, 'Beta')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(screen.getByLabelText('Select all visible tasks'))
    await user.click(screen.getByRole('button', { name: 'Delete selected tasks' }))

    expect(store.getState().tasks).toHaveLength(2)
    expect(screen.getByText('Delete 2 selected tasks?')).toBeTruthy()

    await user.click(
      screen.getByRole('button', { name: 'Confirm delete selected tasks' }),
    )

    expect(store.getState().tasks).toEqual([])
    expect(store.getState().activity?.slice(-2).map((entry) => entry.event.kind)).toEqual([
      'task.deleted',
      'task.deleted',
    ])
    expect(screen.getByText('0 tasks selected')).toBeTruthy()
    expect(screen.queryByText('Delete 2 selected tasks?')).toBeNull()
    expect(ids).toEqual([])
  })
})
