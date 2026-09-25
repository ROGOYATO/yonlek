import type { ViewPreferences } from '../domain/view-preferences'
import type { WorkspaceState } from '../domain/workspace'

export const WORKSPACE_BACKUP_VERSION = 1 as const

export interface WorkspaceBackupV1 {
  version: typeof WORKSPACE_BACKUP_VERSION
  exportedAt: string
  workspace: WorkspaceState
  viewPreferences: ViewPreferences
}

function assertCanonicalInstant(value: string): void {
  const instant = new Date(value)

  if (Number.isNaN(instant.getTime()) || instant.toISOString() !== value) {
    throw new Error('Backup export timestamp must be a canonical ISO instant')
  }
}

export function createWorkspaceBackupDocument(
  workspace: WorkspaceState,
  viewPreferences: ViewPreferences,
  exportedAt: string,
): WorkspaceBackupV1 {
  assertCanonicalInstant(exportedAt)

  return {
    version: WORKSPACE_BACKUP_VERSION,
    exportedAt,
    workspace,
    viewPreferences,
  }
}

export function serializeWorkspaceBackup(backup: WorkspaceBackupV1): string {
  return `${JSON.stringify(backup, null, 2)}\n`
}

export function createWorkspaceBackupFilename(exportedAt: string): string {
  assertCanonicalInstant(exportedAt)

  return `yonlek-backup-${exportedAt.replace(/[:.]/g, '-')}.json`
}
