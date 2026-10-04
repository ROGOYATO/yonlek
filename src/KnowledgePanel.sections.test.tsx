/** @vitest-environment jsdom */

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { KnowledgePanel } from './KnowledgePanel'
import { createKnowledgeDocument } from './domain/knowledge-document'

afterEach(() => cleanup())

describe('KnowledgePanel Notes Docs Wiki sections', () => {
  it('groups source-of-truth documents into Wiki and deletes through the command callback', async () => {
    const user = userEvent.setup()
    const note = createKnowledgeDocument({ id: 'note-1', title: 'Scratchpad', kind: 'note', content: '' })
    const doc = createKnowledgeDocument({ id: 'doc-1', title: 'Spec', kind: 'doc', content: '' })
    const wiki = createKnowledgeDocument({ id: 'wiki-1', title: 'Canonical runbook', kind: 'doc', content: '', sourceOfTruth: true })
    const onDeleteKnowledgeDocument = vi.fn()

    render(
      <KnowledgePanel
        state={{ projects: [], tasks: [], knowledgeDocuments: [note, doc, wiki] }}
        onAddKnowledgeDocument={vi.fn()}
        onRenameKnowledgeDocument={vi.fn()}
        onChangeKnowledgeDocumentContent={vi.fn()}
        onChangeKnowledgeDocumentKind={vi.fn()}
        onChangeKnowledgeDocumentProject={vi.fn()}
        onChangeKnowledgeDocumentSourceOfTruth={vi.fn()}
        onDeleteKnowledgeDocument={onDeleteKnowledgeDocument}
      />,
    )

    expect(within(screen.getByRole('region', { name: 'Notes' })).getByRole('heading', { name: 'Scratchpad' })).toBeTruthy()
    expect(within(screen.getByRole('region', { name: 'Docs' })).getByRole('heading', { name: 'Spec' })).toBeTruthy()
    expect(within(screen.getByRole('region', { name: 'Wiki' })).getByRole('heading', { name: 'Canonical runbook' })).toBeTruthy()
    expect(screen.getAllByRole('heading', { name: 'Canonical runbook' })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Delete Canonical runbook' }))
    expect(onDeleteKnowledgeDocument).toHaveBeenCalledWith('wiki-1')
  })
})
