import { describe, expect, it } from 'vitest'

import { createAutomation } from './automation'
import { matchAutomationTrigger } from './automation-trigger'
import type { TaskActivityEntry } from './task-activity'

describe('Automation task.statusChanged trigger matching', () => {
  it('matches the status-change Activity boundary and preserves its sequence', () => {
    const automation = createAutomation({
      id: 'automation-status',
      name: 'Status trigger',
      enabled: true,
      trigger: { kind: 'task.statusChanged' },
    })
    const entry: TaskActivityEntry = {
      sequence: 17,
      occurredAt: '2026-09-26T00:01:00.000Z',
      taskId: 'task-17',
      taskTitle: 'Ship release',
      event: { kind: 'task.statusChanged', from: 'todo', to: 'doing' },
    }

    expect(matchAutomationTrigger(automation, entry)).toEqual({
      automationId: 'automation-status',
      taskId: 'task-17',
      activitySequence: 17,
      triggerKind: 'task.statusChanged',
    })
  })
})
