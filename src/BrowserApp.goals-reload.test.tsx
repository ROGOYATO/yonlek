/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { BrowserApp } from './BrowserApp'
import { createGoal } from './domain/goal'
import { saveWorkspace, type KeyValueStore } from './persistence/workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const runtime = {
  nextId: () => 'goal-created',
  now: () => '2026-09-29T11:00:00.000Z',
}

afterEach(() => cleanup())

describe('Browser Goal progress and reload', () => {
  it('renders derived manual progress in the Goal editor', () => {
    const storage = new MemoryStore()
    saveWorkspace(storage, {
      projects: [],
      tasks: [],
      goals: [
        createGoal({
          id: 'goal-manual',
          name: 'Adoption',
          targetType: 'manual',
          targetValue: 100,
          currentValue: 25,
        }),
      ],
    })

    render(<BrowserApp storage={storage} runtime={runtime} />)

    expect(screen.getByText('Progress: 25 / 100 (25%)')).toBeTruthy()
  })

  it('reloads a Goal created through the browser UI from storage version 1', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const first = render(<BrowserApp storage={storage} runtime={runtime} />)

    await user.type(screen.getByLabelText('New Goal name'), 'Reload Goal')
    await user.clear(screen.getByLabelText('New Goal target value'))
    await user.type(screen.getByLabelText('New Goal target value'), '10')
    await user.clear(screen.getByLabelText('New Goal current value'))
    await user.type(screen.getByLabelText('New Goal current value'), '4')
    await user.click(screen.getByRole('button', { name: 'Add Goal' }))
    first.unmount()

    render(<BrowserApp storage={storage} runtime={runtime} />)

    expect(screen.getByRole('heading', { name: 'Reload Goal' })).toBeTruthy()
    expect(
      (screen.getByLabelText('Target value for Reload Goal') as HTMLInputElement).value,
    ).toBe('10')
    expect(
      (screen.getByLabelText('Current value for Reload Goal') as HTMLInputElement).value,
    ).toBe('4')
  })
})
