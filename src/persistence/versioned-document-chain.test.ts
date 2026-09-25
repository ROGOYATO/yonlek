import { describe, expect, it } from 'vitest'

import {
  migrateVersionedDocument,
  type VersionedDocumentMigrations,
} from './versioned-document'

describe('Versioned document ordered migration chains', () => {
  it('applies one registered migration per version without mutating the source', () => {
    const source = {
      version: 1,
      name: 'workspace',
    }
    const migrations: VersionedDocumentMigrations = {
      1: (document) => ({
        ...document,
        version: 2,
        firstMigration: true,
      }),
      2: (document) => ({
        ...document,
        version: 3,
        secondMigration: true,
      }),
    }

    const result = migrateVersionedDocument(source, 3, migrations)

    expect(result).toEqual({
      document: {
        version: 3,
        name: 'workspace',
        firstMigration: true,
        secondMigration: true,
      },
      fromVersion: 1,
      toVersion: 3,
      migrated: true,
      appliedVersions: [1, 2],
    })
    expect(source).toEqual({
      version: 1,
      name: 'workspace',
    })
  })
})
