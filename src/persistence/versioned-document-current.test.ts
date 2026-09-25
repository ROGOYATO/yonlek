import { describe, expect, it } from 'vitest'

import { migrateVersionedDocument } from './versioned-document'

describe('Versioned document migration current-version contract', () => {
  it('returns a current document unchanged with explicit migration metadata', () => {
    const document = {
      version: 3,
      value: 'current',
    }

    const result = migrateVersionedDocument(document, 3)

    expect(result).toEqual({
      document,
      fromVersion: 3,
      toVersion: 3,
      migrated: false,
      appliedVersions: [],
    })
    expect(result.document).toBe(document)
  })

  it.each([
    null,
    {},
    { version: 0 },
    { version: -1 },
    { version: 1.5 },
    { version: '1' },
  ])('rejects an invalid versioned document: %j', (document) => {
    expect(() => migrateVersionedDocument(document, 1)).toThrow(
      'Versioned document is invalid',
    )
  })
})
