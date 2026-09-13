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

describe('WorkspaceRoot Formula custom fields', () => {
  it('creates and configures a Formula field and renders a read-only computed Task result', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = [
      'project-1',
      'task-1',
      'field-left',
      'field-right',
      'field-total',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-13T12:00:00.000Z',
    })
    const project = commands.addProject('Research')
    const task = commands.addTask(project.id, 'Score task')
    const left = commands.addCustomField('Left', 'number')
    const right = commands.addCustomField('Right', 'number')
    commands.changeTaskCustomFieldValue(task.id, left.id, 2)
    commands.changeTaskCustomFieldValue(task.id, right.id, 3)

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.type(screen.getByLabelText('Custom field name'), 'Total')
    await user.selectOptions(
      screen.getByLabelText('Custom field type'),
      'formula',
    )
    await user.click(screen.getByRole('button', { name: 'Add custom field' }))

    const total = store.getState().customFields?.find(
      (field) => field.name === 'Total',
    )
    expect(total).toMatchObject({
      id: 'field-total',
      type: 'formula',
    })
    expect(total).not.toHaveProperty('formula')

    const leftOperand = screen.getByLabelText(
      'Left operand for formula Total',
    ) as HTMLSelectElement
    const rightOperand = screen.getByLabelText(
      'Right operand for formula Total',
    ) as HTMLSelectElement
    const operator = screen.getByLabelText(
      'Operator for formula Total',
    ) as HTMLSelectElement

    expect(within(leftOperand).getByRole('option', { name: 'Left' })).toBeTruthy()
    expect(within(leftOperand).getByRole('option', { name: 'Right' })).toBeTruthy()
    expect(within(leftOperand).queryByRole('option', { name: 'Total' })).toBeNull()

    await user.selectOptions(leftOperand, left.id)
    await user.selectOptions(operator, '*')
    await user.selectOptions(rightOperand, right.id)
    await user.click(
      screen.getByRole('button', { name: 'Configure formula Total' }),
    )

    expect(store.getState().customFields?.find(
      (field) => field.id === 'field-total',
    )?.formula).toEqual({
      leftFieldId: left.id,
      operator: '*',
      rightFieldId: right.id,
    })

    const result = screen.getByLabelText(
      'Custom field Total for Score task',
    )
    expect(result.tagName).toBe('OUTPUT')
    expect(result.textContent).toBe('6')
    expect(store.getState().tasks[0]?.customFieldValues).toEqual({
      [left.id]: 2,
      [right.id]: 3,
    })

    const leftInput = screen.getByLabelText(
      'Custom field Left for Score task',
    ) as HTMLInputElement
    await user.clear(leftInput)
    await user.type(leftInput, '4')
    expect(result.textContent).toBe('12')

    const filterSelect = screen.getByLabelText(
      'Custom field filter',
    ) as HTMLSelectElement
    const sortSelect = screen.getByLabelText('Sort tasks') as HTMLSelectElement
    expect(within(filterSelect).queryByRole('option', { name: 'Total' })).toBeNull()
    expect(
      within(sortSelect).queryByRole('option', {
        name: 'Custom field: Total',
      }),
    ).toBeNull()

    await user.click(
      screen.getByRole('button', { name: 'Clear formula Total' }),
    )
    expect(store.getState().customFields?.find(
      (field) => field.id === 'field-total',
    )).not.toHaveProperty('formula')
    expect(result.textContent).toBe('Unavailable')
  })
})
