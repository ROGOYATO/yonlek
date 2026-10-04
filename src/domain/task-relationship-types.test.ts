import { describe, expect, it } from 'vitest'

import * as relationshipDomain from './task-relationship'

describe('task relationship runtime types', () => {
  it('exposes the supported relationship types and rejects unknown values', () => {
    const registry = (
      relationshipDomain as typeof relationshipDomain & {
        TASK_RELATIONSHIP_TYPES?: readonly string[]
      }
    ).TASK_RELATIONSHIP_TYPES
    const guard = (
      relationshipDomain as typeof relationshipDomain & {
        isTaskRelationshipType?: (value: unknown) => boolean
      }
    ).isTaskRelationshipType

    expect(registry).toEqual([
      'blocks',
      'related',
      'duplicates',
      'references',
    ])
    expect(guard?.('blocks')).toBe(true)
    expect(guard?.('related')).toBe(true)
    expect(guard?.('duplicates')).toBe(true)
    expect(guard?.('references')).toBe(true)
    expect(guard?.('unsupported')).toBe(false)
  })
})
