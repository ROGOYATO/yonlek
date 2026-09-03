import type { Task } from './task'

export interface TaskSummary {
  total: number
  todo: number
  doing: number
  done: number
}

export function summarizeTasks(tasks: Task[]): TaskSummary {
  return tasks.reduce<TaskSummary>(
    (summary, task) => ({
      ...summary,
      total: summary.total + 1,
      [task.status]: summary[task.status] + 1,
    }),
    {
      total: 0,
      todo: 0,
      doing: 0,
      done: 0,
    },
  )
}
