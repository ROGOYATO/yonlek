import { describe, expect, it } from 'vitest'

import { createWorkspaceCommands } from './workspace-commands'
import { createWorkspaceStore } from './workspace-store'
import type { KeyValueStore } from '../persistence/workspace-storage'

describe('task template commands', () => {
  it('persists a task template independently and creates fresh structure in the selected project and list', () => {
    let raw: string | null = JSON.stringify({
      version: 1,
      workspace: {
        projects: [
          {
            id: 'project-source',
            name: 'Source',
            createdAt: '2026-09-04T23:10:00.000Z',
          },
          {
            id: 'project-target',
            name: 'Target',
            createdAt: '2026-09-04T23:11:00.000Z',
          },
        ],
        lists: [
          {
            id: 'list-target',
            projectId: 'project-target',
            name: 'Experiments',
            createdAt: '2026-09-04T23:12:00.000Z',
          },
        ],
        tasks: [
          {
            id: 'task-root',
            projectId: 'project-source',
            title: 'Define protocol',
            status: 'doing',
            priority: 'high',
            description: 'Write the procedure',
            createdAt: '2026-09-04T23:13:00.000Z',
          },
          {
            id: 'task-child',
            projectId: 'project-source',
            parentTaskId: 'task-root',
            title: 'Calibrate camera',
            status: 'todo',
            priority: 'normal',
            createdAt: '2026-09-04T23:14:00.000Z',
          },
        ],
      },
    })
    const storage: KeyValueStore = {
      getItem: () => raw,
      setItem: (_key, value) => {
        raw = value
      },
    }
    const ids = ['template-1', 'task-new-root', 'task-new-child']
    const times = [
      '2026-09-04T23:15:00.000Z',
      '2026-09-04T23:16:00.000Z',
      '2026-09-04T23:17:00.000Z',
    ]
    const store = createWorkspaceStore(storage)
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => times.shift() ?? 'unexpected-time',
    })

    const template = commands.saveTaskTemplate(
      'task-root',
      'Protocol task',
    )

    commands.deleteTask('task-root')
    expect(store.getState().taskTemplates).toEqual([template])

    const root = commands.createTaskFromTemplate(
      template.id,
      'project-target',
      'list-target',
    )
    const state = store.getState()

    expect(root).toEqual({
      id: 'task-new-root',
      projectId: 'project-target',
      listId: 'list-target',
      title: 'Define protocol',
      status: 'doing',
      priority: 'high',
      description: 'Write the procedure',
      createdAt: '2026-09-04T23:17:00.000Z',
    })
    expect(state.tasks).toEqual([
      root,
      {
        id: 'task-new-child',
        projectId: 'project-target',
        listId: 'list-target',
        parentTaskId: 'task-new-root',
        title: 'Calibrate camera',
        status: 'todo',
        priority: 'normal',
        createdAt: '2026-09-04T23:17:00.000Z',
      },
    ])

    commands.deleteTaskTemplate(template.id)
    expect(store.getState().taskTemplates).toBeUndefined()
    expect(ids).toEqual([])
    expect(times).toEqual([])
  })
})
