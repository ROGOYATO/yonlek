import { describe, expect, it } from 'vitest'

import { createGoalIdentity } from './goal'

describe('Goal identity', () => {
  it('normalizes a stable id and name', () => {
    expect(
      createGoalIdentity({
        id: '  goal-1  ',
        name: '  Ship beta  ',
      }),
    ).toEqual({
      id: 'goal-1',
      name: 'Ship beta',
    })
  })

  it('rejects a blank Goal id', () => {
    expect(() =>
      createGoalIdentity({
        id: '   ',
        name: 'Ship beta',
      }),
    ).toThrow('Goal id is required')
  })

  it('rejects a blank Goal name', () => {
    expect(() =>
      createGoalIdentity({
        id: 'goal-1',
        name: '   ',
      }),
    ).toThrow('Goal name is required')
  })
})
