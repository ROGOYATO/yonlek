import { describe, expect, it } from 'vitest'

import {
  applyAutomationAction,
  createAutomationExecutionContext,
} from './automation-action'
import type { WorkspaceState } from './workspace'

function context() {
  return createAutomationExecutionContext({
    occurredAt: '2026-09-26T01:15:00.000Z',
    maxActionApplications: 4,
  })
}

const workspace: WorkspaceState = {
  projects: [
    { id: 'project-a', name: 'Alpha', createdAt: '2026-09-26T00:00:00.000Z' },
    { id: 'project-b', name: 'Beta', createdAt: '2026-09-26T00:00:00.000Z' },
  ],
  lists: [
    { id: 'list-a', projectId: 'project-a', name: 'Queue', createdAt: '2026-09-26T00:00:00.000Z' },
    { id: 'list-b', projectId: 'project-a', name: 'Ready', createdAt: '2026-09-26T00:00:00.000Z' },
    { id: 'list-other', projectId: 'project-b', name: 'Other', createdAt: '2026-09-26T00:00:00.000Z' },
  ],
  tasks: [
    {
      id: 'task-list',
      projectId: 'project-a',
      listId: 'list-a',
      title: 'Move me',
      status: 'todo',
      priority: 'normal',
      createdAt: '2026-09-26T00:00:00.000Z',
    },
  ],
}

describe('Automation List move action', () => {
  it('moves the Task to a List in the same Project', () => {
    const result = applyAutomationAction(
      { kind: 'list.move', listId: 'list-b' },
      workspace,
      'task-list',
      context(),
    )

    expect(result.workspace.tasks[0]?.listId).toBe('list-b')
    expect(workspace.tasks[0]?.listId).toBe('list-a')
  })

  it('reuses the Workspace invariant that rejects a List from another Project', () => {
    expect(() =>
      applyAutomationAction(
        { kind: 'list.move', listId: 'list-other' },
        workspace,
        'task-list',
        context(),
      ),
    ).toThrow('Cannot assign a task to a list from another project')
  })
})
