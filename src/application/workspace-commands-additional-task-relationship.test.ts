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

describe('additional task relationship command persistence', () => {
  it('persists Duplicates and References through workspace storage version 1', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = [
      'project-1',
      'task-1',
      'task-2',
      'relationship-1',
      'relationship-2',
    ]
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-10-04T15:10:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const first = commands.addTask(project.id, 'Draft experiment plan')
    const second = commands.addTask(project.id, 'Calibrate camera')

    const duplicate = commands.addTaskRelationship(
      'duplicates',
      first.id,
      second.id,
    )
    const reference = commands.addTaskRelationship(
      'references',
      second.id,
      first.id,
    )

    expect(loadWorkspace(storage).relationships).toEqual([
      duplicate,
      reference,
    ])
  })
})
