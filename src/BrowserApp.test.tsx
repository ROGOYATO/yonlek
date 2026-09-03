/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createProject } from './domain/project'
import { createTask } from './domain/task'
import { emptyWorkspace } from './domain/workspace'
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

describe('BrowserApp', () => {
  it('renders workspace state loaded from browser storage', () => {
    const storage = new MemoryStore()
    const project = createProject({
      id: 'project-1',
      name: 'Robotics Research',
      now: '2026-09-03T03:00:00.000Z',
    })
    const task = createTask({
      id: 'task-1',
      projectId: project.id,
      title: 'Draft experiment plan',
      now: '2026-09-03T03:05:00.000Z',
    })

    saveWorkspace(storage, {
      projects: [project],
      tasks: [task],
    })

    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused-id',
          now: () => '2026-09-03T03:10:00.000Z',
        }}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Robotics Research' }),
    ).toBeTruthy()
    expect(screen.getByText('Draft experiment plan')).toBeTruthy()
  })
})


it('shows a readable error when saved workspace data is invalid', () => {
  const storage: KeyValueStore = {
    getItem: () => '{not-json',
    setItem: () => undefined,
  }

  render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-03T05:40:00.000Z',
      }}
    />,
  )

  expect(screen.getByRole('alert').textContent).toContain(
    'Saved workspace could not be loaded.',
  )
})


it('lets a user reset invalid saved workspace data', async () => {
  const user = userEvent.setup()
  const storage = new MemoryStore()
  storage.setItem('workspace-app.workspace', '{not-json')

  render(
    <BrowserApp
      storage={storage}
      runtime={{
        nextId: () => 'unused-id',
        now: () => '2026-09-03T05:45:00.000Z',
      }}
    />,
  )

  await user.click(
    screen.getByRole('button', { name: 'Reset saved workspace' }),
  )

  expect(screen.getByText('No projects yet.')).toBeTruthy()
  expect(loadWorkspace(storage)).toEqual(emptyWorkspace)
})
