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

describe('WorkspaceRoot Date custom field Task values', () => {
  it('renders a date input, writes exact dates, and clears with null', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1', 'field-review-date']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-13T17:00:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')
    const field = commands.addCustomField('Review date', 'date')
    commands.changeTaskStartDate(task.id, '2026-09-10')
    commands.changeTaskDueDate(task.id, '2026-09-30')
    commands.changeTaskCustomFieldValue(
      task.id,
      field.id,
      '2026-09-21',
    )

    render(<WorkspaceRoot store={store} commands={commands} />)

    const input = screen.getByLabelText(
      'Custom field Review date for Draft experiment plan',
    ) as HTMLInputElement

    expect(input.type).toBe('date')
    expect(input.value).toBe('2026-09-21')

    fireEvent.change(input, { target: { value: '2026-09-22' } })

    expect(store.getState().tasks[0]?.customFieldValues).toEqual({
      'field-review-date': '2026-09-22',
    })
    expect(store.getState().tasks[0]?.startDate).toBe('2026-09-10')
    expect(store.getState().tasks[0]?.dueDate).toBe('2026-09-30')

    fireEvent.change(input, { target: { value: '' } })

    expect(store.getState().tasks[0]).not.toHaveProperty(
      'customFieldValues',
    )
    expect(store.getState().tasks[0]?.startDate).toBe('2026-09-10')
    expect(store.getState().tasks[0]?.dueDate).toBe('2026-09-30')
  })
})
