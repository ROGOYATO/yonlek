import { emptyWorkspace, type WorkspaceState } from '../domain/workspace'

const STORAGE_KEY = 'workspace-app.workspace'
const STORAGE_VERSION = 1

export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

interface StoredWorkspaceV1 {
  version: 1
  workspace: WorkspaceState
}

export function loadWorkspace(store: KeyValueStore): WorkspaceState {
  const raw = store.getItem(STORAGE_KEY)

  if (raw === null) {
    return emptyWorkspace
  }

  const document = JSON.parse(raw) as StoredWorkspaceV1

  if (document.version !== STORAGE_VERSION) {
    throw new Error('Unsupported workspace storage version')
  }

  return document.workspace
}

export function saveWorkspace(
  store: KeyValueStore,
  workspace: WorkspaceState,
): void {
  const document: StoredWorkspaceV1 = {
    version: STORAGE_VERSION,
    workspace,
  }

  store.setItem(STORAGE_KEY, JSON.stringify(document))
}
