import { describe, expect, it } from 'vitest'

import { createKnowledgeDocumentIdentity } from './knowledge-document'

describe('Knowledge document identity', () => {
  it('trims stable identity fields and rejects blank ids or titles', () => {
    expect(
      createKnowledgeDocumentIdentity({
        id: '  doc-1  ',
        title: '  Tunnel plan  ',
      }),
    ).toEqual({
      id: 'doc-1',
      title: 'Tunnel plan',
    })

    expect(() =>
      createKnowledgeDocumentIdentity({ id: '   ', title: 'Valid title' }),
    ).toThrow('Knowledge document id is required')
    expect(() =>
      createKnowledgeDocumentIdentity({ id: 'doc-1', title: '   ' }),
    ).toThrow('Knowledge document title is required')
  })
})
