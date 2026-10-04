import { describe, expect, it } from 'vitest'

import { createTaskRelationship } from './task-relationship'

describe('additional task relationship construction', () => {
  it('keeps Duplicates and References directional and rejects unsupported types', () => {
    const duplicates = createTaskRelationship({
      id: 'relationship-1',
      type: 'duplicates',
      sourceTaskId: 'task-z',
      targetTaskId: 'task-a',
      now: '2026-10-04T15:00:00.000Z',
    })
    const references = createTaskRelationship({
      id: 'relationship-2',
      type: 'references',
      sourceTaskId: 'task-z',
      targetTaskId: 'task-a',
      now: '2026-10-04T15:01:00.000Z',
    })

    expect(duplicates).toMatchObject({
      type: 'duplicates',
      sourceTaskId: 'task-z',
      targetTaskId: 'task-a',
    })
    expect(references).toMatchObject({
      type: 'references',
      sourceTaskId: 'task-z',
      targetTaskId: 'task-a',
    })
    expect(() =>
      createTaskRelationship({
        id: 'relationship-3',
        type: 'unsupported' as never,
        sourceTaskId: 'task-1',
        targetTaskId: 'task-2',
        now: '2026-10-04T15:02:00.000Z',
      }),
    ).toThrow('Unsupported task relationship type')
  })
})
