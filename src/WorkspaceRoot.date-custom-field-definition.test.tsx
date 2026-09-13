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

describe('WorkspaceRoot Date custom field definitions', () => {
  it('creates a Date field without Select option controls', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['field-review-date']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-13T16:00:00.000Z',
    })

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(screen.getByLabelText('Custom field name'), 'Review date')
    await user.selectOptions(
      screen.getByLabelText('Custom field type'),
      'date',
    )
    await user.click(
      screen.getByRole('button', { name: 'Add custom field' }),
    )

    expect(store.getState().customFields?.[0]).toEqual({
      id: 'field-review-date',
      name: 'Review date',
      type: 'date',
      createdAt: '2026-09-13T16:00:00.000Z',
    })
    expect(
      screen.queryByLabelText('Option name for custom field Review date'),
    ).toBeNull()
  })
})
