
import { describe, expect, it } from 'vitest'

import { deriveGoalProgressPercent } from './goal-progress'

describe('Goal progress zero-target behavior', () => {
  it('reports zero percent when both current and target are zero', () => {
    expect(
      deriveGoalProgressPercent({ currentValue: 0, targetValue: 0 }),
    ).toBe(0)
  })

  it('reports 100 percent when positive current progress exceeds a zero target', () => {
    expect(
      deriveGoalProgressPercent({ currentValue: 1, targetValue: 0 }),
    ).toBe(100)
  })
})
