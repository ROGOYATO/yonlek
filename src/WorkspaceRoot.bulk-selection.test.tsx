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

describe('WorkspaceRoot bulk Task selection', () => {
  it('selects only currently focused and filtered visible active Tasks', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = [
      'project-a',
      'task-alpha',
      'task-beta',
      'project-b',
      'task-gamma',
      'task-archived',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-13T01:30:00.000Z',
    })
    const projectA = commands.addProject('Project A')
    commands.addTask(projectA.id, 'Alpha visible')
    const beta = commands.addTask(projectA.id, 'Beta filtered')
    commands.changeTaskStatus(beta.id, 'doing')
    const projectB = commands.addProject('Project B')
    commands.addTask(projectB.id, 'Gamma other project')
    const archived = commands.addTask(projectA.id, 'Archived task')
    commands.archiveTask(archived.id)

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.selectOptions(screen.getByLabelText('View project'), projectA.id)
    await user.selectOptions(screen.getByLabelText('Filter by status'), 'todo')

    expect(screen.getByLabelText('Select task Alpha visible')).toBeTruthy()
    expect(screen.queryByLabelText('Select task Beta filtered')).toBeNull()
    expect(screen.queryByLabelText('Select task Gamma other project')).toBeNull()
    expect(screen.queryByLabelText('Select task Archived task')).toBeNull()

    await user.click(screen.getByLabelText('Select all visible tasks'))

    expect(
      (screen.getByLabelText('Select task Alpha visible') as HTMLInputElement)
        .checked,
    ).toBe(true)
    expect(screen.getByText('1 task selected')).toBeTruthy()

    await user.click(screen.getByLabelText('Select all visible tasks'))

    expect(
      (screen.getByLabelText('Select task Alpha visible') as HTMLInputElement)
        .checked,
    ).toBe(false)
    expect(screen.getByText('0 tasks selected')).toBeTruthy()
    expect(ids).toEqual([])
  })
})
