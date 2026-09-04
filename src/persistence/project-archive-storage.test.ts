import { describe, expect, it } from 'vitest'

import { createProject } from '../domain/project'
import {
  loadWorkspace,
  type KeyValueStore,
} from './workspace-storage'

describe('archived project persistence', () => {
  it('preserves valid archive timestamps and rejects invalid ones', () => {
    const project = createProject({
      id: 'project-archive-storage',
      name: 'Robotics Research',
      now: '2026-09-04T19:45:00.000Z',
    })

    const validStore: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            projects: [
              {
                ...project,
                archivedAt: '2026-09-04T19:46:00.000Z',
              },
            ],
            tasks: [],
          },
        }),
      setItem: () => undefined,
    }

    expect(loadWorkspace(validStore).projects[0]?.archivedAt).toBe(
      '2026-09-04T19:46:00.000Z',
    )

    const invalidStore: KeyValueStore = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          workspace: {
            projects: [
              {
                ...project,
                archivedAt: 'not-an-instant',
              },
            ],
            tasks: [],
          },
        }),
      setItem: () => undefined,
    }

    expect(() => loadWorkspace(invalidStore)).toThrow(
      'Workspace storage is invalid',
    )
  })
})
