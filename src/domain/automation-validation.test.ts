import { describe, expect, it } from 'vitest'

import {
  createAutomation,
  renameAutomation,
  setAutomationActions,
  setAutomationConditions,
  setAutomationEnabled,
  setAutomationTrigger,
} from './automation'

function automation() {
  return createAutomation({
    id: 'automation-1',
    name: 'Daily triage',
    enabled: true,
    trigger: { kind: 'task.created' },
    conditions: [{ kind: 'project', projectId: 'project-1' }],
    actions: [{ kind: 'priority.set', priority: 'high' }],
  })
}

describe('Automation validation and immutable updates', () => {
  it('rejects malformed trigger, condition, and action records', () => {
    expect(() =>
      createAutomation({
        id: 'automation-trigger',
        name: 'Bad trigger',
        enabled: true,
        trigger: { kind: 'task.unknown' } as never,
        conditions: [],
        actions: [],
      }),
    ).toThrow('Automation trigger is invalid')

    expect(() =>
      createAutomation({
        id: 'automation-condition',
        name: 'Bad condition',
        enabled: true,
        trigger: { kind: 'task.created' },
        conditions: [{ kind: 'project', projectId: '   ' }],
        actions: [],
      }),
    ).toThrow('Automation project condition requires a project id')

    expect(() =>
      createAutomation({
        id: 'automation-action',
        name: 'Bad action',
        enabled: true,
        trigger: { kind: 'task.created' },
        conditions: [],
        actions: [{ kind: 'list.move', listId: '   ' }],
      }),
    ).toThrow('Automation list action requires a list id')
  })

  it('renames without mutating the previous Automation or changing its id', () => {
    const current = automation()
    const next = renameAutomation(current, '  Morning triage  ')

    expect(next).not.toBe(current)
    expect(next.id).toBe(current.id)
    expect(next.name).toBe('Morning triage')
    expect(current.name).toBe('Daily triage')
  })

  it('updates enabled and trigger state immutably', () => {
    const current = automation()
    const disabled = setAutomationEnabled(current, false)
    const retriggered = setAutomationTrigger(disabled, {
      kind: 'task.dueDateChanged',
    })

    expect(disabled).not.toBe(current)
    expect(disabled.enabled).toBe(false)
    expect(current.enabled).toBe(true)
    expect(retriggered).not.toBe(disabled)
    expect(retriggered.id).toBe(current.id)
    expect(retriggered.trigger).toEqual({ kind: 'task.dueDateChanged' })
  })

  it('copies condition and action arrays during immutable updates', () => {
    const current = automation()
    const conditions = [{ kind: 'tag' as const, tagId: 'tag-1' }]
    const actions = [{ kind: 'status.set' as const, status: 'done' as const }]
    const withConditions = setAutomationConditions(current, conditions)
    const withActions = setAutomationActions(withConditions, actions)

    conditions.push({ kind: 'tag', tagId: 'tag-2' })
    actions.push({ kind: 'status.set', status: 'todo' })

    expect(withConditions.conditions).toEqual([
      { kind: 'tag', tagId: 'tag-1' },
    ])
    expect(withActions.actions).toEqual([
      { kind: 'status.set', status: 'done' },
    ])
    expect(current.conditions).toEqual([
      { kind: 'project', projectId: 'project-1' },
    ])
    expect(current.actions).toEqual([
      { kind: 'priority.set', priority: 'high' },
    ])
  })
})
