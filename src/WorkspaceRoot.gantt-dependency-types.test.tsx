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

describe('WorkspaceRoot Gantt dependency relationship types', () => {
  it('renders only Blocks relationships as Gantt dependencies', () => {
    const store = createWorkspaceStore(new MemoryStore())
    const ids = [
      'project-1',
      'task-alpha',
      'task-beta',
      'task-gamma',
      'relationship-blocks',
      'relationship-related',
      'relationship-duplicates',
      'relationship-references',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-10-06T18:40:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const alpha = commands.addTask(project.id, 'Alpha')
    const beta = commands.addTask(project.id, 'Beta')
    const gamma = commands.addTask(project.id, 'Gamma')
    commands.addTaskRelationship('blocks', alpha.id, beta.id)
    commands.addTaskRelationship('related', alpha.id, gamma.id)
    commands.addTaskRelationship('duplicates', beta.id, gamma.id)
    commands.addTaskRelationship('references', gamma.id, alpha.id)

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
    ).toEqual(['Gantt dependency Alpha blocks Beta'])
    expect(ids).toEqual([])
  })
})
