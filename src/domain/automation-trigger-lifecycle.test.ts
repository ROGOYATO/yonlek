import { describe, expect, it } from 'vitest'

import { createAutomation, type Automation } from './automation'
import * as automationTrigger from './automation-trigger'
import type { TaskActivityEntry, TaskActivityEvent } from './task-activity'

function entry(sequence: number, taskId: string, event: TaskActivityEvent): TaskActivityEntry {
  return {
    sequence,
    occurredAt: `2026-09-26T00:0${sequence}:00.000Z`,
    taskId,
    taskTitle: taskId,
    event,
  }
}

const { matchAutomationTrigger } = automationTrigger

const batchMatcher = (automationTrigger as {
  matchAutomationTriggers?: (
    automations: Automation[],
    entries: TaskActivityEntry[],
  ) => unknown
}).matchAutomationTriggers

describe('Automation archive/restore trigger matching', () => {
  it('matches task.archived from the Activity boundary', () => {
    const automation = createAutomation({
      id: 'automation-archive',
      name: 'Archive trigger',
      enabled: true,
      trigger: { kind: 'task.archived' },
    })

    expect(
      matchAutomationTrigger(
        automation,
        entry(4, 'task-archive', { kind: 'task.archived' }),
      ),
    ).toMatchObject({
      automationId: 'automation-archive',
      taskId: 'task-archive',
      triggerKind: 'task.archived',
    })
  })

  it('matches task.restored from the Activity boundary', () => {
    const automation = createAutomation({
      id: 'automation-restore',
      name: 'Restore trigger',
      enabled: true,
      trigger: { kind: 'task.restored' },
    })

    expect(
      matchAutomationTrigger(
        automation,
        entry(5, 'task-restore', { kind: 'task.restored' }),
      ),
    ).toMatchObject({
      automationId: 'automation-restore',
      taskId: 'task-restore',
      triggerKind: 'task.restored',
    })
  })

  it('matches enabled Automations deterministically in Activity order then Automation order', () => {
    const automations = [
      createAutomation({
        id: 'created-a',
        name: 'Created A',
        enabled: true,
        trigger: { kind: 'task.created' },
      }),
      createAutomation({
        id: 'created-disabled',
        name: 'Created disabled',
        enabled: false,
        trigger: { kind: 'task.created' },
      }),
      createAutomation({
        id: 'created-b',
        name: 'Created B',
        enabled: true,
        trigger: { kind: 'task.created' },
      }),
      createAutomation({
        id: 'status-a',
        name: 'Status A',
        enabled: true,
        trigger: { kind: 'task.statusChanged' },
      }),
    ]
    const entries = [
      entry(1, 'task-1', {
        kind: 'task.created',
        projectId: 'project-1',
        projectName: 'Inbox',
      }),
      entry(2, 'task-1', { kind: 'task.titleChanged', from: 'Old', to: 'New' }),
      entry(3, 'task-1', { kind: 'task.statusChanged', from: 'todo', to: 'doing' }),
    ]

    expect(batchMatcher).toBeTypeOf('function')
    expect(batchMatcher!(automations, entries)).toEqual([
      {
        automationId: 'created-a',
        taskId: 'task-1',
        activitySequence: 1,
        triggerKind: 'task.created',
      },
      {
        automationId: 'created-b',
        taskId: 'task-1',
        activitySequence: 1,
        triggerKind: 'task.created',
      },
      {
        automationId: 'status-a',
        taskId: 'task-1',
        activitySequence: 3,
        triggerKind: 'task.statusChanged',
      },
    ])
  })
})
