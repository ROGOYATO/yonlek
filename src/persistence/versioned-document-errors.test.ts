import { describe, expect, it } from 'vitest'

import {
  migrateVersionedDocument,
  VersionedDocumentMigrationError,
} from './versioned-document'

function captureMigrationError(run: () => unknown): VersionedDocumentMigrationError {
  try {
    run()
  } catch (error) {
    expect(error).toBeInstanceOf(VersionedDocumentMigrationError)
    return error as VersionedDocumentMigrationError
  }

  throw new Error('Expected migration to fail')
}

describe('Versioned document migration failures', () => {
  it('distinguishes newer versions, missing steps, and invalid migration output', () => {
    const newer = captureMigrationError(() =>
      migrateVersionedDocument({ version: 4 }, 3),
    )
    expect(newer.code).toBe('unsupported-version')
    expect(newer.message).toBe('Unsupported document version')

    const missing = captureMigrationError(() =>
      migrateVersionedDocument({ version: 1 }, 3, {
        1: (document) => ({
          ...document,
          version: 2,
        }),
      }),
    )
    expect(missing.code).toBe('missing-migration')
    expect(missing.message).toBe('Missing document migration: 2')

    const invalid = captureMigrationError(() =>
      migrateVersionedDocument({ version: 1 }, 2, {
        1: (document) => ({
          ...document,
          version: 3,
        }),
      }),
    )
    expect(invalid.code).toBe('invalid-migration')
    expect(invalid.message).toBe('Document migration is invalid')
  })

  it('uses a typed error for invalid document envelopes', () => {
    const error = captureMigrationError(() =>
      migrateVersionedDocument({}, 1),
    )

    expect(error.code).toBe('invalid-document')
    expect(error.message).toBe('Versioned document is invalid')
  })
})
