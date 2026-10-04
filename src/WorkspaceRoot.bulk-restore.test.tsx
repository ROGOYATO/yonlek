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

describe('WorkspaceRoot bulk Task restore', () => {
  it('selects visible archived roots, restores them in one bulk action, and clears the archived selection', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-1', 'task-alpha', 'task-beta']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-10-04T17:20:00.000Z',
    })
    const project = commands.addProject('Launch')
    const alpha = commands.addTask(project.id, 'Alpha')
    const beta = commands.addTask(project.id, 'Beta')
    commands.archiveTasks([alpha.id, beta.id])

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(screen.getByLabelText('Select all archived tasks'))
    expect(screen.getByText('2 archived tasks selected')).toBeTruthy()

    await user.click(
      screen.getByRole('button', { name: 'Restore selected archived tasks' }),
    )

    expect(store.getState().tasks.map((task) => task.archivedAt)).toEqual([
      undefined,
      undefined,
    ])
    expect(screen.queryByText('Archived tasks')).toBeNull()
    expect(screen.getByText('0 archived tasks selected')).toBeTruthy()
    expect(screen.getByLabelText('Select task Alpha')).toBeTruthy()
    expect(screen.getByLabelText('Select task Beta')).toBeTruthy()
    expect(ids).toEqual([])
  })
})
