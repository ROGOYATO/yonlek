import type { Task, TaskPriority, TaskStatus } from './task'

export interface TaskFilter {
  query: string
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
}

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  const query = filter.query.trim().toLowerCase()

  return tasks.filter((task) => {
    const matchesQuery =
      query.length === 0 || task.title.toLowerCase().includes(query)
    const matchesStatus =
      filter.status === 'all' || task.status === filter.status
    const matchesPriority =
      filter.priority === 'all' || task.priority === filter.priority

    return matchesQuery && matchesStatus && matchesPriority
  })
}
