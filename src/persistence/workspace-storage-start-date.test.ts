import { describe, expect, it } from 'vitest'

import { createProject } from '../domain/project'
import { createTask, setTaskStartDate } from '../domain/task'
import { loadWorkspace, saveWorkspace, type KeyValueStore } from './workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('workspace start-date storage compatibility', () => {
  it('round-trips a valid optional Task start date in storage version 1', () => {
    const project = createProject({
      id: 'project-1',
      name: 'Robotics Research',
      now: '2026-09-11T09:30:00.000Z',
    })
    const task = setTaskStartDate(
      createTask({
        id: 'task-1',
        projectId: project.id,
        title: 'Draft experiment plan',
        now: '2026-09-11T09:35:00.000Z',
      }),
      '2026-09-14',
    )
    const workspace = { projects: [project], tasks: [task] }
    const store = new MemoryStore()

    saveWorkspace(store, workspace)

    expect(loadWorkspace(store)).toEqual(workspace)
  })

  it('keeps an older version-1 Task without a start date compatible', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            projects: [
              {
                id: 'project-1',
                name: 'Robotics Research',
                createdAt: '2026-09-11T09:30:00.000Z',
              },
            ],
            tasks: [
              {
                id: 'task-1',
                projectId: 'project-1',
                title: 'Draft experiment plan',
                status: 'todo',
                priority: 'normal',
                createdAt: '2026-09-11T09:35:00.000Z',
              },
            ],
          },
        }),
      setItem: () => undefined,
    }

    expect(loadWorkspace(store).tasks[0]).not.toHaveProperty('startDate')
  })

  it('rejects an invalid persisted Task start date', () => {
    const store: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            projects: [
              {
                id: 'project-1',
                name: 'Robotics Research',
                createdAt: '2026-09-11T09:30:00.000Z',
              },
            ],
            tasks: [
              {
                id: 'task-1',
                projectId: 'project-1',
                title: 'Draft experiment plan',
                status: 'todo',
                priority: 'normal',
                createdAt: '2026-09-11T09:35:00.000Z',
                startDate: '2026-02-31',
              },
            ],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })
})
