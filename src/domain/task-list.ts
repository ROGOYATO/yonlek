export interface TaskList {
  id: string
  projectId: string
  name: string
  createdAt: string
}

export interface CreateTaskListInput {
  id: string
  projectId: string
  name: string
  now: string
}

export function createTaskList(input: CreateTaskListInput): TaskList {
  const projectId = input.projectId.trim()
  const name = input.name.trim()

  if (!projectId) {
    throw new Error('List project is required')
  }

  if (!name) {
    throw new Error('List name is required')
  }

  return {
    id: input.id,
    projectId,
    name,
    createdAt: input.now,
  }
}

export function renameTaskList(
  list: TaskList,
  nextName: string,
): TaskList {
  const name = nextName.trim()

  if (!name) {
    throw new Error('List name is required')
  }

  return {
    ...list,
    name,
  }
}
