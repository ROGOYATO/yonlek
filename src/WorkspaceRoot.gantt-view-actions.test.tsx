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

describe('WorkspaceRoot Gantt view Task details', () => {
  it('keeps Task actions, suppresses List grouping, and restores grouping after switching back', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-1', 'task-beta', 'task-alpha', 'task-low']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-12T02:50:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const beta = commands.addTask(project.id, 'Beta review')
    const alpha = commands.addTask(project.id, 'Alpha notes')
    const low = commands.addTask(project.id, 'Low-priority cleanup')
    commands.changeTaskPriority(beta.id, 'high')
    commands.changeTaskPriority(low.id, 'low')
    commands.changeTaskStartDate(alpha.id, '2026-09-14')
    commands.changeTaskDueDate(alpha.id, '2026-09-16')

    const initialViewPreferences = updateViewPreferences(
      createDefaultViewPreferences(),
      {
        projectView: project.id,
        sort: 'title',
        group: 'priority',
        viewMode: 'gantt',
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
      projectView.getByRole('list', { name: 'Task Gantt for Robotics Research' }),
    ).toBeTruthy()
    expect(
      projectView.getAllByRole('listitem', { name: /Gantt task details/ }).map(
        (item) => item.getAttribute('aria-label'),
      ),
    ).toEqual([
      'Gantt task details Alpha notes',
      'Gantt task details Beta review',
      'Gantt task details Low-priority cleanup',
    ])
    expect(projectView.queryByRole('heading', { name: 'High' })).toBeNull()
    expect(projectView.queryByRole('heading', { name: 'Normal' })).toBeNull()
    expect(projectView.queryByRole('heading', { name: 'Low' })).toBeNull()
    expect(
      projectView.getByRole('button', { name: 'Duplicate task Alpha notes' }),
    ).toBeTruthy()

    await user.selectOptions(screen.getByLabelText('Task view'), 'list')

    expect(
      projectView.queryByRole('list', { name: 'Task Gantt for Robotics Research' }),
    ).toBeNull()
    expect(projectView.getByRole('heading', { name: 'High' })).toBeTruthy()
    expect(projectView.getByRole('heading', { name: 'Normal' })).toBeTruthy()
    expect(projectView.getByRole('heading', { name: 'Low' })).toBeTruthy()
    expect(
      projectView.queryByRole('listitem', { name: /Gantt task details/ }),
    ).toBeNull()
    expect(ids).toEqual([])
  })
})
