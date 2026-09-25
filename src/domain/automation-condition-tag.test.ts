import { describe, expect, it } from 'vitest'

import { createAutomation } from './automation'
import {
  matchesAutomationCondition,
  matchesAutomationConditions,
} from './automation-condition'
import type { WorkspaceState } from './workspace'

function workspace(): WorkspaceState {
  return {
    tags: [
      { id: 'tag-urgent', name: 'Urgent', createdAt: '2026-09-26T00:00:00.000Z' },
      { id: 'tag-review', name: 'Review', createdAt: '2026-09-26T00:00:00.000Z' },
    ],
    projects: [{ id: 'project-1', name: 'Inbox', createdAt: '2026-09-26T00:00:00.000Z' }],
    tasks: [
      {
        id: 'task-1',
        projectId: 'project-1',
        title: 'Triage incident',
        status: 'doing',
        priority: 'high',
        dueDate: '2026-10-03',
        tagIds: ['tag-urgent'],
        createdAt: '2026-09-26T00:00:00.000Z',
      },
    ],
  }
}

describe('Automation Tag condition and deterministic condition sets', () => {
  it('matches only Tags assigned to the Task', () => {
    const snapshot = workspace()
    expect(
      matchesAutomationCondition(
        { kind: 'tag', tagId: 'tag-urgent' },
        snapshot,
        'task-1',
      ),
    ).toBe(true)
    expect(
      matchesAutomationCondition(
        { kind: 'tag', tagId: 'tag-review' },
        snapshot,
        'task-1',
      ),
    ).toBe(false)
  })

  it('requires every configured condition to match the same Workspace snapshot', () => {
    const snapshot = workspace()
    const automation = createAutomation({
      id: 'automation-all',
      name: 'All conditions',
      enabled: true,
      trigger: { kind: 'task.statusChanged' },
      conditions: [
        { kind: 'project', projectId: 'project-1' },
        { kind: 'status', status: 'doing' },
        { kind: 'priority', priority: 'high' },
        { kind: 'dueDate.present', present: true },
        { kind: 'tag', tagId: 'tag-urgent' },
      ],
    })

    expect(matchesAutomationConditions(automation, snapshot, 'task-1')).toBe(true)
    expect(snapshot.tasks[0]).toMatchObject({
      status: 'doing',
      priority: 'high',
      tagIds: ['tag-urgent'],
    })
  })

  it('fails the condition set when any one condition does not match', () => {
    const snapshot = workspace()
    const automation = createAutomation({
      id: 'automation-mismatch',
      name: 'Mismatch',
      enabled: true,
      trigger: { kind: 'task.created' },
      conditions: [
        { kind: 'project', projectId: 'project-1' },
        { kind: 'tag', tagId: 'tag-review' },
      ],
    })

    expect(matchesAutomationConditions(automation, snapshot, 'task-1')).toBe(false)
  })

  it('treats an empty condition list as matched for an existing Task', () => {
    const snapshot = workspace()
    const automation = createAutomation({
      id: 'automation-empty',
      name: 'No conditions',
      enabled: true,
      trigger: { kind: 'task.created' },
    })

    expect(matchesAutomationConditions(automation, snapshot, 'task-1')).toBe(true)
    expect(matchesAutomationConditions(automation, snapshot, 'missing-task')).toBe(false)
  })
})
