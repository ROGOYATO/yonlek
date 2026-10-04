import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createSubtask, createTask } from './task'
import { createTaskList } from './task-list'
import { workspaceReducer, type WorkspaceState } from './workspace'

describe('Workspace bulk Task Project movement', () => {
  it('moves selected roots with their subtrees and clears Lists when the Project changes', () => {
    const sourceProject = createProject({
      id: 'project-source',
      name: 'Source',
      now: '2026-10-04T18:00:00.000Z',
    })
    const targetProject = createProject({
      id: 'project-target',
      name: 'Target',
      now: '2026-10-04T18:01:00.000Z',
    })
    const sourceList = createTaskList({
      id: 'list-source',
      projectId: sourceProject.id,
      name: 'Backlog',
      now: '2026-10-04T18:02:00.000Z',
    })
    const parent = createTask({
      id: 'task-parent',
      projectId: sourceProject.id,
      title: 'Parent',
      now: '2026-10-04T18:03:00.000Z',
      listId: sourceList.id,
    })
    const child = createSubtask({
      id: 'task-child',
      parent,
      title: 'Child',
      now: '2026-10-04T18:04:00.000Z',
    })
    const peer = createTask({
      id: 'task-peer',
      projectId: sourceProject.id,
      title: 'Peer',
      now: '2026-10-04T18:05:00.000Z',
      listId: sourceList.id,
    })
    const state: WorkspaceState = {
      projects: [sourceProject, targetProject],
      lists: [sourceList],
      tasks: [parent, child, peer],
    }

    const moved = workspaceReducer(state, {
      type: 'task/projectChangedBulk',
      taskIds: [peer.id, parent.id, peer.id],
      projectId: targetProject.id,
    } as never)

    expect(moved.tasks.map((task) => [task.id, task.projectId, task.listId])).toEqual([
      [parent.id, targetProject.id, undefined],
      [child.id, targetProject.id, undefined],
      [peer.id, targetProject.id, undefined],
    ])
    expect(state.tasks.map((task) => [task.id, task.projectId, task.listId])).toEqual([
      [parent.id, sourceProject.id, sourceList.id],
      [child.id, sourceProject.id, sourceList.id],
      [peer.id, sourceProject.id, sourceList.id],
    ])

    expect(() =>
      workspaceReducer(state, {
        type: 'task/projectChangedBulk',
        taskIds: [child.id],
        projectId: targetProject.id,
      } as never),
    ).toThrow('Cannot move a subtask away from its parent project')
  })
})
