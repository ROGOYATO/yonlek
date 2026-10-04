import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createSubtask, createTask } from './task'
import { createTaskRelationship } from './task-relationship'
import { workspaceReducer, type WorkspaceState } from './workspace'

describe('Workspace bulk Task delete', () => {
  it('deletes selected roots with their subtrees and cleans relationships atomically', () => {
    const project = createProject({
      id: 'project-1',
      name: 'Launch',
      now: '2026-10-04T16:20:00.000Z',
    })
    const parent = createTask({
      id: 'task-parent',
      projectId: project.id,
      title: 'Parent',
      now: '2026-10-04T16:21:00.000Z',
    })
    const child = createSubtask({
      id: 'task-child',
      parent,
      title: 'Child',
      now: '2026-10-04T16:22:00.000Z',
    })
    const peer = createTask({
      id: 'task-peer',
      projectId: project.id,
      title: 'Peer',
      now: '2026-10-04T16:23:00.000Z',
    })
    const survivor = createTask({
      id: 'task-survivor',
      projectId: project.id,
      title: 'Survivor',
      now: '2026-10-04T16:24:00.000Z',
    })
    const relationship = createTaskRelationship({
      id: 'relationship-1',
      type: 'references',
      sourceTaskId: child.id,
      targetTaskId: survivor.id,
      now: '2026-10-04T16:25:00.000Z',
    })
    const state: WorkspaceState = {
      projects: [project],
      tasks: [parent, child, peer, survivor],
      relationships: [relationship],
    }

    const deleted = workspaceReducer(state, {
      type: 'task/deletedBulk',
      taskIds: [peer.id, parent.id, peer.id],
    } as never)

    expect(deleted.tasks.map((task) => task.id)).toEqual([survivor.id])
    expect(deleted.relationships).toBeUndefined()
    expect(state.tasks.map((task) => task.id)).toEqual([
      parent.id,
      child.id,
      peer.id,
      survivor.id,
    ])
  })
})
