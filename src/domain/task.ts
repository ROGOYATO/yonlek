export type TaskStatus = 'todo' | 'doing' | 'done'
export type TaskPriority = 'low' | 'normal' | 'high'

export interface Task {
  id: string
  projectId: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  createdAt: string
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
