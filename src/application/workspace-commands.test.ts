import { describe, expect, it } from 'vitest'

import { loadWorkspace, type KeyValueStore } from '../persistence/workspace-storage'
import { createWorkspaceCommands } from './workspace-commands'
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

describe('workspace commands', () => {
  it('creates projects and tasks using injected ids and timestamps', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1']
    const timestamps = [
      '2026-09-03T01:00:00.000Z',
      '2026-09-03T01:05:00.000Z',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => timestamps.shift() ?? 'unexpected-time',
    })

    const project = commands.addProject('  Robotics Research  ')
    const task = commands.addTask(project.id, '  Draft experiment plan  ')

    expect(project).toEqual({
      id: 'project-1',
      name: 'Robotics Research',
      createdAt: '2026-09-03T01:00:00.000Z',
    })
    expect(task.projectId).toBe(project.id)
    expect(task.title).toBe('Draft experiment plan')
    expect(loadWorkspace(storage)).toEqual(store.getState())
  })
})
