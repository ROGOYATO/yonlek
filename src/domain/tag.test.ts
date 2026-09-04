import { describe, expect, it } from 'vitest'

import * as tagDomain from './tag'

function createTag() {
  return (
    tagDomain as typeof tagDomain & {
      createTag?: (input: {
        id: string
        name: string
        now: string
      }) => {
        id: string
        name: string
        createdAt: string
      }
    }
  ).createTag
}

function renameTag() {
  return (
    tagDomain as typeof tagDomain & {
      renameTag?: (
        tag: { id: string; name: string; createdAt: string },
        name: string,
      ) => { id: string; name: string; createdAt: string }
    }
  ).renameTag
}

describe('tag domain', () => {
  it('creates a tag with a trimmed name', () => {
    expect(
      createTag()?.({
        id: 'tag-1',
        name: '  Safety  ',
        now: '2026-09-04T07:10:00.000Z',
      }),
    ).toEqual({
      id: 'tag-1',
      name: 'Safety',
      createdAt: '2026-09-04T07:10:00.000Z',
    })
  })

  it('rejects a blank tag name', () => {
    expect(() =>
      createTag()?.({
        id: 'tag-1',
        name: '   ',
        now: '2026-09-04T07:10:00.000Z',
      }),
    ).toThrow('Tag name is required')
  })

  it('renames a tag without mutating the original', () => {
    const tag = {
      id: 'tag-1',
      name: 'Safety',
      createdAt: '2026-09-04T07:10:00.000Z',
    }

    const next = renameTag()?.(tag, '  Camera  ')

    expect(next?.name).toBe('Camera')
    expect(tag.name).toBe('Safety')
  })
})
