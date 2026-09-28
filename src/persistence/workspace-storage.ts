import {
  validateAutomation,
  type Automation,
} from '../domain/automation'
import {
  normalizeDateCustomFieldValue,
  validateCustomFieldFormulaDependencies,
  type CustomFieldDefinition,
} from '../domain/custom-field'
import {
  setTaskDueDate,
  setTaskRecurrence,
  setTaskStartDate,
  type Task,
  type TaskRecurrenceRule,
} from '../domain/task'
import { emptyWorkspace, type WorkspaceState } from '../domain/workspace'
import {
  migrateVersionedDocument,
  VersionedDocumentMigrationError,
  type VersionedDocumentMigrationResult,
  type VersionedDocumentMigrations,
} from './versioned-document'

const STORAGE_KEY = 'workspace-app.workspace'
const STORAGE_VERSION = 1
const WORKSPACE_STORAGE_MIGRATIONS: VersionedDocumentMigrations = {}

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

export function migrateWorkspaceStorageDocument(
  value: unknown,
): VersionedDocumentMigrationResult {
  try {
    return migrateVersionedDocument(
      value,
      STORAGE_VERSION,
      WORKSPACE_STORAGE_MIGRATIONS,
    )
  } catch (error) {
    if (
      error instanceof VersionedDocumentMigrationError &&
      (error.code === 'unsupported-version' ||
        error.code === 'missing-migration')
    ) {
      throw new Error('Unsupported workspace storage version')
    }

    invalidStorage()
  }
}



function isValidAutomation(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }

  try {
    validateAutomation(value as unknown as Automation)
    return true
  } catch {
    return false
  }
}

function isValidTaskTimeEstimate(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value > 0
}

function isValidTaskTimeEntry(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.durationMs === 'number' &&
    Number.isFinite(value.durationMs) &&
    Number.isInteger(value.durationMs) &&
    value.durationMs > 0 &&
    isIsoInstant(value.recordedAt)
  )
}

function isValidTaskAttachment(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    value.id.trim().length > 0 &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    typeof value.sizeBytes === 'number' &&
    Number.isSafeInteger(value.sizeBytes) &&
    value.sizeBytes >= 0 &&
    (value.mediaType === undefined ||
      (typeof value.mediaType === 'string' &&
        value.mediaType.trim().length > 0)) &&
    isIsoInstant(value.addedAt)
  )
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


function hasOnlyKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const allowed = new Set(keys)
  return Object.keys(value).every((key) => allowed.has(key))
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidTaskActivityStatus(value: unknown): boolean {
  return value === 'todo' || value === 'doing' || value === 'done'
}

function isValidTaskActivityPriority(value: unknown): boolean {
  return value === 'low' || value === 'normal' || value === 'high'
}

function isValidTaskActivityDate(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const instant = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(instant.getTime()) && instant.toISOString().slice(0, 10) === value
}

function isValidNullableTaskActivityDate(value: unknown): boolean {
  return value === null || isValidTaskActivityDate(value)
}

function isValidTaskActivityListContext(
  id: unknown,
  name: unknown,
): boolean {
  return (
    (id === null && name === null) ||
    (isNonBlankString(id) && isNonBlankString(name))
  )
}

function isValidTaskActivityEvent(value: unknown): boolean {
  if (!isRecord(value) || !isNonBlankString(value.kind)) {
    return false
  }

  switch (value.kind) {
    case 'task.created': {
      if (
        !hasOnlyKeys(value, [
          'kind',
          'projectId',
          'projectName',
          'listId',
          'listName',
        ]) ||
        !isNonBlankString(value.projectId) ||
        !isNonBlankString(value.projectName)
      ) {
        return false
      }

      const hasListId = value.listId !== undefined
      const hasListName = value.listName !== undefined
      return (
        hasListId === hasListName &&
        (!hasListId ||
          (isNonBlankString(value.listId) && isNonBlankString(value.listName)))
      )
    }

    case 'task.titleChanged':
      return (
        hasOnlyKeys(value, ['kind', 'from', 'to']) &&
        isNonBlankString(value.from) &&
        isNonBlankString(value.to)
      )

    case 'task.statusChanged':
      return (
        hasOnlyKeys(value, ['kind', 'from', 'to']) &&
        isValidTaskActivityStatus(value.from) &&
        isValidTaskActivityStatus(value.to)
      )

    case 'task.priorityChanged':
      return (
        hasOnlyKeys(value, ['kind', 'from', 'to']) &&
        isValidTaskActivityPriority(value.from) &&
        isValidTaskActivityPriority(value.to)
      )

    case 'task.startDateChanged':
    case 'task.dueDateChanged':
      return (
        hasOnlyKeys(value, ['kind', 'from', 'to']) &&
        isValidNullableTaskActivityDate(value.from) &&
        isValidNullableTaskActivityDate(value.to)
      )

    case 'task.projectChanged':
      return (
        hasOnlyKeys(value, [
          'kind',
          'fromProjectId',
          'fromProjectName',
          'toProjectId',
          'toProjectName',
        ]) &&
        isNonBlankString(value.fromProjectId) &&
        isNonBlankString(value.fromProjectName) &&
        isNonBlankString(value.toProjectId) &&
        isNonBlankString(value.toProjectName)
      )

    case 'task.listChanged':
      return (
        hasOnlyKeys(value, [
          'kind',
          'fromListId',
          'fromListName',
          'toListId',
          'toListName',
        ]) &&
        isValidTaskActivityListContext(value.fromListId, value.fromListName) &&
        isValidTaskActivityListContext(value.toListId, value.toListName)
      )

    case 'task.archived':
    case 'task.restored':
    case 'task.deleted':
      return hasOnlyKeys(value, ['kind'])

    default:
      return false
  }
}

function isValidTaskActivityEntry(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, [
      'sequence',
      'occurredAt',
      'taskId',
      'taskTitle',
      'event',
    ]) &&
    typeof value.sequence === 'number' &&
    Number.isSafeInteger(value.sequence) &&
    value.sequence > 0 &&
    isIsoInstant(value.occurredAt) &&
    isNonBlankString(value.taskId) &&
    isNonBlankString(value.taskTitle) &&
    isValidTaskActivityEvent(value.event)
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
    (value.archivedAt === undefined || isIsoInstant(value.archivedAt)) &&
    (value.description === undefined ||
      typeof value.description === 'string') &&
    (value.areaId === undefined ||
      (typeof value.areaId === 'string' && value.areaId.trim().length > 0))
  )
}


function isValidTaskTemplateTask(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.key === 'string' &&
    value.key.trim().length > 0 &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    (value.status === 'todo' ||
      value.status === 'doing' ||
      value.status === 'done') &&
    (value.priority === 'low' ||
      value.priority === 'normal' ||
      value.priority === 'high') &&
    (value.description === undefined || typeof value.description === 'string') &&
    (value.estimateMinutes === undefined || isValidTaskTimeEstimate(value.estimateMinutes)) &&
    value.timeEntries === undefined &&
    value.timerStartedAt === undefined &&
    value.attachments === undefined &&
    (value.parentTaskKey === undefined ||
      (typeof value.parentTaskKey === 'string' &&
        value.parentTaskKey.trim().length > 0)) &&
    (value.checklist === undefined ||
      (Array.isArray(value.checklist) &&
        value.checklist.every(isValidProjectTemplateChecklistItem)))
  )
}

function isValidTaskTemplate(value: unknown): boolean {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    value.id.trim().length === 0 ||
    typeof value.name !== 'string' ||
    value.name.trim().length === 0 ||
    !isIsoInstant(value.createdAt) ||
    typeof value.rootTaskKey !== 'string' ||
    value.rootTaskKey.trim().length === 0 ||
    !Array.isArray(value.tasks) ||
    value.tasks.length === 0 ||
    !value.tasks.every(isValidTaskTemplateTask)
  ) {
    return false
  }

  const tasks = value.tasks as Array<{
    key: string
    parentTaskKey?: string
  }>
  const taskKeys = new Set(tasks.map((task) => task.key))

  if (
    taskKeys.size !== tasks.length ||
    !taskKeys.has(value.rootTaskKey as string)
  ) {
    return false
  }

  const tasksByKey = new Map(tasks.map((task) => [task.key, task]))
  const root = tasksByKey.get(value.rootTaskKey as string)

  if (root?.parentTaskKey !== undefined) {
    return false
  }

  for (const task of tasks) {
    const visited = new Set<string>()
    let current = task

    while (current.key !== value.rootTaskKey) {
      if (
        current.parentTaskKey === undefined ||
        visited.has(current.key)
      ) {
        return false
      }

      visited.add(current.key)
      const parent = tasksByKey.get(current.parentTaskKey)

      if (parent === undefined) {
        return false
      }

      current = parent
    }
  }

  return true
}

function isValidProjectTemplateList(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.key === 'string' &&
    value.key.trim().length > 0 &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0
  )
}

function isValidProjectTemplateChecklistItem(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.text === 'string' &&
    value.text.trim().length > 0 &&
    typeof value.completed === 'boolean'
  )
}

function isValidProjectTemplateTask(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.key === 'string' &&
    value.key.trim().length > 0 &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    (value.status === 'todo' ||
      value.status === 'doing' ||
      value.status === 'done') &&
    (value.priority === 'low' ||
      value.priority === 'normal' ||
      value.priority === 'high') &&
    (value.description === undefined ||
      typeof value.description === 'string') &&
    (value.estimateMinutes === undefined || isValidTaskTimeEstimate(value.estimateMinutes)) &&
    value.timeEntries === undefined &&
    value.timerStartedAt === undefined &&
    value.attachments === undefined &&
    (value.listKey === undefined ||
      (typeof value.listKey === 'string' && value.listKey.trim().length > 0)) &&
    (value.parentTaskKey === undefined ||
      (typeof value.parentTaskKey === 'string' &&
        value.parentTaskKey.trim().length > 0)) &&
    (value.checklist === undefined ||
      (Array.isArray(value.checklist) &&
        value.checklist.every(isValidProjectTemplateChecklistItem)))
  )
}

function isValidProjectTemplate(value: unknown): boolean {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    value.id.trim().length === 0 ||
    typeof value.name !== 'string' ||
    value.name.trim().length === 0 ||
    !isIsoInstant(value.createdAt) ||
    typeof value.projectName !== 'string' ||
    value.projectName.trim().length === 0 ||
    (value.projectDescription !== undefined &&
      typeof value.projectDescription !== 'string') ||
    !Array.isArray(value.lists) ||
    !Array.isArray(value.tasks) ||
    !value.lists.every(isValidProjectTemplateList) ||
    !value.tasks.every(isValidProjectTemplateTask)
  ) {
    return false
  }

  const lists = value.lists as Array<{ key: string }>
  const tasks = value.tasks as Array<{
    key: string
    listKey?: string
    parentTaskKey?: string
  }>
  const listKeys = new Set(lists.map((list) => list.key))
  const taskKeys = new Set(tasks.map((task) => task.key))

  if (listKeys.size !== lists.length || taskKeys.size !== tasks.length) {
    return false
  }

  if (
    tasks.some(
      (task) =>
        (task.listKey !== undefined && !listKeys.has(task.listKey)) ||
        (task.parentTaskKey !== undefined &&
          (!taskKeys.has(task.parentTaskKey) ||
            task.parentTaskKey === task.key)),
    )
  ) {
    return false
  }

  const tasksByKey = new Map(tasks.map((task) => [task.key, task]))

  for (const task of tasks) {
    const visited = new Set<string>()
    let current = task

    while (current.parentTaskKey !== undefined) {
      if (visited.has(current.key)) {
        return false
      }

      visited.add(current.key)
      const parent = tasksByKey.get(current.parentTaskKey)

      if (parent === undefined) {
        return false
      }

      current = parent
    }
  }

  return true
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


function isValidCustomFieldFormula(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.leftFieldId === 'string' &&
    value.leftFieldId.length > 0 &&
    value.leftFieldId.trim() === value.leftFieldId &&
    (value.operator === '+' ||
      value.operator === '-' ||
      value.operator === '*' ||
      value.operator === '/') &&
    typeof value.rightFieldId === 'string' &&
    value.rightFieldId.length > 0 &&
    value.rightFieldId.trim() === value.rightFieldId
  )
}

function isValidCustomField(value: unknown): boolean {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    value.id.trim().length === 0 ||
    typeof value.name !== 'string' ||
    value.name.trim().length === 0 ||
    (value.type !== 'text' &&
      value.type !== 'number' &&
      value.type !== 'checkbox' &&
      value.type !== 'select' &&
      value.type !== 'date' &&
      value.type !== 'formula') ||
    !isIsoInstant(value.createdAt)
  ) {
    return false
  }

  if (value.type === 'formula') {
    return (
      value.options === undefined &&
      (value.formula === undefined || isValidCustomFieldFormula(value.formula))
    )
  }

  if (value.formula !== undefined) {
    return false
  }

  if (value.type !== 'select') {
    return value.options === undefined
  }

  if (!Array.isArray(value.options)) {
    return false
  }

  const options = value.options as unknown[]

  if (
    !options.every(
      (option) =>
        isRecord(option) &&
        typeof option.id === 'string' &&
        option.id.trim().length > 0 &&
        typeof option.name === 'string' &&
        option.name.trim().length > 0,
    )
  ) {
    return false
  }

  const optionIds = new Set(
    options.map((option) => (option as { id: string }).id),
  )

  return optionIds.size === options.length
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
    (value.archivedAt !== undefined && !isIsoInstant(value.archivedAt)) ||
    (value.description !== undefined &&
      typeof value.description !== 'string') ||
    (value.estimateMinutes !== undefined && !isValidTaskTimeEstimate(value.estimateMinutes)) ||
    (value.timeEntries !== undefined &&
      (!Array.isArray(value.timeEntries) ||
        !value.timeEntries.every(isValidTaskTimeEntry))) ||
    (value.timerStartedAt !== undefined && !isIsoInstant(value.timerStartedAt)) ||
    (value.attachments !== undefined &&
      (!Array.isArray(value.attachments) ||
        !value.attachments.every(isValidTaskAttachment))) ||
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

  if (value.timeEntries !== undefined) {
    const entryIds = new Set(
      (value.timeEntries as Array<{ id: string }>).map((entry) => entry.id),
    )

    if (entryIds.size !== value.timeEntries.length) {
      return false
    }
  }

  if (value.attachments !== undefined) {
    const attachmentIds = new Set(
      (value.attachments as Array<{ id: string }>).map(
        (attachment) => attachment.id,
      ),
    )

    if (attachmentIds.size !== value.attachments.length) {
      return false
    }
  }

  if (value.startDate !== undefined) {
    if (typeof value.startDate !== 'string') {
      return false
    }

    try {
      setTaskStartDate(value as unknown as Task, value.startDate)
    } catch {
      return false
    }
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

  if (value.recurrence !== undefined) {
    if (!isRecord(value.recurrence)) {
      return false
    }

    try {
      setTaskRecurrence(
        value as unknown as Task,
        value.recurrence as unknown as TaskRecurrenceRule,
      )
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

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    invalidStorage()
  }

  const document = migrateWorkspaceStorageDocument(parsed).document
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
    (workspace.projectTemplates !== undefined &&
      !Array.isArray(workspace.projectTemplates)) ||
    (workspace.taskTemplates !== undefined &&
      !Array.isArray(workspace.taskTemplates)) ||
    (workspace.activity !== undefined && !Array.isArray(workspace.activity)) ||
    (workspace.automations !== undefined && !Array.isArray(workspace.automations)) ||
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
  const projectTemplates = workspace.projectTemplates ?? []
  const taskTemplates = workspace.taskTemplates ?? []
  const activity = workspace.activity ?? []
  const automations = workspace.automations ?? []

  if (
    !areas.every(isValidArea) ||
    !lists.every(isValidTaskList) ||
    !tags.every(isValidTag) ||
    !people.every(isValidPerson) ||
    !customFields.every(isValidCustomField) ||
    !relationships.every(isValidTaskRelationship) ||
    !projectTemplates.every(isValidProjectTemplate) ||
    !taskTemplates.every(isValidTaskTemplate) ||
    !activity.every(isValidTaskActivityEntry) ||
    !automations.every(isValidAutomation) ||
    !workspace.projects.every(isValidProject) ||
    !workspace.tasks.every(isValidTask)
  ) {
    invalidStorage()
  }

  if (
    activity.some(
      (entry, index) =>
        (entry as { sequence: number }).sequence !== index + 1,
    )
  ) {
    invalidStorage()
  }

  const automationIds = new Set(
    automations.map((automation) => (automation as { id: string }).id),
  )

  if (automationIds.size !== automations.length) {
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
        type: 'text' | 'number' | 'checkbox' | 'select' | 'date' | 'formula'
        options?: Array<{ id: string; name: string }>
        formula?: {
          leftFieldId: string
          operator: '+' | '-' | '*' | '/'
          rightFieldId: string
        }
      },
    ]),
  )

  try {
    validateCustomFieldFormulaDependencies(
      customFields as CustomFieldDefinition[],
    )
  } catch {
    invalidStorage()
  }

  const projectIds = new Set(
    workspace.projects.map((project) => (project as { id: string }).id),
  )

  if (projectIds.size !== workspace.projects.length) {
    invalidStorage()
  }

  const projectTemplateIds = new Set(
    projectTemplates.map(
      (template) => (template as { id: string }).id,
    ),
  )

  if (projectTemplateIds.size !== projectTemplates.length) {
    invalidStorage()
  }

  const taskTemplateIds = new Set(
    taskTemplates.map((template) => (template as { id: string }).id),
  )

  if (taskTemplateIds.size !== taskTemplates.length) {
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

        if (field.type === 'checkbox') {
          return typeof value !== 'boolean'
        }

        if (field.type === 'date') {
          if (typeof value !== 'string') {
            return true
          }

          try {
            return normalizeDateCustomFieldValue(value) !== value
          } catch {
            return true
          }
        }

        if (field.type === 'formula') {
          return true
        }

        return (
          typeof value !== 'string' ||
          !(field.options ?? []).some((option) => option.id === value)
        )
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
