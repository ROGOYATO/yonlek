import { describe, expect, it } from 'vitest'

import type { WorkspaceState } from '../domain/workspace'
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

const project = {
  id: 'project-1',
  name: 'Research',
  createdAt: '2026-09-13T09:00:00.000Z',
}

function stateWithTask(task: WorkspaceState['tasks'][number]): WorkspaceState {
  return { projects: [project], tasks: [task] }
}

const recurringTask = {
  id: 'task-1',
  projectId: project.id,
  title: 'Recurring',
  status: 'todo' as const,
  priority: 'normal' as const,
  createdAt: '2026-09-13T09:00:00.000Z',
  startDate: '2026-09-13',
  dueDate: '2026-09-14',
  recurrence: { unit: 'week' as const, interval: 2 },
}

describe('Recurring Task workspace storage', () => {
  it('round-trips recurrence in workspace storage version 1', () => {
    const storage = new MemoryStore()
    saveWorkspace(storage, stateWithTask(recurringTask))
    expect(loadWorkspace(storage)).toEqual(stateWithTask(recurringTask))
  })

  it('keeps legacy version-1 Tasks without recurrence valid', () => {
    const storage = new MemoryStore()
    const legacyTask = { ...recurringTask }
    delete (legacyTask as Partial<typeof recurringTask>).recurrence
    saveWorkspace(storage, stateWithTask(legacyTask))
    expect(loadWorkspace(storage).tasks[0]).not.toHaveProperty('recurrence')
  })

  it('rejects malformed recurrence rules and recurrence without a valid due date', () => {
    const invalidTasks = [
      { ...recurringTask, recurrence: { unit: 'year', interval: 1 } },
      { ...recurringTask, recurrence: { unit: 'day', interval: 0 } },
      { ...recurringTask, recurrence: { unit: 'week', interval: 1.5 } },
      { ...recurringTask, dueDate: undefined },
      { ...recurringTask, dueDate: '2026-02-31' },
    ]

    for (const task of invalidTasks) {
      const storage = new MemoryStore()
      storage.setItem(
        'workspace-app.workspace',
        JSON.stringify({ version: 1, workspace: stateWithTask(task as never) }),
      )
      expect(() => loadWorkspace(storage)).toThrow('Workspace storage is invalid')
    }
  })
})
