import { describe, expect, it } from 'vitest'

import {
  createProject,
  createProjectTemplate,
  instantiateProjectTemplate,
} from './project'
import { createTaskList } from './task-list'
import { createTask } from './task'
import { workspaceReducer, type WorkspaceState } from './workspace'

describe('workspace project templates', () => {
  it('stores, instantiates, and deletes a reusable template without changing its source project', () => {
    const sourceProject = createProject({
      id: 'project-source',
      name: 'Robotics Research',
      now: '2026-09-04T21:00:00.000Z',
    })
    const sourceList = createTaskList({
      id: 'list-source',
      projectId: sourceProject.id,
      name: 'Experiments',
      now: '2026-09-04T21:01:00.000Z',
    })
    const sourceTask = createTask({
      id: 'task-source',
      projectId: sourceProject.id,
      listId: sourceList.id,
      title: 'Define protocol',
      now: '2026-09-04T21:02:00.000Z',
    })
    const template = createProjectTemplate({
      id: 'template-1',
      name: 'Robotics experiment',
      now: '2026-09-04T21:03:00.000Z',
      project: sourceProject,
      lists: [sourceList],
      tasks: [sourceTask],
    })
    const initial: WorkspaceState = {
      projects: [sourceProject],
      lists: [sourceList],
      tasks: [sourceTask],
    }

    const withTemplate = workspaceReducer(initial, {
      type: 'projectTemplate/added',
      template,
    } as never)

    expect(withTemplate).toEqual({
      ...initial,
      projectTemplates: [template],
    })
    expect(withTemplate.projectTemplates).toEqual([template])
    expect(withTemplate.projects).toEqual([sourceProject])

    const ids = ['project-new', 'list-new', 'task-new']
    const instance = instantiateProjectTemplate(template, {
      now: '2026-09-04T21:04:00.000Z',
      nextId: () => ids.shift() ?? 'unexpected-id',
    })
    const instantiated = workspaceReducer(withTemplate, {
      type: 'projectTemplate/instantiated',
      ...instance,
    } as never)

    expect(instantiated.projects).toEqual([
      sourceProject,
      instance.project,
    ])
    expect(instantiated.lists).toEqual([sourceList, ...instance.lists])
    expect(instantiated.tasks).toEqual([sourceTask, ...instance.tasks])
    expect(instantiated.projectTemplates).toEqual([template])

    const withoutTemplate = workspaceReducer(instantiated, {
      type: 'projectTemplate/deleted',
      templateId: template.id,
    } as never)

    expect(withoutTemplate.projectTemplates).toBeUndefined()
    expect(withoutTemplate.projects).toEqual([
      sourceProject,
      instance.project,
    ])
  })
})
