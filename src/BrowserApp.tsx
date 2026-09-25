import { useRef, useState } from 'react'

import {
  createWorkspaceCommands,
  type WorkspaceRuntime,
} from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import {
  createDefaultViewPreferences,
  updateViewPreferences,
  type ViewPreferences,
} from './domain/view-preferences'
import {
  loadViewPreferences,
  saveViewPreferences,
} from './persistence/view-preferences-storage'
import { saveWorkspace, type KeyValueStore } from './persistence/workspace-storage'
import {
  createWorkspaceBackupDocument,
  createWorkspaceBackupFilename,
  serializeWorkspaceBackup,
} from './persistence/workspace-backup'
import {
  downloadBackupText,
  type BackupDownloadHandler,
} from './browser/backup-download'
import { emptyWorkspace } from './domain/workspace'
import { WorkspaceRoot } from './WorkspaceRoot'

export interface BrowserAppProps {
  storage?: KeyValueStore
  runtime?: WorkspaceRuntime
  backupDownload?: BackupDownloadHandler
}

const defaultRuntime: WorkspaceRuntime = {
  nextId: () => globalThis.crypto.randomUUID(),
  now: () => new Date().toISOString(),
}

const defaultBackupDownload: BackupDownloadHandler = (file) => {
  downloadBackupText(file)
}

function persistViewPreferences(
  storage: KeyValueStore,
  preferences: ViewPreferences,
): void {
  try {
    saveViewPreferences(storage, preferences)
  } catch {
    // View preferences are non-critical. Keep the current UI usable.
  }
}

function createBrowserApplication(
  storage: KeyValueStore,
  runtime: WorkspaceRuntime,
) {
  try {
    const store = createWorkspaceStore(storage)
    const commands = createWorkspaceCommands(store, runtime)
    const savedViewPreferences = loadViewPreferences(storage)
    const projectFocusExists =
      savedViewPreferences.projectView === 'all' ||
      store
        .getState()
        .projects.some(
          (project) => project.id === savedViewPreferences.projectView,
        )
    const viewPreferences = projectFocusExists
      ? savedViewPreferences
      : updateViewPreferences(savedViewPreferences, { projectView: 'all' })

    if (viewPreferences !== savedViewPreferences) {
      persistViewPreferences(storage, viewPreferences)
    }

    return { store, commands, viewPreferences, error: null }
  } catch {
    return {
      store: null,
      commands: null,
      error: 'Saved workspace could not be loaded.',
    }
  }
}

export function BrowserApp({
  storage = globalThis.localStorage,
  runtime = defaultRuntime,
  backupDownload = defaultBackupDownload,
}: BrowserAppProps) {
  const [application, setApplication] = useState(() =>
    createBrowserApplication(storage, runtime),
  )
  const viewPreferencesRef = useRef<ViewPreferences>(
    application.viewPreferences ?? createDefaultViewPreferences(),
  )

  if (
    application.error ||
    !application.store ||
    !application.commands ||
    !application.viewPreferences
  ) {
    return (
      <main>
        <h1>Yönlek</h1>
        <p role="alert">{application.error}</p>
        <button
          type="button"
          onClick={() => {
            saveWorkspace(storage, emptyWorkspace)
            const preferences = createDefaultViewPreferences()
            persistViewPreferences(storage, preferences)
            viewPreferencesRef.current = preferences
            setApplication(createBrowserApplication(storage, runtime))
          }}
        >
          Reset saved workspace
        </button>
      </main>
    )
  }

  return (
    <>
      <div>
        <button
          type="button"
          onClick={() => {
            const exportedAt = runtime.now()
            const backup = createWorkspaceBackupDocument(
              application.store.getState(),
              viewPreferencesRef.current,
              exportedAt,
            )

            backupDownload({
              filename: createWorkspaceBackupFilename(exportedAt),
              contents: serializeWorkspaceBackup(backup),
            })
          }}
        >
          Export backup
        </button>
      </div>

      <WorkspaceRoot
        store={application.store}
        commands={application.commands}
        initialViewPreferences={application.viewPreferences as ViewPreferences}
        onViewPreferencesChange={(preferences) => {
          persistViewPreferences(storage, preferences)
          viewPreferencesRef.current = preferences
        }}
      />
    </>
  )
}
