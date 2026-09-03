import type { Task, TaskPriority, TaskStatus } from './task'

export type TaskDueDateFilter = 'all' | 'withDueDate' | 'withoutDueDate'

export interface TaskFilter {
  query: string
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  dueDate?: TaskDueDateFilter
}

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  const query = filter.query.trim().toLowerCase()
  const dueDateFilter = filter.dueDate ?? 'all'

  return tasks.filter((task) => {
    const matchesQuery =
      query.length === 0 || task.title.toLowerCase().includes(query)
    const matchesStatus =
      filter.status === 'all' || task.status === filter.status
    const matchesPriority =
      filter.priority === 'all' || task.priority === filter.priority
    const matchesDueDate =
      dueDateFilter === 'all' ||
      (dueDateFilter === 'withDueDate' && task.dueDate !== undefined) ||
      (dueDateFilter === 'withoutDueDate' && task.dueDate === undefined)

    return (
      matchesQuery && matchesStatus && matchesPriority && matchesDueDate
    )
  })
}
