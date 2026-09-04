import { describe, expect, it } from 'vitest'

import * as relationshipDomain from './task-relationship'

function createTaskRelationship() {
  return (
    relationshipDomain as typeof relationshipDomain & {
      createTaskRelationship?: (input: {
        id: string
        type: 'blocks' | 'related'
        sourceTaskId: string
        targetTaskId: string
        now: string
      }) => {
        id: string
        type: 'blocks' | 'related'
        sourceTaskId: string
        targetTaskId: string
        createdAt: string
      }
    }
  ).createTaskRelationship
}

describe('task relationship domain', () => {
  it('creates a directional Blocks relationship', () => {
    expect(
      createTaskRelationship()?.({
        id: 'relationship-1',
        type: 'blocks',
        sourceTaskId: 'task-2',
        targetTaskId: 'task-1',
        now: '2026-09-04T10:30:00.000Z',
      }),
    ).toEqual({
      id: 'relationship-1',
      type: 'blocks',
      sourceTaskId: 'task-2',
      targetTaskId: 'task-1',
      createdAt: '2026-09-04T10:30:00.000Z',
    })
  })

  it('canonicalizes Related endpoints because the relationship is symmetric', () => {
    expect(
      createTaskRelationship()?.({
        id: 'relationship-1',
        type: 'related',
        sourceTaskId: 'task-z',
        targetTaskId: 'task-a',
        now: '2026-09-04T10:30:00.000Z',
      }),
    ).toMatchObject({
      sourceTaskId: 'task-a',
      targetTaskId: 'task-z',
    })
  })

  it('rejects self relationships', () => {
    expect(() =>
      createTaskRelationship()?.({
        id: 'relationship-1',
        type: 'blocks',
        sourceTaskId: 'task-1',
        targetTaskId: 'task-1',
        now: '2026-09-04T10:30:00.000Z',
      }),
    ).toThrow('A task cannot relate to itself')
  })

  it('preserves the supplied creation timestamp', () => {
    expect(
      createTaskRelationship()?.({
        id: 'relationship-1',
        type: 'related',
        sourceTaskId: 'task-1',
        targetTaskId: 'task-2',
        now: '2026-09-04T10:31:00.000Z',
      })?.createdAt,
    ).toBe('2026-09-04T10:31:00.000Z')
  })
})
