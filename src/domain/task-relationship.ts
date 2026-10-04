export const TASK_RELATIONSHIP_TYPES = [
  'blocks',
  'related',
  'duplicates',
  'references',
] as const

export type TaskRelationshipType = (typeof TASK_RELATIONSHIP_TYPES)[number]

export function isTaskRelationshipType(
  value: unknown,
): value is TaskRelationshipType {
  return (
    typeof value === 'string' &&
    (TASK_RELATIONSHIP_TYPES as readonly string[]).includes(value)
  )
}

export interface TaskRelationship {
  id: string
  type: TaskRelationshipType
  sourceTaskId: string
  targetTaskId: string
  createdAt: string
}

export interface CreateTaskRelationshipInput {
  id: string
  type: TaskRelationshipType
  sourceTaskId: string
  targetTaskId: string
  now: string
}

export function createTaskRelationship(
  input: CreateTaskRelationshipInput,
): TaskRelationship {
  if (!isTaskRelationshipType(input.type)) {
    throw new Error('Unsupported task relationship type')
  }

  if (input.sourceTaskId === input.targetTaskId) {
    throw new Error('A task cannot relate to itself')
  }

  const [sourceTaskId, targetTaskId] =
    input.type === 'related' &&
    input.sourceTaskId.localeCompare(input.targetTaskId) > 0
      ? [input.targetTaskId, input.sourceTaskId]
      : [input.sourceTaskId, input.targetTaskId]

  return {
    id: input.id,
    type: input.type,
    sourceTaskId,
    targetTaskId,
    createdAt: input.now,
  }
}
