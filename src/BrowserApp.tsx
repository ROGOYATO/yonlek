import { useState } from 'react'

import {
  createWorkspaceCommands,
  type WorkspaceRuntime,
} from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import { saveWorkspace, type KeyValueStore } from './persistence/workspace-storage'
import { emptyWorkspace } from './domain/workspace'
import { WorkspaceRoot } from './WorkspaceRoot'

export interface BrowserAppProps {
  storage?: KeyValueStore
  runtime?: WorkspaceRuntime
}

const defaultRuntime: WorkspaceRuntime = {
  nextId: () => globalThis.crypto.randomUUID(),
  now: () => new Date().toISOString(),
}

function createBrowserApplication(
  storage: KeyValueStore,
  runtime: WorkspaceRuntime,
) {
  try {
    const store = createWorkspaceStore(storage)
    const commands = createWorkspaceCommands(store, runtime)

    return { store, commands, error: null }
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
}: BrowserAppProps) {
  const [application, setApplication] = useState(() =>
    createBrowserApplication(storage, runtime),
  )

  if (application.error || !application.store || !application.commands) {
    return (
      <main>
        <h1>Workspace</h1>
        <p role="alert">{application.error}</p>
        <button
          type="button"
          onClick={() => {
            saveWorkspace(storage, emptyWorkspace)
            setApplication(createBrowserApplication(storage, runtime))
          }}
        >
          Reset saved workspace
        </button>
      </main>
    )
  }

  return (
    <WorkspaceRoot
      store={application.store}
      commands={application.commands}
    />
  )
}
