import { setTaskDueDate, setTaskStartDate, type Task } from './task'

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

export interface TaskGanttScheduleChange {
  startDate: string
  dueDate: string
}

export function createTaskGanttScheduleChange(
  task: Task,
  startDate: string,
  dueDate: string,
): TaskGanttScheduleChange {
  const unscheduled = { ...task }
  delete unscheduled.startDate
  delete unscheduled.dueDate

  const withStart = setTaskStartDate(unscheduled, startDate)
  const scheduled = setTaskDueDate(withStart, dueDate)

  return {
    startDate: scheduled.startDate!,
    dueDate: scheduled.dueDate!,
  }
}
