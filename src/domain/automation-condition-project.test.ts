import { describe, expect, it } from 'vitest'

import { matchesAutomationCondition } from './automation-condition'
import type { WorkspaceState } from './workspace'

const workspace: WorkspaceState = {
  projects: [
    { id: 'project-a', name: 'Alpha', createdAt: '2026-09-26T00:00:00.000Z' },
    { id: 'project-b', name: 'Beta', createdAt: '2026-09-26T00:00:00.000Z' },
  ],
  tasks: [
    {
      id: 'task-1',
      projectId: 'project-a',
      title: 'Prepare launch',
      status: 'todo',
      priority: 'normal',
      createdAt: '2026-09-26T00:00:00.000Z',
    },
  ],
}

describe('Automation Project condition', () => {
  it('matches the Task project from one Workspace snapshot', () => {
    expect(
      matchesAutomationCondition(
        { kind: 'project', projectId: 'project-a' },
        workspace,
        'task-1',
      ),
    ).toBe(true)
    expect(
      matchesAutomationCondition(
        { kind: 'project', projectId: 'project-b' },
        workspace,
        'task-1',
      ),
    ).toBe(false)
  })

  it('does not match a Task missing from the Workspace snapshot', () => {
    expect(
      matchesAutomationCondition(
        { kind: 'project', projectId: 'project-a' },
        workspace,
        'missing-task',
      ),
    ).toBe(false)
  })
})
