/** @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
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

describe('WorkspaceRoot Task start date', () => {
  it('sets and clears a Task start date through the existing persisted command path', () => {
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-12T02:20:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    const input = screen.getByLabelText(
      'Start date for Draft experiment plan',
    ) as HTMLInputElement

    fireEvent.change(input, { target: { value: '2026-09-14' } })
    expect(store.getState().tasks[0]?.startDate).toBe('2026-09-14')
    expect(input.value).toBe('2026-09-14')

    fireEvent.change(input, { target: { value: '' } })
    expect(store.getState().tasks[0]).not.toHaveProperty('startDate')
    expect(input.value).toBe('')
    expect(ids).toEqual([])
  })
})
