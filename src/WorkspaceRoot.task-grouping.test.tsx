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

describe('WorkspaceRoot task grouping', () => {
  it('renders non-empty status groups and removes group headings when grouping is cleared', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-1', 'task-todo', 'task-done']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-05T00:30:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft protocol')
    const doneTask = commands.addTask(project.id, 'Review results')
    commands.changeTaskStatus(doneTask.id, 'done')

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(screen.getByLabelText('Group tasks'), 'status')

    const projectHeading = screen.getByRole('heading', {
      name: 'Robotics Research',
    })
    const projectSection = projectHeading.closest('section')
    expect(projectSection).not.toBeNull()
    const projectView = within(projectSection as HTMLElement)

    expect(projectView.getByRole('heading', { name: 'To do' })).toBeTruthy()
    expect(projectView.getByRole('heading', { name: 'Done' })).toBeTruthy()
    expect(projectView.queryByRole('heading', { name: 'Doing' })).toBeNull()
    expect(projectView.getByText('Draft protocol')).toBeTruthy()
    expect(projectView.getByText('Review results')).toBeTruthy()

    await user.selectOptions(screen.getByLabelText('Group tasks'), 'none')

    expect(projectView.queryByRole('heading', { name: 'To do' })).toBeNull()
    expect(projectView.queryByRole('heading', { name: 'Done' })).toBeNull()
  })
})
