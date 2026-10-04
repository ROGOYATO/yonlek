import { describe, expect, it } from 'vitest'

import { createKnowledgeDocument } from '../domain/knowledge-document'
import { createProject } from '../domain/project'
import {
  loadWorkspace,
  saveWorkspace,
  type KeyValueStore,
} from './workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('Knowledge document storage round-trip', () => {
  it('round-trips the optional Knowledge document collection in storage version 1', () => {
    const project = createProject({
      id: 'project-1',
      name: 'Launch',
      now: '2026-10-04T08:00:00.000Z',
    })
    const note = createKnowledgeDocument({
      id: 'knowledge-1',
      title: 'Launch notes',
      kind: 'note',
      content: '  keep exact content\n',
      projectId: project.id,
      sourceOfTruth: true,
    })
    const doc = createKnowledgeDocument({
      id: 'knowledge-2',
      title: 'Decision record',
      kind: 'doc',
      content: '# Decision',
    })
    const workspace = {
      projects: [project],
      tasks: [],
      knowledgeDocuments: [note, doc],
    }
    const storage = new MemoryStore()

    saveWorkspace(storage, workspace)

    expect(loadWorkspace(storage)).toEqual(workspace)

    const malformed = new MemoryStore()
    malformed.setItem(
      'workspace-app.workspace',
      JSON.stringify({
        version: 1,
        workspace: {
          projects: [],
          tasks: [],
          knowledgeDocuments: [
            {
              id: 'knowledge-bad',
              title: 'Bad',
              kind: 'wiki',
              content: 'Nope',
            },
          ],
        },
      }),
    )

    expect(() => loadWorkspace(malformed)).toThrow(
      'Workspace storage is invalid',
    )
  })
})
