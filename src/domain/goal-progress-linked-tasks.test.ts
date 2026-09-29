
import { describe, expect, it } from 'vitest'

import { createGoal, linkGoalTask } from './goal'
import * as goalProgress from './goal-progress'

const deriveLinkedTaskGoalProgress = (
  goalProgress as {
    deriveLinkedTaskGoalProgress?: (
      goal: ReturnType<typeof createGoal>,
      tasks: Array<{ id: string; status: 'todo' | 'doing' | 'done' }>,
    ) => { currentValue: number; targetValue: number }
  }
).deriveLinkedTaskGoalProgress

function linkedGoal() {
  let goal = createGoal({
    id: 'goal-linked',
    name: 'Launch checklist',
    targetType: 'linkedTasks',
    targetValue: 50,
    currentValue: 40,
  })
  goal = linkGoalTask(goal, 'task-2')
  goal = linkGoalTask(goal, 'task-1')
  return goal
}

describe('linked-Task Goal progress values', () => {
  it('derives current and target from linked Task completion, not stored numeric values', () => {
    expect(deriveLinkedTaskGoalProgress).toBeTypeOf('function')

    expect(
      deriveLinkedTaskGoalProgress!(linkedGoal(), [
        { id: 'task-1', status: 'done' },
        { id: 'task-2', status: 'doing' },
      ]),
    ).toEqual({
      currentValue: 1,
      targetValue: 2,
    })
  })

  it('ignores unrelated Tasks and counts a missing linked Task as incomplete', () => {
    expect(deriveLinkedTaskGoalProgress).toBeTypeOf('function')

    expect(
      deriveLinkedTaskGoalProgress!(linkedGoal(), [
        { id: 'task-1', status: 'done' },
        { id: 'unrelated', status: 'done' },
      ]),
    ).toEqual({
      currentValue: 1,
      targetValue: 2,
    })
  })
})
