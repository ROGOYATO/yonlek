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
        createdAt: '2026-09-16T08:00:00.000Z',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        projectId: 'project-1',
        title: 'Attached task',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-16T08:00:00.000Z',
        attachments: [
          {
            id: 'attachment-1',
            name: 'report.pdf',
            sizeBytes: 2048,
            mediaType: 'application/pdf',
            addedAt: '2026-09-16T09:00:00.000Z',
          },
          {
            id: 'attachment-2',
            name: 'empty.txt',
            sizeBytes: 0,
            addedAt: '2026-09-16T09:05:00.000Z',
          },
        ],
      },
    ],
    taskTemplates: [
      {
        id: 'task-template-1',
        name: 'Task template',
        createdAt: '2026-09-16T08:00:00.000Z',
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
        createdAt: '2026-09-16T08:00:00.000Z',
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

describe('Attachment workspace storage', () => {
  it('round-trips Task attachment metadata in storage version 1', () => {
    const storage = new MemoryStorage()
    const state = base()
    saveWorkspace(storage, state)
    expect(loadWorkspace(storage)).toEqual(state)
  })

  it('keeps legacy version-1 Tasks without attachments valid', () => {
    const storage = new MemoryStorage()
    const state = base()
    delete state.tasks[0]!.attachments
    saveWorkspace(storage, state)
    expect(loadWorkspace(storage)).toEqual(state)
  })

  it('rejects malformed live attachment metadata and attachments inside templates', () => {
    const invalidDocuments: unknown[] = []

    for (const invalidAttachment of [
      {
        id: '',
        name: 'report.pdf',
        sizeBytes: 1,
        addedAt: '2026-09-16T09:00:00.000Z',
      },
      {
        id: 'attachment-1',
        name: '',
        sizeBytes: 1,
        addedAt: '2026-09-16T09:00:00.000Z',
      },
      {
        id: 'attachment-1',
        name: 'report.pdf',
        sizeBytes: -1,
        addedAt: '2026-09-16T09:00:00.000Z',
      },
      {
        id: 'attachment-1',
        name: 'report.pdf',
        sizeBytes: 1.5,
        addedAt: '2026-09-16T09:00:00.000Z',
      },
      {
        id: 'attachment-1',
        name: 'report.pdf',
        sizeBytes: 1,
        mediaType: 42,
        addedAt: '2026-09-16T09:00:00.000Z',
      },
      {
        id: 'attachment-1',
        name: 'report.pdf',
        sizeBytes: 1,
        addedAt: 'not-an-instant',
      },
    ]) {
      const document = { version: 1, workspace: base() } as any
      document.workspace.tasks[0].attachments = [invalidAttachment]
      invalidDocuments.push(document)
    }

    const duplicateIds = { version: 1, workspace: base() } as any
    duplicateIds.workspace.tasks[0].attachments = [
      {
        id: 'duplicate',
        name: 'one.txt',
        sizeBytes: 1,
        addedAt: '2026-09-16T09:00:00.000Z',
      },
      {
        id: 'duplicate',
        name: 'two.txt',
        sizeBytes: 2,
        addedAt: '2026-09-16T09:01:00.000Z',
      },
    ]
    invalidDocuments.push(duplicateIds)

    const taskTemplateAttachment = { version: 1, workspace: base() } as any
    taskTemplateAttachment.workspace.taskTemplates[0].tasks[0].attachments = [
      {
        id: 'attachment-template',
        name: 'template.txt',
        sizeBytes: 1,
        addedAt: '2026-09-16T09:00:00.000Z',
      },
    ]
    invalidDocuments.push(taskTemplateAttachment)

    const projectTemplateAttachment = { version: 1, workspace: base() } as any
    projectTemplateAttachment.workspace.projectTemplates[0].tasks[0].attachments = [
      {
        id: 'attachment-template',
        name: 'template.txt',
        sizeBytes: 1,
        addedAt: '2026-09-16T09:00:00.000Z',
      },
    ]
    invalidDocuments.push(projectTemplateAttachment)

    for (const document of invalidDocuments) {
      const storage = new MemoryStorage()
      storage.value = JSON.stringify(document)
      expect(() => loadWorkspace(storage)).toThrow('Workspace storage is invalid')
    }
  })
})
