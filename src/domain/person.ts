export interface Person {
  id: string
  name: string
  createdAt: string
}

export interface CreatePersonInput {
  id: string
  name: string
  now: string
}

export function createPerson(input: CreatePersonInput): Person {
  const name = input.name.trim()

  if (!name) {
    throw new Error('Person name is required')
  }

  return {
    id: input.id,
    name,
    createdAt: input.now,
  }
}

export function renamePerson(
  person: Person,
  nextName: string,
): Person {
  const name = nextName.trim()

  if (!name) {
    throw new Error('Person name is required')
  }

  return {
    ...person,
    name,
  }
}
