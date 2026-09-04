export type TaskRelationshipType = 'blocks' | 'related'

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
