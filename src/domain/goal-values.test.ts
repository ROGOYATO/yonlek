import { describe, expect, it } from 'vitest'

import * as goalDomain from './goal'
import type { Goal } from './goal'

const createGoal = (
  goalDomain as {
    createGoal?: (input: {
      id: string
      name: string
      description?: string
      targetType: 'manual' | 'linkedTasks'
      targetValue: number
      currentValue: number
    }) => Goal
  }
).createGoal

const setGoalValues = (
  goalDomain as {
    setGoalValues?: (
      goal: Goal,
      targetValue: number,
      currentValue: number,
    ) => Goal
  }
).setGoalValues

function goal(): Goal {
  return createGoal!({
    id: 'goal-1',
    name: 'Adoption',
    targetType: 'manual',
    targetValue: 100,
    currentValue: 25,
  })
}

describe('Goal target and current values', () => {
  it('stores finite non-negative values without clamping current to target', () => {
    expect(createGoal).toBeTypeOf('function')

    expect(
      createGoal!({
        id: 'goal-1',
        name: 'Adoption',
        targetType: 'manual',
        targetValue: 100,
        currentValue: 125,
      }),
    ).toMatchObject({
      targetValue: 100,
      currentValue: 125,
    })
  })

  it('updates both values immutably', () => {
    expect(createGoal).toBeTypeOf('function')
    expect(setGoalValues).toBeTypeOf('function')

    const current = goal()
    const next = setGoalValues!(current, 200, 80)

    expect(next).not.toBe(current)
    expect(current).toMatchObject({
      targetValue: 100,
      currentValue: 25,
    })
    expect(next).toMatchObject({
      targetValue: 200,
      currentValue: 80,
    })
  })

  it('allows a zero target so later progress derivation can define zero-target behavior', () => {
    expect(createGoal).toBeTypeOf('function')

    expect(
      createGoal!({
        id: 'goal-zero',
        name: 'Zero target',
        targetType: 'manual',
        targetValue: 0,
        currentValue: 0,
      }),
    ).toMatchObject({
      targetValue: 0,
      currentValue: 0,
    })
  })

  it('rejects negative and non-finite values', () => {
    expect(createGoal).toBeTypeOf('function')

    const input = {
      id: 'goal-invalid',
      name: 'Invalid values',
      targetType: 'manual' as const,
      targetValue: 10,
      currentValue: 1,
    }

    expect(() => createGoal!({ ...input, targetValue: -1 })).toThrow(
      'Goal target value must be a finite non-negative number',
    )
    expect(() => createGoal!({ ...input, currentValue: Number.NaN })).toThrow(
      'Goal current value must be a finite non-negative number',
    )
    expect(() => createGoal!({ ...input, targetValue: Number.POSITIVE_INFINITY })).toThrow(
      'Goal target value must be a finite non-negative number',
    )
  })
})
