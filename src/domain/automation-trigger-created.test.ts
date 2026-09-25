import { describe, expect, it } from 'vitest'

import { createAutomation } from './automation'
import { matchAutomationTrigger } from './automation-trigger'
import type { TaskActivityEntry, TaskActivityEvent } from './task-activity'

function entry(event: TaskActivityEvent, sequence = 1): TaskActivityEntry {
  return {
    sequence,
    occurredAt: '2026-09-26T00:00:00.000Z',
    taskId: 'task-1',
    taskTitle: 'Prepare launch notes',
    event,
  }
}

function createdAutomation(enabled = true) {
  return createAutomation({
    id: 'automation-created',
    name: 'New Task trigger',
    enabled,
    trigger: { kind: 'task.created' },
  })
}

describe('Automation task.created trigger matching', () => {
  it('matches a Task Activity created event without executing an action', () => {
    expect(
      matchAutomationTrigger(
        createdAutomation(),
        entry({
          kind: 'task.created',
          projectId: 'project-1',
          projectName: 'Inbox',
        }),
      ),
    ).toEqual({
      automationId: 'automation-created',
      taskId: 'task-1',
      activitySequence: 1,
      triggerKind: 'task.created',
    })
  })

  it('ignores an unrelated Task Activity event', () => {
    expect(
      matchAutomationTrigger(
        createdAutomation(),
        entry({ kind: 'task.titleChanged', from: 'Before', to: 'After' }),
      ),
    ).toBeNull()
  })

  it('does not match a disabled Automation', () => {
    expect(
      matchAutomationTrigger(
        createdAutomation(false),
        entry({
          kind: 'task.created',
          projectId: 'project-1',
          projectName: 'Inbox',
        }),
      ),
    ).toBeNull()
  })
})
