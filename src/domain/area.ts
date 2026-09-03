export interface Area {
  id: string
  name: string
  createdAt: string
}

export interface CreateAreaInput {
  id: string
  name: string
  now: string
}

export function createArea(input: CreateAreaInput): Area {
  const name = input.name.trim()

  if (!name) {
    throw new Error('Area name is required')
  }

  return {
    id: input.id,
    name,
    createdAt: input.now,
  }
}

export function renameArea(area: Area, nextName: string): Area {
  const name = nextName.trim()

  if (!name) {
    throw new Error('Area name is required')
  }

  return {
    ...area,
    name,
  }
}
