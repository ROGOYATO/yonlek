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


describe('workspace mutation commands', () => {
  it('updates task title, status, and priority', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-03T03:30:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const task = commands.addTask(project.id, 'Draft experiment plan')

    commands.renameTask(task.id, '  Review experiment plan  ')
    commands.changeTaskStatus(task.id, 'doing')
    commands.changeTaskPriority(task.id, 'high')

    expect(store.getState().tasks[0]).toMatchObject({
      title: 'Review experiment plan',
      status: 'doing',
      priority: 'high',
    })
  })

  it('deletes tasks and projects through the store', () => {
    const storage = new MemoryStore()
    const store = createWorkspaceStore(storage)
    const ids = ['project-1', 'task-1', 'task-2']
    const commands = createWorkspaceCommands(store, {
      nextId: () => ids.shift() ?? 'unexpected-id',
      now: () => '2026-09-03T03:35:00.000Z',
    })
    const project = commands.addProject('Robotics Research')
    const firstTask = commands.addTask(project.id, 'First task')
    commands.addTask(project.id, 'Second task')

    commands.deleteTask(firstTask.id)

    expect(store.getState().tasks.map((task) => task.title)).toEqual([
      'Second task',
    ])

    commands.deleteProject(project.id)

    expect(store.getState()).toEqual({ projects: [], tasks: [] })
  })
})
