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

describe('WorkspaceRoot Timeline view', () => {
  it('renders due-date points chronologically while preserving selected sort order on ties', () => {
    const store = createWorkspaceStore(new MemoryStore())
    const ids = [
      'project-1',
      'task-late',
      'task-early-b',
      'task-undated',
      'task-early-a',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-06T10:20:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const late = commands.addTask(project.id, 'Alpha later')
    const earlyB = commands.addTask(project.id, 'Beta early')
    commands.addTask(project.id, 'Delta unscheduled')
    const earlyA = commands.addTask(project.id, 'Gamma early')
    commands.changeTaskDueDate(late.id, '2026-09-12')
    commands.changeTaskDueDate(earlyB.id, '2026-09-08')
    commands.changeTaskDueDate(earlyA.id, '2026-09-08')

    const initialViewPreferences = updateViewPreferences(
      createDefaultViewPreferences(),
      {
        projectView: project.id,
        sort: 'title',
        viewMode: 'timeline',
      },
    )

    render(
      <WorkspaceRoot
        store={store}
        commands={commands}
        initialViewPreferences={initialViewPreferences}
      />,
    )

    const timeline = screen.getByRole('list', {
      name: 'Task timeline for Robotics Research',
    })
    expect(
      within(timeline)
        .getAllByRole('listitem')
        .map((item) => item.getAttribute('aria-label')),
    ).toEqual([
      '2026-09-08 timeline item Beta early',
      '2026-09-08 timeline item Gamma early',
      '2026-09-12 timeline item Alpha later',
      'No due date timeline item Delta unscheduled',
    ])
    expect(ids).toEqual([])
  })
})
