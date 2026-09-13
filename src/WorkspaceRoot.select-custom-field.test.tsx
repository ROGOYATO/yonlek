/** @vitest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
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

describe('WorkspaceRoot Select custom fields', () => {
  it('creates Select fields, manages options, and keeps Task selections stable across option rename', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = [
      'project-1',
      'task-1',
      'field-phase',
      'option-draft',
      'option-review',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-13T12:00:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(screen.getByLabelText('Custom field name'), 'Phase')
    await user.selectOptions(
      screen.getByLabelText('Custom field type'),
      'select',
    )
    await user.click(
      screen.getByRole('button', { name: 'Add custom field' }),
    )

    expect(store.getState().customFields?.[0]).toMatchObject({
      id: 'field-phase',
      name: 'Phase',
      type: 'select',
      options: [],
    })

    const optionInput = screen.getByLabelText(
      'Option name for custom field Phase',
    )
    await user.type(optionInput, 'Draft')
    await user.click(
      screen.getByRole('button', { name: 'Add option to Phase' }),
    )
    await user.type(optionInput, 'Review')
    await user.click(
      screen.getByRole('button', { name: 'Add option to Phase' }),
    )

    const taskSelect = screen.getByLabelText(
      'Custom field Phase for Draft experiment plan',
    ) as HTMLSelectElement
    expect(
      within(taskSelect).getByRole('option', { name: 'Draft' }),
    ).toBeTruthy()
    expect(
      within(taskSelect).getByRole('option', { name: 'Review' }),
    ).toBeTruthy()

    await user.selectOptions(taskSelect, 'option-review')
    expect(store.getState().tasks[0]?.customFieldValues).toEqual({
      'field-phase': 'option-review',
    })

    const reviewName = screen.getByLabelText(
      'Name for option Review in custom field Phase',
    )
    await user.clear(reviewName)
    await user.type(reviewName, 'Ready')
    await user.click(
      screen.getByRole('button', {
        name: 'Save option name Review in Phase',
      }),
    )

    expect(store.getState().customFields?.[0]?.options?.[1]).toEqual({
      id: 'option-review',
      name: 'Ready',
    })
    expect(store.getState().tasks[0]?.customFieldValues).toEqual({
      'field-phase': 'option-review',
    })
    expect(taskSelect.value).toBe('option-review')
    expect(
      within(taskSelect).getByRole('option', { name: 'Ready' }),
    ).toBeTruthy()

    await user.click(
      screen.getByRole('button', {
        name: 'Delete option Ready from Phase',
      }),
    )

    expect(store.getState().tasks[0]).not.toHaveProperty(
      'customFieldValues',
    )
    expect(taskSelect.value).toBe('')
    expect(
      within(taskSelect).queryByRole('option', { name: 'Ready' }),
    ).toBeNull()
    expect(store.getState().tasks[0]?.id).toBe(task.id)
  })
})
