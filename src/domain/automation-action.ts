import type { AutomationAction } from './automation'
import {
  workspaceReducer,
  type ActivityTrackableWorkspaceAction,
  type WorkspaceState,
} from './workspace'

export interface CreateAutomationExecutionContextInput {
  occurredAt: string
  maxActionApplications: number
}

export interface AutomationExecutionContext {
  occurredAt: string
  remainingActionApplications: number
}

export interface AutomationActionApplicationResult {
  workspace: WorkspaceState
  context: AutomationExecutionContext
}

function isCanonicalIsoInstant(value: string): boolean {
  const instant = new Date(value)
  return !Number.isNaN(instant.getTime()) && instant.toISOString() === value
}

function assertExecutionContext(context: AutomationExecutionContext): void {
  if (!isCanonicalIsoInstant(context.occurredAt)) {
    throw new Error('Automation execution timestamp must be an ISO instant')
  }

  if (
    !Number.isInteger(context.remainingActionApplications) ||
    context.remainingActionApplications < 0
  ) {
    throw new Error('Automation action application budget is invalid')
  }
}

export function createAutomationExecutionContext(
  input: CreateAutomationExecutionContextInput,
): AutomationExecutionContext {
  if (!Number.isInteger(input.maxActionApplications) || input.maxActionApplications <= 0) {
    throw new Error('Automation action application limit must be a positive integer')
  }

  const context: AutomationExecutionContext = {
    occurredAt: input.occurredAt,
    remainingActionApplications: input.maxActionApplications,
  }
  assertExecutionContext(context)
  return context
}

function consumeExecutionContext(
  context: AutomationExecutionContext,
): AutomationExecutionContext {
  assertExecutionContext(context)
  if (context.remainingActionApplications === 0) {
    throw new Error('Automation action application limit reached')
  }

  return {
    ...context,
    remainingActionApplications: context.remainingActionApplications - 1,
  }
}

export function workspaceActionForAutomationAction(
  action: AutomationAction,
  taskId: string,
  context: AutomationExecutionContext,
): ActivityTrackableWorkspaceAction {
  assertExecutionContext(context)

  switch (action.kind) {
    case 'status.set':
      return { type: 'task/statusChanged', taskId, status: action.status }

    case 'priority.set':
      return { type: 'task/priorityChanged', taskId, priority: action.priority }

    case 'project.move':
      return { type: 'task/projectChanged', taskId, projectId: action.projectId }

    case 'list.move':
      return { type: 'task/listChanged', taskId, listId: action.listId }

    case 'task.archive':
      return { type: 'task/archived', taskId, archivedAt: context.occurredAt }

    default:
      throw new Error('Automation action kind is not supported')
  }
}

export function applyAutomationAction(
  action: AutomationAction,
  workspace: WorkspaceState,
  taskId: string,
  context: AutomationExecutionContext,
): AutomationActionApplicationResult {
  assertExecutionContext(context)
  if (!workspace.tasks.some((task) => task.id === taskId)) {
    throw new Error('Automation action target Task is missing')
  }

  const nextContext = consumeExecutionContext(context)
  const workspaceAction = workspaceActionForAutomationAction(
    action,
    taskId,
    context,
  )

  return {
    workspace: workspaceReducer(workspace, workspaceAction),
    context: nextContext,
  }
}
