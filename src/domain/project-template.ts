import { createChecklistItem, type ChecklistItem } from './checklist'
import type { Project } from './project'
import { createTaskList, type TaskList } from './task-list'
import { createTask, type Task, type TaskPriority, type TaskStatus } from './task'

export interface ProjectTemplateList {
  key: string
  name: string
}

export interface ProjectTemplateChecklistItem {
  text: string
  completed: boolean
}

export interface ProjectTemplateTask {
  key: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  description?: string
  listKey?: string
  parentTaskKey?: string
  checklist?: ProjectTemplateChecklistItem[]
}

export interface ProjectTemplate {
  id: string
  name: string
  createdAt: string
  projectName: string
  projectDescription?: string
  lists: ProjectTemplateList[]
  tasks: ProjectTemplateTask[]
}

export interface CreateProjectTemplateInput {
  id: string
  name: string
  now: string
  project: Project
  lists: TaskList[]
  tasks: Task[]
}

export interface InstantiateProjectTemplateInput {
  now: string
  nextId(): string
}

export interface ProjectTemplateInstance {
  project: Project
  lists: TaskList[]
  tasks: Task[]
}

export function createProjectTemplate(
  input: CreateProjectTemplateInput,
): ProjectTemplate {
  const name = input.name.trim()

  if (!name) {
    throw new Error('Project template name is required')
  }

  const projectLists = input.lists.filter(
    (list) => list.projectId === input.project.id,
  )
  const activeTasks = input.tasks.filter(
    (task) =>
      task.projectId === input.project.id && task.archivedAt === undefined,
  )
  const activeTaskIds = new Set(activeTasks.map((task) => task.id))

  const template: ProjectTemplate = {
    id: input.id,
    name,
    createdAt: input.now,
    projectName: input.project.name,
    lists: projectLists.map((list) => ({
      key: list.id,
      name: list.name,
    })),
    tasks: activeTasks.map((task) => {
      const blueprint: ProjectTemplateTask = {
        key: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
      }

      if (task.description !== undefined) {
        blueprint.description = task.description
      }

      if (task.listId !== undefined) {
        blueprint.listKey = task.listId
      }

      if (
        task.parentTaskId !== undefined &&
        activeTaskIds.has(task.parentTaskId)
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

  if (input.project.description !== undefined) {
    template.projectDescription = input.project.description
  }

  return template
}

export function instantiateProjectTemplate(
  template: ProjectTemplate,
  input: InstantiateProjectTemplateInput,
): ProjectTemplateInstance {
  const project: Project = {
    id: input.nextId(),
    name: template.projectName,
    createdAt: input.now,
  }

  if (template.projectDescription !== undefined) {
    project.description = template.projectDescription
  }

  const listIds = new Map<string, string>()
  const lists = template.lists.map((blueprint) => {
    const id = input.nextId()
    listIds.set(blueprint.key, id)

    return createTaskList({
      id,
      projectId: project.id,
      name: blueprint.name,
      now: input.now,
    })
  })

  const taskIds = new Map<string, string>()
  for (const blueprint of template.tasks) {
    taskIds.set(blueprint.key, input.nextId())
  }

  const tasks = template.tasks.map((blueprint) => {
    const id = taskIds.get(blueprint.key)

    if (id === undefined) {
      throw new Error('Project template task identity is invalid')
    }

    const listId =
      blueprint.listKey === undefined
        ? undefined
        : listIds.get(blueprint.listKey)

    if (blueprint.listKey !== undefined && listId === undefined) {
      throw new Error('Project template task list is invalid')
    }

    const task = createTask({
      id,
      projectId: project.id,
      title: blueprint.title,
      now: input.now,
      listId,
    })

    task.status = blueprint.status
    task.priority = blueprint.priority

    if (blueprint.description !== undefined) {
      task.description = blueprint.description
    }

    if (blueprint.parentTaskKey !== undefined) {
      const parentTaskId = taskIds.get(blueprint.parentTaskKey)

      if (parentTaskId === undefined) {
        throw new Error('Project template parent task is invalid')
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

  return { project, lists, tasks }
}
