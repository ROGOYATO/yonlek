import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { deriveTaskPriorityReport } from './reporting'
import { createTask } from './task'

const project = createProject({
  id: 'project-1',
  name: 'Launch',
  now: '2026-10-03T09:00:00.000Z',
})

function task(id: string, priority: 'low' | 'normal' | 'high') {
  return {
    ...createTask({
      id,
      projectId: project.id,
      title: id,
      now: '2026-10-03T09:01:00.000Z',
    }),
    priority,
  }
}

describe('Task priority reporting', () => {
  it('counts active Tasks by priority without mutating the Workspace', () => {
    const workspace = {
      projects: [project],
      tasks: [
        task('task-low', 'low'),
        task('task-normal-1', 'normal'),
        task('task-normal-2', 'normal'),
        task('task-high', 'high'),
      ],
    }
    const before = structuredClone(workspace)

    expect(deriveTaskPriorityReport(workspace)).toEqual({
      low: 1,
      normal: 2,
      high: 1,
      total: 4,
    })
    expect(workspace).toEqual(before)
  })
})
