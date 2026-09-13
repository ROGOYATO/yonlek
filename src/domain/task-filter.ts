import {
  normalizeCustomFieldValueForDefinition,
  type CustomFieldDefinition,
  type CustomFieldType,
  type CustomFieldValue,
} from './custom-field'
import type { Task, TaskPriority, TaskStatus } from './task'

export type TaskDueDateFilter = 'all' | 'withDueDate' | 'withoutDueDate'

export interface CustomFieldTaskFilter {
  fieldId: string
  fieldType: CustomFieldType
  value: CustomFieldValue
}

export interface TaskFilter {
  query: string
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  dueDate?: TaskDueDateFilter
  customField?: CustomFieldTaskFilter
}

export function createCustomFieldTaskFilter(
  field: CustomFieldDefinition,
  value: unknown,
): CustomFieldTaskFilter {
  const fieldId = field.id.trim()

  if (!fieldId) {
    throw new Error('Custom field filter field is required')
  }

  const normalizedValue = normalizeCustomFieldValueForDefinition(field, value)

  if (field.type === 'text' && normalizedValue === '') {
    throw new Error('Custom field filter value is required')
  }

  return {
    fieldId,
    fieldType: field.type,
    value: normalizedValue,
  }
}

function resolveCustomFieldFilter(
  filter: CustomFieldTaskFilter | undefined,
  customFields: CustomFieldDefinition[],
): { field: CustomFieldDefinition; value: CustomFieldValue } | undefined {
  if (filter === undefined) {
    return undefined
  }

  const field = customFields.find(
    (candidate) =>
      candidate.id === filter.fieldId && candidate.type === filter.fieldType,
  )

  if (!field) {
    return undefined
  }

  try {
    return {
      field,
      value: createCustomFieldTaskFilter(field, filter.value).value,
    }
  } catch {
    return undefined
  }
}

function matchesCustomFieldFilter(
  task: Task,
  field: CustomFieldDefinition,
  value: CustomFieldValue,
): boolean {
  const taskValue = task.customFieldValues?.[field.id]

  if (taskValue === undefined) {
    return false
  }

  if (field.type === 'text') {
    return (
      typeof taskValue === 'string' &&
      typeof value === 'string' &&
      taskValue.toLowerCase().includes(value.toLowerCase())
    )
  }

  return taskValue === value
}

export function filterTasks(
  tasks: Task[],
  filter: TaskFilter,
  customFields: CustomFieldDefinition[] = [],
): Task[] {
  const query = filter.query.trim().toLowerCase()
  const dueDateFilter = filter.dueDate ?? 'all'
  const customFieldFilter = resolveCustomFieldFilter(
    filter.customField,
    customFields,
  )

  return tasks.filter((task) => {
    const matchesQuery =
      query.length === 0 ||
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) === true
    const matchesStatus =
      filter.status === 'all' || task.status === filter.status
    const matchesPriority =
      filter.priority === 'all' || task.priority === filter.priority
    const matchesDueDate =
      dueDateFilter === 'all' ||
      (dueDateFilter === 'withDueDate' && task.dueDate !== undefined) ||
      (dueDateFilter === 'withoutDueDate' && task.dueDate === undefined)
    const matchesCustomField =
      customFieldFilter === undefined ||
      matchesCustomFieldFilter(
        task,
        customFieldFilter.field,
        customFieldFilter.value,
      )

    return (
      matchesQuery &&
      matchesStatus &&
      matchesPriority &&
      matchesDueDate &&
      matchesCustomField
    )
  })
}
