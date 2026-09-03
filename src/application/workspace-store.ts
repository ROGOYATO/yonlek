import {
  type WorkspaceAction,
  type WorkspaceState,
  workspaceReducer,
} from '../domain/workspace'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from '../persistence/workspace-storage'

export interface WorkspaceStore {
  getState(): WorkspaceState
  dispatch(action: WorkspaceAction): void
  subscribe(listener: () => void): () => void
}

export function createWorkspaceStore(storage: KeyValueStore): WorkspaceStore {
  let state = loadWorkspace(storage)
  const listeners = new Set<() => void>()

  return {
    getState() {
      return state
    },

    dispatch(action) {
      const nextState = workspaceReducer(state, action)
      saveWorkspace(storage, nextState)
      state = nextState

      for (const listener of listeners) {
        listener()
      }
    },

    subscribe(listener) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}
