/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { BrowserApp } from './BrowserApp'
import { createProject } from './domain/project'
import { createTag } from './domain/tag'
import { createTaskList } from './domain/task-list'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from './persistence/workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-09-27T12:00:00.000Z',
})
const list = createTaskList({
  id: 'list-1',
  projectId: project.id,
  name: 'Next',
  now: '2026-09-27T12:01:00.000Z',
})
const tag = createTag({
  id: 'tag-1',
  name: 'Urgent',
  now: '2026-09-27T12:02:00.000Z',
})

function storageWithReferences(): MemoryStore {
  const storage = new MemoryStore()
  saveWorkspace(storage, {
    projects: [project],
    tasks: [],
    lists: [list],
    tags: [tag],
  })
  return storage
}

const runtime = {
  nextId: () => 'automation-1',
  now: () => '2026-09-27T12:30:00.000Z',
}

afterEach(() => {
  cleanup()
})

describe('Browser Automation editor', () => {
  it('creates and edits the current local Automation model', async () => {
    const user = userEvent.setup()
    const storage = storageWithReferences()

    render(<BrowserApp storage={storage} runtime={runtime} />)

    expect(screen.getByRole('heading', { name: 'Automations' })).toBeTruthy()
    await user.type(screen.getByLabelText('New automation name'), 'Active triage')
    await user.selectOptions(
      screen.getByLabelText('New automation trigger'),
      'task.statusChanged',
    )
    await user.click(screen.getByRole('button', { name: 'Add automation' }))

    await user.selectOptions(
      screen.getByLabelText('Condition type for Active triage'),
      'status',
    )
    await user.selectOptions(
      screen.getByLabelText('Condition value for Active triage'),
      'doing',
    )
    await user.click(
      screen.getByRole('button', { name: 'Add condition to Active triage' }),
    )

    await user.selectOptions(
      screen.getByLabelText('Action type for Active triage'),
      'priority.set',
    )
    await user.selectOptions(
      screen.getByLabelText('Action value for Active triage'),
      'high',
    )
    await user.click(
      screen.getByRole('button', { name: 'Add action to Active triage' }),
    )
    await user.selectOptions(
      screen.getByLabelText('Trigger for Active triage'),
      'task.priorityChanged',
    )
    await user.click(screen.getByLabelText('Enabled for Active triage'))

    expect(loadWorkspace(storage).automations).toEqual([
      expect.objectContaining({
        id: 'automation-1',
        name: 'Active triage',
        enabled: false,
        trigger: { kind: 'task.priorityChanged' },
        conditions: [{ kind: 'status', status: 'doing' }],
        actions: [{ kind: 'priority.set', priority: 'high' }],
      }),
    ])
  })

  it('reloads persisted Automation configuration into the editor', async () => {
    const user = userEvent.setup()
    const storage = storageWithReferences()

    const first = render(<BrowserApp storage={storage} runtime={runtime} />)
    await user.type(screen.getByLabelText('New automation name'), 'Reload me')
    await user.click(screen.getByRole('button', { name: 'Add automation' }))
    await user.selectOptions(
      screen.getByLabelText('Action type for Reload me'),
      'task.archive',
    )
    await user.click(
      screen.getByRole('button', { name: 'Add action to Reload me' }),
    )
    first.unmount()

    render(<BrowserApp storage={storage} runtime={runtime} />)

    expect(screen.getByRole('heading', { name: 'Reload me' })).toBeTruthy()
    expect(screen.getByText('Archive Task')).toBeTruthy()
    expect(
      (screen.getByLabelText('Enabled for Reload me') as HTMLInputElement).checked,
    ).toBe(true)
  })
})
