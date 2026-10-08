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

describe('WorkspaceRoot Gantt dependency lines', () => {
  it('renders a directional Blocks dependency from source Task to target Task', () => {
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-1', 'task-plan', 'task-run', 'relationship-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-10-06T18:20:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const plan = commands.addTask(project.id, 'Plan experiment')
    const run = commands.addTask(project.id, 'Run experiment')
    commands.addTaskRelationship('blocks', plan.id, run.id)

    const initialViewPreferences = updateViewPreferences(
      createDefaultViewPreferences(),
      {
        projectView: project.id,
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

    const dependencies = screen.getByRole('list', {
      name: 'Gantt dependencies for Robotics Research',
    })
    expect(
      within(dependencies)
        .getAllByRole('listitem')
        .map((item) => item.getAttribute('aria-label')),
    ).toEqual(['Gantt dependency Plan experiment blocks Run experiment'])
    expect(
      within(dependencies).getByText('Plan experiment blocks Run experiment'),
    ).toBeTruthy()
    expect(ids).toEqual([])
  })
})
