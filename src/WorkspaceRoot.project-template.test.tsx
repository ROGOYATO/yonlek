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

describe('WorkspaceRoot project templates', () => {
  it('saves an active project as a template, creates a fresh project from it, and deletes the template', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = [
      'project-source',
      'list-source',
      'task-source',
      'template-1',
      'project-new',
      'list-new',
      'task-new',
    ]
    const times = [
      '2026-09-04T21:30:00.000Z',
      '2026-09-04T21:31:00.000Z',
      '2026-09-04T21:32:00.000Z',
      '2026-09-04T21:33:00.000Z',
      '2026-09-04T21:34:00.000Z',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => times.shift() ?? 'unexpected-time',
    })
    const project = commands.addProject('Robotics Research')
    const list = commands.addTaskList(project.id, 'Experiments')
    commands.addTask(project.id, 'Define protocol', list.id)

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(
      screen.getByRole('button', {
        name: 'Save project as template Robotics Research',
      }),
    )

    expect(
      screen.getByRole('heading', { name: 'Project templates' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', {
        name: 'Create project from template Robotics Research',
      }),
    ).toBeTruthy()

    await user.click(
      screen.getByRole('button', {
        name: 'Create project from template Robotics Research',
      }),
    )

    expect(
      screen.getAllByRole('heading', { name: 'Robotics Research' }),
    ).toHaveLength(2)
    expect(screen.getAllByText('Define protocol')).toHaveLength(2)

    await user.click(
      screen.getByRole('button', {
        name: 'Delete project template Robotics Research',
      }),
    )

    expect(
      screen.queryByRole('heading', { name: 'Project templates' }),
    ).toBeNull()
    expect(store.getState().projectTemplates).toBeUndefined()
    expect(ids).toEqual([])
    expect(times).toEqual([])
  })
})
