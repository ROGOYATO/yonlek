export type TaskActivityStatus = 'todo' | 'doing' | 'done'
export type TaskActivityPriority = 'low' | 'normal' | 'high'

export interface TaskActivityTaskSnapshot {
  id: string
  projectId: string
  listId?: string | null
  title: string
  status: TaskActivityStatus
  priority: TaskActivityPriority
  startDate?: string | null
  dueDate?: string | null
  archivedAt?: string | null
}

export interface TaskActivityProjectSnapshot {
  id: string
  name: string
}

export interface TaskActivityListSnapshot {
  id: string
  projectId: string
  name: string
}

export type TaskActivityEvent =
  | {
      kind: 'task.created'
      projectId: string
      projectName: string
      listId?: string
      listName?: string
    }
  | { kind: 'task.titleChanged'; from: string; to: string }
  | { kind: 'task.statusChanged'; from: TaskActivityStatus; to: TaskActivityStatus }
  | { kind: 'task.priorityChanged'; from: TaskActivityPriority; to: TaskActivityPriority }
  | { kind: 'task.startDateChanged'; from: string | null; to: string | null }
  | { kind: 'task.dueDateChanged'; from: string | null; to: string | null }
  | {
      kind: 'task.projectChanged'
      fromProjectId: string
      fromProjectName: string
      toProjectId: string
      toProjectName: string
    }
  | {
      kind: 'task.listChanged'
      fromListId: string | null
      fromListName: string | null
      toListId: string | null
      toListName: string | null
    }
  | { kind: 'task.archived' }
  | { kind: 'task.restored' }
  | { kind: 'task.deleted' }

export interface TaskActivityEntry {
  sequence: number
  occurredAt: string
  taskId: string
  taskTitle: string
  event: TaskActivityEvent
}

export interface TaskActivityWorkspaceSnapshot {
  projects: TaskActivityProjectSnapshot[]
  lists?: TaskActivityListSnapshot[]
  tasks: TaskActivityTaskSnapshot[]
  activity?: TaskActivityEntry[]
}

export type TaskActivityAction =
  | { type: 'task/added'; task: TaskActivityTaskSnapshot }
  | { type: 'task/titleChanged'; taskId: string; title: string }
  | { type: 'task/statusChanged'; taskId: string; status: TaskActivityStatus }
  | { type: 'task/statusChangedBulk'; taskIds: string[]; status: TaskActivityStatus }
  | { type: 'task/priorityChanged'; taskId: string; priority: TaskActivityPriority }
  | { type: 'task/priorityChangedBulk'; taskIds: string[]; priority: TaskActivityPriority }
  | { type: 'task/startDateChanged'; taskId: string; startDate: string | null }
  | { type: 'task/dueDateChanged'; taskId: string; dueDate: string | null }
  | { type: 'task/projectChanged'; taskId: string; projectId: string }
  | { type: 'task/listChanged'; taskId: string; listId: string | null }
  | { type: 'task/archived'; taskId: string; archivedAt: string }
  | { type: 'task/archivedBulk'; taskIds: string[]; archivedAt: string }
  | { type: 'task/restored'; taskId: string }
  | { type: 'task/deleted'; taskId: string }
  | { type: 'task/recurringCompleted'; taskId: string; occurrence: TaskActivityTaskSnapshot }
  | { type: 'taskTemplate/instantiated'; tasks: TaskActivityTaskSnapshot[] }
  | {
      type: 'projectTemplate/instantiated'
      project: TaskActivityProjectSnapshot
      lists: TaskActivityListSnapshot[]
      tasks: TaskActivityTaskSnapshot[]
    }
  | { type: 'project/deleted'; projectId: string }

function assertCanonicalInstant(value: string): void {
  const instant = new Date(value)

  if (Number.isNaN(instant.getTime()) || instant.toISOString() !== value) {
    throw new Error('Task activity timestamp must be a canonical ISO instant')
  }
}

function taskById(workspace: TaskActivityWorkspaceSnapshot, taskId: string) {
  return workspace.tasks.find((task) => task.id === taskId)
}

function projectName(workspace: TaskActivityWorkspaceSnapshot, projectId: string) {
  return workspace.projects.find((project) => project.id === projectId)?.name ?? projectId
}

function listName(
  workspace: TaskActivityWorkspaceSnapshot,
  listId: string | null | undefined,
): string | null {
  if (!listId) return null
  return workspace.lists?.find((list) => list.id === listId)?.name ?? listId
}

function isArchived(task: TaskActivityTaskSnapshot): boolean {
  return task.archivedAt !== undefined && task.archivedAt !== null
}

export function deriveTaskActivityEntries(
  before: TaskActivityWorkspaceSnapshot,
  after: TaskActivityWorkspaceSnapshot,
  action: TaskActivityAction,
  occurredAt: string,
): TaskActivityEntry[] {
  assertCanonicalInstant(occurredAt)

  const entries: TaskActivityEntry[] = []
  let sequence = (before.activity?.length ?? 0) + 1

  function append(task: TaskActivityTaskSnapshot, event: TaskActivityEvent) {
    entries.push({
      sequence,
      occurredAt,
      taskId: task.id,
      taskTitle: task.title,
      event,
    })
    sequence += 1
  }

  function appendCreated(taskId: string) {
    if (taskById(before, taskId)) return
    const task = taskById(after, taskId)
    if (!task) return
    const capturedListName = listName(after, task.listId)

    append(task, {
      kind: 'task.created',
      projectId: task.projectId,
      projectName: projectName(after, task.projectId),
      ...(task.listId && capturedListName
        ? { listId: task.listId, listName: capturedListName }
        : {}),
    })
  }

  function appendStatusChanged(taskId: string) {
    const previous = taskById(before, taskId)
    const next = taskById(after, taskId)
    if (!previous || !next || previous.status === next.status) return
    append(next, {
      kind: 'task.statusChanged',
      from: previous.status,
      to: next.status,
    })
  }

  function appendPriorityChanged(taskId: string) {
    const previous = taskById(before, taskId)
    const next = taskById(after, taskId)
    if (!previous || !next || previous.priority === next.priority) return
    append(next, {
      kind: 'task.priorityChanged',
      from: previous.priority,
      to: next.priority,
    })
  }

  switch (action.type) {
    case 'task/added':
      appendCreated(action.task.id)
      break

    case 'taskTemplate/instantiated':
    case 'projectTemplate/instantiated':
      for (const task of action.tasks) appendCreated(task.id)
      break

    case 'task/recurringCompleted':
      appendStatusChanged(action.taskId)
      appendCreated(action.occurrence.id)
      break

    case 'task/titleChanged': {
      const previous = taskById(before, action.taskId)
      const next = taskById(after, action.taskId)
      if (previous && next && previous.title !== next.title) {
        append(next, {
          kind: 'task.titleChanged',
          from: previous.title,
          to: next.title,
        })
      }
      break
    }

    case 'task/statusChanged':
      appendStatusChanged(action.taskId)
      break

    case 'task/statusChangedBulk': {
      const requested = new Set(action.taskIds)
      for (const task of before.tasks) {
        if (requested.has(task.id)) appendStatusChanged(task.id)
      }
      break
    }

    case 'task/priorityChanged':
      appendPriorityChanged(action.taskId)
      break

    case 'task/priorityChangedBulk': {
      const requested = new Set(action.taskIds)
      for (const task of before.tasks) {
        if (requested.has(task.id)) appendPriorityChanged(task.id)
      }
      break
    }

    case 'task/startDateChanged': {
      const previous = taskById(before, action.taskId)
      const next = taskById(after, action.taskId)
      const from = previous?.startDate ?? null
      const to = next?.startDate ?? null
      if (previous && next && from !== to) {
        append(next, { kind: 'task.startDateChanged', from, to })
      }
      break
    }

    case 'task/dueDateChanged': {
      const previous = taskById(before, action.taskId)
      const next = taskById(after, action.taskId)
      const from = previous?.dueDate ?? null
      const to = next?.dueDate ?? null
      if (previous && next && from !== to) {
        append(next, { kind: 'task.dueDateChanged', from, to })
      }
      break
    }

    case 'task/projectChanged':
      for (const previous of before.tasks) {
        const next = taskById(after, previous.id)
        if (!next || previous.projectId === next.projectId) continue
        append(next, {
          kind: 'task.projectChanged',
          fromProjectId: previous.projectId,
          fromProjectName: projectName(before, previous.projectId),
          toProjectId: next.projectId,
          toProjectName: projectName(after, next.projectId),
        })
      }
      break

    case 'task/listChanged': {
      const previous = taskById(before, action.taskId)
      const next = taskById(after, action.taskId)
      const fromListId = previous?.listId ?? null
      const toListId = next?.listId ?? null
      if (previous && next && fromListId !== toListId) {
        append(next, {
          kind: 'task.listChanged',
          fromListId,
          fromListName: listName(before, fromListId),
          toListId,
          toListName: listName(after, toListId),
        })
      }
      break
    }

    case 'task/archived':
    case 'task/archivedBulk':
      for (const previous of before.tasks) {
        const next = taskById(after, previous.id)
        if (!next || isArchived(previous) || !isArchived(next)) continue
        append(next, { kind: 'task.archived' })
      }
      break

    case 'task/restored':
      for (const previous of before.tasks) {
        const next = taskById(after, previous.id)
        if (!next || !isArchived(previous) || isArchived(next)) continue
        append(next, { kind: 'task.restored' })
      }
      break

    case 'task/deleted':
    case 'project/deleted':
      for (const previous of before.tasks) {
        if (!taskById(after, previous.id)) {
          append(previous, { kind: 'task.deleted' })
        }
      }
      break
  }

  return entries
}

const statusLabels: Record<TaskActivityStatus, string> = {
  todo: 'To do',
  doing: 'Doing',
  done: 'Done',
}

const priorityLabels: Record<TaskActivityPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}

function nullableLabel(value: string | null): string {
  return value ?? 'none'
}

export function describeTaskActivityEntry(entry: TaskActivityEntry): string {
  const event = entry.event

  switch (event.kind) {
    case 'task.created': {
      const location = event.listName
        ? `${event.projectName} / ${event.listName}`
        : event.projectName
      return `Created “${entry.taskTitle}” in ${location}`
    }
    case 'task.titleChanged':
      return `Renamed “${event.from}” to “${event.to}”`
    case 'task.statusChanged':
      return `Status for “${entry.taskTitle}”: ${statusLabels[event.from]} → ${statusLabels[event.to]}`
    case 'task.priorityChanged':
      return `Priority for “${entry.taskTitle}”: ${priorityLabels[event.from]} → ${priorityLabels[event.to]}`
    case 'task.startDateChanged':
      return `Start date for “${entry.taskTitle}”: ${nullableLabel(event.from)} → ${nullableLabel(event.to)}`
    case 'task.dueDateChanged':
      return `Due date for “${entry.taskTitle}”: ${nullableLabel(event.from)} → ${nullableLabel(event.to)}`
    case 'task.projectChanged':
      return `Moved “${entry.taskTitle}” from ${event.fromProjectName} to ${event.toProjectName}`
    case 'task.listChanged':
      return `List for “${entry.taskTitle}”: ${nullableLabel(event.fromListName)} → ${nullableLabel(event.toListName)}`
    case 'task.archived':
      return `Archived “${entry.taskTitle}”`
    case 'task.restored':
      return `Restored “${entry.taskTitle}”`
    case 'task.deleted':
      return `Deleted “${entry.taskTitle}”`
  }
}
