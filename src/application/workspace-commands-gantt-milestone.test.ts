import { describe, expect, it } from 'vitest'
import { createWorkspaceCommands } from './workspace-commands'
import { createWorkspaceStore } from './workspace-store'
import type { KeyValueStore } from '../persistence/workspace-storage'
import { loadWorkspace } from '../persistence/workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly items = new Map<string, string>()
  getItem(key: string) { return this.items.get(key) ?? null }
  setItem(key: string, value: string) { this.items.set(key, value) }
}

describe('Gantt milestone command', () => {
  it('updates and persists the milestone flag without allocating an ID', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected',
      now: () => '2026-10-08T07:10:00.000Z',
    })
    const project = commands.addProject('Release')
    const task = commands.addTask(project.id, 'Design freeze')
    commands.changeTaskMilestone(task.id, true)
    expect(store.getState().tasks[0].isMilestone).toBe(true)
    expect(loadWorkspace(storage).tasks[0].isMilestone).toBe(true)
    commands.changeTaskMilestone(task.id, false)
    expect(store.getState().tasks[0]).not.toHaveProperty('isMilestone')
    expect(ids).toEqual([])
    expect(() => commands.changeTaskMilestone('missing', true)).toThrow(
      'Cannot update milestone on a missing task',
    )
  })
})
