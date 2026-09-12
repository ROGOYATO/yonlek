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

describe('WorkspaceRoot Gantt view', () => {
  it('renders every incoming Task row and marks only complete date ranges scheduled', () => {
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-1', 'task-a', 'task-b', 'task-c', 'task-d']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-12T02:40:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const alpha = commands.addTask(project.id, 'Alpha scheduled')
    const beta = commands.addTask(project.id, 'Beta missing start')
    const gamma = commands.addTask(project.id, 'Gamma missing due')
    commands.addTask(project.id, 'Delta unscheduled')
    commands.changeTaskStartDate(alpha.id, '2026-09-14')
    commands.changeTaskDueDate(alpha.id, '2026-09-16')
    commands.changeTaskDueDate(beta.id, '2026-09-17')
    commands.changeTaskStartDate(gamma.id, '2026-09-18')

    const initialViewPreferences = updateViewPreferences(
      createDefaultViewPreferences(),
      {
        projectView: project.id,
        sort: 'title',
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

    const gantt = screen.getByRole('list', {
      name: 'Task Gantt for Robotics Research',
    })
    expect(
      within(gantt)
        .getAllByRole('listitem')
        .map((item) => item.getAttribute('aria-label')),
    ).toEqual([
      '2026-09-14 to 2026-09-16 Gantt item Alpha scheduled',
      'Unscheduled Gantt item Beta missing start',
      'Unscheduled Gantt item Delta unscheduled',
      'Unscheduled Gantt item Gamma missing due',
    ])
    expect(within(gantt).getAllByText('Unscheduled')).toHaveLength(3)
    expect(ids).toEqual([])
  })
})
