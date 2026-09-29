
import { describe, expect, it } from 'vitest'

import * as goalProgress from './goal-progress'

const deriveGoalProgressPercent = (
  goalProgress as {
    deriveGoalProgressPercent?: (values: {
      currentValue: number
      targetValue: number
    }) => number
  }
).deriveGoalProgressPercent

describe('Goal progress percentage', () => {
  it('derives a percentage for a positive target', () => {
    expect(deriveGoalProgressPercent).toBeTypeOf('function')
    expect(
      deriveGoalProgressPercent!({ currentValue: 25, targetValue: 100 }),
    ).toBe(25)
  })

  it('clamps progress above the target to 100 percent', () => {
    expect(deriveGoalProgressPercent).toBeTypeOf('function')
    expect(
      deriveGoalProgressPercent!({ currentValue: 125, targetValue: 100 }),
    ).toBe(100)
  })

  it('clamps progress below zero to zero percent', () => {
    expect(deriveGoalProgressPercent).toBeTypeOf('function')
    expect(
      deriveGoalProgressPercent!({ currentValue: -5, targetValue: 100 }),
    ).toBe(0)
  })
})
