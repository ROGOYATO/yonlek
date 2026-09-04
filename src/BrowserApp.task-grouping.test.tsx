/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createProject } from './domain/project'
import { createTask } from './domain/task'
import { getTaskGroup } from './domain/view-preferences'
import {
  loadViewPreferences,
} from './persistence/view-preferences-storage'
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

describe('BrowserApp task grouping preference', () => {
  it('persists grouping separately from workspace data', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const project = createProject({
      id: 'project-1',
      name: 'Robotics Research',
      now: '2026-09-05T00:20:00.000Z',
    })
    const task = createTask({
      id: 'task-1',
      projectId: project.id,
      title: 'Define protocol',
      now: '2026-09-05T00:21:00.000Z',
    })
    const workspace = { projects: [project], tasks: [task] }

    saveWorkspace(storage, workspace)

    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused-id',
          now: () => '2026-09-05T00:22:00.000Z',
        }}
      />,
    )

    await user.selectOptions(screen.getByLabelText('Group tasks'), 'status')

    expect(getTaskGroup(loadViewPreferences(storage))).toBe('status')
    expect(loadWorkspace(storage)).toEqual(workspace)
  })
})
