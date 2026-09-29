import { describe, expect, it } from 'vitest'

import * as goalDomain from './goal'
import { createGoal } from './goal'

const linkGoalTask = (
  goalDomain as {
    linkGoalTask?: (goal: ReturnType<typeof createGoal>, taskId: string) => ReturnType<typeof createGoal>
  }
).linkGoalTask

function goal() {
  return createGoal({
    id: 'goal-1',
    name: 'Ship beta',
    targetType: 'linkedTasks',
    targetValue: 3,
    currentValue: 0,
  })
}

describe('Goal Task linkage domain', () => {
  it('links a Task immutably and preserves insertion order', () => {
    expect(linkGoalTask).toBeTypeOf('function')
    const current = goal()
    const first = linkGoalTask!(current, 'task-2')
    const second = linkGoalTask!(first, 'task-1')

    expect(current).not.toHaveProperty('linkedTaskIds')
    expect(first.linkedTaskIds).toEqual(['task-2'])
    expect(second.linkedTaskIds).toEqual(['task-2', 'task-1'])
  })
})
