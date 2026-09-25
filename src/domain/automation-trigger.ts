import { validateAutomation, type Automation, type AutomationTrigger } from './automation'
import type { TaskActivityEntry } from './task-activity'

export interface AutomationTriggerMatch {
  automationId: string
  taskId: string
  activitySequence: number
  triggerKind: AutomationTrigger['kind']
}

function isSupportedTriggerKind(kind: AutomationTrigger['kind']): boolean {
  switch (kind) {
    case 'task.created':
    case 'task.statusChanged':
    case 'task.priorityChanged':
    case 'task.dueDateChanged':
    case 'task.archived':
    case 'task.restored':
      return true

    default:
      return false
  }
}

export function matchAutomationTrigger(
  automation: Automation,
  entry: TaskActivityEntry,
): AutomationTriggerMatch | null {
  validateAutomation(automation)

  if (!automation.enabled || !isSupportedTriggerKind(automation.trigger.kind)) {
    return null
  }

  if (entry.event.kind !== automation.trigger.kind) {
    return null
  }

  return {
    automationId: automation.id,
    taskId: entry.taskId,
    activitySequence: entry.sequence,
    triggerKind: automation.trigger.kind,
  }
}

export function matchAutomationTriggers(
  automations: Automation[],
  entries: TaskActivityEntry[],
): AutomationTriggerMatch[] {
  const matches: AutomationTriggerMatch[] = []

  for (const entry of entries) {
    for (const automation of automations) {
      const match = matchAutomationTrigger(automation, entry)
      if (match) matches.push(match)
    }
  }

  return matches
}
