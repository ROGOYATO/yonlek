/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { BackupDownloadFile } from './browser/backup-download'
import { createProject } from './domain/project'
import { createTask } from './domain/task'
import { createDefaultViewPreferences } from './domain/view-preferences'
import {
  loadViewPreferences,
  saveViewPreferences,
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

describe('BrowserApp backup export', () => {
  it('downloads current workspace and view preferences without mutating persisted state', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const project = createProject({
      id: 'project-1',
      name: 'Robotics Research',
      now: '2026-09-25T09:00:00.000Z',
    })
    const task = createTask({
      id: 'task-1',
      projectId: project.id,
      title: 'Prepare demo',
      now: '2026-09-25T09:05:00.000Z',
    })

    saveWorkspace(storage, {
      projects: [project],
      tasks: [task],
    })
    saveViewPreferences(storage, createDefaultViewPreferences())

    const downloads: BackupDownloadFile[] = []

    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => 'unused-id',
          now: () => '2026-09-25T09:15:30.123Z',
        }}
        backupDownload={(file) => {
          downloads.push(file)
        }}
      />,
    )

    await user.type(screen.getByLabelText('Search tasks'), 'demo')

    const workspaceBefore = loadWorkspace(storage)
    const preferencesBefore = loadViewPreferences(storage)

    await user.click(screen.getByRole('button', { name: 'Export backup' }))

    expect(downloads).toHaveLength(1)
    expect(downloads[0]?.filename).toBe(
      'yonlek-backup-2026-09-25T09-15-30-123Z.json',
    )

    expect(JSON.parse(downloads[0]?.contents ?? '')).toEqual({
      version: 1,
      exportedAt: '2026-09-25T09:15:30.123Z',
      workspace: workspaceBefore,
      viewPreferences: preferencesBefore,
    })

    expect(loadWorkspace(storage)).toEqual(workspaceBefore)
    expect(loadViewPreferences(storage)).toEqual(preferencesBefore)
  })
})
