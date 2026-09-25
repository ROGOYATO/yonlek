import { describe, expect, it } from 'vitest'

import { matchesAutomationCondition } from './automation-condition'
import type { WorkspaceState } from './workspace'

const workspace: WorkspaceState = {
  projects: [{ id: 'project-1', name: 'Inbox', createdAt: '2026-09-26T00:00:00.000Z' }],
  tasks: [
    {
      id: 'task-dated',
      projectId: 'project-1',
      title: 'Scheduled review',
      status: 'todo',
      priority: 'normal',
      dueDate: '2026-10-02',
      createdAt: '2026-09-26T00:00:00.000Z',
    },
    {
      id: 'task-undated',
      projectId: 'project-1',
      title: 'Backlog item',
      status: 'todo',
      priority: 'normal',
      createdAt: '2026-09-26T00:00:00.000Z',
    },
  ],
}

describe('Automation due-date presence condition', () => {
  it('matches present=true only when the Task has a due date', () => {
    expect(
      matchesAutomationCondition(
        { kind: 'dueDate.present', present: true },
        workspace,
        'task-dated',
      ),
    ).toBe(true)
    expect(
      matchesAutomationCondition(
        { kind: 'dueDate.present', present: true },
        workspace,
        'task-undated',
      ),
    ).toBe(false)
  })

  it('matches present=false only when the Task has no due date', () => {
    expect(
      matchesAutomationCondition(
        { kind: 'dueDate.present', present: false },
        workspace,
        'task-undated',
      ),
    ).toBe(true)
    expect(
      matchesAutomationCondition(
        { kind: 'dueDate.present', present: false },
        workspace,
        'task-dated',
      ),
    ).toBe(false)
  })
})
