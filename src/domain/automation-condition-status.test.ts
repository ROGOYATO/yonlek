import { describe, expect, it } from 'vitest'

import { matchesAutomationCondition } from './automation-condition'
import type { WorkspaceState } from './workspace'

const workspace: WorkspaceState = {
  projects: [{ id: 'project-1', name: 'Inbox', createdAt: '2026-09-26T00:00:00.000Z' }],
  tasks: [
    {
      id: 'task-status',
      projectId: 'project-1',
      title: 'Review queue',
      status: 'doing',
      priority: 'normal',
      createdAt: '2026-09-26T00:00:00.000Z',
    },
  ],
}

describe('Automation Status condition', () => {
  it('matches only the current Task status in the supplied Workspace snapshot', () => {
    expect(
      matchesAutomationCondition(
        { kind: 'status', status: 'doing' },
        workspace,
        'task-status',
      ),
    ).toBe(true)
    expect(
      matchesAutomationCondition(
        { kind: 'status', status: 'done' },
        workspace,
        'task-status',
      ),
    ).toBe(false)
  })
})
