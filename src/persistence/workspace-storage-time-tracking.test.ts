import { describe, expect, it } from 'vitest'

import type { WorkspaceState } from '../domain/workspace'
import { loadWorkspace, saveWorkspace } from './workspace-storage'

class MemoryStorage {
  value: string | null = null

  getItem() {
    return this.value
  }

  setItem(_key: string, value: string) {
    this.value = value
  }
}

function base(): WorkspaceState {
  return {
    projects: [
      {
        id: 'project-1',
        name: 'Project',
        createdAt: '2026-09-15T09:00:00.000Z',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        projectId: 'project-1',
        title: 'Tracked task',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-15T09:00:00.000Z',
        timeEntries: [
          {
            id: 'entry-1',
            durationMs: 30 * 60_000,
            recordedAt: '2026-09-15T10:00:00.000Z',
          },
        ],
        timerStartedAt: '2026-09-15T11:00:00.000Z',
      },
    ],
    taskTemplates: [
      {
        id: 'task-template-1',
        name: 'Task template',
        createdAt: '2026-09-15T09:00:00.000Z',
        rootTaskKey: 'task-key',
        tasks: [
          {
            key: 'task-key',
            title: 'Template task',
            status: 'todo',
            priority: 'normal',
          },
        ],
      },
    ],
    projectTemplates: [
      {
        id: 'project-template-1',
        name: 'Project template',
        createdAt: '2026-09-15T09:00:00.000Z',
        projectName: 'Template project',
        lists: [],
        tasks: [
          {
            key: 'task-key',
            title: 'Template task',
            status: 'todo',
            priority: 'normal',
          },
        ],
      },
    ],
  }
}

describe('Time-tracking workspace storage', () => {
  it('round-trips completed entries and a running timer in storage version 1', () => {
    const storage = new MemoryStorage()
    const state = base()
    saveWorkspace(storage, state)
    expect(loadWorkspace(storage)).toEqual(state)
  })

  it('keeps legacy version-1 Tasks without time tracking valid', () => {
    const storage = new MemoryStorage()
    const state = base()
    delete state.tasks[0]!.timeEntries
    delete state.tasks[0]!.timerStartedAt
    saveWorkspace(storage, state)
    expect(loadWorkspace(storage)).toEqual(state)
  })

  it('rejects malformed live tracking data and tracking data inside templates', () => {
    const invalidDocuments: unknown[] = []

    for (const invalidEntry of [
      {
        id: '',
        durationMs: 60_000,
        recordedAt: '2026-09-15T10:00:00.000Z',
      },
      {
        id: 'entry-1',
        durationMs: 0,
        recordedAt: '2026-09-15T10:00:00.000Z',
      },
      {
        id: 'entry-1',
        durationMs: 1.5,
        recordedAt: '2026-09-15T10:00:00.000Z',
      },
      {
        id: 'entry-1',
        durationMs: 60_000,
        recordedAt: 'not-an-instant',
      },
    ]) {
      const document = { version: 1, workspace: base() } as any
      document.workspace.tasks[0].timeEntries = [invalidEntry]
      invalidDocuments.push(document)
    }

    const duplicateIds = { version: 1, workspace: base() } as any
    duplicateIds.workspace.tasks[0].timeEntries = [
      {
        id: 'duplicate',
        durationMs: 60_000,
        recordedAt: '2026-09-15T10:00:00.000Z',
      },
      {
        id: 'duplicate',
        durationMs: 120_000,
        recordedAt: '2026-09-15T10:02:00.000Z',
      },
    ]
    invalidDocuments.push(duplicateIds)

    const invalidTimer = { version: 1, workspace: base() } as any
    invalidTimer.workspace.tasks[0].timerStartedAt = 'not-an-instant'
    invalidDocuments.push(invalidTimer)

    const taskTemplateTracking = { version: 1, workspace: base() } as any
    taskTemplateTracking.workspace.taskTemplates[0].tasks[0].timeEntries = [
      {
        id: 'entry-template',
        durationMs: 60_000,
        recordedAt: '2026-09-15T10:00:00.000Z',
      },
    ]
    invalidDocuments.push(taskTemplateTracking)

    const projectTemplateTracking = { version: 1, workspace: base() } as any
    projectTemplateTracking.workspace.projectTemplates[0].tasks[0].timerStartedAt =
      '2026-09-15T10:00:00.000Z'
    invalidDocuments.push(projectTemplateTracking)

    for (const document of invalidDocuments) {
      const storage = new MemoryStorage()
      storage.value = JSON.stringify(document)
      expect(() => loadWorkspace(storage)).toThrow('Workspace storage is invalid')
    }
  })
})
