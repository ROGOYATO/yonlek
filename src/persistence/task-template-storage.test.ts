import { describe, expect, it } from 'vitest'

import { createTaskTemplate } from '../domain/task'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from './workspace-storage'

describe('task template persistence', () => {
  it('round-trips a valid template and rejects a broken parent reference', () => {
    const root = {
      id: 'task-root',
      projectId: 'project-source',
      title: 'Define protocol',
      status: 'todo' as const,
      priority: 'normal' as const,
      createdAt: '2026-09-04T23:00:00.000Z',
    }
    const child = {
      id: 'task-child',
      projectId: root.projectId,
      parentTaskId: root.id,
      title: 'Calibrate camera',
      status: 'doing' as const,
      priority: 'high' as const,
      createdAt: '2026-09-04T23:01:00.000Z',
    }
    const template = createTaskTemplate({
      id: 'template-1',
      name: 'Protocol task',
      now: '2026-09-04T23:02:00.000Z',
      rootTask: root,
      tasks: [root, child],
    })
    let raw: string | null = null
    const store: KeyValueStore = {
      getItem: () => raw,
      setItem: (_key, value) => {
        raw = value
      },
    }

    saveWorkspace(store, {
      projects: [],
      tasks: [],
      taskTemplates: [template],
    } as never)

    expect((loadWorkspace(store) as never as { taskTemplates: unknown }).taskTemplates).toEqual([
      template,
    ])

    const invalidStore: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            projects: [],
            tasks: [],
            taskTemplates: [
              {
                ...template,
                tasks: [
                  template.tasks[0],
                  {
                    ...template.tasks[1],
                    parentTaskKey: 'missing-parent',
                  },
                ],
              },
            ],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(invalidStore)).toThrow(
      'Workspace storage is invalid',
    )
  })
})
