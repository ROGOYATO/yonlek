import { describe, expect, it } from 'vitest'

import {
  createKnowledgeDocument,
  renameKnowledgeDocument,
  setKnowledgeDocumentContent,
  setKnowledgeDocumentKind,
} from './knowledge-document'

describe('Knowledge document kind and content', () => {
  it('keeps note/doc kind explicit and preserves editable content exactly', () => {
    const original = createKnowledgeDocument({
      id: 'doc-1',
      title: 'Draft',
      kind: 'note',
      content: '  first line\nsecond line  ',
    })

    expect(original).toEqual({
      id: 'doc-1',
      title: 'Draft',
      kind: 'note',
      content: '  first line\nsecond line  ',
    })
    expect(renameKnowledgeDocument(original, '  Canonical plan  ')).toEqual({
      ...original,
      title: 'Canonical plan',
    })
    expect(setKnowledgeDocumentContent(original, '')).toEqual({
      ...original,
      content: '',
    })
    expect(setKnowledgeDocumentKind(original, 'doc')).toEqual({
      ...original,
      kind: 'doc',
    })
    expect(() => setKnowledgeDocumentKind(original, 'wiki' as never)).toThrow(
      'Knowledge document kind is invalid',
    )
  })
})
