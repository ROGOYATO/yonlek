import { describe, expect, it } from 'vitest'

import * as projectDomain from './project'

const project = projectDomain.createProject({
  id: 'project-1',
  name: 'Robotics Research',
  now: '2026-09-03T19:10:00.000Z',
})

function moveProjectToArea() {
  return (
    projectDomain as typeof projectDomain & {
      moveProjectToArea?: (
        project: projectDomain.Project,
        areaId: string | null,
      ) => projectDomain.Project
    }
  ).moveProjectToArea
}

describe('moveProjectToArea', () => {
  it('assigns a project to a trimmed area id without mutating the original', () => {
    const next = moveProjectToArea()?.(project, '  area-1  ')

    expect(next?.areaId).toBe('area-1')
    expect(project).not.toHaveProperty('areaId')
  })

  it('clears an area assignment with null', () => {
    const assigned = { ...project, areaId: 'area-1' }

    expect(moveProjectToArea()?.(assigned, null)).toEqual(project)
  })
})
