import { describe, expect, it } from 'vitest'

import { matchesAutomationCondition } from './automation-condition'
import type { WorkspaceState } from './workspace'

const workspace: WorkspaceState = {
  projects: [{ id: 'project-1', name: 'Inbox', createdAt: '2026-09-26T00:00:00.000Z' }],
  tasks: [
    {
      id: 'task-priority',
      projectId: 'project-1',
      title: 'Escalate incident',
      status: 'todo',
      priority: 'high',
      createdAt: '2026-09-26T00:00:00.000Z',
    },
  ],
}

describe('Automation Priority condition', () => {
  it('matches only the current Task priority in the supplied Workspace snapshot', () => {
    expect(
      matchesAutomationCondition(
        { kind: 'priority', priority: 'high' },
        workspace,
        'task-priority',
      ),
    ).toBe(true)
    expect(
      matchesAutomationCondition(
        { kind: 'priority', priority: 'low' },
        workspace,
        'task-priority',
      ),
    ).toBe(false)
  })
})
