import { describe, expect, it } from 'vitest'

import { createDefaultViewPreferences } from '../domain/view-preferences'
import {
  createWorkspaceBackupDocument,
  serializeWorkspaceBackup,
} from './workspace-backup'

describe('Workspace backup serialization', () => {
  it('serializes deterministically as readable JSON with one final line feed', () => {
    const backup = createWorkspaceBackupDocument(
      { projects: [], tasks: [] },
      createDefaultViewPreferences(),
      '2026-09-25T09:15:30.123Z',
    )

    const first = serializeWorkspaceBackup(backup)
    const second = serializeWorkspaceBackup(backup)

    expect(second).toBe(first)
    expect(first.endsWith('\n')).toBe(true)
    expect(first.endsWith('\n\n')).toBe(false)
    expect(first).toContain('\n  "version": 1,\n')
    expect(JSON.parse(first)).toEqual(backup)
  })
})
