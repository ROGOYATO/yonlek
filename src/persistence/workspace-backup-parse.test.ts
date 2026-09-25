import { describe, expect, it } from 'vitest'

import {
  createWorkspaceBackupDocument,
  parseWorkspaceBackup,
  serializeWorkspaceBackup,
} from './workspace-backup'
import { createDefaultViewPreferences } from '../domain/view-preferences'

describe('Workspace backup parsing', () => {
  it('parses a version-1 backup envelope and rejects malformed envelope data', () => {
    const backup = createWorkspaceBackupDocument(
      { projects: [], tasks: [] },
      createDefaultViewPreferences(),
      '2026-09-25T10:00:00.000Z',
    )

    expect(parseWorkspaceBackup(serializeWorkspaceBackup(backup))).toEqual(backup)

    expect(() => parseWorkspaceBackup('{')).toThrow('Workspace backup is invalid')
    expect(() =>
      parseWorkspaceBackup(
        JSON.stringify({ ...backup, version: 2 }),
      ),
    ).toThrow('Workspace backup is invalid')
    expect(() =>
      parseWorkspaceBackup(
        JSON.stringify({ ...backup, exportedAt: '2026-09-25 10:00:00Z' }),
      ),
    ).toThrow('Workspace backup is invalid')
    expect(() =>
      parseWorkspaceBackup(
        JSON.stringify({ ...backup, unexpected: true }),
      ),
    ).toThrow('Workspace backup is invalid')
  })
})
