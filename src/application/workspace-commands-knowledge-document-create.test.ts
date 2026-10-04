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

describe('Workspace Knowledge document create command', () => {
  it('creates a normalized Knowledge document through the persisted command path', () => {
    const { storage, commands } = setup()

    const document = commands.addKnowledgeDocument('  Launch runbook  ', {
      kind: 'doc',
      content: '  exact body\n',
      projectId: project.id,
      sourceOfTruth: true,
    })

    expect(document).toMatchObject({
      id: 'knowledge-1',
      title: 'Launch runbook',
      kind: 'doc',
      content: '  exact body\n',
      projectId: project.id,
      sourceOfTruth: true,
    })
    expect(loadWorkspace(storage).knowledgeDocuments).toEqual([document])
  })
})
