/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { createWorkspaceCommands } from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import { WorkspaceRoot } from './WorkspaceRoot'
import type { KeyValueStore } from './persistence/workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

function setup() {
  const store = createWorkspaceStore(new MemoryStore())
  const commands = createWorkspaceCommands(store, {
    nextId: () => 'goal-1',
    now: () => '2026-09-29T10:00:00.000Z',
  })

  render(<WorkspaceRoot store={store} commands={commands} />)
  return { store }
}

afterEach(() => cleanup())

describe('WorkspaceRoot Goals CRUD', () => {
  it('creates and edits a manual Goal from the Goals panel', async () => {
    const user = userEvent.setup()
    const { store } = setup()

    expect(screen.getByRole('heading', { name: 'Goals' })).toBeTruthy()
    await user.type(screen.getByLabelText('New Goal name'), 'Adoption')
    await user.clear(screen.getByLabelText('New Goal target value'))
    await user.type(screen.getByLabelText('New Goal target value'), '100')
    await user.clear(screen.getByLabelText('New Goal current value'))
    await user.type(screen.getByLabelText('New Goal current value'), '25')
    await user.click(screen.getByRole('button', { name: 'Add Goal' }))

    await user.clear(screen.getByLabelText('Goal name for Adoption'))
    await user.type(screen.getByLabelText('Goal name for Adoption'), 'Launch adoption')
    await user.click(screen.getByRole('button', { name: 'Rename Adoption' }))

    await user.type(
      screen.getByLabelText('Goal description for Launch adoption'),
      'First cohort',
    )
    await user.click(
      screen.getByRole('button', { name: 'Save description for Launch adoption' }),
    )

    await user.clear(screen.getByLabelText('Target value for Launch adoption'))
    await user.type(screen.getByLabelText('Target value for Launch adoption'), '120')
    await user.clear(screen.getByLabelText('Current value for Launch adoption'))
    await user.type(screen.getByLabelText('Current value for Launch adoption'), '40')
    await user.click(
      screen.getByRole('button', { name: 'Save values for Launch adoption' }),
    )

    expect(store.getState().goals?.[0]).toMatchObject({
      name: 'Launch adoption',
      description: 'First cohort',
      targetValue: 120,
      currentValue: 40,
    })
  })

  it('deletes an existing Goal from the Goals panel', async () => {
    const user = userEvent.setup()
    const { store } = setup()

    await user.type(screen.getByLabelText('New Goal name'), 'Temporary Goal')
    await user.click(screen.getByRole('button', { name: 'Add Goal' }))
    await user.click(screen.getByRole('button', { name: 'Delete Temporary Goal' }))

    expect(store.getState()).not.toHaveProperty('goals')
  })
})
