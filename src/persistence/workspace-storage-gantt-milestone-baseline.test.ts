import { describe, expect, it } from 'vitest'
import { createProject } from '../domain/project'
import { createTask } from '../domain/task'
import { loadWorkspace, saveWorkspace, type KeyValueStore } from './workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly items = new Map<string, string>()
  getItem(key: string) { return this.items.get(key) ?? null }
  setItem(key: string, value: string) { this.items.set(key, value) }
}

function validWorkspace() {
  const project = createProject({
    id: 'project-1', name: 'Launch', now: '2026-10-08T07:50:00.000Z',
  })
  const task = {
    ...createTask({
      id: 'task-1', projectId: project.id, title: 'Quality gate',
      now: '2026-10-08T07:51:00.000Z',
    }),
    isMilestone: true,
    ganttBaseline: {
      startDate: '2026-10-10', dueDate: '2026-10-12',
      capturedAt: '2026-10-08T07:52:00.000Z',
    },
  }
  return { projects: [project], tasks: [task] }
}

describe('Gantt milestone and baseline storage validation', () => {
  it('persists a valid version-1 baseline and rejects invalid snapshots', () => {
    const store = new MemoryStore()
    const workspace = validWorkspace()
    saveWorkspace(store, workspace)
    expect(loadWorkspace(store)).toEqual(workspace)

    for (const ganttBaseline of [
      { startDate: '2026-02-31', dueDate: '2026-03-02', capturedAt: '2026-10-08T07:52:00.000Z' },
      { startDate: '2026-10-20', dueDate: '2026-10-10', capturedAt: '2026-10-08T07:52:00.000Z' },
      { startDate: '2026-10-10', dueDate: '2026-10-12', capturedAt: 'not-an-instant' },
    ]) {
      saveWorkspace(store, { ...workspace, tasks: [{ ...workspace.tasks[0], ganttBaseline }] })
      expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
    }
    saveWorkspace(store, { ...workspace, tasks: [{ ...workspace.tasks[0], isMilestone: 'yes' as unknown as boolean }] })
    expect(() => loadWorkspace(store)).toThrow('Workspace storage is invalid')
  })
})
