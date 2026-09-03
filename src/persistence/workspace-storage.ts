import { setTaskDueDate, type Task } from '../domain/task'
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function invalidStorage(): never {
  throw new Error('Workspace storage is invalid')
}


function isIsoInstant(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const instant = new Date(value)

  return (
    !Number.isNaN(instant.getTime()) &&
    instant.toISOString() === value
  )
}


function isValidProject(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    isIsoInstant(value.createdAt) &&
    (value.description === undefined ||
      typeof value.description === 'string')
  )
}


function isValidTask(value: unknown): boolean {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    value.id.trim().length === 0 ||
    typeof value.projectId !== 'string' ||
    value.projectId.trim().length === 0 ||
    typeof value.title !== 'string' ||
    value.title.trim().length === 0 ||
    (value.status !== 'todo' &&
      value.status !== 'doing' &&
      value.status !== 'done') ||
    (value.priority !== 'low' &&
      value.priority !== 'normal' &&
      value.priority !== 'high') ||
    !isIsoInstant(value.createdAt) ||
    (value.description !== undefined &&
      typeof value.description !== 'string')
  ) {
    return false
  }

  if (value.dueDate !== undefined) {
    if (typeof value.dueDate !== 'string') {
      return false
    }

    try {
      setTaskDueDate(value as unknown as Task, value.dueDate)
    } catch {
      return false
    }
  }

  return true
}

export function loadWorkspace(store: KeyValueStore): WorkspaceState {
  const raw = store.getItem(STORAGE_KEY)

  if (raw === null) {
    return emptyWorkspace
  }

  let document: unknown

  try {
    document = JSON.parse(raw)
  } catch {
    invalidStorage()
  }

  if (!isRecord(document)) {
    invalidStorage()
  }

  if (document.version !== STORAGE_VERSION) {
    throw new Error('Unsupported workspace storage version')
  }

  const workspace = document.workspace

  if (
    !isRecord(workspace) ||
    !Array.isArray(workspace.projects) ||
    !Array.isArray(workspace.tasks)
  ) {
    invalidStorage()
  }

  if (
    !workspace.projects.every(isValidProject) ||
    !workspace.tasks.every(isValidTask)
  ) {
    invalidStorage()
  }

  const projectIds = new Set(
    workspace.projects.map((project) => (project as { id: string }).id),
  )

  if (projectIds.size !== workspace.projects.length) {
    invalidStorage()
  }

  const taskIds = new Set(
    workspace.tasks.map((task) => (task as { id: string }).id),
  )

  if (taskIds.size !== workspace.tasks.length) {
    invalidStorage()
  }

  if (
    workspace.tasks.some(
      (task) => !projectIds.has((task as { projectId: string }).projectId),
    )
  ) {
    invalidStorage()
  }

  return workspace as unknown as WorkspaceState
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
