/** @vitest-environment jsdom */

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { KnowledgePanel } from './KnowledgePanel'
import { createKnowledgeDocument } from './domain/knowledge-document'
import { createProject } from './domain/project'

afterEach(() => cleanup())

describe('KnowledgePanel Project and source-of-truth controls', () => {
  it('changes Project context and Wiki source-of-truth explicitly', async () => {
    const user = userEvent.setup()
    const project = createProject({ id: 'project-1', name: 'Launch', now: '2026-10-04T08:00:00.000Z' })
    const document = createKnowledgeDocument({ id: 'knowledge-1', title: 'Runbook', kind: 'doc', content: '' })
    const onChangeKnowledgeDocumentProject = vi.fn()
    const onChangeKnowledgeDocumentSourceOfTruth = vi.fn()

    render(
      <KnowledgePanel
        state={{ projects: [project], tasks: [], knowledgeDocuments: [document] }}
        onAddKnowledgeDocument={vi.fn()}
        onRenameKnowledgeDocument={vi.fn()}
        onChangeKnowledgeDocumentContent={vi.fn()}
        onChangeKnowledgeDocumentKind={vi.fn()}
        onChangeKnowledgeDocumentProject={onChangeKnowledgeDocumentProject}
        onChangeKnowledgeDocumentSourceOfTruth={onChangeKnowledgeDocumentSourceOfTruth}
        onDeleteKnowledgeDocument={vi.fn()}
      />,
    )

    await user.selectOptions(screen.getByLabelText('Project for Runbook'), project.id)
    expect(onChangeKnowledgeDocumentProject).toHaveBeenCalledWith('knowledge-1', project.id)

    await user.click(screen.getByLabelText('Source of truth for Runbook'))
    expect(onChangeKnowledgeDocumentSourceOfTruth).toHaveBeenCalledWith('knowledge-1', true)

    await user.selectOptions(screen.getByLabelText('Project for Runbook'), '')
    expect(onChangeKnowledgeDocumentProject).toHaveBeenLastCalledWith('knowledge-1', null)
  })
})
