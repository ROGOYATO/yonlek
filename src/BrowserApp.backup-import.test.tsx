/** @vitest-environment jsdom */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { createProject } from './domain/project'
import { createTask } from './domain/task'
import { createDefaultViewPreferences } from './domain/view-preferences'
import {
  loadViewPreferences,
  saveViewPreferences,
} from './persistence/view-preferences-storage'
import {
  createWorkspaceBackupDocument,
  serializeWorkspaceBackup,
} from './persistence/workspace-backup'
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

function createBackupContents() {
  const project = createProject({
    id: 'imported-project',
    name: 'Imported project',
    now: '2026-09-25T10:20:00.000Z',
  })
  const task = createTask({
    id: 'imported-task',
    projectId: project.id,
    title: 'Imported demo',
    now: '2026-09-25T10:21:00.000Z',
  })
  const viewPreferences = {
    ...createDefaultViewPreferences(),
    query: 'imported',
  }

  return {
    workspace: { projects: [project], tasks: [task] },
    viewPreferences,
    contents: serializeWorkspaceBackup(
      createWorkspaceBackupDocument(
        { projects: [project], tasks: [task] },
        viewPreferences,
        '2026-09-25T10:22:00.000Z',
      ),
    ),
  }
}

describe('BrowserApp backup import', () => {
  it('imports Workspace and View Preferences and remounts the current application', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const currentProject = createProject({
      id: 'current-project',
      name: 'Current project',
      now: '2026-09-25T10:00:00.000Z',
    })
    saveWorkspace(storage, { projects: [currentProject], tasks: [] })
    saveViewPreferences(storage, createDefaultViewPreferences())

    const backup = createBackupContents()

    render(
      <BrowserApp
        storage={storage}
        runtime={{
          nextId: () => {
            throw new Error('Import must not consume an id')
          },
          now: () => {
            throw new Error('Import must not consume runtime time')
          },
        }}
        backupRead={async () => backup.contents}
      />,
    )

    await user.upload(
      screen.getByLabelText('Import backup'),
      new File(['ignored'], 'backup.json', { type: 'application/json' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Imported project' }),
    ).not.toBeNull()
    expect(
      screen.queryByRole('heading', { name: 'Current project' }),
    ).toBeNull()
    expect(
      (screen.getByLabelText('Search tasks') as HTMLInputElement).value,
    ).toBe('imported')
    expect(
      screen.getByLabelText('Title for Imported demo'),
    ).not.toBeNull()
    expect(loadWorkspace(storage)).toEqual(backup.workspace)
    expect(loadViewPreferences(storage)).toEqual(backup.viewPreferences)
  })

  it('shows an import error and preserves current state for an invalid backup', async () => {
    const user = userEvent.setup()
    const storage = new MemoryStore()
    const currentProject = createProject({
      id: 'current-project',
      name: 'Current project',
      now: '2026-09-25T10:00:00.000Z',
    })
    const currentWorkspace = { projects: [currentProject], tasks: [] }
    const currentPreferences = createDefaultViewPreferences()
    saveWorkspace(storage, currentWorkspace)
    saveViewPreferences(storage, currentPreferences)

    render(
      <BrowserApp
        storage={storage}
        backupRead={async () => '{not-json'}
      />,
    )

    await user.upload(
      screen.getByLabelText('Import backup'),
      new File(['ignored'], 'broken.json', { type: 'application/json' }),
    )

    const alert = await screen.findByText('Backup could not be imported.')
    expect(alert.getAttribute('role')).toBe('alert')

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Current project' }),
      ).not.toBeNull()
    })
    expect(loadWorkspace(storage)).toEqual(currentWorkspace)
    expect(loadViewPreferences(storage)).toEqual(currentPreferences)
  })
})
