import { describe, expect, it } from 'vitest'

import {
  createProject,
  createProjectTemplate,
} from '../domain/project'
import { createTaskList } from '../domain/task-list'
import { createTask } from '../domain/task'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from './workspace-storage'

describe('project template persistence', () => {
  it('round-trips a valid template and rejects broken internal references', () => {
    const project = createProject({
      id: 'project-source',
      name: 'Robotics Research',
      now: '2026-09-04T21:10:00.000Z',
    })
    const list = createTaskList({
      id: 'list-source',
      projectId: project.id,
      name: 'Experiments',
      now: '2026-09-04T21:11:00.000Z',
    })
    const task = createTask({
      id: 'task-source',
      projectId: project.id,
      listId: list.id,
      title: 'Define protocol',
      now: '2026-09-04T21:12:00.000Z',
    })
    const template = createProjectTemplate({
      id: 'template-1',
      name: 'Robotics experiment',
      now: '2026-09-04T21:13:00.000Z',
      project,
      lists: [list],
      tasks: [task],
    })
    let raw: string | null = null
    const store: KeyValueStore = {
      getItem: () => raw,
      setItem: (_key, value) => {
        raw = value
      },
    }

    saveWorkspace(store, {
      projects: [project],
      lists: [list],
      tasks: [task],
      projectTemplates: [template],
    } as never)

    expect(loadWorkspace(store).projectTemplates).toEqual([template])

    const invalidStore: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            projects: [],
            tasks: [],
            projectTemplates: [
              {
                ...template,
                tasks: [
                  {
                    ...template.tasks[0],
                    listKey: 'missing-list',
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
