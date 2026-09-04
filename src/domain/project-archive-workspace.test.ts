import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createTask } from './task'
import { workspaceReducer } from './workspace'

describe('project archive workspace lifecycle', () => {
  it('archives and restores a project without mutating its tasks or relationships', () => {
    const project = {
      ...createProject({
        id: 'project-archive',
        name: 'Robotics Research',
        now: '2026-09-04T19:33:00.000Z',
      }),
      areaId: 'area-1',
      description: 'Autonomy experiments',
    }
    const siblingProject = createProject({
      id: 'project-2',
      name: 'Field Tests',
      now: '2026-09-04T19:35:00.000Z',
    })
    const projectTask = createTask({
      id: 'project-archive-task',
      projectId: project.id,
      title: 'Draft experiment plan',
      now: '2026-09-04T19:36:00.000Z',
    })
    const siblingTask = createTask({
      id: 'project-archive-sibling-task',
      projectId: siblingProject.id,
      title: 'Prepare field kit',
      now: '2026-09-04T19:37:00.000Z',
    })
    const list = {
      id: 'list-archive',
      projectId: project.id,
      name: 'Experiments',
      createdAt: '2026-09-04T19:38:00.000Z',
    }
    const relationship = {
      id: 'project-archive-relationship',
      type: 'related' as const,
      sourceTaskId: projectTask.id,
      targetTaskId: siblingTask.id,
      createdAt: '2026-09-04T19:39:00.000Z',
    }
    const state = {
      areas: [
        {
          id: 'area-1',
          name: 'Research',
          createdAt: '2026-09-04T19:34:00.000Z',
        },
      ],
      lists: [list],
      relationships: [relationship],
      projects: [project, siblingProject],
      tasks: [projectTask, siblingTask],
    }

    const archived = workspaceReducer(state, {
      type: 'project/archived',
      projectId: project.id,
      archivedAt: '2026-09-04T19:40:00.000Z',
    } as never)

    expect(archived.projects[0]).toEqual({
      ...project,
      archivedAt: '2026-09-04T19:40:00.000Z',
    })
    expect(archived.tasks).toEqual(state.tasks)
    expect(archived.lists).toEqual(state.lists)
    expect(archived.relationships).toEqual(state.relationships)

    const restored = workspaceReducer(archived, {
      type: 'project/restored',
      projectId: project.id,
    } as never)

    expect(restored.projects[0]).toEqual(project)
    expect(restored.tasks).toEqual(state.tasks)
    expect(restored.lists).toEqual(state.lists)
    expect(restored.relationships).toEqual(state.relationships)
  })
})
