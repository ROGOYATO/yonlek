
import { describe, expect, it } from 'vitest'

import { createGoal } from './goal'
import { deriveManualGoalProgress } from './goal-progress'

describe('manual Goal progress values', () => {
  it('uses the Goal current and target values without mutating the Goal', () => {
    const goal = createGoal({
      id: 'goal-manual',
      name: 'Adoption',
      targetType: 'manual',
      targetValue: 100,
      currentValue: 35,
    })
    const snapshot = JSON.stringify(goal)

    expect(deriveManualGoalProgress(goal)).toEqual({
      currentValue: 35,
      targetValue: 100,
    })
    expect(JSON.stringify(goal)).toBe(snapshot)
  })

  it('rejects applying the manual derivation to a linked-Task Goal', () => {
    const goal = createGoal({
      id: 'goal-linked',
      name: 'Launch checklist',
      targetType: 'linkedTasks',
      targetValue: 99,
      currentValue: 88,
    })

    expect(() => deriveManualGoalProgress(goal)).toThrow(
      'Manual Goal progress requires a manual target type',
    )
  })
})
