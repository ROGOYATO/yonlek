/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createWorkspaceCommands } from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
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

describe('WorkspaceRoot project archive lifecycle', () => {
  it('hides an archived project and restores it without restoring an independently archived task', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-active', 'task-archived']
    const timestamps = [
      '2026-09-04T19:55:00.000Z',
      '2026-09-04T19:56:00.000Z',
      '2026-09-04T19:57:00.000Z',
      '2026-09-04T19:58:00.000Z',
      '2026-09-04T19:59:00.000Z',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => timestamps.shift() ?? 'unexpected-time',
    })
    const project = commands.addProject('Robotics Research')
    commands.addTask(project.id, 'Draft experiment plan')
    const archivedTask = commands.addTask(project.id, 'Retired calibration')
    commands.archiveTask(archivedTask.id)

    render(<WorkspaceRoot store={store} commands={commands} />)

    expect(screen.getByText('1 project · 1 task · 0 done')).toBeTruthy()
    expect(screen.getByText('Draft experiment plan')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Archived tasks' })).toBeTruthy()

    await user.click(
      screen.getByRole('button', { name: 'Archive project Robotics Research' }),
    )

    expect(screen.getByText('0 projects · 0 tasks · 0 done')).toBeTruthy()
    expect(screen.queryByText('Draft experiment plan')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Archived tasks' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Archived projects' })).toBeTruthy()
    expect(store.getState().tasks.find((task) => task.id === archivedTask.id)?.archivedAt).toBe(
      '2026-09-04T19:58:00.000Z',
    )

    await user.click(
      screen.getByRole('button', { name: 'Restore project Robotics Research' }),
    )

    expect(screen.getByText('1 project · 1 task · 0 done')).toBeTruthy()
    expect(screen.getByText('Draft experiment plan')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Archived tasks' })).toBeTruthy()
    expect(screen.getByText('Retired calibration')).toBeTruthy()
    expect(store.getState().tasks.find((task) => task.id === archivedTask.id)?.archivedAt).toBe(
      '2026-09-04T19:58:00.000Z',
    )
  })
})
