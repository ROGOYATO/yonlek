import { describe, expect, it } from 'vitest'

import { archiveProject, createProject, restoreProject } from './project'

describe('project archive lifecycle', () => {
  it('archives and restores a project without mutating the source object', () => {
    const source = createProject({
      id: 'project-archive',
      name: 'Robotics Research',
      now: '2026-09-04T19:30:00.000Z',
    })

    const archived = archiveProject(source, '2026-09-04T19:31:00.000Z')
    const restored = restoreProject(archived)

    expect(source).not.toHaveProperty('archivedAt')
    expect(archived).toEqual({
      ...source,
      archivedAt: '2026-09-04T19:31:00.000Z',
    })
    expect(restored).toEqual(source)
  })
})
