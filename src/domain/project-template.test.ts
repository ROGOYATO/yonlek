import { describe, expect, it } from 'vitest'

import * as projectDomain from './project'
import type { Project } from './project'
import type { TaskList } from './task-list'
import type { Task } from './task'


type ProjectTemplateShape = {
  id: string
  name: string
  createdAt: string
  projectName: string
  projectDescription?: string
  lists: Array<{ key: string; name: string }>
  tasks: Array<{
    key: string
    title: string
    status: Task['status']
    priority: Task['priority']
    description?: string
    listKey?: string
    parentTaskKey?: string
    checklist?: Array<{ text: string; completed: boolean }>
  }>
}

type CreateProjectTemplateFn = (input: {
  id: string
  name: string
  now: string
  project: Project
  lists: TaskList[]
  tasks: Task[]
}) => ProjectTemplateShape

type InstantiateProjectTemplateFn = (
  template: ProjectTemplateShape,
  input: { now: string; nextId(): string },
) => { project: Project; lists: TaskList[]; tasks: Task[] }

describe('project template lifecycle', () => {
  it('snapshots reusable project structure and instantiates it with fresh identities', () => {
    const project: Project = {
      id: 'project-1',
      name: 'Robotics Research',
      description: 'Camera-guided arm experiments',
      areaId: 'area-1',
      createdAt: '2026-09-04T20:40:00.000Z',
    }
    const lists: TaskList[] = [
      {
        id: 'list-experiments',
        projectId: project.id,
        name: 'Experiments',
        createdAt: '2026-09-04T20:41:00.000Z',
      },
      {
        id: 'list-review',
        projectId: project.id,
        name: 'Review',
        createdAt: '2026-09-04T20:42:00.000Z',
      },
    ]
    const tasks: Task[] = [
      {
        id: 'task-root',
        projectId: project.id,
        listId: lists[0].id,
        title: 'Define protocol',
        status: 'doing',
        priority: 'high',
        createdAt: '2026-09-04T20:43:00.000Z',
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
      },
      {
        id: 'task-child',
        projectId: project.id,
        listId: lists[0].id,
        parentTaskId: 'task-root',
        title: 'Calibrate camera',
        status: 'todo',
        priority: 'low',
        createdAt: '2026-09-04T20:44:00.000Z',
      },
      {
        id: 'task-archived',
        projectId: project.id,
        title: 'Retired setup',
        status: 'done',
        priority: 'normal',
        createdAt: '2026-09-04T20:45:00.000Z',
        archivedAt: '2026-09-04T20:46:00.000Z',
      },
    ]

    const createProjectTemplate = (
      projectDomain as unknown as {
        createProjectTemplate: CreateProjectTemplateFn
      }
    ).createProjectTemplate
    const instantiateProjectTemplate = (
      projectDomain as unknown as {
        instantiateProjectTemplate: InstantiateProjectTemplateFn
      }
    ).instantiateProjectTemplate

    const template = createProjectTemplate({
      id: 'template-1',
      name: '  Robotics experiment  ',
      now: '2026-09-04T20:47:00.000Z',
      project,
      lists,
      tasks,
    })

    expect(template).toEqual({
      id: 'template-1',
      name: 'Robotics experiment',
      createdAt: '2026-09-04T20:47:00.000Z',
      projectName: 'Robotics Research',
      projectDescription: 'Camera-guided arm experiments',
      lists: [
        { key: 'list-experiments', name: 'Experiments' },
        { key: 'list-review', name: 'Review' },
      ],
      tasks: [
        {
          key: 'task-root',
          title: 'Define protocol',
          status: 'doing',
          priority: 'high',
          description: 'Write the repeatable experiment procedure',
          listKey: 'list-experiments',
          checklist: [{ text: 'Record calibration', completed: true }],
        },
        {
          key: 'task-child',
          title: 'Calibrate camera',
          status: 'todo',
          priority: 'low',
          listKey: 'list-experiments',
          parentTaskKey: 'task-root',
        },
      ],
    })

    const ids = [
      'project-new',
      'list-new-1',
      'list-new-2',
      'task-new-1',
      'task-new-2',
      'check-new-1',
    ]
    const instance = instantiateProjectTemplate(template, {
      now: '2026-09-04T20:48:00.000Z',
      nextId: () => {
        const id = ids.shift()
        if (id === undefined) {
          throw new Error('Unexpected id request')
        }
        return id
      },
    })

    expect(instance.project).toEqual({
      id: 'project-new',
      name: 'Robotics Research',
      createdAt: '2026-09-04T20:48:00.000Z',
      description: 'Camera-guided arm experiments',
    })
    expect(instance.lists).toEqual([
      {
        id: 'list-new-1',
        projectId: 'project-new',
        name: 'Experiments',
        createdAt: '2026-09-04T20:48:00.000Z',
      },
      {
        id: 'list-new-2',
        projectId: 'project-new',
        name: 'Review',
        createdAt: '2026-09-04T20:48:00.000Z',
      },
    ])
    expect(instance.tasks).toEqual([
      {
        id: 'task-new-1',
        projectId: 'project-new',
        listId: 'list-new-1',
        title: 'Define protocol',
        status: 'doing',
        priority: 'high',
        createdAt: '2026-09-04T20:48:00.000Z',
        description: 'Write the repeatable experiment procedure',
        checklist: [
          {
            id: 'check-new-1',
            text: 'Record calibration',
            completed: true,
          },
        ],
      },
      {
        id: 'task-new-2',
        projectId: 'project-new',
        listId: 'list-new-1',
        parentTaskId: 'task-new-1',
        title: 'Calibrate camera',
        status: 'todo',
        priority: 'low',
        createdAt: '2026-09-04T20:48:00.000Z',
      },
    ])
    expect(ids).toEqual([])
  })
})
