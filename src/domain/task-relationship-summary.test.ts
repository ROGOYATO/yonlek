import { describe, expect, it } from 'vitest'

import type { TaskRelationship } from './task-relationship'
import { summarizeTaskRelationships } from './task-relationship-summary'

describe('task relationship summary', () => {
  it('counts directional and symmetric relationship roles without mutation', () => {
    const relationships: TaskRelationship[] = [
      {
        id: 'r-blocks-out',
        type: 'blocks',
        sourceTaskId: 'task-a',
        targetTaskId: 'task-b',
        createdAt: '2026-10-04T15:20:00.000Z',
      },
      {
        id: 'r-blocks-in',
        type: 'blocks',
        sourceTaskId: 'task-c',
        targetTaskId: 'task-a',
        createdAt: '2026-10-04T15:21:00.000Z',
      },
      {
        id: 'r-related',
        type: 'related',
        sourceTaskId: 'task-a',
        targetTaskId: 'task-d',
        createdAt: '2026-10-04T15:22:00.000Z',
      },
      {
        id: 'r-duplicates-out',
        type: 'duplicates',
        sourceTaskId: 'task-a',
        targetTaskId: 'task-e',
        createdAt: '2026-10-04T15:23:00.000Z',
      },
      {
        id: 'r-duplicates-in',
        type: 'duplicates',
        sourceTaskId: 'task-f',
        targetTaskId: 'task-a',
        createdAt: '2026-10-04T15:24:00.000Z',
      },
      {
        id: 'r-references-out',
        type: 'references',
        sourceTaskId: 'task-a',
        targetTaskId: 'task-g',
        createdAt: '2026-10-04T15:25:00.000Z',
      },
      {
        id: 'r-references-in',
        type: 'references',
        sourceTaskId: 'task-h',
        targetTaskId: 'task-a',
        createdAt: '2026-10-04T15:26:00.000Z',
      },
    ]
    const before = structuredClone(relationships)

    expect(summarizeTaskRelationships('task-a', relationships)).toEqual({
      blocks: 1,
      blockedBy: 1,
      related: 1,
      duplicates: 1,
      duplicatedBy: 1,
      references: 1,
      referencedBy: 1,
    })
    expect(relationships).toEqual(before)
  })
})
