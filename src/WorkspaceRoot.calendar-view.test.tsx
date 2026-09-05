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

describe('WorkspaceRoot Calendar view', () => {
  it('renders chronological due-date sections with existing Task actions and restores List grouping when switched back', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = [
      'project-1',
      'task-beta',
      'task-late',
      'task-undated',
      'task-alpha',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-05T22:10:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const beta = commands.addTask(project.id, 'Beta prep')
    const late = commands.addTask(project.id, 'Late review')
    commands.addTask(project.id, 'Backlog note')
    const alpha = commands.addTask(project.id, 'Alpha prep')
    commands.changeTaskDueDate(beta.id, '2026-09-08')
    commands.changeTaskDueDate(late.id, '2026-09-12')
    commands.changeTaskDueDate(alpha.id, '2026-09-08')
    commands.changeTaskPriority(beta.id, 'high')
    commands.changeTaskPriority(alpha.id, 'low')
    commands.changeTaskPriority(late.id, 'high')

    const initialViewPreferences = updateViewPreferences(
      createDefaultViewPreferences(),
      {
        projectView: project.id,
        sort: 'title',
        group: 'priority',
        viewMode: 'calendar',
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

    expect(projectView.getByRole('heading', { name: '2026-09-08' })).toBeTruthy()
    expect(projectView.getByRole('heading', { name: '2026-09-12' })).toBeTruthy()
    expect(projectView.getByRole('heading', { name: 'No due date' })).toBeTruthy()
    expect(projectView.queryByRole('heading', { name: 'High' })).toBeNull()
    expect(projectView.queryByRole('heading', { name: 'Normal' })).toBeNull()
    expect(projectView.queryByRole('heading', { name: 'Low' })).toBeNull()

    const calendarTasks = projectView.getAllByRole('listitem', {
      name: /calendar task/,
    })
    expect(calendarTasks.map((item) => item.getAttribute('aria-label'))).toEqual([
      '2026-09-08 calendar task Alpha prep',
      '2026-09-08 calendar task Beta prep',
      '2026-09-12 calendar task Late review',
      'No due date calendar task Backlog note',
    ])
    expect(
      projectView.getByRole('button', { name: 'Duplicate task Alpha prep' }),
    ).toBeTruthy()

    await user.selectOptions(screen.getByLabelText('Task view'), 'list')

    expect(
      projectView.queryByRole('listitem', { name: /calendar task/ }),
    ).toBeNull()
    expect(projectView.getByRole('heading', { name: 'High' })).toBeTruthy()
    expect(projectView.getByRole('heading', { name: 'Normal' })).toBeTruthy()
    expect(projectView.getByRole('heading', { name: 'Low' })).toBeTruthy()
    expect(ids).toEqual([])
  })
})
