import { describe, expect, it } from 'vitest'

import {
  createKnowledgeDocument,
  linkKnowledgeDocumentToProject,
  unlinkKnowledgeDocumentFromProject,
} from './knowledge-document'

describe('Knowledge document Project linkage', () => {
  it('normalizes an optional Project link and removes it without mutating the document', () => {
    const original = createKnowledgeDocument({
      id: 'doc-1',
      title: 'Field notes',
      kind: 'note',
      content: '',
      projectId: '  project-1  ',
    })

    expect(original.projectId).toBe('project-1')

    const linked = linkKnowledgeDocumentToProject(original, '  project-2  ')
    expect(linked).toEqual({ ...original, projectId: 'project-2' })
    expect(original.projectId).toBe('project-1')

    expect(unlinkKnowledgeDocumentFromProject(linked)).toEqual({
      id: 'doc-1',
      title: 'Field notes',
      kind: 'note',
      content: '',
    })
    expect(() => linkKnowledgeDocumentToProject(original, '   ')).toThrow(
      'Knowledge document Project id is required',
    )
  })
})
