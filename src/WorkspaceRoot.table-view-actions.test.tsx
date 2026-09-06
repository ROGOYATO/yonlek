/** @vitest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
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

describe('WorkspaceRoot Table view Task details', () => {
  it('keeps Task actions, suppresses List grouping, and restores grouping after switching back', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-1', 'task-beta', 'task-alpha', 'task-low']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-05T23:30:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const beta = commands.addTask(project.id, 'Beta review')
    commands.addTask(project.id, 'Alpha notes')
    const low = commands.addTask(project.id, 'Low-priority cleanup')
    commands.changeTaskPriority(beta.id, 'high')
    commands.changeTaskPriority(low.id, 'low')

    const initialViewPreferences = updateViewPreferences(
      createDefaultViewPreferences(),
      {
        projectView: project.id,
        sort: 'title',
        group: 'priority',
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

    const projectHeading = screen.getByRole('heading', {
      name: 'Robotics Research',
    })
    const projectSection = projectHeading.closest('section')
    expect(projectSection).not.toBeNull()
    const projectView = within(projectSection as HTMLElement)

    expect(
      projectView.getByRole('table', { name: 'Task table for Robotics Research' }),
    ).toBeTruthy()
    expect(projectView.queryByRole('heading', { name: 'High' })).toBeNull()
    expect(projectView.queryByRole('heading', { name: 'Normal' })).toBeNull()
    expect(projectView.queryByRole('heading', { name: 'Low' })).toBeNull()
    expect(
      projectView.getByRole('button', { name: 'Duplicate task Alpha notes' }),
    ).toBeTruthy()
    expect(
      projectView.getAllByRole('listitem', { name: /Table task details/ }).map(
        (item) => item.getAttribute('aria-label'),
      ),
    ).toEqual([
      'Table task details Alpha notes',
      'Table task details Beta review',
      'Table task details Low-priority cleanup',
    ])

    await user.selectOptions(screen.getByLabelText('Task view'), 'list')

    expect(
      projectView.queryByRole('table', { name: 'Task table for Robotics Research' }),
    ).toBeNull()
    expect(projectView.getByRole('heading', { name: 'High' })).toBeTruthy()
    expect(projectView.getByRole('heading', { name: 'Normal' })).toBeTruthy()
    expect(projectView.getByRole('heading', { name: 'Low' })).toBeTruthy()
    expect(
      projectView.queryByRole('listitem', { name: /Table task details/ }),
    ).toBeNull()
    expect(ids).toEqual([])
  })
})
