import type { ChecklistItem } from './checklist'

export type TaskStatus = 'todo' | 'doing' | 'done'
export type TaskPriority = 'low' | 'normal' | 'high'

export interface Task {
  id: string
  projectId: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
  dueDate?: string
  description?: string
  listId?: string
  parentTaskId?: string
  checklist?: ChecklistItem[]
  tagIds?: string[]
  assigneeIds?: string[]
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

export function setTaskDueDate(
  task: Task,
  dueDate: string | null,
): Task {
  if (dueDate === null) {
    const next = { ...task }
    delete next.dueDate
    return next
  }

  const normalizedDueDate = dueDate.trim()

  if (!isCalendarDate(normalizedDueDate)) {
    throw new Error('Task due date must use YYYY-MM-DD')
  }

  return {
    ...task,
    dueDate: normalizedDueDate,
  }
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
