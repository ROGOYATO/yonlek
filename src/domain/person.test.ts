import { describe, expect, it } from 'vitest'

import * as personDomain from './person'

function createPerson() {
  return (
    personDomain as typeof personDomain & {
      createPerson?: (input: {
        id: string
        name: string
        now: string
      }) => {
        id: string
        name: string
        createdAt: string
      }
    }
  ).createPerson
}

function renamePerson() {
  return (
    personDomain as typeof personDomain & {
      renamePerson?: (
        person: { id: string; name: string; createdAt: string },
        name: string,
      ) => { id: string; name: string; createdAt: string }
    }
  ).renamePerson
}

describe('person domain', () => {
  it('creates a person with a trimmed name', () => {
    expect(
      createPerson()?.({
        id: 'person-1',
        name: '  Ada Lovelace  ',
        now: '2026-09-04T08:10:00.000Z',
      }),
    ).toEqual({
      id: 'person-1',
      name: 'Ada Lovelace',
      createdAt: '2026-09-04T08:10:00.000Z',
    })
  })

  it('rejects a blank person name', () => {
    expect(() =>
      createPerson()?.({
        id: 'person-1',
        name: '   ',
        now: '2026-09-04T08:10:00.000Z',
      }),
    ).toThrow('Person name is required')
  })

  it('renames a person without mutating the original', () => {
    const person = {
      id: 'person-1',
      name: 'Ada Lovelace',
      createdAt: '2026-09-04T08:10:00.000Z',
    }

    const next = renamePerson()?.(person, '  Grace Hopper  ')

    expect(next?.name).toBe('Grace Hopper')
    expect(person.name).toBe('Ada Lovelace')
  })
})
