/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createProject } from './domain/project'
import { createTask } from './domain/task'
import { getSavedTaskViews } from './domain/view-preferences'
import { loadViewPreferences } from './persistence/view-preferences-storage'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from './persistence/workspace-storage'
import { BrowserApp } from './BrowserApp'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('BrowserApp saved Task views', () => {
  it('saves the complete current list view in preferences without changing workspace data', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const project = createProject({
      id: 'project-1',
      name: 'Robotics Research',
      now: '2026-09-05T20:40:00.000Z',
    })
    const task = createTask({
      id: 'task-1',
      projectId: project.id,
      title: 'Calibrate camera',
      now: '2026-09-05T20:41:00.000Z',
    })
    const workspace = { projects: [project], tasks: [task] }

    saveWorkspace(storage, workspace)

    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused-id',
          now: () => '2026-09-05T20:42:00.000Z',
        }}
      />,
    )

    await user.selectOptions(screen.getByLabelText('View project'), project.id)
    await user.type(screen.getByLabelText('Search tasks'), 'camera')
    await user.selectOptions(screen.getByLabelText('Filter by status'), 'doing')
    await user.selectOptions(screen.getByLabelText('Filter by priority'), 'high')
    await user.selectOptions(
      screen.getByLabelText('Filter by due date'),
      'withDueDate',
    )
    await user.selectOptions(screen.getByLabelText('Sort tasks'), 'title')
    await user.selectOptions(screen.getByLabelText('Group tasks'), 'status')
    await user.type(screen.getByLabelText('Saved view name'), 'Camera review')
    await user.click(screen.getByRole('button', { name: 'Save current view' }))

    const preferences = loadViewPreferences(storage)
    expect(getSavedTaskViews(preferences)).toEqual([
      {
        name: 'Camera review',
        projectView: project.id,
        query: 'camera',
        status: 'doing',
        priority: 'high',
        dueDate: 'withDueDate',
        sort: 'title',
        group: 'status',
      },
    ])
    expect(loadWorkspace(storage)).toEqual(workspace)
  })
})
