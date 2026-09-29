import { describe, expect, it } from 'vitest'

import * as goalDomain from './goal'
import { createGoal, linkGoalTask } from './goal'

const unlinkGoalTask = (
  goalDomain as {
    unlinkGoalTask?: (goal: ReturnType<typeof createGoal>, taskId: string) => ReturnType<typeof createGoal>
  }
).unlinkGoalTask

function linkedGoal() {
  const current = createGoal({
    id: 'goal-1',
    name: 'Ship beta',
    targetType: 'linkedTasks',
    targetValue: 2,
    currentValue: 0,
  })
  return linkGoalTask(linkGoalTask(current, 'task-1'), 'task-2')
}

describe('Goal Task unlinking domain', () => {
  it('unlinks one Task without disturbing the remaining order', () => {
    expect(unlinkGoalTask).toBeTypeOf('function')
    expect(unlinkGoalTask!(linkedGoal(), 'task-1').linkedTaskIds).toEqual(['task-2'])
  })

  it('removes the optional linkage field after unlinking the final Task', () => {
    expect(unlinkGoalTask).toBeTypeOf('function')
    const current = linkGoalTask(
      createGoal({
        id: 'goal-1',
        name: 'Ship beta',
        targetType: 'linkedTasks',
        targetValue: 1,
        currentValue: 0,
      }),
      'task-1',
    )
    expect(unlinkGoalTask!(current, 'task-1')).not.toHaveProperty('linkedTaskIds')
  })
})
