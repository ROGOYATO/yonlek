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

describe('task start date command', () => {
  it('sets, persists, and clears a task start date through the workspace store', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-11T09:15:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')
    const startDateCommands = commands as typeof commands & {
      changeTaskStartDate(taskId: string, startDate: string | null): void
    }

    startDateCommands.changeTaskStartDate(task.id, '2026-09-14')

    expect(store.getState().tasks[0]?.startDate).toBe('2026-09-14')
    expect(loadWorkspace(storage).tasks[0]?.startDate).toBe('2026-09-14')

    startDateCommands.changeTaskStartDate(task.id, null)

    expect(store.getState().tasks[0]).not.toHaveProperty('startDate')
    expect(loadWorkspace(storage).tasks[0]).not.toHaveProperty('startDate')
  })
})
