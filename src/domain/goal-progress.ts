
import type { Goal } from './goal'

export interface GoalProgressValues {
  currentValue: number
  targetValue: number
}

export function deriveManualGoalProgress(goal: Goal): GoalProgressValues {
  if (goal.targetType !== 'manual') {
    throw new Error('Manual Goal progress requires a manual target type')
  }

  return {
    currentValue: goal.currentValue,
    targetValue: goal.targetValue,
  }
}

export interface GoalProgressTask {
  id: string
  status: 'todo' | 'doing' | 'done'
}

export function deriveLinkedTaskGoalProgress(
  goal: Goal,
  tasks: GoalProgressTask[],
): GoalProgressValues {
  if (goal.targetType !== 'linkedTasks') {
    throw new Error('Linked-Task Goal progress requires a linkedTasks target type')
  }

  const taskById = new Map(tasks.map((task) => [task.id, task]))
  const linkedTaskIds = goal.linkedTaskIds ?? []
  const currentValue = linkedTaskIds.reduce(
    (completed, taskId) =>
      completed + (taskById.get(taskId)?.status === 'done' ? 1 : 0),
    0,
  )

  return {
    currentValue,
    targetValue: linkedTaskIds.length,
  }
}

export function deriveGoalProgressPercent(
  values: GoalProgressValues,
): number {
  if (values.targetValue === 0) {
    return values.currentValue > 0 ? 100 : 0
  }

  const percent = (values.currentValue / values.targetValue) * 100
  return Math.max(0, Math.min(100, percent))
}

export interface GoalProgressSummary extends GoalProgressValues {
  targetType: Goal['targetType']
  percent: number
}

export function summarizeGoalProgress(
  goal: Goal,
  tasks: GoalProgressTask[],
): GoalProgressSummary {
  const values =
    goal.targetType === 'manual'
      ? deriveManualGoalProgress(goal)
      : deriveLinkedTaskGoalProgress(goal, tasks)

  return {
    targetType: goal.targetType,
    ...values,
    percent: deriveGoalProgressPercent(values),
  }
}
