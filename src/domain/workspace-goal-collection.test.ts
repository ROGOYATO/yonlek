import { describe, expect, it } from 'vitest'

import * as goalDomain from './goal'
import { createGoal } from './goal'
import { emptyWorkspace, workspaceReducer } from './workspace'

const validateGoal = (
  goalDomain as {
    validateGoal?: (goal: ReturnType<typeof createGoal>) => void
  }
).validateGoal

function goal(id = 'goal-1') {
  return createGoal({
    id,
    name: 'Ship beta',
    description: 'Reach external users',
    targetType: 'manual',
    targetValue: 100,
    currentValue: 25,
  })
}

describe('Goal validation and Workspace collection', () => {
  it('rejects a malformed Goal at the validation boundary', () => {
    expect(validateGoal).toBeTypeOf('function')
    expect(() =>
      validateGoal!({
        ...goal(),
        targetType: 'percent',
      } as never),
    ).toThrow('Goal target type is invalid')
  })

  it('adds a Goal and rejects duplicate ids', () => {
    const first = goal()
    const withGoal = workspaceReducer(emptyWorkspace, {
      type: 'goal/added',
      goal: first,
    } as never)

    expect(withGoal.goals).toEqual([first])
    expect(emptyWorkspace).not.toHaveProperty('goals')
    expect(() =>
      workspaceReducer(withGoal, {
        type: 'goal/added',
        goal: goal(),
      } as never),
    ).toThrow('Goal id must be unique')
  })

  it('updates Goal model fields immutably', () => {
    const withGoal = workspaceReducer(emptyWorkspace, {
      type: 'goal/added',
      goal: goal(),
    } as never)

    const renamed = workspaceReducer(withGoal, {
      type: 'goal/nameChanged',
      goalId: 'goal-1',
      name: '  Ship public beta  ',
    } as never)
    const described = workspaceReducer(renamed, {
      type: 'goal/descriptionChanged',
      goalId: 'goal-1',
      description: null,
    } as never)
    const retargeted = workspaceReducer(described, {
      type: 'goal/targetTypeChanged',
      goalId: 'goal-1',
      targetType: 'linkedTasks',
    } as never)
    const valued = workspaceReducer(retargeted, {
      type: 'goal/valuesChanged',
      goalId: 'goal-1',
      targetValue: 8,
      currentValue: 3,
    } as never)

    expect(withGoal.goals?.[0]).toMatchObject({
      name: 'Ship beta',
      description: 'Reach external users',
      targetType: 'manual',
      targetValue: 100,
      currentValue: 25,
    })
    expect(valued.goals?.[0]).toEqual({
      id: 'goal-1',
      name: 'Ship public beta',
      targetType: 'linkedTasks',
      targetValue: 8,
      currentValue: 3,
    })
  })

  it('deletes the final Goal without leaving an empty optional collection', () => {
    const withGoal = workspaceReducer(emptyWorkspace, {
      type: 'goal/added',
      goal: goal(),
    } as never)

    const next = workspaceReducer(withGoal, {
      type: 'goal/deleted',
      goalId: 'goal-1',
    } as never)

    expect(next).not.toHaveProperty('goals')
    expect(withGoal.goals).toHaveLength(1)
  })
})
