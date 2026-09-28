import { describe, expect, it } from 'vitest'

import { createAutomation } from '../domain/automation'
import { createProject } from '../domain/project'
import { createTask } from '../domain/task'
import type { WorkspaceState } from '../domain/workspace'
import { executeAutomationTransaction } from './automation-execution'

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-09-27T08:00:00.000Z',
})

function taskState(automations: WorkspaceState['automations']): WorkspaceState {
  return {
    projects: [project],
    tasks: [
      createTask({
        id: 'task-1',
        projectId: project.id,
        title: 'Prepare demo',
        now: '2026-09-27T08:05:00.000Z',
      }),
    ],
    automations,
  }
}

describe('controlled Automation execution', () => {
  it('runs a matching Automation after the initiating tracked mutation', () => {
    const workspace = taskState([
      createAutomation({
        id: 'automation-1',
        name: 'Raise active priority',
        enabled: true,
        trigger: { kind: 'task.statusChanged' },
        conditions: [],
        actions: [{ kind: 'priority.set', priority: 'high' }],
      }),
    ])

    const result = executeAutomationTransaction(workspace, {
      action: { type: 'task/statusChanged', taskId: 'task-1', status: 'doing' },
      occurredAt: '2026-09-27T09:00:00.000Z',
      maxActionApplications: 8,
    })

    expect(result.workspace.tasks[0]).toMatchObject({
      status: 'doing',
      priority: 'high',
    })
    expect(result.workspace.activity?.map((entry) => entry.event.kind)).toEqual([
      'task.statusChanged',
      'task.priorityChanged',
    ])
    expect(result.context.remainingActionApplications).toBe(7)
    expect(workspace.tasks[0]).toMatchObject({ status: 'todo', priority: 'normal' })
    expect(workspace).not.toHaveProperty('activity')
  })

  it('evaluates conditions against the post-initiating Workspace snapshot', () => {
    const workspace = taskState([
      createAutomation({
        id: 'automation-1',
        name: 'Archive work in progress',
        enabled: true,
        trigger: { kind: 'task.statusChanged' },
        conditions: [{ kind: 'status', status: 'doing' }],
        actions: [{ kind: 'task.archive' }],
      }),
    ])

    const result = executeAutomationTransaction(workspace, {
      action: { type: 'task/statusChanged', taskId: 'task-1', status: 'doing' },
      occurredAt: '2026-09-27T09:05:00.000Z',
      maxActionApplications: 8,
    })

    expect(result.workspace.tasks[0]?.archivedAt).toBe(
      '2026-09-27T09:05:00.000Z',
    )
    expect(result.workspace.activity?.map((entry) => entry.event.kind)).toEqual([
      'task.statusChanged',
      'task.archived',
    ])
  })

  it('feeds action-produced Activity back through the bounded trigger queue', () => {
    const workspace = taskState([
      createAutomation({
        id: 'automation-priority',
        name: 'Raise priority',
        enabled: true,
        trigger: { kind: 'task.statusChanged' },
        conditions: [],
        actions: [{ kind: 'priority.set', priority: 'high' }],
      }),
      createAutomation({
        id: 'automation-archive',
        name: 'Archive high priority',
        enabled: true,
        trigger: { kind: 'task.priorityChanged' },
        conditions: [{ kind: 'priority', priority: 'high' }],
        actions: [{ kind: 'task.archive' }],
      }),
    ])

    const result = executeAutomationTransaction(workspace, {
      action: { type: 'task/statusChanged', taskId: 'task-1', status: 'doing' },
      occurredAt: '2026-09-27T09:10:00.000Z',
      maxActionApplications: 8,
    })

    expect(result.workspace.tasks[0]).toMatchObject({
      status: 'doing',
      priority: 'high',
      archivedAt: '2026-09-27T09:10:00.000Z',
    })
    expect(result.workspace.activity?.map((entry) => entry.event.kind)).toEqual([
      'task.statusChanged',
      'task.priorityChanged',
      'task.archived',
    ])
    expect(result.context.remainingActionApplications).toBe(6)
  })
})
