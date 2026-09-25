export type VersionedDocument = Record<string, unknown> & {
  version: number
}

export type VersionedDocumentMigration = (
  document: Readonly<VersionedDocument>,
) => VersionedDocument

export type VersionedDocumentMigrations = Readonly<
  Record<number, VersionedDocumentMigration>
>

export type VersionedDocumentMigrationErrorCode =
  | 'invalid-document'
  | 'unsupported-version'
  | 'missing-migration'
  | 'invalid-migration'

export class VersionedDocumentMigrationError extends Error {
  constructor(
    public readonly code: VersionedDocumentMigrationErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'VersionedDocumentMigrationError'
  }
}

export interface VersionedDocumentMigrationResult {
  document: VersionedDocument
  fromVersion: number
  toVersion: number
  migrated: boolean
  appliedVersions: number[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isValidVersion(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

function invalidDocument(): never {
  throw new VersionedDocumentMigrationError(
    'invalid-document',
    'Versioned document is invalid',
  )
}

export function migrateVersionedDocument(
  value: unknown,
  currentVersion: number,
  migrations: VersionedDocumentMigrations = {},
): VersionedDocumentMigrationResult {
  if (
    !isRecord(value) ||
    !isValidVersion(value.version) ||
    !isValidVersion(currentVersion)
  ) {
    invalidDocument()
  }

  if (value.version > currentVersion) {
    throw new VersionedDocumentMigrationError(
      'unsupported-version',
      'Unsupported document version',
    )
  }

  const fromVersion = value.version
  let document = value as VersionedDocument
  const appliedVersions: number[] = []

  while (document.version < currentVersion) {
    const sourceVersion = document.version
    const migration = migrations[sourceVersion]

    if (!migration) {
      throw new VersionedDocumentMigrationError(
        'missing-migration',
        `Missing document migration: ${sourceVersion}`,
      )
    }

    const next = migration(document)

    if (
      !isRecord(next) ||
      !isValidVersion(next.version) ||
      next.version !== sourceVersion + 1
    ) {
      throw new VersionedDocumentMigrationError(
        'invalid-migration',
        'Document migration is invalid',
      )
    }

    document = next
    appliedVersions.push(sourceVersion)
  }

  return {
    document,
    fromVersion,
    toVersion: currentVersion,
    migrated: appliedVersions.length > 0,
    appliedVersions,
  }
}
