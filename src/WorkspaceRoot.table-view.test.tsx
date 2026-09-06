/** @vitest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
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

describe('WorkspaceRoot Table view', () => {
  it('renders fixed Task columns in the selected sort order', () => {
    const store = createWorkspaceStore(new MemoryStore())
    const ids = [
      'project-1',
      'list-lab',
      'task-beta',
      'task-alpha',
      'task-done',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-05T23:20:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const list = commands.addTaskList(project.id, 'Lab')
    const beta = commands.addTask(project.id, 'Beta review', list.id)
    commands.addTask(project.id, 'Alpha notes')
    const done = commands.addTask(project.id, 'Publish results', list.id)
    commands.changeTaskStatus(beta.id, 'doing')
    commands.changeTaskPriority(beta.id, 'high')
    commands.changeTaskDueDate(beta.id, '2026-09-12')
    commands.changeTaskStatus(done.id, 'done')
    commands.changeTaskPriority(done.id, 'low')
    commands.changeTaskDueDate(done.id, '2026-09-10')

    const initialViewPreferences = updateViewPreferences(
      createDefaultViewPreferences(),
      {
        projectView: project.id,
        sort: 'title',
        viewMode: 'table',
      },
    )

    render(
      <WorkspaceRoot
        store={store}
        commands={commands}
        initialViewPreferences={initialViewPreferences}
      />,
    )

    const table = screen.getByRole('table', {
      name: 'Task table for Robotics Research',
    })
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent)
    expect(headers).toEqual(['Title', 'Status', 'Priority', 'Due date', 'List'])

    const rows = within(table).getAllByRole('row').slice(1)
    expect(
      rows.map((row) =>
        within(row)
          .getAllByRole('cell')
          .map((cell) => cell.textContent),
      ),
    ).toEqual([
      ['Alpha notes', 'To do', 'Normal', 'No due date', 'No list'],
      ['Beta review', 'Doing', 'High', '2026-09-12', 'Lab'],
      ['Publish results', 'Done', 'Low', '2026-09-10', 'Lab'],
    ])
    expect(ids).toEqual([])
  })
})
