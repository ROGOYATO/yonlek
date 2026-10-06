/** @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createWorkspaceCommands } from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import {
  createDefaultViewPreferences,
  updateViewPreferences,
} from './domain/view-preferences'
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

describe('WorkspaceRoot keyboard-accessible Gantt scheduling', () => {
  it('applies the same explicit range from a focused button and rejects inversion without mutation', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-10-06T00:50:00.000Z',
    })
    const project = commands.addProject('Launch')
    commands.addTask(project.id, 'Keyboard schedule')

    const initialViewPreferences = updateViewPreferences(
      createDefaultViewPreferences(),
      { projectView: project.id, viewMode: 'gantt' },
    )

    render(
      <WorkspaceRoot
        store={store}
        commands={commands}
        initialViewPreferences={initialViewPreferences}
      />,
    )

    const start = screen.getByLabelText(
      'Gantt start for Keyboard schedule',
    ) as HTMLInputElement
    const due = screen.getByLabelText(
      'Gantt due for Keyboard schedule',
    ) as HTMLInputElement
    const apply = screen.getByRole('button', {
      name: 'Apply Gantt schedule for Keyboard schedule',
    })

    fireEvent.change(start, { target: { value: '2026-10-14' } })
    fireEvent.change(due, { target: { value: '2026-10-16' } })
    apply.focus()
    await user.keyboard('{Enter}')

    expect(store.getState().tasks[0]).toMatchObject({
      startDate: '2026-10-14',
      dueDate: '2026-10-16',
    })

    fireEvent.change(start, { target: { value: '2026-10-20' } })
    fireEvent.change(due, { target: { value: '2026-10-19' } })
    apply.focus()
    await user.keyboard('{Enter}')

    expect(screen.getByRole('alert').textContent).toContain(
      'Task due date must not be before start date',
    )
    expect(store.getState().tasks[0]).toMatchObject({
      startDate: '2026-10-14',
      dueDate: '2026-10-16',
    })
    expect(ids).toEqual([])
  })
})
