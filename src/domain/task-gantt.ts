import type { Task } from './task'

export interface TaskGanttItem {
  task: Task
  startDate: string | null
  dueDate: string | null
  isScheduled: boolean
}

export function createTaskGanttItems(tasks: Task[]): TaskGanttItem[] {
  return tasks.map((task) => ({
    task,
    startDate: task.startDate ?? null,
    dueDate: task.dueDate ?? null,
    isScheduled: task.startDate !== undefined && task.dueDate !== undefined,
  }))
}
