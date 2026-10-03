import { describe, expect, it } from 'vitest'

import { createProject } from '../domain/project'
import { createTask } from '../domain/task'
import { createWorkspaceStore } from './workspace-store'
import { loadWorkspace, saveWorkspace, type KeyValueStore } from '../persistence/workspace-storage'
import { createWorkspaceCommands } from './workspace-commands'

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
  now: '2026-09-29T09:00:00.000Z',
})
const task = createTask({
  id: 'task-1',
  projectId: project.id,
  title: 'Ship beta',
  now: '2026-09-29T09:01:00.000Z',
})

interface GoalCommandSurface {
  addGoal?: (
    name: string,
    input: {
      description?: string
      targetType: 'manual' | 'linkedTasks'
      targetValue: number
      currentValue: number
    },
  ) => { id: string }
  renameGoal?: (goalId: string, name: string) => void
  changeGoalDescription?: (goalId: string, description: string | null) => void
  changeGoalTargetType?: (goalId: string, targetType: 'manual' | 'linkedTasks') => void
  changeGoalValues?: (goalId: string, targetValue: number, currentValue: number) => void
  linkGoalTask?: (goalId: string, taskId: string) => void
  unlinkGoalTask?: (goalId: string, taskId: string) => void
  deleteGoal?: (goalId: string) => void
}

function setup() {
  const storage = new MemoryStore()
  saveWorkspace(storage, { projects: [project], tasks: [task] })
  const store = createWorkspaceStore(storage)
  const commands = createWorkspaceCommands(store, {
    nextId: () => 'goal-1',
    now: () => '2026-09-29T09:30:00.000Z',
  }) as unknown as GoalCommandSurface

  return { storage, store, commands }
}

describe('Workspace Goal commands', () => {
  it('creates a Goal through the command surface and persists it', () => {
    const { storage, commands } = setup()
    expect(commands.addGoal).toBeTypeOf('function')

    const goal = commands.addGoal!(' Adoption ', {
      description: ' External users ',
      targetType: 'manual',
      targetValue: 100,
      currentValue: 25,
    })

    expect(goal.id).toBe('goal-1')
    expect(loadWorkspace(storage).goals).toEqual([
      expect.objectContaining({
        id: 'goal-1',
        name: 'Adoption',
        description: 'External users',
        targetType: 'manual',
        targetValue: 100,
        currentValue: 25,
      }),
    ])
  })

  it('updates the editable Goal fields through commands', () => {
    const { store, commands } = setup()
    const goalId = commands.addGoal!('Adoption', {
      targetType: 'manual',
      targetValue: 100,
      currentValue: 25,
    }).id

    expect(commands.renameGoal).toBeTypeOf('function')
    expect(commands.changeGoalDescription).toBeTypeOf('function')
    expect(commands.changeGoalTargetType).toBeTypeOf('function')
    expect(commands.changeGoalValues).toBeTypeOf('function')

    commands.renameGoal!(goalId, 'Launch adoption')
    commands.changeGoalDescription!(goalId, 'First cohort')
    commands.changeGoalValues!(goalId, 120, 40)
    commands.changeGoalTargetType!(goalId, 'linkedTasks')

    expect(store.getState().goals?.[0]).toMatchObject({
      name: 'Launch adoption',
      description: 'First cohort',
      targetType: 'linkedTasks',
      targetValue: 120,
      currentValue: 40,
    })
  })

  it('links, unlinks, and deletes a Goal through commands', () => {
    const { store, commands } = setup()
    const goalId = commands.addGoal!('Launch work', {
      targetType: 'linkedTasks',
      targetValue: 0,
      currentValue: 0,
    }).id

    expect(commands.linkGoalTask).toBeTypeOf('function')
    expect(commands.unlinkGoalTask).toBeTypeOf('function')
    expect(commands.deleteGoal).toBeTypeOf('function')

    commands.linkGoalTask!(goalId, task.id)
    expect(store.getState().goals?.[0]?.linkedTaskIds).toEqual([task.id])

    commands.unlinkGoalTask!(goalId, task.id)
    expect(store.getState().goals?.[0]?.linkedTaskIds).toBeUndefined()

    commands.deleteGoal!(goalId)
    expect(store.getState()).not.toHaveProperty('goals')
  })
})
