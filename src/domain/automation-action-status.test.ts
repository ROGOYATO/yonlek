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
        id: 'task-1',
        projectId: 'project-1',
        title: 'Triage incident',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-26T00:00:00.000Z',
      },
    ],
  }
}

describe('Automation status action and explicit execution context', () => {
  it('sets Task status immutably and consumes one caller-owned action budget step', () => {
    const current = workspace()
    const context = createAutomationExecutionContext({
      occurredAt: '2026-09-26T01:00:00.000Z',
      maxActionApplications: 2,
    })

    const result = applyAutomationAction(
      { kind: 'status.set', status: 'doing' },
      current,
      'task-1',
      context,
    )

    expect(result.workspace).not.toBe(current)
    expect(result.workspace.tasks[0]?.status).toBe('doing')
    expect(current.tasks[0]?.status).toBe('todo')
    expect(result.context).toEqual({
      occurredAt: '2026-09-26T01:00:00.000Z',
      remainingActionApplications: 1,
    })
    expect(context.remainingActionApplications).toBe(2)
  })

  it('rejects a missing target Task before applying an action', () => {
    expect(() =>
      applyAutomationAction(
        { kind: 'status.set', status: 'doing' },
        workspace(),
        'missing-task',
        createAutomationExecutionContext({
          occurredAt: '2026-09-26T01:00:00.000Z',
          maxActionApplications: 2,
        }),
      ),
    ).toThrow('Automation action target Task is missing')
  })

  it('stops when the explicit action budget is exhausted', () => {
    const first = applyAutomationAction(
      { kind: 'status.set', status: 'doing' },
      workspace(),
      'task-1',
      createAutomationExecutionContext({
        occurredAt: '2026-09-26T01:00:00.000Z',
        maxActionApplications: 1,
      }),
    )

    expect(first.context.remainingActionApplications).toBe(0)
    expect(() =>
      applyAutomationAction(
        { kind: 'status.set', status: 'done' },
        first.workspace,
        'task-1',
        first.context,
      ),
    ).toThrow('Automation action application limit reached')
  })
})
