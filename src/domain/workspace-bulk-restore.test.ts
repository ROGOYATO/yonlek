import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { archiveTask, createSubtask, createTask } from './task'
import { workspaceReducer, type WorkspaceState } from './workspace'

describe('Workspace bulk Task restore', () => {
  it('restores selected roots and their subtrees once without mutating the input Workspace', () => {
    const project = createProject({
      id: 'project-1',
      name: 'Launch',
      now: '2026-10-04T16:00:00.000Z',
    })
    const parent = archiveTask(
      createTask({
        id: 'task-parent',
        projectId: project.id,
        title: 'Parent',
        now: '2026-10-04T16:01:00.000Z',
      }),
      '2026-10-04T16:10:00.000Z',
    )
    const child = archiveTask(
      createSubtask({
        id: 'task-child',
        parent,
        title: 'Child',
        now: '2026-10-04T16:02:00.000Z',
      }),
      '2026-10-04T16:10:00.000Z',
    )
    const peer = archiveTask(
      createTask({
        id: 'task-peer',
        projectId: project.id,
        title: 'Peer',
        now: '2026-10-04T16:03:00.000Z',
      }),
      '2026-10-04T16:10:00.000Z',
    )
    const state: WorkspaceState = {
      projects: [project],
      tasks: [parent, child, peer],
    }

    const restored = workspaceReducer(state, {
      type: 'task/restoredBulk',
      taskIds: [peer.id, parent.id, parent.id],
    } as never)

    expect(restored.tasks.map((task) => [task.id, task.archivedAt])).toEqual([
      [parent.id, undefined],
      [child.id, undefined],
      [peer.id, undefined],
    ])
    expect(state.tasks.every((task) => task.archivedAt !== undefined)).toBe(true)
  })
})
