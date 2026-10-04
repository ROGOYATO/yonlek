export interface KnowledgeDocumentIdentity {
  id: string
  title: string
}

export interface CreateKnowledgeDocumentIdentityInput {
  id: string
  title: string
}

export function createKnowledgeDocumentIdentity(
  input: CreateKnowledgeDocumentIdentityInput,
): KnowledgeDocumentIdentity {
  const id = input.id.trim()
  const title = input.title.trim()

  if (!id) {
    throw new Error('Knowledge document id is required')
  }

  if (!title) {
    throw new Error('Knowledge document title is required')
  }

  return {
    id,
    title,
  }
}

export type KnowledgeDocumentKind = 'note' | 'doc'

export interface KnowledgeDocument extends KnowledgeDocumentIdentity {
  kind: KnowledgeDocumentKind
  content: string
  projectId?: string
  sourceOfTruth?: true
}

export interface CreateKnowledgeDocumentInput
  extends CreateKnowledgeDocumentIdentityInput {
  kind: KnowledgeDocumentKind
  content: string
  projectId?: string
  sourceOfTruth?: boolean
}

function normalizeKnowledgeDocumentKind(
  value: unknown,
): KnowledgeDocumentKind {
  if (value !== 'note' && value !== 'doc') {
    throw new Error('Knowledge document kind is invalid')
  }

  return value
}

function normalizeKnowledgeDocumentContent(value: unknown): string {
  if (typeof value !== 'string') {
    throw new Error('Knowledge document content must be a string')
  }

  return value
}

function normalizeKnowledgeDocumentProjectId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Knowledge document Project id is required')
  }

  return value.trim()
}

export function createKnowledgeDocument(
  input: CreateKnowledgeDocumentInput,
): KnowledgeDocument {
  const document: KnowledgeDocument = {
    ...createKnowledgeDocumentIdentity(input),
    kind: normalizeKnowledgeDocumentKind(input.kind),
    content: normalizeKnowledgeDocumentContent(input.content),
  }

  if (input.projectId !== undefined) {
    document.projectId = normalizeKnowledgeDocumentProjectId(input.projectId)
  }

  if (input.sourceOfTruth === true) {
    document.sourceOfTruth = true
  } else if (
    input.sourceOfTruth !== undefined &&
    input.sourceOfTruth !== false
  ) {
    throw new Error('Knowledge document source-of-truth marker must be boolean')
  }

  return document
}

export function validateKnowledgeDocument(
  document: KnowledgeDocument,
): void {
  createKnowledgeDocument(document)
}

export function renameKnowledgeDocument(
  document: KnowledgeDocument,
  nextTitle: string,
): KnowledgeDocument {
  validateKnowledgeDocument(document)
  const identity = createKnowledgeDocumentIdentity({
    id: document.id,
    title: nextTitle,
  })

  return {
    ...document,
    title: identity.title,
  }
}

export function setKnowledgeDocumentContent(
  document: KnowledgeDocument,
  content: string,
): KnowledgeDocument {
  validateKnowledgeDocument(document)

  return {
    ...document,
    content: normalizeKnowledgeDocumentContent(content),
  }
}

export function setKnowledgeDocumentKind(
  document: KnowledgeDocument,
  kind: KnowledgeDocumentKind,
): KnowledgeDocument {
  validateKnowledgeDocument(document)

  return {
    ...document,
    kind: normalizeKnowledgeDocumentKind(kind),
  }
}

export function linkKnowledgeDocumentToProject(
  document: KnowledgeDocument,
  projectId: string,
): KnowledgeDocument {
  validateKnowledgeDocument(document)

  return {
    ...document,
    projectId: normalizeKnowledgeDocumentProjectId(projectId),
  }
}

export function unlinkKnowledgeDocumentFromProject(
  document: KnowledgeDocument,
): KnowledgeDocument {
  validateKnowledgeDocument(document)
  const next = { ...document }
  delete next.projectId
  return next
}

export function setKnowledgeDocumentSourceOfTruth(
  document: KnowledgeDocument,
  sourceOfTruth: boolean,
): KnowledgeDocument {
  validateKnowledgeDocument(document)
  const next = { ...document }

  if (sourceOfTruth) {
    next.sourceOfTruth = true
  } else {
    delete next.sourceOfTruth
  }

  return next
}
