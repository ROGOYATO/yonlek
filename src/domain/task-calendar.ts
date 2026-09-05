import type { Task } from './task'

export interface TaskCalendarSection {
  key: string
  label: string
  tasks: Task[]
}

export function createTaskCalendarSections(
  tasks: Task[],
): TaskCalendarSection[] {
  const dated = new Map<string, Task[]>()
  const undated: Task[] = []

  for (const task of tasks) {
    if (task.dueDate === undefined) {
      undated.push(task)
      continue
    }

    const section = dated.get(task.dueDate) ?? []
    section.push(task)
    dated.set(task.dueDate, section)
  }

  const sections = [...dated.keys()]
    .sort((left, right) => left.localeCompare(right))
    .map((dueDate) => ({
      key: dueDate,
      label: dueDate,
      tasks: dated.get(dueDate) ?? [],
    }))

  if (undated.length > 0) {
    sections.push({
      key: 'undated',
      label: 'No due date',
      tasks: undated,
    })
  }

  return sections
}
