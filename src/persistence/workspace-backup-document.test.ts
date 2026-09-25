import { describe, expect, it } from 'vitest'

import { createDefaultViewPreferences } from '../domain/view-preferences'
import { createWorkspaceBackupDocument } from './workspace-backup'

describe('Workspace backup document', () => {
  it('captures versioned workspace and view-preference state at one canonical instant', () => {
    const workspace = {
      projects: [],
      tasks: [],
    }
    const viewPreferences = {
      ...createDefaultViewPreferences(),
      query: 'robotics',
    }

    const backup = createWorkspaceBackupDocument(
      workspace,
      viewPreferences,
      '2026-09-25T09:15:30.123Z',
    )

    expect(backup).toEqual({
      version: 1,
      exportedAt: '2026-09-25T09:15:30.123Z',
      workspace,
      viewPreferences,
    })

    expect(() =>
      createWorkspaceBackupDocument(
        workspace,
        viewPreferences,
        '2026-09-25 09:15:30Z',
      ),
    ).toThrow('Backup export timestamp must be a canonical ISO instant')
  })
})
