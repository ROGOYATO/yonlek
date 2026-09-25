import { describe, expect, it } from 'vitest'

import { createAutomation } from './automation'
import { emptyWorkspace, workspaceReducer } from './workspace'

function automation(id = 'automation-1') {
  return createAutomation({
    id,
    name: 'Daily triage',
    enabled: true,
    trigger: { kind: 'task.created' },
    conditions: [],
    actions: [{ kind: 'priority.set', priority: 'high' }],
  })
}

describe('Workspace Automation collection', () => {
  it('adds an Automation and rejects duplicate ids', () => {
    const first = automation()
    const withAutomation = workspaceReducer(emptyWorkspace, {
      type: 'automation/added',
      automation: first,
    } as never)

    expect(withAutomation.automations).toEqual([first])
    expect(emptyWorkspace).not.toHaveProperty('automations')
    expect(() =>
      workspaceReducer(withAutomation, {
        type: 'automation/added',
        automation: automation('automation-1'),
      } as never),
    ).toThrow('Automation id must be unique')
  })

  it('updates one Automation immutably without changing its id', () => {
    const first = workspaceReducer(emptyWorkspace, {
      type: 'automation/added',
      automation: automation(),
    } as never)
    const renamed = workspaceReducer(first, {
      type: 'automation/nameChanged',
      automationId: 'automation-1',
      name: 'Morning triage',
    } as never)
    const disabled = workspaceReducer(renamed, {
      type: 'automation/enabledChanged',
      automationId: 'automation-1',
      enabled: false,
    } as never)
    const retriggered = workspaceReducer(disabled, {
      type: 'automation/triggerChanged',
      automationId: 'automation-1',
      trigger: { kind: 'task.statusChanged' },
    } as never)
    const conditioned = workspaceReducer(retriggered, {
      type: 'automation/conditionsChanged',
      automationId: 'automation-1',
      conditions: [{ kind: 'status', status: 'doing' }],
    } as never)
    const actioned = workspaceReducer(conditioned, {
      type: 'automation/actionsChanged',
      automationId: 'automation-1',
      actions: [{ kind: 'status.set', status: 'done' }],
    } as never)

    expect(first.automations?.[0]?.name).toBe('Daily triage')
    expect(actioned.automations?.[0]).toMatchObject({
      id: 'automation-1',
      name: 'Morning triage',
      enabled: false,
      trigger: { kind: 'task.statusChanged' },
      conditions: [{ kind: 'status', status: 'doing' }],
      actions: [{ kind: 'status.set', status: 'done' }],
    })
  })

  it('deletes the last Automation without leaving an empty optional collection', () => {
    const withAutomation = workspaceReducer(emptyWorkspace, {
      type: 'automation/added',
      automation: automation(),
    } as never)
    const next = workspaceReducer(withAutomation, {
      type: 'automation/deleted',
      automationId: 'automation-1',
    } as never)

    expect(next).not.toHaveProperty('automations')
    expect(withAutomation.automations).toHaveLength(1)
  })
})
