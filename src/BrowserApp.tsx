import { useState } from 'react'

import {
  createWorkspaceCommands,
  type WorkspaceRuntime,
} from './application/workspace-commands'
import { createWorkspaceStore } from './application/workspace-store'
import type { KeyValueStore } from './persistence/workspace-storage'
import { WorkspaceRoot } from './WorkspaceRoot'

export interface BrowserAppProps {
  storage?: KeyValueStore
  runtime?: WorkspaceRuntime
}

const defaultRuntime: WorkspaceRuntime = {
  nextId: () => globalThis.crypto.randomUUID(),
  now: () => new Date().toISOString(),
}

export function BrowserApp({
  storage = globalThis.localStorage,
  runtime = defaultRuntime,
}: BrowserAppProps) {
  const [application] = useState(() => {
    const store = createWorkspaceStore(storage)
    const commands = createWorkspaceCommands(store, runtime)

    return { store, commands }
  })

  return (
    <WorkspaceRoot
      store={application.store}
      commands={application.commands}
    />
  )
}
