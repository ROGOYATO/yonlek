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

describe('WorkspaceRoot bulk List movement', () => {
  it('offers compatible Lists for one Project and only clearing across Projects', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = [
      'project-a',
      'project-b',
      'list-a1',
      'list-a2',
      'list-b',
      'task-a1',
      'task-a2',
      'task-b',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-10-04T18:50:00.000Z',
    })
    const projectA = commands.addProject('Project A')
    const projectB = commands.addProject('Project B')
    const listA1 = commands.addTaskList(projectA.id, 'A backlog')
    const listA2 = commands.addTaskList(projectA.id, 'A doing')
    const listB = commands.addTaskList(projectB.id, 'B backlog')
    const first = commands.addTask(projectA.id, 'A first', listA1.id)
    const second = commands.addTask(projectA.id, 'A second')
    const other = commands.addTask(projectB.id, 'B task', listB.id)

    render(<WorkspaceRoot store={store} commands={commands} />)

    await user.click(screen.getByLabelText('Select task A first'))
    await user.click(screen.getByLabelText('Select task A second'))

    const listSelect = screen.getByLabelText('Bulk list') as HTMLSelectElement
    expect(Array.from(listSelect.options).map((option) => option.text)).toEqual([
      'No list',
      'A backlog',
      'A doing',
    ])

    await user.selectOptions(listSelect, listA2.id)
    await user.click(screen.getByRole('button', { name: 'Apply bulk list' }))

    expect(
      store.getState().tasks
        .filter((task) => task.projectId === projectA.id)
        .map((task) => [task.id, task.listId]),
    ).toEqual([
      [first.id, listA2.id],
      [second.id, listA2.id],
    ])
    expect(screen.getByText('0 tasks selected')).toBeTruthy()

    await user.click(screen.getByLabelText('Select task A first'))
    await user.click(screen.getByLabelText('Select task B task'))

    const crossProjectSelect = screen.getByLabelText('Bulk list') as HTMLSelectElement
    expect(Array.from(crossProjectSelect.options).map((option) => option.text)).toEqual([
      'No list',
    ])
    expect(screen.getByText('Only list clearing is available across projects.')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Apply bulk list' }))

    expect(
      store.getState().tasks.find((task) => task.id === first.id)?.listId,
    ).toBeUndefined()
    expect(
      store.getState().tasks.find((task) => task.id === other.id)?.listId,
    ).toBeUndefined()
    expect(ids).toEqual([])
  })
})
