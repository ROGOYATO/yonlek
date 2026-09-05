/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createWorkspaceCommands } from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import {
  createDefaultViewPreferences,
  getTaskFilterSets,
  saveTaskFilterSet,
  updateViewPreferences,
  type ViewPreferences,
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

describe('WorkspaceRoot saved Task filter sets', () => {
  it('applies and deletes a saved filter set without changing Project focus, sort, or grouping', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-1', 'task-camera', 'task-notes']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-05T03:20:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const cameraTask = commands.addTask(project.id, 'Calibrate camera')
    commands.changeTaskStatus(cameraTask.id, 'doing')
    commands.changeTaskPriority(cameraTask.id, 'high')
    commands.addTask(project.id, 'Write notes')

    const saved = saveTaskFilterSet(
      updateViewPreferences(createDefaultViewPreferences(), {
        projectView: project.id,
        query: 'camera',
        status: 'doing',
        priority: 'high',
        dueDate: 'all',
        sort: 'title',
        group: 'status',
      }),
      'Lab review',
    )
    const initialViewPreferences = updateViewPreferences(saved, {
      query: '',
      status: 'all',
      priority: 'all',
      dueDate: 'all',
    })
    let latestPreferences: ViewPreferences = initialViewPreferences

    render(
      <WorkspaceRoot
        store={store}
        commands={commands}
        initialViewPreferences={initialViewPreferences}
        onViewPreferencesChange={(preferences) => {
          latestPreferences = preferences
        }}
      />,
    )

    await user.click(
      screen.getByRole('button', {
        name: 'Apply saved filter set Lab review',
      }),
    )

    expect(
      (screen.getByLabelText('View project') as HTMLSelectElement).value,
    ).toBe(project.id)
    expect((screen.getByLabelText('Search tasks') as HTMLInputElement).value).toBe(
      'camera',
    )
    expect(
      (screen.getByLabelText('Filter by status') as HTMLSelectElement).value,
    ).toBe('doing')
    expect(
      (screen.getByLabelText('Filter by priority') as HTMLSelectElement).value,
    ).toBe('high')
    expect(
      (screen.getByLabelText('Filter by due date') as HTMLSelectElement).value,
    ).toBe('all')
    expect((screen.getByLabelText('Sort tasks') as HTMLSelectElement).value).toBe(
      'title',
    )
    expect((screen.getByLabelText('Group tasks') as HTMLSelectElement).value).toBe(
      'status',
    )
    expect(screen.getByText('Calibrate camera')).toBeTruthy()
    expect(screen.queryByText('Write notes')).toBeNull()

    await user.click(
      screen.getByRole('button', {
        name: 'Delete saved filter set Lab review',
      }),
    )

    expect(
      screen.queryByRole('heading', { name: 'Saved filter sets' }),
    ).toBeNull()
    expect(getTaskFilterSets(latestPreferences)).toEqual([])
    expect(latestPreferences.projectView).toBe(project.id)
    expect(latestPreferences.sort).toBe('title')
    expect(latestPreferences.group).toBe('status')
    expect(ids).toEqual([])
  })
})
