import type { ChecklistItem } from './checklist'
import type { CustomFieldValue } from './custom-field'

export type TaskStatus = 'todo' | 'doing' | 'done'
export type TaskPriority = 'low' | 'normal' | 'high'
export type TaskRecurrenceUnit = 'day' | 'week' | 'month'

export interface TaskRecurrenceRule {
  unit: TaskRecurrenceUnit
  interval: number
}

export interface Task {
  id: string
  projectId: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
  archivedAt?: string
  startDate?: string
  dueDate?: string
  recurrence?: TaskRecurrenceRule
  description?: string
  listId?: string
  parentTaskId?: string
  checklist?: ChecklistItem[]
  tagIds?: string[]
  assigneeIds?: string[]
  customFieldValues?: Record<string, CustomFieldValue>
}

export interface CreateTaskInput {
  id: string
  projectId: string
  title: string
  now: string
  listId?: string
}

export function createTask(input: CreateTaskInput): Task {
  const title = input.title.trim()

  if (!title) {
    throw new Error('Task title is required')
  }

  const task: Task = {
    id: input.id,
    projectId: input.projectId,
    title,
    status: 'todo',
    priority: 'normal',
    createdAt: input.now,
  }

  if (input.listId !== undefined) {
    const listId = input.listId.trim()

    if (!listId) {
      throw new Error('Task list is required')
    }

    task.listId = listId
  }

  return task
}

export function archiveTask(task: Task, archivedAt: string): Task {
  return {
    ...task,
    archivedAt,
  }
}

export function restoreTask(task: Task): Task {
  const restored = { ...task }
  delete restored.archivedAt
  return restored
}


export interface DuplicateTaskInput {
  id: string
  now: string
}

export function duplicateTask(
  task: Task,
  input: DuplicateTaskInput,
): Task {
  const duplicate: Task = {
    ...task,
    id: input.id,
    createdAt: input.now,
  }

  if (task.checklist !== undefined) {
    duplicate.checklist = task.checklist.map((item) => ({ ...item }))
  }

  if (task.tagIds !== undefined) {
    duplicate.tagIds = [...task.tagIds]
  }

  if (task.assigneeIds !== undefined) {
    duplicate.assigneeIds = [...task.assigneeIds]
  }

  if (task.customFieldValues !== undefined) {
    duplicate.customFieldValues = { ...task.customFieldValues }
  }

  return duplicate
}

export function renameTask(task: Task, title: string): Task {
  const normalizedTitle = title.trim()

  if (!normalizedTitle) {
    throw new Error('Task title is required')
  }

  return {
    ...task,
    title: normalizedTitle,
  }
}


function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function setTaskStartDate(
  task: Task,
  startDate: string | null,
): Task {
  if (startDate === null) {
    const next = { ...task }
    delete next.startDate
    return next
  }

  const normalizedStartDate = startDate.trim()

  if (!isCalendarDate(normalizedStartDate)) {
    throw new Error('Task start date must use YYYY-MM-DD')
  }

  if (task.dueDate !== undefined && normalizedStartDate > task.dueDate) {
    throw new Error('Task start date must not be after due date')
  }

  return {
    ...task,
    startDate: normalizedStartDate,
  }
}


export function setTaskDueDate(
  task: Task,
  dueDate: string | null,
): Task {
  if (dueDate === null) {
    const next = { ...task }
    delete next.dueDate
    delete next.recurrence
    return next
  }

  const normalizedDueDate = dueDate.trim()

  if (!isCalendarDate(normalizedDueDate)) {
    throw new Error('Task due date must use YYYY-MM-DD')
  }

  if (task.startDate !== undefined && normalizedDueDate < task.startDate) {
    throw new Error('Task due date must not be before start date')
  }

  return {
    ...task,
    dueDate: normalizedDueDate,
  }
}


function assertTaskRecurrenceRule(
  recurrence: TaskRecurrenceRule,
): void {
  if (
    recurrence.unit !== 'day' &&
    recurrence.unit !== 'week' &&
    recurrence.unit !== 'month'
  ) {
    throw new Error('Task recurrence unit is invalid')
  }

  if (!Number.isInteger(recurrence.interval) || recurrence.interval <= 0) {
    throw new Error('Task recurrence interval must be a positive integer')
  }
}

function formatCalendarDate(date: Date): string {
  return [
    String(date.getUTCFullYear()).padStart(4, '0'),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

export function advanceTaskCalendarDate(
  value: string,
  recurrence: TaskRecurrenceRule,
): string {
  if (!isCalendarDate(value)) {
    throw new Error('Task date must use YYYY-MM-DD')
  }

  assertTaskRecurrenceRule(recurrence)

  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const monthIndex = Number(monthText) - 1
  const day = Number(dayText)

  if (recurrence.unit === 'month') {
    const totalMonths = monthIndex + recurrence.interval
    const nextYear = year + Math.floor(totalMonths / 12)
    const nextMonthIndex = totalMonths % 12
    const lastDay = new Date(
      Date.UTC(nextYear, nextMonthIndex + 1, 0),
    ).getUTCDate()

    return formatCalendarDate(
      new Date(Date.UTC(nextYear, nextMonthIndex, Math.min(day, lastDay))),
    )
  }

  const date = new Date(Date.UTC(year, monthIndex, day))
  const days = recurrence.unit === 'week'
    ? recurrence.interval * 7
    : recurrence.interval
  date.setUTCDate(date.getUTCDate() + days)
  return formatCalendarDate(date)
}

export function setTaskRecurrence(
  task: Task,
  recurrence: TaskRecurrenceRule | null,
): Task {
  if (recurrence === null) {
    const next = { ...task }
    delete next.recurrence
    return next
  }

  if (task.dueDate === undefined || !isCalendarDate(task.dueDate)) {
    throw new Error('Recurring task requires a valid due date')
  }

  assertTaskRecurrenceRule(recurrence)

  return {
    ...task,
    recurrence: { ...recurrence },
  }
}

export interface CreateNextRecurringTaskOccurrenceInput {
  id: string
  now: string
}

export function createNextRecurringTaskOccurrence(
  task: Task,
  input: CreateNextRecurringTaskOccurrenceInput,
): Task {
  if (task.status !== 'done') {
    throw new Error(
      'Recurring Task must be completed before creating the next occurrence',
    )
  }

  if (task.recurrence === undefined) {
    throw new Error('Task does not have a recurrence rule')
  }

  if (task.dueDate === undefined || !isCalendarDate(task.dueDate)) {
    throw new Error('Recurring task requires a valid due date')
  }

  const recurrence = { ...task.recurrence }
  assertTaskRecurrenceRule(recurrence)

  const next: Task = {
    ...task,
    id: input.id,
    status: 'todo',
    createdAt: input.now,
    dueDate: advanceTaskCalendarDate(task.dueDate, recurrence),
    recurrence,
  }

  delete next.archivedAt

  if (task.startDate !== undefined) {
    next.startDate = advanceTaskCalendarDate(task.startDate, recurrence)
  }

  if (task.checklist !== undefined) {
    next.checklist = task.checklist.map((item) => ({
      ...item,
      completed: false,
    }))
  }

  if (task.tagIds !== undefined) {
    next.tagIds = [...task.tagIds]
  }

  if (task.assigneeIds !== undefined) {
    next.assigneeIds = [...task.assigneeIds]
  }

  if (task.customFieldValues !== undefined) {
    next.customFieldValues = { ...task.customFieldValues }
  }

  return next
}

export function setTaskDescription(
  task: Task,
  description: string | null,
): Task {
  const normalizedDescription = description?.trim() ?? ''

  if (!normalizedDescription) {
    const next = { ...task }
    delete next.description
    return next
  }

  return {
    ...task,
    description: normalizedDescription,
  }
}


export function moveTaskToProject(task: Task, projectId: string): Task {
  const normalizedProjectId = projectId.trim()

  if (!normalizedProjectId) {
    throw new Error('Task project is required')
  }

  return {
    ...task,
    projectId: normalizedProjectId,
  }
}


export function setTaskList(
  task: Task,
  listId: string | null,
): Task {
  if (listId === null) {
    const next = { ...task }
    delete next.listId
    return next
  }

  const normalizedListId = listId.trim()

  if (!normalizedListId) {
    throw new Error('Task list is required')
  }

  return {
    ...task,
    listId: normalizedListId,
  }
}


export interface CreateSubtaskInput {
  id: string
  parent: Task
  title: string
  now: string
}

export function createSubtask(input: CreateSubtaskInput): Task {
  const task = createTask({
    id: input.id,
    projectId: input.parent.projectId,
    title: input.title,
    now: input.now,
    listId: input.parent.listId,
  })

  return {
    ...task,
    parentTaskId: input.parent.id,
  }
}

export * from './task-template'
