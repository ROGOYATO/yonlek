export interface Tag {
  id: string
  name: string
  createdAt: string
}

export interface CreateTagInput {
  id: string
  name: string
  now: string
}

export function createTag(input: CreateTagInput): Tag {
  const name = input.name.trim()

  if (!name) {
    throw new Error('Tag name is required')
  }

  return {
    id: input.id,
    name,
    createdAt: input.now,
  }
}

export function renameTag(tag: Tag, nextName: string): Tag {
  const name = nextName.trim()

  if (!name) {
    throw new Error('Tag name is required')
  }

  return {
    ...tag,
    name,
  }
}
