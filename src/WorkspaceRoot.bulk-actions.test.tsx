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

describe('WorkspaceRoot bulk Task actions', () => {
  it('applies status, priority, and archive to selected Tasks and clears selection after each action', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-1', 'task-alpha', 'task-beta']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-13T01:40:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const alpha = commands.addTask(project.id, 'Alpha')
    const beta = commands.addTask(project.id, 'Beta')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(screen.getByLabelText('Select all visible tasks'))
    await user.selectOptions(screen.getByLabelText('Bulk status'), 'done')
    await user.click(screen.getByRole('button', { name: 'Apply bulk status' }))

    expect(store.getState().tasks.map((task) => task.status)).toEqual([
      'done',
      'done',
    ])
    expect(screen.getByText('0 tasks selected')).toBeTruthy()

    await user.click(screen.getByLabelText('Select all visible tasks'))
    await user.selectOptions(screen.getByLabelText('Bulk priority'), 'high')
    await user.click(screen.getByRole('button', { name: 'Apply bulk priority' }))

    expect(store.getState().tasks.map((task) => task.priority)).toEqual([
      'high',
      'high',
    ])
    expect(screen.getByText('0 tasks selected')).toBeTruthy()

    await user.click(screen.getByLabelText('Select all visible tasks'))
    await user.click(
      screen.getByRole('button', { name: 'Archive selected tasks' }),
    )

    expect(
      store.getState().tasks.map((task) => [task.id, task.archivedAt]),
    ).toEqual([
      [alpha.id, '2026-09-13T01:40:00.000Z'],
      [beta.id, '2026-09-13T01:40:00.000Z'],
    ])
    expect(screen.getByText('0 tasks selected')).toBeTruthy()
    expect(screen.queryByLabelText('Select task Alpha')).toBeNull()
    expect(screen.queryByLabelText('Select task Beta')).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Restore task Alpha' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Restore task Beta' }),
    ).toBeTruthy()
    expect(ids).toEqual([])
  })
})
