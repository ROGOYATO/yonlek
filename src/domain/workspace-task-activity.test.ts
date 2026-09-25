import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { createTask } from './task'
import {
  workspaceReducer,
  type WorkspaceState,
} from './workspace'

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-09-23T08:00:00.000Z',
})

const task = createTask({
  id: 'task-1',
  projectId: project.id,
  title: 'Prepare slides',
  now: '2026-09-23T08:05:00.000Z',
})

function state(): WorkspaceState {
  return {
    projects: [project],
    tasks: [task],
  }
}

describe('Workspace tracked Task activity envelope', () => {
  it('applies the Task mutation and appends Activity in one reducer result', () => {
    const next = workspaceReducer(state(), {
      type: 'workspace/taskActivityTracked',
      occurredAt: '2026-09-23T09:00:00.000Z',
      action: {
        type: 'task/titleChanged',
        taskId: task.id,
        title: 'Prepare demo',
      },
    } as Parameters<typeof workspaceReducer>[1])

    expect(next.tasks[0]?.title).toBe('Prepare demo')
    expect(next.activity).toEqual([
      {
        sequence: 1,
        occurredAt: '2026-09-23T09:00:00.000Z',
        taskId: task.id,
        taskTitle: 'Prepare demo',
        event: {
          kind: 'task.titleChanged',
          from: 'Prepare slides',
          to: 'Prepare demo',
        },
      },
    ])
  })

  it('keeps direct base-action dispatch untracked and skips tracked no-ops', () => {
    const direct = workspaceReducer(state(), {
      type: 'task/titleChanged',
      taskId: task.id,
      title: 'Prepare demo',
    })

    expect(direct.tasks[0]?.title).toBe('Prepare demo')
    expect(direct.activity).toBeUndefined()

    const noOp = workspaceReducer(state(), {
      type: 'workspace/taskActivityTracked',
      occurredAt: '2026-09-23T09:00:00.000Z',
      action: {
        type: 'task/titleChanged',
        taskId: task.id,
        title: task.title,
      },
    } as Parameters<typeof workspaceReducer>[1])

    expect(noOp.activity).toBeUndefined()
  })
})
