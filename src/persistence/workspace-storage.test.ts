import { describe, expect, it } from 'vitest'

import { createProject } from '../domain/project'
import { createTask } from '../domain/task'
import { emptyWorkspace } from '../domain/workspace'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from './workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('workspace storage', () => {
  it('returns an empty workspace when nothing has been saved', () => {
    expect(loadWorkspace(new MemoryStore())).toEqual(emptyWorkspace)
  })

  it('round-trips a workspace through a versioned stored document', () => {
    const project = createProject({
      id: 'project-1',
      name: 'Robotics Research',
      now: '2026-09-03T00:00:00.000Z',
    })
    const task = createTask({
      id: 'task-1',
      projectId: project.id,
      title: 'Draft experiment plan',
      now: '2026-09-03T00:05:00.000Z',
    })
    const workspace = { projects: [project], tasks: [task] }
    const store = new MemoryStore()

    saveWorkspace(store, workspace)

    expect(loadWorkspace(store)).toEqual(workspace)
  })
})


it('reports malformed JSON as invalid workspace storage', () => {
  const store: KeyValueStore = {
    getItem: () => '{not-json',
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})


it('rejects a versioned document without workspace arrays', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: {},
          tasks: [],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})

it('still reports unsupported storage versions separately', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 2,
        workspace: {
          projects: [],
          tasks: [],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow(
    'Unsupported workspace storage version',
  )
})


it('rejects an invalid persisted project record', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 42,
              createdAt: '2026-09-03T05:30:00.000Z',
            },
          ],
          tasks: [],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})


it('rejects an invalid persisted task status', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T05:30:00.000Z',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Draft experiment plan',
              status: 'blocked',
              priority: 'normal',
              createdAt: '2026-09-03T05:35:00.000Z',
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})

it('rejects an invalid persisted task priority', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T05:30:00.000Z',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Draft experiment plan',
              status: 'todo',
              priority: 'urgent',
              createdAt: '2026-09-03T05:35:00.000Z',
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})


it('rejects an invalid persisted task due date', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T05:30:00.000Z',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Draft experiment plan',
              status: 'todo',
              priority: 'normal',
              createdAt: '2026-09-03T05:35:00.000Z',
              dueDate: '2026-02-31',
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})

it('rejects a non-string persisted task description', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T05:30:00.000Z',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Draft experiment plan',
              status: 'todo',
              priority: 'normal',
              createdAt: '2026-09-03T05:35:00.000Z',
              description: 123,
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})

it('rejects a persisted task whose project is missing', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [],
          tasks: [
            {
              id: 'task-1',
              projectId: 'missing-project',
              title: 'Draft experiment plan',
              status: 'todo',
              priority: 'normal',
              createdAt: '2026-09-03T05:35:00.000Z',
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})

it('loads valid optional due dates and descriptions', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T05:30:00.000Z',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Draft experiment plan',
              status: 'todo',
              priority: 'normal',
              createdAt: '2026-09-03T05:35:00.000Z',
              dueDate: '2026-09-12',
              description: 'Prepare the calibration procedure.',
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(loadWorkspace(store).tasks[0]).toMatchObject({
    dueDate: '2026-09-12',
    description: 'Prepare the calibration procedure.',
  })
})


it('rejects duplicate persisted project ids', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T15:40:00.000Z',
            },
            {
              id: 'project-1',
              name: 'Field Tests',
              createdAt: '2026-09-03T15:41:00.000Z',
            },
          ],
          tasks: [],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})


it('rejects duplicate persisted task ids', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T15:50:00.000Z',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Draft experiment plan',
              status: 'todo',
              priority: 'normal',
              createdAt: '2026-09-03T15:51:00.000Z',
            },
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Review safety checklist',
              status: 'todo',
              priority: 'normal',
              createdAt: '2026-09-03T15:52:00.000Z',
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})


it('rejects an invalid persisted project creation timestamp', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: 'not-a-timestamp',
            },
          ],
          tasks: [],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})

it('rejects an invalid persisted task creation timestamp', () => {
  const store: KeyValueStore = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [
            {
              id: 'project-1',
              name: 'Robotics Research',
              createdAt: '2026-09-03T16:00:00.000Z',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              projectId: 'project-1',
              title: 'Draft experiment plan',
              status: 'todo',
              priority: 'normal',
              createdAt: '2026-02-31T16:01:00.000Z',
            },
          ],
        },
      }),
    setItem: () => undefined,
  }

  expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
})
