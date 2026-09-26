import { describe, expect, it } from 'vitest'

import {
  applyAutomationAction,
  createAutomationExecutionContext,
} from './automation-action'
import type { WorkspaceState } from './workspace'

function workspace(): WorkspaceState {
  return {
    projects: [
      { id: 'project-1', name: 'Inbox', createdAt: '2026-09-26T00:00:00.000Z' },
    ],
    tasks: [
      {
        id: 'task-parent',
        projectId: 'project-1',
        title: 'Parent',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-26T00:00:00.000Z',
      },
      {
        id: 'task-child',
        parentTaskId: 'task-parent',
        projectId: 'project-1',
        title: 'Child',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-26T00:00:00.000Z',
      },
      {
        id: 'task-sibling',
        projectId: 'project-1',
        title: 'Sibling',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-26T00:00:00.000Z',
      },
    ],
  }
}

describe('Automation archive action', () => {
  it('archives the target Task subtree at the explicit execution timestamp', () => {
    const current = workspace()
    const result = applyAutomationAction(
      { kind: 'task.archive' },
      current,
      'task-parent',
      createAutomationExecutionContext({
        occurredAt: '2026-09-26T01:20:00.000Z',
        maxActionApplications: 5,
      }),
    )

    expect(result.workspace.tasks[0]?.archivedAt).toBe('2026-09-26T01:20:00.000Z')
    expect(result.workspace.tasks[1]?.archivedAt).toBe('2026-09-26T01:20:00.000Z')
    expect(result.workspace.tasks[2]).not.toHaveProperty('archivedAt')
    expect(current.tasks[0]).not.toHaveProperty('archivedAt')
  })

  it('does not append Activity or run another Automation inside the pure action layer', () => {
    const current = workspace()
    const result = applyAutomationAction(
      { kind: 'task.archive' },
      current,
      'task-parent',
      createAutomationExecutionContext({
        occurredAt: '2026-09-26T01:20:00.000Z',
        maxActionApplications: 5,
      }),
    )

    expect(result.workspace).not.toHaveProperty('activity')
    expect(result.context.remainingActionApplications).toBe(4)
  })
})
