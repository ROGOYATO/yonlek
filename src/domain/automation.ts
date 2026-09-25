import type { TaskPriority, TaskStatus } from './task'

export interface AutomationIdentity {
  id: string
  name: string
  enabled: boolean
}

export interface CreateAutomationIdentityInput {
  id: string
  name: string
  enabled: boolean
}

export type AutomationTrigger =
  | { kind: 'task.created' }
  | { kind: 'task.statusChanged' }
  | { kind: 'task.priorityChanged' }
  | { kind: 'task.dueDateChanged' }
  | { kind: 'task.archived' }
  | { kind: 'task.restored' }

export type AutomationCondition =
  | { kind: 'project'; projectId: string }
  | { kind: 'status'; status: TaskStatus }
  | { kind: 'priority'; priority: TaskPriority }
  | { kind: 'dueDate.present'; present: boolean }
  | { kind: 'tag'; tagId: string }

export type AutomationAction =
  | { kind: 'status.set'; status: TaskStatus }
  | { kind: 'priority.set'; priority: TaskPriority }
  | { kind: 'project.move'; projectId: string }
  | { kind: 'list.move'; listId: string }
  | { kind: 'task.archive' }

export interface Automation extends AutomationIdentity {
  trigger: AutomationTrigger
  conditions: AutomationCondition[]
  actions: AutomationAction[]
}

export interface CreateAutomationInput extends CreateAutomationIdentityInput {
  trigger: AutomationTrigger
  conditions?: AutomationCondition[]
  actions?: AutomationAction[]
}

function normalizeReference(value: unknown, message: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(message)
  }

  return value.trim()
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === 'todo' || value === 'doing' || value === 'done'
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return value === 'low' || value === 'normal' || value === 'high'
}

function normalizeTrigger(trigger: AutomationTrigger): AutomationTrigger {
  switch (trigger?.kind) {
    case 'task.created':
    case 'task.statusChanged':
    case 'task.priorityChanged':
    case 'task.dueDateChanged':
    case 'task.archived':
    case 'task.restored':
      return { kind: trigger.kind }

    default:
      throw new Error('Automation trigger is invalid')
  }
}

function normalizeCondition(
  condition: AutomationCondition,
): AutomationCondition {
  switch (condition?.kind) {
    case 'project':
      return {
        kind: 'project',
        projectId: normalizeReference(
          condition.projectId,
          'Automation project condition requires a project id',
        ),
      }

    case 'status':
      if (!isTaskStatus(condition.status)) {
        throw new Error('Automation status condition is invalid')
      }
      return { kind: 'status', status: condition.status }

    case 'priority':
      if (!isTaskPriority(condition.priority)) {
        throw new Error('Automation priority condition is invalid')
      }
      return { kind: 'priority', priority: condition.priority }

    case 'dueDate.present':
      if (typeof condition.present !== 'boolean') {
        throw new Error('Automation due-date condition is invalid')
      }
      return { kind: 'dueDate.present', present: condition.present }

    case 'tag':
      return {
        kind: 'tag',
        tagId: normalizeReference(
          condition.tagId,
          'Automation tag condition requires a tag id',
        ),
      }

    default:
      throw new Error('Automation condition is invalid')
  }
}

function normalizeAction(action: AutomationAction): AutomationAction {
  switch (action?.kind) {
    case 'status.set':
      if (!isTaskStatus(action.status)) {
        throw new Error('Automation status action is invalid')
      }
      return { kind: 'status.set', status: action.status }

    case 'priority.set':
      if (!isTaskPriority(action.priority)) {
        throw new Error('Automation priority action is invalid')
      }
      return { kind: 'priority.set', priority: action.priority }

    case 'project.move':
      return {
        kind: 'project.move',
        projectId: normalizeReference(
          action.projectId,
          'Automation project action requires a project id',
        ),
      }

    case 'list.move':
      return {
        kind: 'list.move',
        listId: normalizeReference(
          action.listId,
          'Automation list action requires a list id',
        ),
      }

    case 'task.archive':
      return { kind: 'task.archive' }

    default:
      throw new Error('Automation action is invalid')
  }
}

export function createAutomationIdentity(
  input: CreateAutomationIdentityInput,
): AutomationIdentity {
  const id = input.id.trim()
  const name = input.name.trim()

  if (!id) {
    throw new Error('Automation id is required')
  }

  if (!name) {
    throw new Error('Automation name is required')
  }

  if (typeof input.enabled !== 'boolean') {
    throw new Error('Automation enabled state must be boolean')
  }

  return {
    id,
    name,
    enabled: input.enabled,
  }
}

export function createAutomation(input: CreateAutomationInput): Automation {
  return {
    ...createAutomationIdentity(input),
    trigger: normalizeTrigger(input.trigger),
    conditions: (input.conditions ?? []).map(normalizeCondition),
    actions: (input.actions ?? []).map(normalizeAction),
  }
}

export function validateAutomation(automation: Automation): void {
  createAutomationIdentity(automation)
  normalizeTrigger(automation.trigger)

  if (!Array.isArray(automation.conditions)) {
    throw new Error('Automation conditions must be an array')
  }

  if (!Array.isArray(automation.actions)) {
    throw new Error('Automation actions must be an array')
  }

  automation.conditions.forEach(normalizeCondition)
  automation.actions.forEach(normalizeAction)
}

export function renameAutomation(
  automation: Automation,
  nextName: string,
): Automation {
  validateAutomation(automation)
  const identity = createAutomationIdentity({
    id: automation.id,
    name: nextName,
    enabled: automation.enabled,
  })

  return {
    ...automation,
    name: identity.name,
  }
}

export function setAutomationEnabled(
  automation: Automation,
  enabled: boolean,
): Automation {
  validateAutomation(automation)

  if (typeof enabled !== 'boolean') {
    throw new Error('Automation enabled state must be boolean')
  }

  return {
    ...automation,
    enabled,
  }
}

export function setAutomationTrigger(
  automation: Automation,
  trigger: AutomationTrigger,
): Automation {
  validateAutomation(automation)

  return {
    ...automation,
    trigger: normalizeTrigger(trigger),
  }
}

export function setAutomationConditions(
  automation: Automation,
  conditions: AutomationCondition[],
): Automation {
  validateAutomation(automation)

  if (!Array.isArray(conditions)) {
    throw new Error('Automation conditions must be an array')
  }

  return {
    ...automation,
    conditions: conditions.map(normalizeCondition),
  }
}

export function setAutomationActions(
  automation: Automation,
  actions: AutomationAction[],
): Automation {
  validateAutomation(automation)

  if (!Array.isArray(actions)) {
    throw new Error('Automation actions must be an array')
  }

  return {
    ...automation,
    actions: actions.map(normalizeAction),
  }
}
