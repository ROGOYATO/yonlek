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

describe('WorkspaceRoot filtered Gantt dependencies', () => {
  it('hides dependency edges when a filter removes either endpoint', () => {
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-1', 'task-alpha', 'task-beta', 'relationship-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-10-06T18:30:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const alpha = commands.addTask(project.id, 'Alpha visible')
    const beta = commands.addTask(project.id, 'Beta hidden')
    commands.addTaskRelationship('blocks', alpha.id, beta.id)

    const initialViewPreferences = updateViewPreferences(
      createDefaultViewPreferences(),
      {
        projectView: project.id,
        viewMode: 'gantt',
        query: 'Alpha',
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

    expect(within(gantt).getByText('Alpha visible')).toBeTruthy()
    expect(within(gantt).queryByText('Beta hidden')).toBeNull()
    expect(
      screen.queryByRole('list', {
        name: 'Gantt dependencies for Robotics Research',
      }),
      'filtered endpoint must suppress Gantt dependencies',
    ).toBeNull()
    expect(ids).toEqual([])
  })
})
