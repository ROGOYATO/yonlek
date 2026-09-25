import { describe, expect, it } from 'vitest'

import {
  createAutomation,
  type AutomationAction,
  type AutomationCondition,
  type AutomationTrigger,
} from './automation'

describe('Automation trigger, condition, and action records', () => {
  it('stores typed rule records without executing them', () => {
    const automation = createAutomation({
      id: 'automation-1',
      name: 'Triage urgent Tasks',
      enabled: true,
      trigger: { kind: 'task.statusChanged' },
      conditions: [
        { kind: 'project', projectId: 'project-1' },
        { kind: 'status', status: 'doing' },
        { kind: 'priority', priority: 'high' },
        { kind: 'dueDate.present', present: true },
        { kind: 'tag', tagId: 'tag-1' },
      ],
      actions: [
        { kind: 'status.set', status: 'done' },
        { kind: 'priority.set', priority: 'normal' },
        { kind: 'project.move', projectId: 'project-2' },
        { kind: 'list.move', listId: 'list-1' },
        { kind: 'task.archive' },
      ],
    })

    expect(automation.trigger).toEqual({ kind: 'task.statusChanged' })
    expect(automation.conditions).toHaveLength(5)
    expect(automation.actions).toHaveLength(5)
  })

  it('represents every trigger planned for the local trigger batch', () => {
    const triggers: AutomationTrigger[] = [
      { kind: 'task.created' },
      { kind: 'task.statusChanged' },
      { kind: 'task.priorityChanged' },
      { kind: 'task.dueDateChanged' },
      { kind: 'task.archived' },
      { kind: 'task.restored' },
    ]
    const conditions: AutomationCondition[] = [
      { kind: 'project', projectId: 'project-1' },
      { kind: 'status', status: 'todo' },
      { kind: 'priority', priority: 'low' },
      { kind: 'dueDate.present', present: false },
      { kind: 'tag', tagId: 'tag-1' },
    ]
    const actions: AutomationAction[] = [
      { kind: 'status.set', status: 'doing' },
      { kind: 'priority.set', priority: 'high' },
      { kind: 'project.move', projectId: 'project-2' },
      { kind: 'list.move', listId: 'list-1' },
      { kind: 'task.archive' },
    ]

    expect(triggers.map((trigger) => trigger.kind)).toEqual([
      'task.created',
      'task.statusChanged',
      'task.priorityChanged',
      'task.dueDateChanged',
      'task.archived',
      'task.restored',
    ])
    expect(conditions.map((condition) => condition.kind)).toEqual([
      'project',
      'status',
      'priority',
      'dueDate.present',
      'tag',
    ])
    expect(actions.map((action) => action.kind)).toEqual([
      'status.set',
      'priority.set',
      'project.move',
      'list.move',
      'task.archive',
    ])
  })
})
