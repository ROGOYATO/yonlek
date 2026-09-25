import { describe, expect, it } from 'vitest'

import { createAutomation } from './automation'
import { matchAutomationTrigger } from './automation-trigger'
import type { TaskActivityEntry } from './task-activity'

function dueDateEntry(from: string | null, to: string | null, sequence: number): TaskActivityEntry {
  return {
    sequence,
    occurredAt: '2026-09-26T00:03:00.000Z',
    taskId: 'task-due',
    taskTitle: 'Schedule review',
    event: { kind: 'task.dueDateChanged', from, to },
  }
}

describe('Automation task.dueDateChanged trigger matching', () => {
  const automation = createAutomation({
    id: 'automation-due-date',
    name: 'Due date trigger',
    enabled: true,
    trigger: { kind: 'task.dueDateChanged' },
  })

  it('matches when a due date is set', () => {
    expect(
      matchAutomationTrigger(
        automation,
        dueDateEntry(null, '2026-10-01', 31),
      ),
    ).toMatchObject({
      taskId: 'task-due',
      activitySequence: 31,
      triggerKind: 'task.dueDateChanged',
    })
  })

  it('matches when a due date is cleared', () => {
    expect(
      matchAutomationTrigger(
        automation,
        dueDateEntry('2026-10-01', null, 32),
      ),
    ).toMatchObject({
      taskId: 'task-due',
      activitySequence: 32,
      triggerKind: 'task.dueDateChanged',
    })
  })
})
