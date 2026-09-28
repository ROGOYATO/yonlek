export interface GoalIdentity {
  id: string
  name: string
}

export interface CreateGoalIdentityInput {
  id: string
  name: string
}

export function createGoalIdentity(
  input: CreateGoalIdentityInput,
): GoalIdentity {
  const id = input.id.trim()
  const name = input.name.trim()

  if (!id) {
    throw new Error('Goal id is required')
  }

  if (!name) {
    throw new Error('Goal name is required')
  }

  return {
    id,
    name,
  }
}

export interface GoalDetails extends GoalIdentity {
  description?: string
}

export function setGoalDescription<T extends GoalDetails>(
  goal: T,
  description: string | null,
): T {
  const normalizedDescription = description?.trim() ?? ''

  if (!normalizedDescription) {
    const next = { ...goal }
    delete next.description
    return next
  }

  return {
    ...goal,
    description: normalizedDescription,
  }
}

export type GoalTargetType = 'manual' | 'linkedTasks'

export interface GoalTargetDefinition extends GoalDetails {
  targetType: GoalTargetType
}

export interface CreateGoalTargetInput extends CreateGoalIdentityInput {
  description?: string
  targetType: GoalTargetType
}

function normalizeGoalTargetType(value: unknown): GoalTargetType {
  if (value !== 'manual' && value !== 'linkedTasks') {
    throw new Error('Goal target type is invalid')
  }

  return value
}

export function createGoalTarget(
  input: CreateGoalTargetInput,
): GoalTargetDefinition {
  const identity = createGoalIdentity(input)
  const targetType = normalizeGoalTargetType(input.targetType)
  const goal = setGoalDescription(identity, input.description ?? null)

  return {
    ...goal,
    targetType,
  }
}

export interface Goal extends GoalTargetDefinition {
  targetValue: number
  currentValue: number
}

export interface CreateGoalInput extends CreateGoalTargetInput {
  targetValue: number
  currentValue: number
}

function normalizeGoalValue(value: unknown, field: 'target' | 'current'): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(`Goal ${field} value must be a finite non-negative number`)
  }

  return value
}

export function createGoal(input: CreateGoalInput): Goal {
  return {
    ...createGoalTarget(input),
    targetValue: normalizeGoalValue(input.targetValue, 'target'),
    currentValue: normalizeGoalValue(input.currentValue, 'current'),
  }
}

export function setGoalValues(
  goal: Goal,
  targetValue: number,
  currentValue: number,
): Goal {
  return {
    ...goal,
    targetValue: normalizeGoalValue(targetValue, 'target'),
    currentValue: normalizeGoalValue(currentValue, 'current'),
  }
}

export function validateGoal(goal: Goal): void {
  createGoal(goal)
}

export function renameGoal(goal: Goal, nextName: string): Goal {
  validateGoal(goal)
  const identity = createGoalIdentity({
    id: goal.id,
    name: nextName,
  })

  return {
    ...goal,
    name: identity.name,
  }
}

export function setGoalTargetType(
  goal: Goal,
  targetType: GoalTargetType,
): Goal {
  validateGoal(goal)

  return {
    ...goal,
    targetType: normalizeGoalTargetType(targetType),
  }
}
