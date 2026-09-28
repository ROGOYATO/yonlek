import { describe, expect, it } from 'vitest'

import * as goalDomain from './goal'

const createGoalTarget = (
  goalDomain as {
    createGoalTarget?: (input: {
      id: string
      name: string
      description?: string
      targetType: 'manual' | 'linkedTasks'
    }) => unknown
  }
).createGoalTarget

describe('Goal measurable target type', () => {
  it('stores a manual numeric target type', () => {
    expect(createGoalTarget).toBeTypeOf('function')
    expect(
      createGoalTarget!({
        id: 'goal-manual',
        name: 'Revenue',
        targetType: 'manual',
      }),
    ).toMatchObject({
      id: 'goal-manual',
      name: 'Revenue',
      targetType: 'manual',
    })
  })

  it('stores a linked-Task target type before linkage is introduced', () => {
    expect(createGoalTarget).toBeTypeOf('function')
    expect(
      createGoalTarget!({
        id: 'goal-linked',
        name: 'Launch checklist',
        description: 'Complete linked Tasks',
        targetType: 'linkedTasks',
      }),
    ).toEqual({
      id: 'goal-linked',
      name: 'Launch checklist',
      description: 'Complete linked Tasks',
      targetType: 'linkedTasks',
    })
  })

  it('rejects an unsupported target type', () => {
    expect(createGoalTarget).toBeTypeOf('function')
    expect(() =>
      createGoalTarget!({
        id: 'goal-invalid',
        name: 'Invalid',
        targetType: 'percent' as never,
      }),
    ).toThrow('Goal target type is invalid')
  })
})
