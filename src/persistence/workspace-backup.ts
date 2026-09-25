import type { ViewPreferences } from '../domain/view-preferences'
import type { WorkspaceState } from '../domain/workspace'
import {
  loadViewPreferences,
  saveViewPreferences,
} from './view-preferences-storage'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from './workspace-storage'

export const WORKSPACE_BACKUP_VERSION = 1 as const

export interface WorkspaceBackupV1 {
  version: typeof WORKSPACE_BACKUP_VERSION
  exportedAt: string
  workspace: WorkspaceState
  viewPreferences: ViewPreferences
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const allowed = new Set(keys)
  return Object.keys(value).every((key) => allowed.has(key))
}

function isCanonicalInstant(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const instant = new Date(value)
  return !Number.isNaN(instant.getTime()) && instant.toISOString() === value
}

function assertCanonicalInstant(value: string): void {
  if (!isCanonicalInstant(value)) {
    throw new Error('Backup export timestamp must be a canonical ISO instant')
  }
}

function invalidBackup(): never {
  throw new Error('Workspace backup is invalid')
}

function createReadOnlyStore(raw: string): KeyValueStore {
  return {
    getItem() {
      return raw
    },
    setItem() {
      throw new Error('Validation store is read-only')
    },
  }
}

function validateWorkspace(value: unknown): WorkspaceState {
  try {
    return loadWorkspace(
      createReadOnlyStore(
        JSON.stringify({
          version: 1,
          workspace: value,
        }),
      ),
    )
  } catch {
    invalidBackup()
  }
}

function validateViewPreferences(value: unknown): ViewPreferences {
  const preferences = loadViewPreferences(
    createReadOnlyStore(
      JSON.stringify({
        version: 1,
        preferences: value,
      }),
    ),
  )

  if (JSON.stringify(preferences) !== JSON.stringify(value)) {
    invalidBackup()
  }

  return preferences
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

export function parseWorkspaceBackup(contents: string): WorkspaceBackupV1 {
  let document: unknown

  try {
    document = JSON.parse(contents)
  } catch {
    invalidBackup()
  }

  if (
    !isRecord(document) ||
    !hasOnlyKeys(document, [
      'version',
      'exportedAt',
      'workspace',
      'viewPreferences',
    ]) ||
    document.version !== WORKSPACE_BACKUP_VERSION ||
    !isCanonicalInstant(document.exportedAt)
  ) {
    invalidBackup()
  }

  return {
    version: WORKSPACE_BACKUP_VERSION,
    exportedAt: document.exportedAt,
    workspace: validateWorkspace(document.workspace),
    viewPreferences: validateViewPreferences(document.viewPreferences),
  }
}


export function importWorkspaceBackup(
  storage: KeyValueStore,
  contents: string,
): WorkspaceBackupV1 {
  const backup = parseWorkspaceBackup(contents)
  const previousWorkspace = loadWorkspace(storage)
  const previousViewPreferences = loadViewPreferences(storage)

  try {
    saveWorkspace(storage, backup.workspace)
    saveViewPreferences(storage, backup.viewPreferences)
  } catch {
    try {
      saveWorkspace(storage, previousWorkspace)
      saveViewPreferences(storage, previousViewPreferences)
    } catch {
      // Keep the original import failure as the public error.
    }

    throw new Error('Workspace backup could not be imported')
  }

  return backup
}
