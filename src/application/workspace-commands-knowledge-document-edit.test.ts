import { describe, expect, it } from 'vitest'

import { createProject } from '../domain/project'
import { createWorkspaceStore } from './workspace-store'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from '../persistence/workspace-storage'
import { createWorkspaceCommands } from './workspace-commands'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-10-04T08:00:00.000Z',
})

function setup() {
  const storage = new MemoryStore()
  saveWorkspace(storage, { projects: [project], tasks: [] })
  const store = createWorkspaceStore(storage)
  const commands = createWorkspaceCommands(store, {
    nextId: () => 'knowledge-1',
    now: () => '2026-10-04T08:30:00.000Z',
  })

  return { storage, store, commands }
}

describe('Workspace Knowledge document edit commands', () => {
  it('edits title, content, kind, and source-of-truth through persisted commands', () => {
    const { storage, commands } = setup()
    const documentId = commands.addKnowledgeDocument('Draft', {
      kind: 'note',
      content: 'first',
    }).id

    commands.renameKnowledgeDocument(documentId, '  Runbook  ')
    commands.changeKnowledgeDocumentContent(documentId, '  second\n')
    commands.changeKnowledgeDocumentKind(documentId, 'doc')
    commands.changeKnowledgeDocumentSourceOfTruth(documentId, true)

    expect(loadWorkspace(storage).knowledgeDocuments?.[0]).toEqual({
      id: documentId,
      title: 'Runbook',
      kind: 'doc',
      content: '  second\n',
      sourceOfTruth: true,
    })

    commands.changeKnowledgeDocumentSourceOfTruth(documentId, false)
    expect(loadWorkspace(storage).knowledgeDocuments?.[0]).not.toHaveProperty(
      'sourceOfTruth',
    )
  })
})
