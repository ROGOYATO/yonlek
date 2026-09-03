import { describe, expect, it } from 'vitest'

import * as projectDomain from './project'

const project = projectDomain.createProject({
  id: 'project-1',
  name: 'Robotics Research',
  now: '2026-09-03T16:50:00.000Z',
})

function getSetProjectDescription() {
  return (
    projectDomain as typeof projectDomain & {
      setProjectDescription?: (
        project: projectDomain.Project,
        description: string | null,
      ) => projectDomain.Project
    }
  ).setProjectDescription
}

describe('setProjectDescription', () => {
  it('stores a trimmed description without mutating the original project', () => {
    const updated = getSetProjectDescription()?.(
      project,
      '  Camera-guided robotics experiments.  ',
    )

    expect(updated?.description).toBe('Camera-guided robotics experiments.')
    expect(project).not.toHaveProperty('description')
  })

  it('clears an existing description with null', () => {
    const described = {
      ...project,
      description: 'Camera-guided robotics experiments.',
    }

    expect(getSetProjectDescription()?.(described, null)).toEqual(project)
  })

  it('treats a blank description as cleared', () => {
    const described = {
      ...project,
      description: 'Camera-guided robotics experiments.',
    }

    expect(getSetProjectDescription()?.(described, '   ')).toEqual(project)
  })
})
