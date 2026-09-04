import { describe, expect, it } from 'vitest'

import * as taskDomain from './task'
import type { Task } from './task'

type TaskTemplateShape = {
  id: string
  name: string
  createdAt: string
  rootTaskKey: string
  tasks: Array<{
    key: string
    title: string
    status: Task['status']
    priority: Task['priority']
    description?: string
    parentTaskKey?: string
    checklist?: Array<{ text: string; completed: boolean }>
  }>
}

type CreateTaskTemplateFn = (input: {
  id: string
  name: string
  now: string
  rootTask: Task
  tasks: Task[]
}) => TaskTemplateShape

type InstantiateTaskTemplateFn = (
  template: TaskTemplateShape,
  input: {
    projectId: string
    listId?: string
    now: string
    nextId(): string
  },
) => { rootTask: Task; tasks: Task[] }

describe('task template lifecycle', () => {
  it('snapshots an active task subtree and instantiates it with fresh identities and selected placement', () => {
    const root: Task = {
      id: 'task-root',
      projectId: 'project-source',
      listId: 'list-source',
      title: 'Define protocol',
      status: 'doing',
      priority: 'high',
      createdAt: '2026-09-04T22:40:00.000Z',
      description: 'Write the repeatable experiment procedure',
      dueDate: '2026-10-01',
      tagIds: ['tag-1'],
      assigneeIds: ['person-1'],
      customFieldValues: { 'field-1': 'camera' },
      checklist: [
        {
          id: 'check-old',
          text: 'Record calibration',
          completed: true,
        },
      ],
    }
    const child: Task = {
      id: 'task-child',
      projectId: root.projectId,
      listId: root.listId,
      parentTaskId: root.id,
      title: 'Calibrate camera',
      status: 'todo',
      priority: 'low',
      createdAt: '2026-09-04T22:41:00.000Z',
    }
    const archivedChild: Task = {
      id: 'task-archived',
      projectId: root.projectId,
      parentTaskId: root.id,
      title: 'Retired setup',
      status: 'done',
      priority: 'normal',
      createdAt: '2026-09-04T22:42:00.000Z',
      archivedAt: '2026-09-04T22:43:00.000Z',
    }
    const unrelated: Task = {
      id: 'task-unrelated',
      projectId: root.projectId,
      title: 'Unrelated task',
      status: 'todo',
      priority: 'normal',
      createdAt: '2026-09-04T22:44:00.000Z',
    }

    const createTaskTemplate = (
      taskDomain as unknown as { createTaskTemplate: CreateTaskTemplateFn }
    ).createTaskTemplate
    const instantiateTaskTemplate = (
      taskDomain as unknown as {
        instantiateTaskTemplate: InstantiateTaskTemplateFn
      }
    ).instantiateTaskTemplate

    const template = createTaskTemplate({
      id: 'template-1',
      name: '  Camera protocol  ',
      now: '2026-09-04T22:45:00.000Z',
      rootTask: root,
      tasks: [root, child, archivedChild, unrelated],
    })

    expect(template).toEqual({
      id: 'template-1',
      name: 'Camera protocol',
      createdAt: '2026-09-04T22:45:00.000Z',
      rootTaskKey: 'task-root',
      tasks: [
        {
          key: 'task-root',
          title: 'Define protocol',
          status: 'doing',
          priority: 'high',
          description: 'Write the repeatable experiment procedure',
          checklist: [{ text: 'Record calibration', completed: true }],
        },
        {
          key: 'task-child',
          title: 'Calibrate camera',
          status: 'todo',
          priority: 'low',
          parentTaskKey: 'task-root',
        },
      ],
    })

    const ids = ['task-new-root', 'task-new-child', 'check-new']
    const instance = instantiateTaskTemplate(template, {
      projectId: 'project-target',
      listId: 'list-target',
      now: '2026-09-04T22:46:00.000Z',
      nextId: () => ids.shift() ?? 'unexpected-id',
    })

    expect(instance.rootTask).toEqual({
      id: 'task-new-root',
      projectId: 'project-target',
      listId: 'list-target',
      title: 'Define protocol',
      status: 'doing',
      priority: 'high',
      createdAt: '2026-09-04T22:46:00.000Z',
      description: 'Write the repeatable experiment procedure',
      checklist: [
        {
          id: 'check-new',
          text: 'Record calibration',
          completed: true,
        },
      ],
    })
    expect(instance.tasks[1]).toEqual({
      id: 'task-new-child',
      projectId: 'project-target',
      listId: 'list-target',
      parentTaskId: 'task-new-root',
      title: 'Calibrate camera',
      status: 'todo',
      priority: 'low',
      createdAt: '2026-09-04T22:46:00.000Z',
    })
    expect(ids).toEqual([])
  })
})
