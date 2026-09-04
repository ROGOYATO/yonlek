import { describe, expect, it } from 'vitest'

import { createWorkspaceCommands } from './workspace-commands'
import { createWorkspaceStore } from './workspace-store'
import type { KeyValueStore } from '../persistence/workspace-storage'

describe('project template commands', () => {
  it('persists a template independently from its source project and instantiates fresh structure', () => {
    let raw: string | null = JSON.stringify({
      version: 1,
      workspace: {
        projects: [
          {
            id: 'project-source',
            name: 'Robotics Research',
            description: 'Camera-guided arm experiments',
            areaId: 'area-1',
            createdAt: '2026-09-04T21:20:00.000Z',
          },
        ],
        areas: [
          {
            id: 'area-1',
            name: 'Research',
            createdAt: '2026-09-04T21:19:00.000Z',
          },
        ],
        lists: [
          {
            id: 'list-source',
            projectId: 'project-source',
            name: 'Experiments',
            createdAt: '2026-09-04T21:21:00.000Z',
          },
        ],
        tasks: [
          {
            id: 'task-source',
            projectId: 'project-source',
            listId: 'list-source',
            title: 'Define protocol',
            status: 'doing',
            priority: 'high',
            description: 'Write the repeatable experiment procedure',
            dueDate: '2026-10-01',
            createdAt: '2026-09-04T21:22:00.000Z',
            checklist: [
              {
                id: 'check-source',
                text: 'Record calibration',
                completed: true,
              },
            ],
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
    const ids = [
      'template-1',
      'project-new',
      'list-new',
      'task-new',
      'check-new',
    ]
    const times = [
      '2026-09-04T21:23:00.000Z',
      '2026-09-04T21:24:00.000Z',
    ]
    const store = createWorkspaceStore(storage)
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => times.shift() ?? 'unexpected-time',
    })

    const template = commands.saveProjectTemplate(
      'project-source',
      'Robotics experiment',
    )

    commands.deleteProject('project-source')
    expect(store.getState().projectTemplates).toEqual([template])

    const project = commands.createProjectFromTemplate(template.id)
    const state = store.getState()

    expect(project).toEqual({
      id: 'project-new',
      name: 'Robotics Research',
      description: 'Camera-guided arm experiments',
      createdAt: '2026-09-04T21:24:00.000Z',
    })
    expect(state.lists).toEqual([
      {
        id: 'list-new',
        projectId: 'project-new',
        name: 'Experiments',
        createdAt: '2026-09-04T21:24:00.000Z',
      },
    ])
    expect(state.tasks).toEqual([
      {
        id: 'task-new',
        projectId: 'project-new',
        listId: 'list-new',
        title: 'Define protocol',
        status: 'doing',
        priority: 'high',
        description: 'Write the repeatable experiment procedure',
        createdAt: '2026-09-04T21:24:00.000Z',
        checklist: [
          {
            id: 'check-new',
            text: 'Record calibration',
            completed: true,
          },
        ],
      },
    ])
    expect(state.projects[0]?.areaId).toBeUndefined()
    expect(state.tasks[0]?.dueDate).toBeUndefined()

    commands.deleteProjectTemplate(template.id)
    expect(store.getState().projectTemplates).toBeUndefined()
    expect(ids).toEqual([])
    expect(times).toEqual([])
  })
})
