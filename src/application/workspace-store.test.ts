import { describe, expect, it } from 'vitest'

import { createProject } from '../domain/project'
import { createTask } from '../domain/task'
import { loadWorkspace, saveWorkspace, type KeyValueStore } from '../persistence/workspace-storage'
import { createWorkspaceStore } from './workspace-store'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

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

describe('workspace store', () => {
  it('loads previously saved workspace state', () => {
    const storage = new MemoryStore()
    const saved = { projects: [project], tasks: [task] }
    saveWorkspace(storage, saved)

    const store = createWorkspaceStore(storage)

    expect(store.getState()).toEqual(saved)
  })

  it('persists accepted reducer actions', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)

    store.dispatch({
      type: 'project/added',
      project,
    })

    expect(store.getState().projects).toEqual([project])
    expect(loadWorkspace(storage).projects).toEqual([project])
  })
})


describe('workspace store subscriptions', () => {
  it('notifies subscribers after an accepted action', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const observedProjectCounts: number[] = []

    store.subscribe(() => {
      observedProjectCounts.push(store.getState().projects.length)
    })

    store.dispatch({
      type: 'project/added',
      project,
    })

    expect(observedProjectCounts).toEqual([1])
  })

  it('stops notifying a subscriber after unsubscribe', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    let calls = 0

    const unsubscribe = store.subscribe(() => {
      calls += 1
    })

    unsubscribe()

    store.dispatch({
      type: 'project/added',
      project,
    })

    expect(calls).toBe(0)
  })
})
