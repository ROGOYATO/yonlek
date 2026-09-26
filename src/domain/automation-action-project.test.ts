import { describe, expect, it } from 'vitest'

import {
  applyAutomationAction,
  createAutomationExecutionContext,
} from './automation-action'
import type { WorkspaceState } from './workspace'

function context() {
  return createAutomationExecutionContext({
    occurredAt: '2026-09-26T01:10:00.000Z',
    maxActionApplications: 4,
  })
}

function workspace(): WorkspaceState {
  return {
    projects: [
      { id: 'project-a', name: 'Alpha', createdAt: '2026-09-26T00:00:00.000Z' },
      { id: 'project-b', name: 'Beta', createdAt: '2026-09-26T00:00:00.000Z' },
    ],
    lists: [
      { id: 'list-a', projectId: 'project-a', name: 'Queue', createdAt: '2026-09-26T00:00:00.000Z' },
    ],
    tasks: [
      {
        id: 'task-parent',
        projectId: 'project-a',
        listId: 'list-a',
        title: 'Parent',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-26T00:00:00.000Z',
      },
      {
        id: 'task-child',
        parentTaskId: 'task-parent',
        projectId: 'project-a',
        listId: 'list-a',
        title: 'Child',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-26T00:00:00.000Z',
      },
    ],
  }
}

describe('Automation Project move action', () => {
  it('moves the Task subtree and clears incompatible List placement', () => {
    const current = workspace()
    const result = applyAutomationAction(
      { kind: 'project.move', projectId: 'project-b' },
      current,
      'task-parent',
      context(),
    )

    expect(result.workspace.tasks).toMatchObject([
      { id: 'task-parent', projectId: 'project-b' },
      { id: 'task-child', projectId: 'project-b' },
    ])
    expect(result.workspace.tasks[0]).not.toHaveProperty('listId')
    expect(result.workspace.tasks[1]).not.toHaveProperty('listId')
    expect(current.tasks[0]).toMatchObject({ projectId: 'project-a', listId: 'list-a' })
  })

  it('reuses the Workspace invariant that rejects a missing target Project', () => {
    expect(() =>
      applyAutomationAction(
        { kind: 'project.move', projectId: 'missing-project' },
        workspace(),
        'task-parent',
        context(),
      ),
    ).toThrow('Cannot move a task to a missing project')
  })
})
