import type { Task } from './task'

export type TaskSort = 'created' | 'title' | 'dueDate'

export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  return [...tasks].sort((left, right) => {
    if (sort === 'title') {
      return left.title.localeCompare(right.title, undefined, {
        sensitivity: 'base',
      })
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
