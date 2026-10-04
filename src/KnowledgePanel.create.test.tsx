/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { KnowledgePanel } from './KnowledgePanel'

afterEach(() => cleanup())

describe('KnowledgePanel creation', () => {
  it('creates a Note or Doc with exact content through the supplied command boundary', async () => {
    const user = userEvent.setup()
    const onAddKnowledgeDocument = vi.fn()

    render(
      <KnowledgePanel
        state={{ projects: [], tasks: [] }}
        onAddKnowledgeDocument={onAddKnowledgeDocument}
        onRenameKnowledgeDocument={vi.fn()}
        onChangeKnowledgeDocumentContent={vi.fn()}
        onChangeKnowledgeDocumentKind={vi.fn()}
        onChangeKnowledgeDocumentProject={vi.fn()}
        onChangeKnowledgeDocumentSourceOfTruth={vi.fn()}
        onDeleteKnowledgeDocument={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Notes / Docs / Wiki' })).toBeTruthy()
    await user.type(screen.getByLabelText('New document title'), 'Launch notes')
    await user.selectOptions(screen.getByLabelText('New document kind'), 'doc')
    await user.type(screen.getByLabelText('New document content'), '  exact body{enter}')
    await user.click(screen.getByRole('button', { name: 'Add document' }))

    expect(onAddKnowledgeDocument).toHaveBeenCalledWith('Launch notes', {
      kind: 'doc',
      content: '  exact body\n',
      projectId: undefined,
      sourceOfTruth: false,
    })
  })
})
