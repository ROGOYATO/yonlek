import { describe, expect, it } from 'vitest'

import { createTaskTemplate, instantiateTaskTemplate } from './task'
import { workspaceReducer, type WorkspaceState } from './workspace'

const sourceTask = {
  id: 'task-source',
  projectId: 'project-source',
  title: 'Define protocol',
  status: 'todo' as const,
  priority: 'normal' as const,
  createdAt: '2026-09-04T22:50:00.000Z',
}

const template = createTaskTemplate({
  id: 'template-1',
  name: 'Protocol task',
  now: '2026-09-04T22:51:00.000Z',
  rootTask: sourceTask,
  tasks: [sourceTask],
})

describe('workspace task templates', () => {
  it('stores, instantiates, and deletes a task template without changing its source task', () => {
    const initial: WorkspaceState = {
      projects: [
        {
          id: 'project-source',
          name: 'Source',
          createdAt: '2026-09-04T22:49:00.000Z',
        },
        {
          id: 'project-target',
          name: 'Target',
          createdAt: '2026-09-04T22:49:30.000Z',
        },
      ],
      tasks: [sourceTask],
    }

    const withTemplate = workspaceReducer(initial, {
      type: 'taskTemplate/added',
      template,
    } as never)

    expect(withTemplate).toEqual({
      ...initial,
      taskTemplates: [template],
    })
    expect(withTemplate.tasks).toEqual([sourceTask])

    const instance = instantiateTaskTemplate(template, {
      projectId: 'project-target',
      now: '2026-09-04T22:52:00.000Z',
      nextId: () => 'task-new',
    })
    const instantiated = workspaceReducer(withTemplate, {
      type: 'taskTemplate/instantiated',
      tasks: instance.tasks,
    } as never)

    expect(instantiated.tasks).toEqual([sourceTask, ...instance.tasks])
    expect(instantiated.taskTemplates).toEqual([template])

    const withoutTemplate = workspaceReducer(instantiated, {
      type: 'taskTemplate/deleted',
      templateId: template.id,
    } as never)

    expect(withoutTemplate.taskTemplates).toBeUndefined()
    expect(withoutTemplate.tasks).toEqual([sourceTask, ...instance.tasks])
  })
})
