import { describe, expect, it } from 'vitest'

import { createKnowledgeDocument } from '../domain/knowledge-document'
import { createProject } from '../domain/project'
import { loadWorkspace, type KeyValueStore } from './workspace-storage'

class MemoryStore implements KeyValueStore {
  private readonly values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

function stored(workspace: unknown): MemoryStore {
  const storage = new MemoryStore()
  storage.setItem(
    'workspace-app.workspace',
    JSON.stringify({ version: 1, workspace }),
  )
  return storage
}

describe('Knowledge document storage validation', () => {
  it('rejects duplicate ids, missing Project references, and malformed records', () => {
    const project = createProject({
      id: 'project-1',
      name: 'Launch',
      now: '2026-10-04T08:00:00.000Z',
    })
    const document = createKnowledgeDocument({
      id: 'knowledge-1',
      title: 'Runbook',
      kind: 'doc',
      content: 'Steps',
    })

    expect(() =>
      loadWorkspace(
        stored({
          projects: [project],
          tasks: [],
          knowledgeDocuments: [document, document],
        }),
      ),
    ).toThrow('Workspace storage is invalid')

    expect(() =>
      loadWorkspace(
        stored({
          projects: [project],
          tasks: [],
          knowledgeDocuments: [
            createKnowledgeDocument({
              id: 'knowledge-linked',
              title: 'Linked',
              kind: 'note',
              content: '',
              projectId: 'missing-project',
            }),
          ],
        }),
      ),
    ).toThrow('Workspace storage is invalid')

    expect(() =>
      loadWorkspace(
        stored({
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
        }),
      ),
    ).toThrow('Workspace storage is invalid')
  })
})
