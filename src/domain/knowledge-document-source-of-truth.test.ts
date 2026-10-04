import { describe, expect, it } from 'vitest'

import {
  createKnowledgeDocument,
  setKnowledgeDocumentSourceOfTruth,
} from './knowledge-document'

describe('Knowledge document source-of-truth marker', () => {
  it('stores only the positive marker and clears it immutably', () => {
    const original = createKnowledgeDocument({
      id: 'doc-1',
      title: 'Operations handbook',
      kind: 'doc',
      content: 'Canonical procedure',
      sourceOfTruth: true,
    })

    expect(original.sourceOfTruth).toBe(true)

    const cleared = setKnowledgeDocumentSourceOfTruth(original, false)
    expect(cleared).toEqual({
      id: 'doc-1',
      title: 'Operations handbook',
      kind: 'doc',
      content: 'Canonical procedure',
    })
    expect(original.sourceOfTruth).toBe(true)

    expect(setKnowledgeDocumentSourceOfTruth(cleared, true)).toEqual(original)
  })
})
