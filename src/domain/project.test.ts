import { describe, expect, it } from 'vitest'

import { createProject } from './project'

describe('createProject', () => {
  it('creates a project with the supplied id and normalized name', () => {
    const project = createProject({
      name: '  Robotics Research  ',
      now: '2026-09-03T00:00:00.000Z',
      id: 'project-1',
    })

    expect(project).toEqual({
      id: 'project-1',
      name: 'Robotics Research',
      createdAt: '2026-09-03T00:00:00.000Z',
    })
  })

  it('rejects an empty project name', () => {
    expect(() =>
      createProject({
        name: '   ',
        now: '2026-09-03T00:00:00.000Z',
        id: 'project-1',
      }),
    ).toThrow('Project name is required')
  })
})

