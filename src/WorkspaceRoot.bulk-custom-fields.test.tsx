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

describe('WorkspaceRoot bulk Custom Field values', () => {
  it('applies and clears one editable Custom Field for selected visible Tasks', () => {
    const store = createWorkspaceStore(new MemoryStore())
    const ids = [
      'field-stage',
      'option-ready',
      'option-blocked',
      'project-1',
      'task-a',
      'task-b',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-10-06T00:50:00.000Z',
    })
    const field = commands.addCustomField('Stage', 'select')
    const ready = commands.addCustomFieldOption(field.id, 'Ready')
    commands.addCustomFieldOption(field.id, 'Blocked')
    const project = commands.addProject('Launch')
    const first = commands.addTask(project.id, 'First')
    const second = commands.addTask(project.id, 'Second')

    render(<WorkspaceRoot store={store} commands={commands} />)

    fireEvent.change(screen.getByLabelText('Bulk custom field'), {
      target: { value: field.id },
    })
    const valueSelect = screen.getByLabelText(
      'Bulk custom field value',
    ) as HTMLSelectElement
    expect(Array.from(valueSelect.options).map((option) => option.text)).toEqual([
      'No selection',
      'Ready',
      'Blocked',
    ])
    fireEvent.change(valueSelect, { target: { value: ready.id } })

    fireEvent.click(screen.getByLabelText('Select all visible tasks'))
    fireEvent.click(
      screen.getByRole('button', { name: 'Apply bulk custom field' }),
    )

    expect(
      store.getState().tasks.map((task) => task.customFieldValues?.[field.id]),
    ).toEqual([ready.id, ready.id])
    expect(screen.getByText('0 tasks selected')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Select all visible tasks'))
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear bulk custom field' }),
    )

    expect(
      store.getState().tasks.every(
        (task) => task.customFieldValues?.[field.id] === undefined,
      ),
    ).toBe(true)
    expect(store.getState().tasks.map((task) => task.id)).toEqual([
      first.id,
      second.id,
    ])
    expect(ids).toEqual([])
  })
})
