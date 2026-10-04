import type { TaskRelationship } from './task-relationship'

export interface TaskRelationshipSummary {
  blocks: number
  blockedBy: number
  related: number
  duplicates: number
  duplicatedBy: number
  references: number
  referencedBy: number
}

export function summarizeTaskRelationships(
  taskId: string,
  relationships: readonly TaskRelationship[],
): TaskRelationshipSummary {
  const summary: TaskRelationshipSummary = {
    blocks: 0,
    blockedBy: 0,
    related: 0,
    duplicates: 0,
    duplicatedBy: 0,
    references: 0,
    referencedBy: 0,
  }

  for (const relationship of relationships) {
    const isSource = relationship.sourceTaskId === taskId
    const isTarget = relationship.targetTaskId === taskId

    if (!isSource && !isTarget) {
      continue
    }

    switch (relationship.type) {
      case 'blocks':
        if (isSource) {
          summary.blocks += 1
        }
        if (isTarget) {
          summary.blockedBy += 1
        }
        break
      case 'related':
        summary.related += 1
        break
      case 'duplicates':
        if (isSource) {
          summary.duplicates += 1
        }
        if (isTarget) {
          summary.duplicatedBy += 1
        }
        break
      case 'references':
        if (isSource) {
          summary.references += 1
        }
        if (isTarget) {
          summary.referencedBy += 1
        }
        break
    }
  }

  return summary
}
