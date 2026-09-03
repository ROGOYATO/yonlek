import { describe, expect, it } from 'vitest'

import * as areaDomain from './area'

function createArea() {
  return (
    areaDomain as typeof areaDomain & {
      createArea?: (input: {
        id: string
        name: string
        now: string
      }) => { id: string; name: string; createdAt: string }
    }
  ).createArea
}

function renameArea() {
  return (
    areaDomain as typeof areaDomain & {
      renameArea?: (
        area: { id: string; name: string; createdAt: string },
        name: string,
      ) => { id: string; name: string; createdAt: string }
    }
  ).renameArea
}

describe('area domain', () => {
  it('creates an area with a trimmed name', () => {
    expect(
      createArea()?.({
        id: 'area-1',
        name: '  Engineering  ',
        now: '2026-09-03T18:50:00.000Z',
      }),
    ).toEqual({
      id: 'area-1',
      name: 'Engineering',
      createdAt: '2026-09-03T18:50:00.000Z',
    })
  })

  it('rejects a blank area name', () => {
    expect(() =>
      createArea()?.({
        id: 'area-1',
        name: '   ',
        now: '2026-09-03T18:50:00.000Z',
      }),
    ).toThrow('Area name is required')
  })

  it('renames an area without mutating the original', () => {
    const area = {
      id: 'area-1',
      name: 'Engineering',
      createdAt: '2026-09-03T18:50:00.000Z',
    }

    const next = renameArea()?.(area, '  Robotics  ')

    expect(next?.name).toBe('Robotics')
    expect(area.name).toBe('Engineering')
  })
})
