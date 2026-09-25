import { validateAutomation, type Automation, type AutomationCondition } from './automation'
import type { WorkspaceState } from './workspace'

type WorkspaceTask = WorkspaceState['tasks'][number]

function matchesConditionAgainstTask(
  condition: AutomationCondition,
  task: WorkspaceTask,
): boolean {
  switch (condition.kind) {
    case 'project':
      return task.projectId === condition.projectId

    case 'status':
      return task.status === condition.status

    case 'priority':
      return task.priority === condition.priority

    case 'dueDate.present':
      return (task.dueDate !== undefined) === condition.present

    case 'tag':
      return (task.tagIds ?? []).includes(condition.tagId)

    default:
      return false
  }
}

export function matchesAutomationCondition(
  condition: AutomationCondition,
  workspace: WorkspaceState,
  taskId: string,
): boolean {
  const task = workspace.tasks.find((candidate) => candidate.id === taskId)
  return task ? matchesConditionAgainstTask(condition, task) : false
}

export function matchesAutomationConditions(
  automation: Automation,
  workspace: WorkspaceState,
  taskId: string,
): boolean {
  validateAutomation(automation)
  const task = workspace.tasks.find((candidate) => candidate.id === taskId)
  if (!task) return false

  return automation.conditions.every((condition) =>
    matchesConditionAgainstTask(condition, task),
  )
}
