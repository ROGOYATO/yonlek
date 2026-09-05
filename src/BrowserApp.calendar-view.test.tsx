/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createProject } from './domain/project'
import { createTask } from './domain/task'
import { getTaskViewMode } from './domain/view-preferences'
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

describe('BrowserApp Calendar Task view preference', () => {
  it('persists Calendar mode separately from workspace data', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const project = createProject({
      id: 'project-1',
      name: 'Robotics Research',
      now: '2026-09-05T21:50:00.000Z',
    })
    const task = createTask({
      id: 'task-1',
      projectId: project.id,
      title: 'Schedule field test',
      now: '2026-09-05T21:51:00.000Z',
    })
    const workspace = { projects: [project], tasks: [task] }

    saveWorkspace(storage, workspace)

    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused-id',
          now: () => '2026-09-05T21:52:00.000Z',
        }}
      />,
    )

    await user.selectOptions(screen.getByLabelText('Task view'), 'calendar')

    expect(getTaskViewMode(loadViewPreferences(storage))).toBe('calendar')
    expect(loadWorkspace(storage)).toEqual(workspace)
  })
})
