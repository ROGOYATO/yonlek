import { describe, expect, it } from 'vitest'

import {
  applyAutomationAction,
  createAutomationExecutionContext,
} from './automation-action'
import type { WorkspaceState } from './workspace'

const workspace: WorkspaceState = {
  projects: [
    { id: 'project-1', name: 'Inbox', createdAt: '2026-09-26T00:00:00.000Z' },
  ],
  tasks: [
    {
      id: 'task-priority',
      projectId: 'project-1',
      title: 'Escalate incident',
      status: 'todo',
      priority: 'normal',
      createdAt: '2026-09-26T00:00:00.000Z',
    },
  ],
}

describe('Automation priority action', () => {
  it('sets Task priority using the existing Workspace reducer semantics', () => {
    const result = applyAutomationAction(
      { kind: 'priority.set', priority: 'high' },
      workspace,
      'task-priority',
      createAutomationExecutionContext({
        occurredAt: '2026-09-26T01:05:00.000Z',
        maxActionApplications: 3,
      }),
    )

    expect(result.workspace.tasks[0]?.priority).toBe('high')
    expect(workspace.tasks[0]?.priority).toBe('normal')
    expect(result.context.remainingActionApplications).toBe(2)
  })
})
