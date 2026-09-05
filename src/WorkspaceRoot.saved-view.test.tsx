/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createWorkspaceCommands } from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import {
  createDefaultViewPreferences,
  getSavedTaskViews,
  saveTaskView,
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

describe('WorkspaceRoot saved Task views', () => {
  it('applies and deletes a saved view with Project focus, filters, sort, and grouping', async () => {
    const user = userEvent.setup()
    const store = createWorkspaceStore(new MemoryStore())
    const ids = ['project-camera', 'project-notes', 'task-camera', 'task-notes']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-05T20:50:00.000Z',
    })
    const cameraProject = commands.addProject('Camera Research')
    const notesProject = commands.addProject('Notes')
    const cameraTask = commands.addTask(cameraProject.id, 'Calibrate camera')
    commands.changeTaskStatus(cameraTask.id, 'doing')
    commands.changeTaskPriority(cameraTask.id, 'high')
    commands.addTask(notesProject.id, 'Write notes')

    const saved = saveTaskView(
      updateViewPreferences(createDefaultViewPreferences(), {
        projectView: cameraProject.id,
        query: 'camera',
        status: 'doing',
        priority: 'high',
        dueDate: 'all',
        sort: 'title',
        group: 'status',
      }),
      'Camera review',
    )
    const initialViewPreferences = updateViewPreferences(saved, {
      projectView: notesProject.id,
      query: '',
      status: 'all',
      priority: 'all',
      dueDate: 'all',
      sort: 'created',
      group: 'none',
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
        name: 'Apply saved view Camera review',
      }),
    )

    expect(
      (screen.getByLabelText('View project') as HTMLSelectElement).value,
    ).toBe(cameraProject.id)
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
        name: 'Delete saved view Camera review',
      }),
    )

    expect(screen.queryByRole('heading', { name: 'Saved views' })).toBeNull()
    expect(getSavedTaskViews(latestPreferences)).toEqual([])
    expect(latestPreferences.projectView).toBe(cameraProject.id)
    expect(latestPreferences.query).toBe('camera')
    expect(latestPreferences.sort).toBe('title')
    expect(latestPreferences.group).toBe('status')
    expect(ids).toEqual([])
  })
})
