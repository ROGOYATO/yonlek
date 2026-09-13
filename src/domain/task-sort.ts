import type { CustomFieldDefinition } from './custom-field'
import type { Task } from './task'

export type TaskSort = 'created' | 'title' | 'dueDate' | 'priority' | 'manual'

export interface CustomFieldTaskSort {
  fieldId: string
}

export function createCustomFieldTaskSort(fieldId: string): CustomFieldTaskSort {
  const normalizedFieldId = fieldId.trim()

  if (!normalizedFieldId) {
    throw new Error('Custom field sort field is required')
  }

  return { fieldId: normalizedFieldId }
}

function compareCreatedAt(left: Task, right: Task): number {
  return left.createdAt.localeCompare(right.createdAt)
}

function getCustomFieldSortValue(
  task: Task,
  field: CustomFieldDefinition,
): string | number | boolean | undefined {
  const value = task.customFieldValues?.[field.id]

  if (field.type === 'text') {
    return typeof value === 'string' ? value.toLowerCase() : undefined
  }

  if (field.type === 'number') {
    return typeof value === 'number' && Number.isFinite(value)
      ? value
      : undefined
  }

  if (field.type === 'checkbox') {
    return typeof value === 'boolean' ? value : undefined
  }

  if (field.type === 'select') {
    if (typeof value !== 'string') {
      return undefined
    }

    const optionIndex = (field.options ?? []).findIndex(
      (option) => option.id === value,
    )
    return optionIndex === -1 ? undefined : optionIndex
  }

  if (field.type === 'date') {
    return typeof value === 'string' ? value : undefined
  }

  return undefined
}

function compareCustomFieldValues(
  left: Task,
  right: Task,
  field: CustomFieldDefinition,
): number {
  const leftValue = getCustomFieldSortValue(left, field)
  const rightValue = getCustomFieldSortValue(right, field)

  if (leftValue === undefined && rightValue === undefined) {
    return compareCreatedAt(left, right)
  }

  if (leftValue === undefined) {
    return 1
  }

  if (rightValue === undefined) {
    return -1
  }

  let order = 0

  if (typeof leftValue === 'string' && typeof rightValue === 'string') {
    order = leftValue.localeCompare(rightValue, undefined, {
      sensitivity: 'base',
    })
  } else if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    order = leftValue - rightValue
  } else if (typeof leftValue === 'boolean' && typeof rightValue === 'boolean') {
    order = Number(leftValue) - Number(rightValue)
  }

  return order !== 0 ? order : compareCreatedAt(left, right)
}

export function sortTasks(
  tasks: Task[],
  sort: TaskSort,
  customFields: CustomFieldDefinition[] = [],
  customFieldSort?: CustomFieldTaskSort,
): Task[] {
  if (customFieldSort !== undefined) {
    const field = customFields.find(
      (candidate) => candidate.id === customFieldSort.fieldId,
    )

    if (!field) {
      return [...tasks]
    }

    return [...tasks].sort((left, right) =>
      compareCustomFieldValues(left, right, field),
    )
  }

  if (sort === 'manual') {
    return [...tasks]
  }

  return [...tasks].sort((left, right) => {
    if (sort === 'title') {
      return left.title.localeCompare(right.title, undefined, {
        sensitivity: 'base',
      })
    }

    if (sort === 'priority') {
      const rank = {
        high: 0,
        normal: 1,
        low: 2,
      } as const
      const priorityOrder = rank[left.priority] - rank[right.priority]

      return priorityOrder !== 0
        ? priorityOrder
        : compareCreatedAt(left, right)
    }

    if (sort === 'dueDate') {
      if (left.dueDate === undefined && right.dueDate === undefined) {
        return compareCreatedAt(left, right)
      }

      if (left.dueDate === undefined) {
        return 1
      }

      if (right.dueDate === undefined) {
        return -1
      }

      const dueDateOrder = left.dueDate.localeCompare(right.dueDate)

      return dueDateOrder !== 0
        ? dueDateOrder
        : compareCreatedAt(left, right)
    }

    return compareCreatedAt(left, right)
  })
}
