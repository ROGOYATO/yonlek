import { describe, expect, it } from 'vitest'

import { createDefaultViewPreferences } from '../domain/view-preferences'
import {
  createWorkspaceBackupDocument,
  parseWorkspaceBackup,
  serializeWorkspaceBackup,
} from './workspace-backup'

describe('Workspace backup nested validation', () => {
  it('rejects invalid Workspace and View Preferences payloads', () => {
    const backup = createWorkspaceBackupDocument(
      { projects: [], tasks: [] },
      createDefaultViewPreferences(),
      '2026-09-25T10:05:00.000Z',
    )

    expect(() =>
      parseWorkspaceBackup(
        JSON.stringify({
          ...backup,
          workspace: { projects: [] },
        }),
      ),
    ).toThrow('Workspace backup is invalid')

    expect(() =>
      parseWorkspaceBackup(
        JSON.stringify({
          ...backup,
          viewPreferences: {
            ...backup.viewPreferences,
            sort: 'not-a-sort',
          },
        }),
      ),
    ).toThrow('Workspace backup is invalid')
  })

  it('returns the validated nested state for an exported backup', () => {
    const backup = createWorkspaceBackupDocument(
      { projects: [], tasks: [] },
      {
        ...createDefaultViewPreferences(),
        query: 'imported',
      },
      '2026-09-25T10:05:00.000Z',
    )

    expect(parseWorkspaceBackup(serializeWorkspaceBackup(backup))).toEqual(backup)
  })
})
