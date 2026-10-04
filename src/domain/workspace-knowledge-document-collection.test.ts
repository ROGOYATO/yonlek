import { describe, expect, it } from 'vitest'

import { createKnowledgeDocument } from './knowledge-document'
import { createProject } from './project'
import { workspaceReducer, type WorkspaceState } from './workspace'

describe('Workspace Knowledge document collection', () => {
  it('keeps documents valid, editable, unique, and safe when a linked Project is deleted', () => {
    const project = createProject({ id: 'project-1', name: 'Launch' })
    const base: WorkspaceState = {
      projects: [project],
      tasks: [],
    }
    const document = createKnowledgeDocument({
      id: 'doc-1',
      title: 'Launch notes',
      kind: 'note',
      content: 'Draft',
      projectId: project.id,
    })

    let workspace = workspaceReducer(base, {
      type: 'knowledgeDocument/added',
      document,
    })
    expect(workspace.knowledgeDocuments).toEqual([document])

    expect(() =>
      workspaceReducer(workspace, {
        type: 'knowledgeDocument/added',
        document,
      }),
    ).toThrow('Knowledge document id must be unique')

    expect(() =>
      workspaceReducer(base, {
        type: 'knowledgeDocument/added',
        document: createKnowledgeDocument({
          ...document,
          id: 'doc-missing-project',
          projectId: 'missing-project',
        }),
      }),
    ).toThrow('Cannot add a Knowledge document linked to a missing Project')

    workspace = workspaceReducer(workspace, {
      type: 'knowledgeDocument/titleChanged',
      documentId: document.id,
      title: '  Launch handbook  ',
    })
    workspace = workspaceReducer(workspace, {
      type: 'knowledgeDocument/contentChanged',
      documentId: document.id,
      content: 'Canonical',
    })
    workspace = workspaceReducer(workspace, {
      type: 'knowledgeDocument/kindChanged',
      documentId: document.id,
      kind: 'doc',
    })
    workspace = workspaceReducer(workspace, {
      type: 'knowledgeDocument/sourceOfTruthChanged',
      documentId: document.id,
      sourceOfTruth: true,
    })

    expect(workspace.knowledgeDocuments?.[0]).toEqual({
      id: 'doc-1',
      title: 'Launch handbook',
      kind: 'doc',
      content: 'Canonical',
      projectId: project.id,
      sourceOfTruth: true,
    })

    workspace = workspaceReducer(workspace, {
      type: 'project/deleted',
      projectId: project.id,
    })
    expect(workspace.knowledgeDocuments?.[0]).toEqual({
      id: 'doc-1',
      title: 'Launch handbook',
      kind: 'doc',
      content: 'Canonical',
      sourceOfTruth: true,
    })

    workspace = workspaceReducer(workspace, {
      type: 'knowledgeDocument/projectChanged',
      documentId: document.id,
      projectId: null,
    })
    workspace = workspaceReducer(workspace, {
      type: 'knowledgeDocument/deleted',
      documentId: document.id,
    })
    expect(workspace.knowledgeDocuments).toBeUndefined()
  })
})
