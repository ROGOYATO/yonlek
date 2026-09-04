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
      typeof value.description === 'string') &&
    (value.areaId === undefined ||
      (typeof value.areaId === 'string' && value.areaId.trim().length > 0))
  )
}


function isValidTaskList(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.projectId === 'string' &&
    value.projectId.trim().length > 0 &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    isIsoInstant(value.createdAt)
  )
}


function isValidChecklistItem(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.text === 'string' &&
    value.text.trim().length > 0 &&
    typeof value.completed === 'boolean'
  )
}


function isValidArea(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    isIsoInstant(value.createdAt)
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
      typeof value.description !== 'string') ||
    (value.listId !== undefined &&
      (typeof value.listId !== 'string' || value.listId.trim().length === 0)) ||
    (value.parentTaskId !== undefined &&
      (typeof value.parentTaskId !== 'string' ||
        value.parentTaskId.trim().length === 0)) ||
    (value.checklist !== undefined &&
      (!Array.isArray(value.checklist) ||
        !value.checklist.every(isValidChecklistItem)))
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
    (workspace.areas !== undefined && !Array.isArray(workspace.areas)) ||
    (workspace.lists !== undefined && !Array.isArray(workspace.lists)) ||
    !Array.isArray(workspace.projects) ||
    !Array.isArray(workspace.tasks)
  ) {
    invalidStorage()
  }

  const areas = workspace.areas ?? []
  const lists = workspace.lists ?? []

  if (
    !areas.every(isValidArea) ||
    !lists.every(isValidTaskList) ||
    !workspace.projects.every(isValidProject) ||
    !workspace.tasks.every(isValidTask)
  ) {
    invalidStorage()
  }

  const areaIds = new Set(
    areas.map((area) => (area as { id: string }).id),
  )

  if (areaIds.size !== areas.length) {
    invalidStorage()
  }

  if (
    workspace.projects.some(
      (project) =>
        (project as { areaId?: string }).areaId !== undefined &&
        !areaIds.has((project as { areaId: string }).areaId),
    )
  ) {
    invalidStorage()
  }

  const projectIds = new Set(
    workspace.projects.map((project) => (project as { id: string }).id),
  )

  if (projectIds.size !== workspace.projects.length) {
    invalidStorage()
  }

  const listIds = new Set(
    lists.map((list) => (list as { id: string }).id),
  )

  if (listIds.size !== lists.length) {
    invalidStorage()
  }

  if (
    lists.some(
      (list) =>
        !projectIds.has((list as { projectId: string }).projectId),
    )
  ) {
    invalidStorage()
  }

  const listProjects = new Map(
    lists.map((list) => [
      (list as { id: string }).id,
      (list as { projectId: string }).projectId,
    ]),
  )

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

  if (
    workspace.tasks.some((task) => {
      const listId = (task as { listId?: string }).listId

      if (listId === undefined) {
        return false
      }

      const listProjectId = listProjects.get(listId)

      return (
        listProjectId === undefined ||
        listProjectId !== (task as { projectId: string }).projectId
      )
    })
  ) {
    invalidStorage()
  }

  if (
    workspace.tasks.some((task) => {
      const checklist = (task as { checklist?: Array<{ id: string }> })
        .checklist

      if (checklist === undefined) {
        return false
      }

      const checklistIds = new Set(checklist.map((item) => item.id))

      return checklistIds.size !== checklist.length
    })
  ) {
    invalidStorage()
  }

  const tasksById = new Map(
    workspace.tasks.map((task) => [
      (task as { id: string }).id,
      task as {
        id: string
        projectId: string
        parentTaskId?: string
      },
    ]),
  )

  if (
    workspace.tasks.some((task) => {
      const current = task as {
        id: string
        projectId: string
        parentTaskId?: string
      }

      if (current.parentTaskId === undefined) {
        return false
      }

      const parent = tasksById.get(current.parentTaskId)

      return parent === undefined || parent.projectId !== current.projectId
    })
  ) {
    invalidStorage()
  }

  for (const task of workspace.tasks) {
    const start = task as {
      id: string
      parentTaskId?: string
    }
    const visited = new Set<string>()
    let current:
      | {
          id: string
          parentTaskId?: string
        }
      | undefined = start

    while (current?.parentTaskId !== undefined) {
      if (visited.has(current.id)) {
        invalidStorage()
      }

      visited.add(current.id)
      current = tasksById.get(current.parentTaskId)
    }
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
