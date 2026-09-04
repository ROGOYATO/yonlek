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


function isValidTaskRelationship(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    (value.type === 'blocks' || value.type === 'related') &&
    typeof value.sourceTaskId === 'string' &&
    value.sourceTaskId.trim().length > 0 &&
    typeof value.targetTaskId === 'string' &&
    value.targetTaskId.trim().length > 0 &&
    isIsoInstant(value.createdAt)
  )
}


function isValidCustomField(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    (value.type === 'text' ||
      value.type === 'number' ||
      value.type === 'checkbox') &&
    isIsoInstant(value.createdAt)
  )
}


function isValidPerson(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    isIsoInstant(value.createdAt)
  )
}


function isValidTag(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    isIsoInstant(value.createdAt)
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
        !value.checklist.every(isValidChecklistItem))) ||
    (value.tagIds !== undefined &&
      (!Array.isArray(value.tagIds) ||
        !value.tagIds.every(
          (tagId) => typeof tagId === 'string' && tagId.trim().length > 0,
        ))) ||
    (value.assigneeIds !== undefined &&
      (!Array.isArray(value.assigneeIds) ||
        !value.assigneeIds.every(
          (personId) =>
            typeof personId === 'string' && personId.trim().length > 0,
        ))) ||
    (value.customFieldValues !== undefined &&
      (!isRecord(value.customFieldValues) ||
        Array.isArray(value.customFieldValues)))
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
    (workspace.tags !== undefined && !Array.isArray(workspace.tags)) ||
    (workspace.people !== undefined && !Array.isArray(workspace.people)) ||
    (workspace.customFields !== undefined &&
      !Array.isArray(workspace.customFields)) ||
    (workspace.relationships !== undefined &&
      !Array.isArray(workspace.relationships)) ||
    !Array.isArray(workspace.projects) ||
    !Array.isArray(workspace.tasks)
  ) {
    invalidStorage()
  }

  const areas = workspace.areas ?? []
  const lists = workspace.lists ?? []
  const tags = workspace.tags ?? []
  const people = workspace.people ?? []
  const customFields = workspace.customFields ?? []
  const relationships = workspace.relationships ?? []

  if (
    !areas.every(isValidArea) ||
    !lists.every(isValidTaskList) ||
    !tags.every(isValidTag) ||
    !people.every(isValidPerson) ||
    !customFields.every(isValidCustomField) ||
    !relationships.every(isValidTaskRelationship) ||
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

  const tagIds = new Set(
    tags.map((tag) => (tag as { id: string }).id),
  )

  if (tagIds.size !== tags.length) {
    invalidStorage()
  }

  const personIds = new Set(
    people.map((person) => (person as { id: string }).id),
  )

  if (personIds.size !== people.length) {
    invalidStorage()
  }

  const customFieldIds = new Set(
    customFields.map((field) => (field as { id: string }).id),
  )

  if (customFieldIds.size !== customFields.length) {
    invalidStorage()
  }

  const customFieldsById = new Map(
    customFields.map((field) => [
      (field as { id: string }).id,
      field as {
        id: string
        type: 'text' | 'number' | 'checkbox'
      },
    ]),
  )

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

  if (
    workspace.tasks.some((task) => {
      const assignedTagIds = (task as { tagIds?: string[] }).tagIds

      if (assignedTagIds === undefined) {
        return false
      }

      const uniqueTagIds = new Set(assignedTagIds)

      return (
        uniqueTagIds.size !== assignedTagIds.length ||
        assignedTagIds.some((tagId) => !tagIds.has(tagId))
      )
    })
  ) {
    invalidStorage()
  }

  if (
    workspace.tasks.some((task) => {
      const assigneeIds = (task as { assigneeIds?: string[] })
        .assigneeIds

      if (assigneeIds === undefined) {
        return false
      }

      const uniqueAssigneeIds = new Set(assigneeIds)

      return (
        uniqueAssigneeIds.size !== assigneeIds.length ||
        assigneeIds.some((personId) => !personIds.has(personId))
      )
    })
  ) {
    invalidStorage()
  }

  if (
    workspace.tasks.some((task) => {
      const values = (
        task as {
          customFieldValues?: Record<string, unknown>
        }
      ).customFieldValues

      if (values === undefined) {
        return false
      }

      return Object.entries(values).some(([fieldId, value]) => {
        const field = customFieldsById.get(fieldId)

        if (!field) {
          return true
        }

        if (field.type === 'text') {
          return typeof value !== 'string'
        }

        if (field.type === 'number') {
          return (
            typeof value !== 'number' ||
            !Number.isFinite(value)
          )
        }

        return typeof value !== 'boolean'
      })
    })
  ) {
    invalidStorage()
  }

  const relationshipIds = new Set(
    relationships.map(
      (relationship) =>
        (relationship as { id: string }).id,
    ),
  )

  if (relationshipIds.size !== relationships.length) {
    invalidStorage()
  }

  const relationshipKeys = new Set<string>()
  for (const relationshipValue of relationships) {
    const relationship = relationshipValue as {
      type: 'blocks' | 'related'
      sourceTaskId: string
      targetTaskId: string
    }

    if (
      relationship.sourceTaskId === relationship.targetTaskId ||
      !taskIds.has(relationship.sourceTaskId) ||
      !taskIds.has(relationship.targetTaskId)
    ) {
      invalidStorage()
    }

    const endpoints =
      relationship.type === 'related'
        ? [
            relationship.sourceTaskId,
            relationship.targetTaskId,
          ].sort()
        : [relationship.sourceTaskId, relationship.targetTaskId]
    const key = `${relationship.type}:${endpoints[0]}:${endpoints[1]}`

    if (relationshipKeys.has(key)) {
      invalidStorage()
    }

    relationshipKeys.add(key)
  }

  const dependencyAdjacency = new Map<string, string[]>()
  for (const relationshipValue of relationships) {
    const relationship = relationshipValue as {
      type: 'blocks' | 'related'
      sourceTaskId: string
      targetTaskId: string
    }

    if (relationship.type !== 'blocks') {
      continue
    }

    const targets =
      dependencyAdjacency.get(relationship.sourceTaskId) ?? []
    targets.push(relationship.targetTaskId)
    dependencyAdjacency.set(relationship.sourceTaskId, targets)
  }

  for (const taskId of taskIds) {
    const pending = [...(dependencyAdjacency.get(taskId) ?? [])]
    const visited = new Set<string>()

    while (pending.length > 0) {
      const current = pending.pop()

      if (current === undefined) {
        continue
      }

      if (current === taskId) {
        invalidStorage()
      }

      if (visited.has(current)) {
        continue
      }

      visited.add(current)
      pending.push(...(dependencyAdjacency.get(current) ?? []))
    }
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
