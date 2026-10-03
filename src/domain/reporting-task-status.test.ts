import { describe, expect, it } from 'vitest'

import { createProject } from './project'
import { deriveTaskStatusReport } from './reporting'
import { createTask } from './task'

const activeProject = createProject({
  id: 'project-active',
  name: 'Active',
  now: '2026-10-03T09:00:00.000Z',
})
const archivedProject = {
  ...createProject({
    id: 'project-archived',
    name: 'Archived',
    now: '2026-10-03T09:01:00.000Z',
  }),
  archivedAt: '2026-10-03T10:00:00.000Z',
}

function task(id: string, status: 'todo' | 'doing' | 'done', projectId = activeProject.id) {
  return {
    ...createTask({
      id,
      projectId,
      title: id,
      now: '2026-10-03T09:02:00.000Z',
    }),
    status,
  }
}

describe('Task status reporting', () => {
  it('counts active Tasks by status and ignores archived work', () => {
    const archivedTask = {
      ...task('task-archived', 'done'),
      archivedAt: '2026-10-03T10:01:00.000Z',
    }

    expect(
      deriveTaskStatusReport({
        projects: [activeProject, archivedProject],
        tasks: [
          task('task-todo', 'todo'),
          task('task-doing', 'doing'),
          task('task-done-1', 'done'),
          task('task-done-2', 'done'),
          archivedTask,
          task('task-hidden-by-project', 'done', archivedProject.id),
        ],
      }),
    ).toEqual({
      todo: 1,
      doing: 1,
      done: 2,
      total: 4,
      completionPercent: 50,
    })
  })
})
