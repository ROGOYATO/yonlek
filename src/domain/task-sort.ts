import type { Task } from './task'

export type TaskSort = 'created' | 'title' | 'dueDate' | 'priority' | 'manual'

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
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
        : left.createdAt.localeCompare(right.createdAt)
    }

    if (sort === 'dueDate') {
      if (left.dueDate === undefined && right.dueDate === undefined) {
        return left.createdAt.localeCompare(right.createdAt)
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
        : left.createdAt.localeCompare(right.createdAt)
    }

    return left.createdAt.localeCompare(right.createdAt)
  })
}
