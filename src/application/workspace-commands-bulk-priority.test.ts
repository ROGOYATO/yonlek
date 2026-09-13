import { describe, expect, it } from 'vitest'

import type { KeyValueStore } from '../persistence/workspace-storage'
import { createWorkspaceCommands } from './workspace-commands'
import { createWorkspaceStore } from './workspace-store'

class CountingStore implements KeyValueStore {
  private readonly values = new Map<string, string>()
  writes = 0

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.writes += 1
    this.values.set(key, value)
  }
}

describe('bulk Task priority command', () => {
  it('changes all selected Tasks with one persisted store dispatch', () => {
    const storage = new CountingStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-a', 'task-b']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-13T01:10:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const alpha = commands.addTask(project.id, 'Alpha')
    const beta = commands.addTask(project.id, 'Beta')
    const writesBeforeBulk = storage.writes

    commands.changeTasksPriority([alpha.id, beta.id], 'high')

    expect(
      store.getState().tasks.map((task) => [task.id, task.priority]),
    ).toEqual([
      [alpha.id, 'high'],
      [beta.id, 'high'],
    ])
    expect(storage.writes).toBe(writesBeforeBulk + 1)
  })
})
