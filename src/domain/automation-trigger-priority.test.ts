import { describe, expect, it } from 'vitest'

import { createAutomation } from './automation'
import { matchAutomationTrigger } from './automation-trigger'
import type { TaskActivityEntry } from './task-activity'

describe('Automation task.priorityChanged trigger matching', () => {
  it('matches a priority-change Activity entry', () => {
    const automation = createAutomation({
      id: 'automation-priority',
      name: 'Priority trigger',
      enabled: true,
      trigger: { kind: 'task.priorityChanged' },
    })
    const entry: TaskActivityEntry = {
      sequence: 23,
      occurredAt: '2026-09-26T00:02:00.000Z',
      taskId: 'task-23',
      taskTitle: 'Escalate bug',
      event: { kind: 'task.priorityChanged', from: 'normal', to: 'high' },
    }

    expect(matchAutomationTrigger(automation, entry)).toMatchObject({
      automationId: 'automation-priority',
      taskId: 'task-23',
      activitySequence: 23,
      triggerKind: 'task.priorityChanged',
    })
  })
})
