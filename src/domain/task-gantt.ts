import { setTaskDueDate, setTaskStartDate, type Task } from './task'
import type { TaskRelationship } from './task-relationship'

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

export type TaskGanttBaselineStatus = 'none' | 'unchanged' | 'changed' | 'unscheduled'

export function createTaskGanttBaselineComparison(task: Task): TaskGanttBaselineStatus {
  const baseline = task.ganttBaseline
  if (!baseline) return 'none'
  if (task.startDate === undefined || task.dueDate === undefined) return 'unscheduled'
  return task.startDate === baseline.startDate && task.dueDate === baseline.dueDate
    ? 'unchanged'
    : 'changed'
}

export interface TaskGanttDependencyEdge {
  relationshipId: string
  sourceTaskId: string
  targetTaskId: string
  sourceTitle: string
  targetTitle: string
  directionLabel: string
}

export function createTaskGanttDependencyEdges(
  tasks: readonly Task[],
  relationships: readonly TaskRelationship[],
): TaskGanttDependencyEdge[] {
  const taskById = new Map(tasks.map((task) => [task.id, task]))
  const edges: TaskGanttDependencyEdge[] = []

  for (const relationship of relationships) {
    if (relationship.type !== 'blocks') {
      continue
    }

    const sourceTask = taskById.get(relationship.sourceTaskId)
    const targetTask = taskById.get(relationship.targetTaskId)

    if (!sourceTask || !targetTask) {
      continue
    }

    edges.push({
      relationshipId: relationship.id,
      sourceTaskId: relationship.sourceTaskId,
      targetTaskId: relationship.targetTaskId,
      sourceTitle: sourceTask.title,
      targetTitle: targetTask.title,
      directionLabel: `${sourceTask.title} blocks ${targetTask.title}`,
    })
  }

  return edges
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
