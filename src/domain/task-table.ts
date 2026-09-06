import type { Task, TaskPriority, TaskStatus } from './task'
import type { TaskList } from './task-list'

export interface TaskTableRow {
  taskId: string
  title: string
  status: string
  priority: string
  dueDate: string
  list: string
}

function taskStatusLabel(status: TaskStatus): string {
  if (status === 'todo') {
    return 'To do'
  }

  if (status === 'doing') {
    return 'Doing'
  }

  return 'Done'
}

function taskPriorityLabel(priority: TaskPriority): string {
  if (priority === 'low') {
    return 'Low'
  }

  if (priority === 'high') {
    return 'High'
  }

  return 'Normal'
}

export function createTaskTableRows(
  tasks: Task[],
  lists: TaskList[],
): TaskTableRow[] {
  const listNames = new Map(lists.map((list) => [list.id, list.name]))

  return tasks.map((task) => ({
    taskId: task.id,
    title: task.title,
    status: taskStatusLabel(task.status),
    priority: taskPriorityLabel(task.priority),
    dueDate: task.dueDate ?? 'No due date',
    list: task.listId ? (listNames.get(task.listId) ?? 'No list') : 'No list',
  }))
}
