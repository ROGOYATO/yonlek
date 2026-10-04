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

describe('WorkspaceRoot bulk Project movement', () => {
  it('moves selected visible Tasks to one Project and clears incompatible Lists', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = [
      'project-source',
      'project-target',
      'list-source',
      'task-alpha',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-10-04T18:40:00.000Z',
    })
    const source = commands.addProject('Source')
    const target = commands.addProject('Target')
    const sourceList = commands.addTaskList(source.id, 'Backlog')
    const task = commands.addTask(source.id, 'Alpha', sourceList.id)

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(screen.getByLabelText('Select task Alpha'))
    await user.selectOptions(screen.getByLabelText('Bulk project'), target.id)
    await user.click(
      screen.getByRole('button', { name: 'Move selected tasks to project' }),
    )

    expect(store.getState().tasks.find((candidate) => candidate.id === task.id)).toEqual(
      expect.objectContaining({
        id: task.id,
        projectId: target.id,
      }),
    )
    expect(
      store.getState().tasks.find((candidate) => candidate.id === task.id)?.listId,
    ).toBeUndefined()
    expect(screen.getByText('0 tasks selected')).toBeTruthy()
    expect(ids).toEqual([])
  })
})
