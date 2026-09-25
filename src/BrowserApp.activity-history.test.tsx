/** @vitest-environment jsdom */

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { BrowserApp } from './BrowserApp'
import { createProject } from './domain/project'
import { createTask } from './domain/task'
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

describe('BrowserApp Activity history', () => {
  it('keeps the panel lazy and shows persisted deleted-Task history after reload', async () => {
    const storage = new MemoryStore()
    const project = createProject({
      id: 'project-1',
      name: 'Launch',
      now: '2026-09-23T08:00:00.000Z',
    })
    const task = createTask({
      id: 'task-1',
      projectId: project.id,
      title: 'History task',
      now: '2026-09-23T08:05:00.000Z',
    })
    saveWorkspace(storage, { projects: [project], tasks: [task] })

    const user = userEvent.setup()
    const runtime = {
      nextId: () => 'unused',
      now: () => '2026-09-23T09:00:00.000Z',
    }
    const first = render(<BrowserApp storage={storage} runtime={runtime} />)

    expect(screen.queryByRole('list', { name: 'Activity history entries' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Show activity history (0)' })).toBeTruthy()

    await user.click(
      screen.getByRole('button', { name: 'Delete task History task' }),
    )

    expect(loadWorkspace(storage).tasks).toEqual([])
    expect(loadWorkspace(storage).activity).toEqual([
      expect.objectContaining({
        sequence: 1,
        taskId: task.id,
        taskTitle: task.title,
        event: { kind: 'task.deleted' },
      }),
    ])

    first.unmount()
    const second = render(<BrowserApp storage={storage} runtime={runtime} />)

    expect(screen.queryByRole('list', { name: 'Activity history entries' })).toBeNull()
    await user.click(
      screen.getByRole('button', { name: 'Show activity history (1)' }),
    )

    const list = screen.getByRole('list', { name: 'Activity history entries' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(items[0]?.textContent).toContain('Deleted “History task”')
    expect(
      list.querySelector('time[datetime="2026-09-23T09:00:00.000Z"]'),
    ).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Hide activity history' }))
    expect(screen.queryByRole('list', { name: 'Activity history entries' })).toBeNull()

    second.unmount()
  })
})
