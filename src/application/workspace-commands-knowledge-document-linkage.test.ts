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

describe('Workspace Knowledge document Project and delete commands', () => {
  it('links, unlinks, and deletes a Knowledge document through persisted commands', () => {
    const { storage, store, commands } = setup()
    const documentId = commands.addKnowledgeDocument('Notes', {
      kind: 'note',
      content: '',
    }).id

    commands.changeKnowledgeDocumentProject(documentId, project.id)
    expect(loadWorkspace(storage).knowledgeDocuments?.[0]?.projectId).toBe(
      project.id,
    )

    commands.changeKnowledgeDocumentProject(documentId, null)
    expect(loadWorkspace(storage).knowledgeDocuments?.[0]).not.toHaveProperty(
      'projectId',
    )

    commands.deleteKnowledgeDocument(documentId)
    expect(store.getState()).not.toHaveProperty('knowledgeDocuments')
    expect(loadWorkspace(storage)).not.toHaveProperty('knowledgeDocuments')
  })
})
