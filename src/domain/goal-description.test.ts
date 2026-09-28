import { describe, expect, it } from 'vitest'

import * as goalDomain from './goal'
import type { GoalIdentity } from './goal'

const setGoalDescription = (
  goalDomain as {
    setGoalDescription?: (
      goal: GoalIdentity & { description?: string },
      description: string | null,
    ) => GoalIdentity & { description?: string }
  }
).setGoalDescription

describe('Goal optional description', () => {
  it('sets a trimmed description without mutating the previous Goal', () => {
    expect(setGoalDescription).toBeTypeOf('function')

    const current = { id: 'goal-1', name: 'Ship beta' }
    const next = setGoalDescription!(current, '  Reach external users  ')

    expect(next).not.toBe(current)
    expect(current).not.toHaveProperty('description')
    expect(next).toEqual({
      id: 'goal-1',
      name: 'Ship beta',
      description: 'Reach external users',
    })
  })

  it('clears blank or null descriptions by removing the optional field', () => {
    expect(setGoalDescription).toBeTypeOf('function')

    const current = {
      id: 'goal-1',
      name: 'Ship beta',
      description: 'Old description',
    }

    expect(setGoalDescription!(current, '   ')).toEqual({
      id: 'goal-1',
      name: 'Ship beta',
    })
    expect(setGoalDescription!(current, null)).toEqual({
      id: 'goal-1',
      name: 'Ship beta',
    })
  })
})
