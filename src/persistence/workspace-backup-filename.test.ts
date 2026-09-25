import { describe, expect, it } from 'vitest'

import { createWorkspaceBackupFilename } from './workspace-backup'

describe('Workspace backup filename', () => {
  it('uses the export instant in a deterministic Windows-safe JSON filename', () => {
    expect(
      createWorkspaceBackupFilename('2026-09-25T09:15:30.123Z'),
    ).toBe('yonlek-backup-2026-09-25T09-15-30-123Z.json')

    expect(() =>
      createWorkspaceBackupFilename('2026-09-25 09:15:30Z'),
    ).toThrow('Backup export timestamp must be a canonical ISO instant')
  })
})
