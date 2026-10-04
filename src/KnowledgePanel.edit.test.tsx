/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { KnowledgePanel } from './KnowledgePanel'
import { createKnowledgeDocument } from './domain/knowledge-document'

afterEach(() => cleanup())

describe('KnowledgePanel editing', () => {
  it('edits title, exact content, and kind through supplied callbacks', async () => {
    const user = userEvent.setup()
    const document = createKnowledgeDocument({
      id: 'knowledge-1',
      title: 'Draft',
      kind: 'note',
      content: 'first',
    })
    const onRenameKnowledgeDocument = vi.fn()
    const onChangeKnowledgeDocumentContent = vi.fn()
    const onChangeKnowledgeDocumentKind = vi.fn()

    render(
      <KnowledgePanel
        state={{ projects: [], tasks: [], knowledgeDocuments: [document] }}
        onAddKnowledgeDocument={vi.fn()}
        onRenameKnowledgeDocument={onRenameKnowledgeDocument}
        onChangeKnowledgeDocumentContent={onChangeKnowledgeDocumentContent}
        onChangeKnowledgeDocumentKind={onChangeKnowledgeDocumentKind}
        onChangeKnowledgeDocumentProject={vi.fn()}
        onChangeKnowledgeDocumentSourceOfTruth={vi.fn()}
        onDeleteKnowledgeDocument={vi.fn()}
      />,
    )

    await user.clear(screen.getByLabelText('Document title for Draft'))
    await user.type(screen.getByLabelText('Document title for Draft'), 'Runbook')
    await user.click(screen.getByRole('button', { name: 'Rename Draft' }))
    expect(onRenameKnowledgeDocument).toHaveBeenCalledWith('knowledge-1', 'Runbook')

    await user.clear(screen.getByLabelText('Document content for Draft'))
    await user.type(screen.getByLabelText('Document content for Draft'), '  second{enter}')
    await user.click(screen.getByRole('button', { name: 'Save content for Draft' }))
    expect(onChangeKnowledgeDocumentContent).toHaveBeenCalledWith(
      'knowledge-1',
      '  second\n',
    )

    await user.selectOptions(screen.getByLabelText('Document kind for Draft'), 'doc')
    expect(onChangeKnowledgeDocumentKind).toHaveBeenCalledWith('knowledge-1', 'doc')
  })
})
