import { createChecklistItem, type ChecklistItem } from './checklist'
import type { Task, TaskPriority, TaskStatus } from './task'

export interface TaskTemplateChecklistItem {
  text: string
  completed: boolean
}

export interface TaskTemplateTask {
  key: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  description?: string
  parentTaskKey?: string
  checklist?: TaskTemplateChecklistItem[]
}

export interface TaskTemplate {
  id: string
  name: string
  createdAt: string
  rootTaskKey: string
  tasks: TaskTemplateTask[]
}

export interface CreateTaskTemplateInput {
  id: string
  name: string
  now: string
  rootTask: Task
  tasks: Task[]
}

export interface InstantiateTaskTemplateInput {
  projectId: string
  listId?: string
  now: string
  nextId(): string
}

export interface TaskTemplateInstance {
  rootTask: Task
  tasks: Task[]
}

export function createTaskTemplate(input: CreateTaskTemplateInput): TaskTemplate {
  const name = input.name.trim()

  if (!name) {
    throw new Error('Task template name is required')
  }

  if (input.rootTask.archivedAt !== undefined) {
    throw new Error('Cannot template an archived task')
  }

  const includedIds = new Set([input.rootTask.id])
  let changed = true

  while (changed) {
    changed = false

    for (const task of input.tasks) {
      if (
        task.archivedAt === undefined &&
        task.parentTaskId !== undefined &&
        includedIds.has(task.parentTaskId) &&
        !includedIds.has(task.id)
      ) {
        includedIds.add(task.id)
        changed = true
      }
    }
  }

  const subtree = [
    input.rootTask,
    ...input.tasks.filter(
      (task) => task.id !== input.rootTask.id && includedIds.has(task.id),
    ),
  ]

  return {
    id: input.id,
    name,
    createdAt: input.now,
    rootTaskKey: input.rootTask.id,
    tasks: subtree.map((task) => {
      const blueprint: TaskTemplateTask = {
        key: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
      }

      if (task.description !== undefined) {
        blueprint.description = task.description
      }

      if (
        task.parentTaskId !== undefined &&
        includedIds.has(task.parentTaskId)
      ) {
        blueprint.parentTaskKey = task.parentTaskId
      }

      if (task.checklist !== undefined) {
        blueprint.checklist = task.checklist.map((item) => ({
          text: item.text,
          completed: item.completed,
        }))
      }

      return blueprint
    }),
  }
}

export function instantiateTaskTemplate(
  template: TaskTemplate,
  input: InstantiateTaskTemplateInput,
): TaskTemplateInstance {
  const projectId = input.projectId.trim()

  if (!projectId) {
    throw new Error('Task template project is required')
  }

  const listId = input.listId?.trim()
  if (input.listId !== undefined && !listId) {
    throw new Error('Task template list is required')
  }

  const taskIds = new Map<string, string>()
  for (const blueprint of template.tasks) {
    taskIds.set(blueprint.key, input.nextId())
  }

  const tasks = template.tasks.map((blueprint) => {
    const id = taskIds.get(blueprint.key)

    if (id === undefined) {
      throw new Error('Task template task identity is invalid')
    }

    const task: Task = {
      id,
      projectId,
      title: blueprint.title,
      status: blueprint.status,
      priority: blueprint.priority,
      createdAt: input.now,
    }

    if (listId !== undefined) {
      task.listId = listId
    }

    if (blueprint.description !== undefined) {
      task.description = blueprint.description
    }

    if (blueprint.parentTaskKey !== undefined) {
      const parentTaskId = taskIds.get(blueprint.parentTaskKey)

      if (parentTaskId === undefined) {
        throw new Error('Task template parent task is invalid')
      }

      task.parentTaskId = parentTaskId
    }

    if (blueprint.checklist !== undefined) {
      task.checklist = blueprint.checklist.map((item) => {
        const checklistItem: ChecklistItem = createChecklistItem({
          id: input.nextId(),
          text: item.text,
        })
        checklistItem.completed = item.completed
        return checklistItem
      })
    }

    return task
  })

  const rootTask = tasks.find(
    (task) => task.id === taskIds.get(template.rootTaskKey),
  )

  if (rootTask === undefined) {
    throw new Error('Task template root task is invalid')
  }

  return { rootTask, tasks }
}
