export interface Project {
  id: string
  name: string
  createdAt: string
  archivedAt?: string
  description?: string
  areaId?: string
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


export function archiveProject(
  project: Project,
  archivedAt: string,
): Project {
  return {
    ...project,
    archivedAt,
  }
}

export function restoreProject(project: Project): Project {
  const restored = { ...project }
  delete restored.archivedAt
  return restored
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


export function moveProjectToArea(
  project: Project,
  areaId: string | null,
): Project {
  if (areaId === null) {
    const next = { ...project }
    delete next.areaId
    return next
  }

  const normalizedAreaId = areaId.trim()

  if (!normalizedAreaId) {
    throw new Error('Project area is required')
  }

  return {
    ...project,
    areaId: normalizedAreaId,
  }
}
