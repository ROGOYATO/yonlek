/** @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
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

describe('WorkspaceRoot bulk Task dates', () => {
  it('sets and clears due/start dates for selected visible Tasks', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-1', 'task-alpha', 'task-beta']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-10-05T10:00:00.000Z',
    })
    const project = commands.addProject('Launch')
    commands.addTask(project.id, 'Alpha')
    commands.addTask(project.id, 'Beta')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(screen.getByLabelText('Select all visible tasks'))
    fireEvent.change(screen.getByLabelText('Bulk due date'), {
      target: { value: '2026-10-20' },
    })
    await user.click(
      screen.getByRole('button', { name: 'Apply bulk due date' }),
    )
    expect(store.getState().tasks.map((task) => task.dueDate)).toEqual([
      '2026-10-20',
      '2026-10-20',
    ])

    await user.click(screen.getByLabelText('Select all visible tasks'))
    fireEvent.change(screen.getByLabelText('Bulk start date'), {
      target: { value: '2026-10-10' },
    })
    await user.click(
      screen.getByRole('button', { name: 'Apply bulk start date' }),
    )
    expect(store.getState().tasks.map((task) => task.startDate)).toEqual([
      '2026-10-10',
      '2026-10-10',
    ])

    await user.click(screen.getByLabelText('Select all visible tasks'))
    await user.click(
      screen.getByRole('button', { name: 'Clear bulk due date' }),
    )
    expect(store.getState().tasks.map((task) => task.dueDate)).toEqual([
      undefined,
      undefined,
    ])

    await user.click(screen.getByLabelText('Select all visible tasks'))
    await user.click(
      screen.getByRole('button', { name: 'Clear bulk start date' }),
    )
    expect(store.getState().tasks.map((task) => task.startDate)).toEqual([
      undefined,
      undefined,
    ])
    expect(screen.getByText('0 tasks selected')).toBeTruthy()
    expect(ids).toEqual([])
  })
})
