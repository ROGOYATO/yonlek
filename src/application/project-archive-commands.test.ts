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

describe('project archive commands', () => {
  it('archives and restores a persisted project without archiving its tasks', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-archive-command', 'task-archive-command']
    const timestamps = [
      '2026-09-04T19:50:00.000Z',
      '2026-09-04T19:51:00.000Z',
      '2026-09-04T19:52:00.000Z',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => timestamps.shift() ?? 'unexpected-time',
    })
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')

    commands.archiveProject(project.id)

    expect(store.getState().projects[0]?.archivedAt).toBe(
      '2026-09-04T19:52:00.000Z',
    )
    expect(store.getState().tasks[0]).not.toHaveProperty('archivedAt')
    expect(loadWorkspace(storage).projects[0]?.archivedAt).toBe(
      '2026-09-04T19:52:00.000Z',
    )
    expect(loadWorkspace(storage).tasks[0]?.id).toBe(task.id)

    commands.restoreProject(project.id)

    expect(store.getState().projects[0]).not.toHaveProperty('archivedAt')
    expect(loadWorkspace(storage).projects[0]).not.toHaveProperty('archivedAt')
  })
})
