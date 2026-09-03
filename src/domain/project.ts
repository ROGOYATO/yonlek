export interface Project {
  id: string
  name: string
  createdAt: string
  description?: string
}

export interface CreateProjectInput {
  id: string
  name: string
  now: string
}

export function createProject(input: CreateProjectInput): Project {
  const name = input.name.trim()

  if (!name) {
    throw new Error('Project name is required')
  }

  return {
    id: input.id,
    name,
    createdAt: input.now,
  }
}


export function renameProject(project: Project, nextName: string): Project {
  const name = nextName.trim()

  if (!name) {
    throw new Error('Project name is required')
  }

  return {
    ...project,
    name,
  }
}


export function setProjectDescription(
  project: Project,
  description: string | null,
): Project {
  const normalizedDescription = description?.trim() ?? ''

  if (!normalizedDescription) {
    const next = { ...project }
    delete next.description
    return next
  }

  return {
    ...project,
    description: normalizedDescription,
  }
}
