import { describe, expect, it } from 'vitest'

import { createGoal, linkGoalTask } from '../domain/goal'
import { createProject } from '../domain/project'
import { createTask } from '../domain/task'
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

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-09-29T08:00:00.000Z',
})
const task = createTask({
  id: 'task-1',
  projectId: project.id,
  title: 'Ship beta',
  now: '2026-09-29T08:01:00.000Z',
})

function stored(workspace: unknown): MemoryStore {
  const storage = new MemoryStore()
  storage.setItem(
    'workspace-app.workspace',
    JSON.stringify({ version: 1, workspace }),
  )
  return storage
}

describe('Goal storage validation', () => {
  it('round-trips a valid optional Goal collection in storage version 1', () => {
    const storage = new MemoryStore()
    const manual = createGoal({
      id: 'goal-manual',
      name: 'Adoption',
      targetType: 'manual',
      targetValue: 100,
      currentValue: 25,
    })
    const linked = linkGoalTask(
      createGoal({
        id: 'goal-linked',
        name: 'Finish launch tasks',
        targetType: 'linkedTasks',
        targetValue: 0,
        currentValue: 0,
      }),
      task.id,
    )
    const workspace = {
      projects: [project],
      tasks: [task],
      goals: [manual, linked],
    }

    saveWorkspace(storage, workspace)

    expect(loadWorkspace(storage)).toEqual(workspace)
  })

  it('rejects malformed Goal records instead of trusting stored JSON', () => {
    const storage = stored({
      projects: [],
      tasks: [],
      goals: [
        {
          id: 'goal-1',
          name: '   ',
          targetType: 'manual',
          targetValue: 1,
          currentValue: 0,
        },
      ],
    })

    expect(() => loadWorkspace(storage)).toThrow('Workspace storage is invalid')
  })

  it('rejects duplicate persisted Goal ids', () => {
    const goal = createGoal({
      id: 'goal-1',
      name: 'Adoption',
      targetType: 'manual',
      targetValue: 10,
      currentValue: 1,
    })
    const storage = stored({ projects: [], tasks: [], goals: [goal, goal] })

    expect(() => loadWorkspace(storage)).toThrow('Workspace storage is invalid')
  })

  it('rejects a persisted Goal link whose Task does not exist', () => {
    const goal = linkGoalTask(
      createGoal({
        id: 'goal-1',
        name: 'Linked work',
        targetType: 'linkedTasks',
        targetValue: 0,
        currentValue: 0,
      }),
      'missing-task',
    )
    const storage = stored({ projects: [], tasks: [], goals: [goal] })

    expect(() => loadWorkspace(storage)).toThrow('Workspace storage is invalid')
  })
})
