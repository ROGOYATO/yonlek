import { describe, expect, it } from 'vitest'
import { createWorkspaceCommands } from './workspace-commands'
import { createWorkspaceStore } from './workspace-store'
import { loadWorkspace, type KeyValueStore } from '../persistence/workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly items = new Map<string, string>()
  getItem(key: string) { return this.items.get(key) ?? null }
  setItem(key: string, value: string) { this.items.set(key, value) }
}

describe('Gantt baseline capture', () => {
  it('captures explicit dates and keeps the snapshot after rescheduling', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected',
      now: () => '2026-10-08T07:20:00.000Z',
    })
    const project = commands.addProject('Launch')
    const task = commands.addTask(project.id, 'Release candidate')
    expect(() => commands.captureTaskGanttBaseline(task.id)).toThrow(
      'Cannot capture baseline without both Task dates',
    )
    commands.changeTaskGanttSchedule(task.id, '2026-10-12', '2026-10-14')
    commands.captureTaskGanttBaseline(task.id)
    const baseline = {
      startDate: '2026-10-12', dueDate: '2026-10-14',
      capturedAt: '2026-10-08T07:20:00.000Z',
    }
    expect(store.getState().tasks[0].ganttBaseline).toEqual(baseline)
    commands.changeTaskGanttSchedule(task.id, '2026-10-20', '2026-10-22')
    expect(store.getState().tasks[0].ganttBaseline).toEqual(baseline)
    expect(loadWorkspace(storage).tasks[0].ganttBaseline).toEqual(baseline)
    expect(ids).toEqual([])
  })
})
