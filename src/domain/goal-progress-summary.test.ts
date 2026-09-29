
import { describe, expect, it } from 'vitest'

import { createGoal, linkGoalTask } from './goal'
import * as goalProgress from './goal-progress'

const summarizeGoalProgress = (
  goalProgress as {
    summarizeGoalProgress?: (
      goal: ReturnType<typeof createGoal>,
      tasks: Array<{ id: string; status: 'todo' | 'doing' | 'done' }>,
    ) => {
      targetType: 'manual' | 'linkedTasks'
      currentValue: number
      targetValue: number
      percent: number
    }
  }
).summarizeGoalProgress

describe('Goal progress summary', () => {
  it('summarizes manual numeric progress', () => {
    expect(summarizeGoalProgress).toBeTypeOf('function')
    const goal = createGoal({
      id: 'goal-manual',
      name: 'Adoption',
      targetType: 'manual',
      targetValue: 80,
      currentValue: 20,
    })

    expect(summarizeGoalProgress!(goal, [])).toEqual({
      targetType: 'manual',
      currentValue: 20,
      targetValue: 80,
      percent: 25,
    })
  })

  it('summarizes linked-Task completion progress', () => {
    expect(summarizeGoalProgress).toBeTypeOf('function')
    let goal = createGoal({
      id: 'goal-linked',
      name: 'Launch checklist',
      targetType: 'linkedTasks',
      targetValue: 90,
      currentValue: 80,
    })
    goal = linkGoalTask(goal, 'task-1')
    goal = linkGoalTask(goal, 'task-2')

    expect(
      summarizeGoalProgress!(goal, [
        { id: 'task-1', status: 'done' },
        { id: 'task-2', status: 'todo' },
      ]),
    ).toEqual({
      targetType: 'linkedTasks',
      currentValue: 1,
      targetValue: 2,
      percent: 50,
    })
  })

  it('does not mutate the Goal or Task inputs', () => {
    expect(summarizeGoalProgress).toBeTypeOf('function')
    let goal = createGoal({
      id: 'goal-pure',
      name: 'Pure summary',
      targetType: 'linkedTasks',
      targetValue: 1,
      currentValue: 1,
    })
    goal = linkGoalTask(goal, 'task-1')
    const tasks = [{ id: 'task-1', status: 'done' as const }]
    const goalSnapshot = JSON.stringify(goal)
    const taskSnapshot = JSON.stringify(tasks)

    summarizeGoalProgress!(goal, tasks)

    expect(JSON.stringify(goal)).toBe(goalSnapshot)
    expect(JSON.stringify(tasks)).toBe(taskSnapshot)
  })
})
