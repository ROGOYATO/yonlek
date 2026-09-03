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
}

export interface CreateTaskInput {
  id: string
  projectId: string
  title: string
  now: string
}

export function createTask(input: CreateTaskInput): Task {
  const title = input.title.trim()

  if (!title) {
    throw new Error('Task title is required')
  }

  return {
    id: input.id,
    projectId: input.projectId,
    title,
    status: 'todo',
    priority: 'normal',
    createdAt: input.now,
  }
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
