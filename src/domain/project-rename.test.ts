import { describe, expect, it } from 'vitest'

import * as projectDomain from './project'

const project = projectDomain.createProject({
  id: 'project-1',
  name: 'Robotics Research',
  now: '2026-09-03T04:30:00.000Z',
})

describe('renameProject', () => {
  it('returns a renamed project without mutating the original project', () => {
    const renameProject = (
      projectDomain as typeof projectDomain & {
        renameProject?: (
          project: projectDomain.Project,
          nextName: string,
        ) => projectDomain.Project
      }
    ).renameProject

    const renamed = renameProject?.(project, '  Autonomy Lab  ')

    expect(renamed?.name).toBe('Autonomy Lab')
    expect(project.name).toBe('Robotics Research')
  })

  it('rejects a blank project name', () => {
    const renameProject = (
      projectDomain as typeof projectDomain & {
        renameProject?: (
          project: projectDomain.Project,
          nextName: string,
        ) => projectDomain.Project
      }
    ).renameProject

    expect(() => renameProject?.(project, '   ')).toThrow(
      'Project name is required',
    )
  })
})
