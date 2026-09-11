import type { Task } from './task'

export interface TaskTimelineItem {
  task: Task
  dueDateLabel: string
}

export function createTaskTimelineItems(tasks: Task[]): TaskTimelineItem[] {
  return tasks
    .map((task, index) => ({ task, index }))
    .sort((left, right) => {
      const leftDate = left.task.dueDate
      const rightDate = right.task.dueDate

      if (leftDate && rightDate) {
        const dateOrder = leftDate.localeCompare(rightDate)
        return dateOrder === 0 ? left.index - right.index : dateOrder
      }

      if (leftDate) {
        return -1
      }

      if (rightDate) {
        return 1
      }

      return left.index - right.index
    })
    .map(({ task }) => ({
      task,
      dueDateLabel: task.dueDate ?? 'No due date',
    }))
}
