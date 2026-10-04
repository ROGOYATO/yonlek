import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createTask } from './task'
import { createTaskList } from './task-list'
import { workspaceReducer, type WorkspaceState } from './workspace'

describe('Workspace bulk Task List movement', () => {
  it('assigns only compatible Lists atomically and allows explicit cross-Project List clearing', () => {
    const firstProject = createProject({
      id: 'project-a',
      name: 'A',
      now: '2026-10-04T18:10:00.000Z',
    })
    const secondProject = createProject({
      id: 'project-b',
      name: 'B',
      now: '2026-10-04T18:11:00.000Z',
    })
    const firstList = createTaskList({
      id: 'list-a',
      projectId: firstProject.id,
      name: 'A list',
      now: '2026-10-04T18:12:00.000Z',
    })
    const secondList = createTaskList({
      id: 'list-b',
      projectId: secondProject.id,
      name: 'B list',
      now: '2026-10-04T18:13:00.000Z',
    })
    const first = createTask({
      id: 'task-a1',
      projectId: firstProject.id,
      title: 'A1',
      now: '2026-10-04T18:14:00.000Z',
    })
    const second = createTask({
      id: 'task-a2',
      projectId: firstProject.id,
      title: 'A2',
      now: '2026-10-04T18:15:00.000Z',
    })
    const other = createTask({
      id: 'task-b1',
      projectId: secondProject.id,
      title: 'B1',
      now: '2026-10-04T18:16:00.000Z',
      listId: secondList.id,
    })
    const state: WorkspaceState = {
      projects: [firstProject, secondProject],
      lists: [firstList, secondList],
      tasks: [first, second, other],
    }

    const assigned = workspaceReducer(state, {
      type: 'task/listChangedBulk',
      taskIds: [second.id, first.id, second.id],
      listId: firstList.id,
    } as never)

    expect(assigned.tasks.map((task) => [task.id, task.listId])).toEqual([
      [first.id, firstList.id],
      [second.id, firstList.id],
      [other.id, secondList.id],
    ])

    expect(() =>
      workspaceReducer(state, {
        type: 'task/listChangedBulk',
        taskIds: [first.id, other.id],
        listId: firstList.id,
      } as never),
    ).toThrow('Cannot assign tasks to a list from another project')

    const cleared = workspaceReducer(
      {
        ...state,
        tasks: [
          { ...first, listId: firstList.id },
          second,
          other,
        ],
      },
      {
        type: 'task/listChangedBulk',
        taskIds: [first.id, other.id],
        listId: null,
      } as never,
    )

    expect(cleared.tasks.map((task) => [task.id, task.listId])).toEqual([
      [first.id, undefined],
      [second.id, undefined],
      [other.id, undefined],
    ])
  })
})
